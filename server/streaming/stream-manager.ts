// Stream Manager for Multi-Camera CCTV Simulation
// Coordinates multiple FFmpeg streams and provides high-level management

import { EventEmitter } from 'events';
import { ffmpegServer, StreamConfig, StreamStatus } from './ffmpeg-server';
import { storage } from '../storage';
import type { Camera, Truck } from '@shared/schema';

export interface StreamGroup {
  truckId: number;
  truckNumber: string;
  streams: StreamConfig[];
  status: 'all_running' | 'partial_running' | 'all_stopped' | 'error';
  activeStreams: number;
  totalStreams: number;
}

export interface StreamMetrics {
  totalStreams: number;
  runningStreams: number;
  stoppedStreams: number;
  errorStreams: number;
  totalBandwidth: number; // kbps
  averageFrameRate: number;
  uptime: number; // milliseconds
}

export class StreamManager extends EventEmitter {
  private streamGroups: Map<number, StreamGroup> = new Map();
  private autoRestartEnabled: boolean = true;
  private healthCheckInterval?: NodeJS.Timeout;
  private maxConcurrentStreams: number = 400;
  private loadBalancingEnabled: boolean = true;

  constructor() {
    super();
    
    // Listen to FFmpeg server events
    ffmpegServer.on('streamStarted', this.handleStreamStarted.bind(this));
    ffmpegServer.on('streamStopped', this.handleStreamStopped.bind(this));
    ffmpegServer.on('streamError', this.handleStreamError.bind(this));
    
    // Start health monitoring
    this.startHealthMonitoring();
  }

  /**
   * Initialize streams for all trucks in the database
   */
  async initializeAllTruckStreams(): Promise<void> {
    try {
      const trucks = await storage.getAllTrucks();
      console.log(`Initializing streams for ${trucks.length} trucks...`);

      for (const truck of trucks) {
        await this.initializeTruckStreams(truck.id);
      }

      console.log(`Stream initialization complete. Total streams: ${this.getTotalStreamsCount()}`);
    } catch (error) {
      console.error('Error initializing truck streams:', error);
      throw error;
    }
  }

  /**
   * Initialize streams for a specific truck
   */
  async initializeTruckStreams(truckId: number): Promise<void> {
    try {
      const truck = await storage.getTruck(truckId);
      if (!truck) {
        throw new Error(`Truck ${truckId} not found`);
      }

      const cameras = await storage.getCamerasByTruck(truckId);
      
      // Generate stream configurations for this truck
      const streamConfigs = this.generateStreamConfigsForTruck(truck, cameras);
      
      const streamGroup: StreamGroup = {
        truckId,
        truckNumber: truck.truckNumber,
        streams: streamConfigs,
        status: 'all_stopped',
        activeStreams: 0,
        totalStreams: streamConfigs.length
      };

      this.streamGroups.set(truckId, streamGroup);
      
      // Start streams if load balancing allows
      if (this.canStartMoreStreams(streamConfigs.length)) {
        await this.startTruckStreams(truckId);
      }

      this.emit('truckStreamsInitialized', { truckId, streamCount: streamConfigs.length });
      
    } catch (error) {
      console.error(`Error initializing streams for truck ${truckId}:`, error);
      throw error;
    }
  }

  /**
   * Start all streams for a truck
   */
  async startTruckStreams(truckId: number): Promise<void> {
    const streamGroup = this.streamGroups.get(truckId);
    if (!streamGroup) {
      throw new Error(`Stream group not found for truck ${truckId}`);
    }

    console.log(`Starting ${streamGroup.streams.length} streams for truck ${truckId}...`);

    const startPromises = streamGroup.streams.map(async (config) => {
      try {
        await ffmpegServer.startStream(config);
        return { success: true, streamId: config.id };
      } catch (error) {
        console.error(`Failed to start stream ${config.id}:`, error);
        return { success: false, streamId: config.id, error: error.message };
      }
    });

    const results = await Promise.allSettled(startPromises);
    
    // Update stream group status
    this.updateStreamGroupStatus(truckId);
    
    const successCount = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
    console.log(`Started ${successCount}/${streamGroup.streams.length} streams for truck ${truckId}`);
  }

