// Streaming Integration with Mock Data
// Connects mock truck data with streaming infrastructure for comprehensive testing

import { EventEmitter } from 'events';
import { storage } from '../storage';
import { simulationEngine } from './simulation-engine';
import type { Truck, Camera } from '@shared/schema';

interface StreamingMockConfig {
  enabled: boolean;
  baseStreamUrl: string;
  mockVideoPath: string;
  streamQuality: 'low' | 'medium' | 'high';
  frameRate: number;
  enableRecording: boolean;
}

interface TruckStreamData {
  truckId: number;
  cameras: {
    cameraId: number;
    position: string;
    streamUrl: string;
    recordingUrl?: string;
    status: 'online' | 'offline' | 'error';
    lastFrame?: Date;
    frameCount: number;
  }[];
  streamingStatus: 'active' | 'inactive' | 'error';
  lastUpdate: Date;
}

export class StreamingMockIntegration extends EventEmitter {
  private config: StreamingMockConfig;
  private truckStreams: Map<number, TruckStreamData> = new Map();
  private streamingTimer?: NodeJS.Timeout;
  private isActive: boolean = false;

  constructor(config: Partial<StreamingMockConfig> = {}) {
    super();
    this.config = {
      enabled: true,
      baseStreamUrl: 'rtsp://localhost:8554',
      mockVideoPath: '/datasets/driving-videos',
      streamQuality: 'medium',
      frameRate: 30,
      enableRecording: true,
      ...config
    };
  }

  /**
   * Initialize streaming integration with mock data
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing streaming mock integration...');
      
      // Get all trucks and their cameras
      const trucks = await storage.getAllTrucks();
      
      for (const truck of trucks) {
        await this.setupTruckStreaming(truck);
      }

      // Listen to simulation events to update streaming status
      this.setupSimulationListeners();

      console.log(`Streaming integration initialized for ${trucks.length} trucks`);
      this.emit('initialized', { truckCount: trucks.length });
    } catch (error) {
      console.error('Failed to initialize streaming integration:', error);
      throw error;
    }
  }

  /**
   * Setup streaming for a specific truck
   */
  private async setupTruckStreaming(truck: Truck): Promise<void> {
    try {
      const cameras = await storage.getCamerasByTruck(truck.id);
      
      const truckStreamData: TruckStreamData = {
        truckId: truck.id,
        cameras: cameras.map(camera => ({
          cameraId: camera.id,
          position: camera.position,
          streamUrl: this.generateStreamUrl(truck.id, camera.position),
          recordingUrl: this.config.enableRecording ? 
            this.generateRecordingUrl(truck.id, camera.position) : undefined,
          status: camera.status === 'online' ? 'online' : 'offline',
          frameCount: 0
        })),
        streamingStatus: truck.status === 'online' ? 'active' : 'inactive',
        lastUpdate: new Date()
      };

      this.truckStreams.set(truck.id, truckStreamData);
      
      // Update camera URLs in database
      for (const camera of cameras) {
        const streamData = truckStreamData.cameras.find(c => c.cameraId === camera.id);
        if (streamData) {
          await storage.updateCamera(camera.id, {
            streamUrl: streamData.streamUrl,
            recordingUrl: streamData.recordingUrl,
            lastUpdate: new Date()
          });
        }
      }
    } catch (error) {
      console.error(`Failed to setup streaming for truck ${truck.id}:`, error);
    }
  }

  /**
   * Setup simulation event listeners
   */
  private setupSimulationListeners(): void {
    simulationEngine.on('statusChanged', async (event) => {
      await this.handleTruckStatusChange(event.truckId, event.newStatus);
    });

    simulationEngine.on('incidentGenerated', async (event) => {
      await this.handleIncidentGenerated(event.truckId, event.incidentType);
    });

    simulationEngine.on('updated', () => {
      this.updateStreamingMetrics();
    });
  }

  /**
   * Handle truck status changes
   */
  private async handleTruckStatusChange(truckId: number, newStatus: string): Promise<void> {
    const streamData = this.truckStreams.get(truckId);
    if (!streamData) return;

    // Update streaming status based on truck status
    streamData.streamingStatus = newStatus === 'online' ? 'active' : 'inactive';
    
    // Update camera statuses
    for (const camera of streamData.cameras) {
      camera.status = newStatus === 'online' ? 'online' : 'offline';
      
      // Update database
      await storage.updateCamera(camera.cameraId, {
        status: camera.status,
        lastUpdate: new Date()
      });
    }

    streamData.lastUpdate = new Date();
    this.emit('truckStreamStatusChanged', { truckId, newStatus, streamData });
  }

  /**
   * Handle AI incident generation - trigger recording
   */
  private async handleIncidentGenerated(truckId: number, incidentType: string): Promise<void> {
    const streamData = this.truckStreams.get(truckId);
    if (!streamData || !this.config.enableRecording) return;

    // Simulate recording trigger for incident
    const recordingData = {
      truckId,
      incidentType,
      timestamp: new Date(),
      cameras: streamData.cameras.map(camera => ({
        cameraId: camera.cameraId,
        position: camera.position,
        recordingUrl: camera.recordingUrl,
        duration: 30 // 30 seconds
      }))
    };

    console.log(`Recording triggered for truck ${truckId} due to ${incidentType}`);
    this.emit('recordingTriggered', recordingData);
  }

  /**
   * Update streaming metrics
   */
  private updateStreamingMetrics(): void {
    for (const [truckId, streamData] of this.truckStreams) {
      if (streamData.streamingStatus === 'active') {
        // Simulate frame updates
        for (const camera of streamData.cameras) {
          if (camera.status === 'online') {
            camera.frameCount += Math.floor(Math.random() * 30) + 15; // 15-45 frames
            camera.lastFrame = new Date();
          }
        }
        streamData.lastUpdate = new Date();
      }
    }
  }