  /**
   * Stop all streams for a truck
   */
  async stopTruckStreams(truckId: number): Promise<void> {
    const streamGroup = this.streamGroups.get(truckId);
    if (!streamGroup) {
      throw new Error(`Stream group not found for truck ${truckId}`);
    }

    console.log(`Stopping streams for truck ${truckId}...`);

    const stopPromises = streamGroup.streams.map(async (config) => {
      try {
        await ffmpegServer.stopStream(config.id);
        return { success: true, streamId: config.id };
      } catch (error) {
        console.error(`Failed to stop stream ${config.id}:`, error);
        return { success: false, streamId: config.id, error: error.message };
      }
    });

    await Promise.allSettled(stopPromises);
    
    // Update stream group status
    this.updateStreamGroupStatus(truckId);
  }

  /**
   * Restart streams for a truck
   */
  async restartTruckStreams(truckId: number): Promise<void> {
    await this.stopTruckStreams(truckId);
    
    // Wait a moment before restart
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await this.startTruckStreams(truckId);
  }

  /**
   * Start a specific camera stream
   */
  async startCameraStream(truckId: number, cameraPosition: string): Promise<void> {
    const streamGroup = this.streamGroups.get(truckId);
    if (!streamGroup) {
      throw new Error(`Stream group not found for truck ${truckId}`);
    }

    const streamConfig = streamGroup.streams.find(s => s.cameraPosition === cameraPosition);
    if (!streamConfig) {
      throw new Error(`Camera stream not found: truck ${truckId}, position ${cameraPosition}`);
    }

    await ffmpegServer.startStream(streamConfig);
    this.updateStreamGroupStatus(truckId);
  }

  /**
   * Stop a specific camera stream
   */
  async stopCameraStream(truckId: number, cameraPosition: string): Promise<void> {
    const streamGroup = this.streamGroups.get(truckId);
    if (!streamGroup) {
      throw new Error(`Stream group not found for truck ${truckId}`);
    }

    const streamConfig = streamGroup.streams.find(s => s.cameraPosition === cameraPosition);
    if (!streamConfig) {
      throw new Error(`Camera stream not found: truck ${truckId}, position ${cameraPosition}`);
    }

    await ffmpegServer.stopStream(streamConfig.id);
    this.updateStreamGroupStatus(truckId);
  }

  /**
   * Get stream group status
   */
  getStreamGroup(truckId: number): StreamGroup | null {
    return this.streamGroups.get(truckId) || null;
  }

  /**
   * Get all stream groups
   */
  getAllStreamGroups(): StreamGroup[] {
    return Array.from(this.streamGroups.values());
  }

  /**
   * Get overall stream metrics
   */
  getStreamMetrics(): StreamMetrics {
    const allStatuses = ffmpegServer.getAllStreamStatuses();
    
    const runningStreams = allStatuses.filter(s => s.status === 'running');
    const stoppedStreams = allStatuses.filter(s => s.status === 'stopped');
    const errorStreams = allStatuses.filter(s => s.status === 'error');
    
    const totalBandwidth = runningStreams.reduce((sum, s) => sum + (s.bitrate || 0), 0);
    const averageFrameRate = runningStreams.length > 0 
      ? runningStreams.reduce((sum, s) => sum + (s.frameRate || 0), 0) / runningStreams.length 
      : 0;
    
    const totalUptime = runningStreams.reduce((sum, s) => {
      if (s.startTime) {
        return sum + (new Date().getTime() - s.startTime.getTime());
      }
      return sum;
    }, 0);

    return {
      totalStreams: allStatuses.length,
      runningStreams: runningStreams.length,
      stoppedStreams: stoppedStreams.length,
      errorStreams: errorStreams.length,
      totalBandwidth,
      averageFrameRate,
      uptime: totalUptime
    };
  }

  /**
   * Auto-scale streams based on system load
   */
  async autoScaleStreams(): Promise<void> {
    if (!this.loadBalancingEnabled) return;

    const metrics = this.getStreamMetrics();
    const systemLoad = this.calculateSystemLoad();
    
    console.log(`Auto-scaling check: ${metrics.runningStreams}/${metrics.totalStreams} streams, load: ${systemLoad.toFixed(2)}`);

    // If system load is high, stop some lower priority streams
    if (systemLoad > 0.85 && metrics.runningStreams > 100) {
      await this.reduceStreamLoad();
    }
    
    // If system load is low, start more streams
    else if (systemLoad < 0.6 && metrics.runningStreams < this.maxConcurrentStreams) {
      await this.increaseStreamLoad();
    }
  }

  /**
   * Calculate system load (simplified)
   */
  private calculateSystemLoad(): number {
    const metrics = this.getStreamMetrics();
    const cpuLoad = metrics.runningStreams / this.maxConcurrentStreams;
    const bandwidthLoad = metrics.totalBandwidth / (this.maxConcurrentStreams * 2000); // Assume 2Mbps max per stream
    
    return Math.max(cpuLoad, bandwidthLoad);
  }

  /**
   * Reduce stream load by stopping lower priority streams
   */
  private async reduceStreamLoad(): Promise<void> {
    const streamGroups = this.getAllStreamGroups()
      .filter(group => group.status === 'all_running' || group.status === 'partial_running')
      .sort((a, b) => a.activeStreams - b.activeStreams); // Stop trucks with fewer active streams first

    for (const group of streamGroups.slice(0, 5)) { // Stop up to 5 truck groups
      await this.stopTruckStreams(group.truckId);
      console.log(`Stopped streams for truck ${group.truckId} due to high system load`);
    }
  }

  /**
   * Increase stream load by starting stopped streams
   */
  private async increaseStreamLoad(): Promise<void> {
    const stoppedGroups = this.getAllStreamGroups()
      .filter(group => group.status === 'all_stopped')
      .slice(0, 10); // Start up to 10 truck groups

    for (const group of stoppedGroups) {
      if (this.canStartMoreStreams(group.totalStreams)) {
        await this.startTruckStreams(group.truckId);
        console.log(`Started streams for truck ${group.truckId} due to low system load`);
      }
    }
  }

  /**
   * Check if more streams can be started
   */
  private canStartMoreStreams(count: number): boolean {
    const currentRunning = ffmpegServer.getRunningStreamsCount();
    return (currentRunning + count) <= this.maxConcurrentStreams;
  }

  /**
   * Generate stream configurations for a truck
   */
  private generateStreamConfigsForTruck(truck: Truck, cameras: Camera[]): StreamConfig[] {
    const videoFiles = this.getAvailableVideoFiles();
    const configs: StreamConfig[] = [];

    cameras.forEach((camera, index) => {
      const videoFile = videoFiles[index % videoFiles.length]; // Cycle through available videos
      
      const config: StreamConfig = {
        id: `truck_${truck.id}_camera_${camera.id}`,
        name: `${truck.truckNumber} - ${camera.position.toUpperCase()}`,
        sourceVideo: videoFile,
        rtspPort: ffmpegServer.getNextAvailableRtspPort(),
        resolution: camera.resolution as any || '1280x720',
        frameRate: 25,
        bitrate: '2000k',
        loop: true,
        cameraPosition: camera.position as any,
        truckId: truck.id,
        enabled: camera.status === 'active'
      };
      
      configs.push(config);
    });

    return configs;
  }