  /**
   * Start streaming integration
   */
  start(): void {
    if (this.isActive) return;

    this.isActive = true;
    
    // Start periodic updates
    this.streamingTimer = setInterval(() => {
      this.updateStreamingMetrics();
      this.performHealthChecks();
    }, 10000); // Every 10 seconds

    console.log('Streaming integration started');
    this.emit('started');
  }

  /**
   * Stop streaming integration
   */
  stop(): void {
    if (!this.isActive) return;

    this.isActive = false;
    
    if (this.streamingTimer) {
      clearInterval(this.streamingTimer);
      this.streamingTimer = undefined;
    }

    console.log('Streaming integration stopped');
    this.emit('stopped');
  }

  /**
   * Perform health checks on streams
   */
  private performHealthChecks(): void {
    for (const [truckId, streamData] of this.truckStreams) {
      // Simulate occasional stream issues
      if (Math.random() < 0.01) { // 1% chance per check
        const randomCamera = streamData.cameras[Math.floor(Math.random() * streamData.cameras.length)];
        const previousStatus = randomCamera.status;
        randomCamera.status = randomCamera.status === 'online' ? 'error' : 'online';
        
        if (previousStatus !== randomCamera.status) {
          console.log(`Camera ${randomCamera.cameraId} status changed to ${randomCamera.status}`);
          this.emit('cameraStatusChanged', {
            truckId,
            cameraId: randomCamera.cameraId,
            oldStatus: previousStatus,
            newStatus: randomCamera.status
          });
        }
      }
    }
  }

  /**
   * Generate stream URL for truck camera
   */
  private generateStreamUrl(truckId: number, position: string): string {
    return `${this.config.baseStreamUrl}/truck${truckId}/${position}/live`;
  }

  /**
   * Generate recording URL for truck camera
   */
  private generateRecordingUrl(truckId: number, position: string): string {
    return `https://recordings.system.com/truck${truckId}/${position}/recordings`;
  }

  /**
   * Get streaming status for specific truck
   */
  getTruckStreamingStatus(truckId: number): TruckStreamData | undefined {
    return this.truckStreams.get(truckId);
  }

  /**
   * Get overall streaming status
   */
  getStreamingStatus() {
    const trucks = Array.from(this.truckStreams.values());
    const activeTrucks = trucks.filter(t => t.streamingStatus === 'active').length;
    const totalCameras = trucks.reduce((sum, t) => sum + t.cameras.length, 0);
    const onlineCameras = trucks.reduce((sum, t) => 
      sum + t.cameras.filter(c => c.status === 'online').length, 0
    );

    return {
      isActive: this.isActive,
      totalTrucks: trucks.length,
      activeTrucks,
      totalCameras,
      onlineCameras,
      streamingRate: totalCameras > 0 ? (onlineCameras / totalCameras) * 100 : 0,
      config: this.config,
      lastUpdate: new Date()
    };
  }

  /**
   * Update streaming configuration
   */
  updateConfig(newConfig: Partial<StreamingMockConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  /**
   * Simulate camera failure for testing
   */
  async simulateCameraFailure(truckId: number, position: string): Promise<void> {
    const streamData = this.truckStreams.get(truckId);
    if (!streamData) return;

    const camera = streamData.cameras.find(c => c.position === position);
    if (!camera) return;

    camera.status = 'error';
    
    await storage.updateCamera(camera.cameraId, {
      status: 'error',
      lastUpdate: new Date()
    });

    this.emit('cameraFailureSimulated', { truckId, position, cameraId: camera.cameraId });
  }

  /**
   * Simulate camera recovery for testing
   */
  async simulateCameraRecovery(truckId: number, position: string): Promise<void> {
    const streamData = this.truckStreams.get(truckId);
    if (!streamData) return;

    const camera = streamData.cameras.find(c => c.position === position);
    if (!camera) return;

    camera.status = 'online';
    
    await storage.updateCamera(camera.cameraId, {
      status: 'online',
      lastUpdate: new Date()
    });

    this.emit('cameraRecoverySimulated', { truckId, position, cameraId: camera.cameraId });
  }

  /**
   * Get stream analytics
   */
  getStreamAnalytics() {
    const trucks = Array.from(this.truckStreams.values());
    
    const analytics = {
      totalFrames: trucks.reduce((sum, t) => 
        sum + t.cameras.reduce((cSum, c) => cSum + c.frameCount, 0), 0
      ),
      averageFrameRate: this.config.frameRate,
      uptime: trucks.filter(t => t.streamingStatus === 'active').length / trucks.length * 100,
      cameraHealth: {
        online: 0,
        offline: 0,
        error: 0
      },
      qualityMetrics: {
        streamQuality: this.config.streamQuality,
        averageBitrate: this.getAverageBitrate(),
        latency: Math.random() * 200 + 50 // 50-250ms simulated latency
      }
    };

    trucks.forEach(truck => {
      truck.cameras.forEach(camera => {
        analytics.cameraHealth[camera.status]++;
      });
    });

    return analytics;
  }

  /**
   * Get average bitrate based on quality
   */
  private getAverageBitrate(): number {
    switch (this.config.streamQuality) {
      case 'high': return 8000; // 8 Mbps
      case 'medium': return 4000; // 4 Mbps
      case 'low': return 2000; // 2 Mbps
      default: return 4000;
    }
  }

  /**
   * Cleanup streaming integration
   */
  cleanup(): void {
    this.stop();
    this.truckStreams.clear();
    this.removeAllListeners();
  }
}

// Global streaming integration instance
export const streamingIntegration = new StreamingMockIntegration();

export default streamingIntegration;