  /**
   * Get available video files (mock implementation)
   */
  private getAvailableVideoFiles(): string[] {
    // In a real implementation, this would scan the video dataset directory
    return [
      'driving_sample_1.mp4',
      'driving_sample_2.mp4',
      'driving_sample_3.mp4',
      'driving_sample_4.mp4',
      'driving_sample_5.mp4',
      'driving_sample_6.mp4'
    ];
  }

  /**
   * Update stream group status based on individual stream statuses
   */
  private updateStreamGroupStatus(truckId: number): void {
    const streamGroup = this.streamGroups.get(truckId);
    if (!streamGroup) return;

    const statuses = streamGroup.streams.map(config => 
      ffmpegServer.getStreamStatus(config.id)
    );

    const runningCount = statuses.filter(s => s?.status === 'running').length;
    const errorCount = statuses.filter(s => s?.status === 'error').length;

    streamGroup.activeStreams = runningCount;

    if (runningCount === streamGroup.totalStreams) {
      streamGroup.status = 'all_running';
    } else if (runningCount > 0) {
      streamGroup.status = 'partial_running';
    } else if (errorCount > 0) {
      streamGroup.status = 'error';
    } else {
      streamGroup.status = 'all_stopped';
    }

    this.streamGroups.set(truckId, streamGroup);
  }

  /**
   * Get total streams count
   */
  getTotalStreamsCount(): number {
    return Array.from(this.streamGroups.values())
      .reduce((sum, group) => sum + group.totalStreams, 0);
  }

  /**
   * Handle stream started event
   */
  private handleStreamStarted(event: { streamId: string, config: StreamConfig }): void {
    // Find which truck this stream belongs to
    for (const [truckId, group] of this.streamGroups.entries()) {
      if (group.streams.some(s => s.id === event.streamId)) {
        this.updateStreamGroupStatus(truckId);
        break;
      }
    }
    
    this.emit('streamStatusChanged', event);
  }

  /**
   * Handle stream stopped event
   */
  private handleStreamStopped(event: { streamId: string }): void {
    // Find which truck this stream belongs to and update status
    for (const [truckId, group] of this.streamGroups.entries()) {
      if (group.streams.some(s => s.id === event.streamId)) {
        this.updateStreamGroupStatus(truckId);
        break;
      }
    }
    
    this.emit('streamStatusChanged', event);
  }

  /**
   * Handle stream error event
   */
  private handleStreamError(event: { streamId: string, error: string }): void {
    console.error(`Stream error: ${event.streamId} - ${event.error}`);
    
    // Find which truck this stream belongs to
    for (const [truckId, group] of this.streamGroups.entries()) {
      if (group.streams.some(s => s.id === event.streamId)) {
        this.updateStreamGroupStatus(truckId);
        
        // Auto-restart if enabled
        if (this.autoRestartEnabled) {
          setTimeout(() => {
            const config = group.streams.find(s => s.id === event.streamId);
            if (config) {
              ffmpegServer.restartStream(config.id).catch(err => 
                console.error(`Failed to auto-restart stream ${event.streamId}:`, err)
              );
            }
          }, 5000); // Wait 5 seconds before restart
        }
        break;
      }
    }
    
    this.emit('streamStatusChanged', event);
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
      this.autoScaleStreams().catch(err => 
        console.error('Auto-scaling error:', err)
      );
    }, 30000); // Check every 30 seconds
  }

  /**
   * Perform health check on all streams
   */
  private performHealthCheck(): void {
    const metrics = this.getStreamMetrics();
    console.log(`Health check: ${metrics.runningStreams} running, ${metrics.errorStreams} errors, ${metrics.totalBandwidth.toFixed(0)} kbps total`);
    
    this.emit('healthCheck', metrics);
  }

  /**
   * Cleanup all streams and intervals
   */
  async cleanup(): Promise<void> {
    console.log('Cleaning up stream manager...');
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    await ffmpegServer.cleanup();
    this.streamGroups.clear();
    
    console.log('Stream manager cleanup complete');
  }
}

// Global stream manager instance
export const streamManager = new StreamManager();