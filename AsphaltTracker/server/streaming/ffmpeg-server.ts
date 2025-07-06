// FFmpeg Streaming Server for Real-Time CCTV Simulation
// Provides RTSP/RTMP streaming capabilities for video dataset

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';

export interface StreamConfig {
  id: string;
  name: string;
  sourceVideo: string;
  rtspPort: number;
  rtmpPort?: number;
  resolution: '1920x1080' | '1280x720' | '640x480';
  frameRate: number;
  bitrate: string;
  loop: boolean;
  cameraPosition: 'front' | 'back' | 'left' | 'right' | 'driver_facing' | 'cargo';
  truckId: number;
  enabled: boolean;
}

export interface StreamStatus {
  id: string;
  status: 'starting' | 'running' | 'stopped' | 'error';
  startTime?: Date;
  lastUpdate: Date;
  viewerCount: number;
  bitrate?: number;
  frameRate?: number;
  uptime?: number;
  error?: string;
}

export class FFmpegStreamingServer extends EventEmitter {
  private streams: Map<string, ChildProcess> = new Map();
  private streamConfigs: Map<string, StreamConfig> = new Map();
  private streamStatuses: Map<string, StreamStatus> = new Map();
  private baseRtspPort: number = 8554;
  private baseRtmpPort: number = 1935;
  private videoDatasetPath: string;
  private ffmpegPath: string;

  constructor(videoDatasetPath: string, ffmpegPath: string = 'ffmpeg') {
    super();
    this.videoDatasetPath = videoDatasetPath;
    this.ffmpegPath = ffmpegPath;
    
    // Clean up on process exit
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
  }

  /**
   * Start a new video stream
   */
  async startStream(config: StreamConfig): Promise<void> {
    if (this.streams.has(config.id)) {
      throw new Error(`Stream ${config.id} is already running`);
    }

    // Verify source video exists
    const videoPath = path.join(this.videoDatasetPath, config.sourceVideo);
    try {
      await fs.access(videoPath);
    } catch {
      throw new Error(`Source video not found: ${videoPath}`);
    }

    this.streamConfigs.set(config.id, config);
    
    // Create initial status
    const status: StreamStatus = {
      id: config.id,
      status: 'starting',
      lastUpdate: new Date(),
      viewerCount: 0
    };
    this.streamStatuses.set(config.id, status);

    try {
      const ffmpegProcess = await this.createFFmpegProcess(config, videoPath);
      this.streams.set(config.id, ffmpegProcess);
      
      // Update status
      status.status = 'running';
      status.startTime = new Date();
      status.lastUpdate = new Date();
      this.streamStatuses.set(config.id, status);

      this.emit('streamStarted', { streamId: config.id, config });
      console.log(`Stream ${config.id} started successfully`);
      
    } catch (error) {
      status.status = 'error';
      status.error = error.message;
      status.lastUpdate = new Date();
      this.streamStatuses.set(config.id, status);
      
      this.emit('streamError', { streamId: config.id, error: error.message });
      throw error;
    }
  }

  /**
   * Stop a running stream
   */
  async stopStream(streamId: string): Promise<void> {
    const process = this.streams.get(streamId);
    if (!process) {
      throw new Error(`Stream ${streamId} is not running`);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        process.kill('SIGKILL');
        reject(new Error('Force killed stream process'));
      }, 5000);

      process.on('exit', () => {
        clearTimeout(timeout);
        this.streams.delete(streamId);
        
        // Update status
        const status = this.streamStatuses.get(streamId);
        if (status) {
          status.status = 'stopped';
          status.lastUpdate = new Date();
          if (status.startTime) {
            status.uptime = new Date().getTime() - status.startTime.getTime();
          }
          this.streamStatuses.set(streamId, status);
        }

        this.emit('streamStopped', { streamId });
        console.log(`Stream ${streamId} stopped`);
        resolve();
      });

      // Gracefully terminate
      process.kill('SIGTERM');
    });
  }

  /**
   * Restart a stream
   */
  async restartStream(streamId: string): Promise<void> {
    const config = this.streamConfigs.get(streamId);
    if (!config) {
      throw new Error(`Stream config not found for ${streamId}`);
    }

    if (this.streams.has(streamId)) {
      await this.stopStream(streamId);
      // Wait a moment before restart
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await this.startStream(config);
  }

  /**
   * Get stream status
   */
  getStreamStatus(streamId: string): StreamStatus | null {
    return this.streamStatuses.get(streamId) || null;
  }

  /**
   * Get all stream statuses
   */
  getAllStreamStatuses(): StreamStatus[] {
    return Array.from(this.streamStatuses.values());
  }

  /**
   * Get running streams count
   */
  getRunningStreamsCount(): number {
    return Array.from(this.streamStatuses.values())
      .filter(status => status.status === 'running').length;
  }

  /**
   * Create FFmpeg process for streaming
   */
  private async createFFmpegProcess(config: StreamConfig, videoPath: string): Promise<ChildProcess> {
    const rtspUrl = `rtsp://localhost:${config.rtspPort}/${config.id}`;
    
    // Build FFmpeg command arguments
    const args = [
      // Input options
      '-re', // Read input at native frame rate
      '-stream_loop', config.loop ? '-1' : '0', // Loop indefinitely if enabled
      '-i', videoPath,
      
      // Video encoding options
      '-c:v', 'libx264', // H.264 codec
      '-preset', 'ultrafast', // Fast encoding for real-time
      '-tune', 'zerolatency', // Optimize for low latency
      '-s', config.resolution, // Set resolution
      '-r', config.frameRate.toString(), // Set frame rate
      '-b:v', config.bitrate, // Set bitrate
      '-maxrate', config.bitrate, // Max bitrate
      '-bufsize', (parseInt(config.bitrate) * 2).toString(), // Buffer size
      
      // Audio options (if present)
      '-c:a', 'aac',
      '-b:a', '128k',
      '-ar', '44100',
      
      // Output format
      '-f', 'rtsp',
      '-rtsp_transport', 'tcp',
      rtspUrl
    ];

    console.log(`Starting FFmpeg for stream ${config.id}:`, this.ffmpegPath, args.join(' '));

    const ffmpegProcess = spawn(this.ffmpegPath, args, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Handle process events
    ffmpegProcess.stdout?.on('data', (data) => {
      console.log(`FFmpeg stdout [${config.id}]:`, data.toString());
    });

    ffmpegProcess.stderr?.on('data', (data) => {
      const output = data.toString();
      console.log(`FFmpeg stderr [${config.id}]:`, output);
      
      // Update stream status based on FFmpeg output
      this.updateStreamStatusFromFFmpeg(config.id, output);
    });

    ffmpegProcess.on('error', (error) => {
      console.error(`FFmpeg process error [${config.id}]:`, error);
      const status = this.streamStatuses.get(config.id);
      if (status) {
        status.status = 'error';
        status.error = error.message;
        status.lastUpdate = new Date();
        this.streamStatuses.set(config.id, status);
      }
      this.emit('streamError', { streamId: config.id, error: error.message });
    });

    ffmpegProcess.on('exit', (code, signal) => {
      console.log(`FFmpeg process exited [${config.id}] with code ${code}, signal ${signal}`);
      
      const status = this.streamStatuses.get(config.id);
      if (status && status.status !== 'stopped') {
        status.status = code === 0 ? 'stopped' : 'error';
        status.lastUpdate = new Date();
        if (code !== 0) {
          status.error = `Process exited with code ${code}`;
        }
        this.streamStatuses.set(config.id, status);
      }
    });

    return ffmpegProcess;
  }

  /**
   * Update stream status based on FFmpeg output
   */
  private updateStreamStatusFromFFmpeg(streamId: string, output: string): void {
    const status = this.streamStatuses.get(streamId);
    if (!status) return;

    // Parse frame rate and bitrate from FFmpeg output
    const frameRateMatch = output.match(/(\d+\.?\d*)\s*fps/);
    const bitrateMatch = output.match(/bitrate=\s*(\d+\.?\d*)(k|M)bits\/s/);
    
    if (frameRateMatch) {
      status.frameRate = parseFloat(frameRateMatch[1]);
    }
    
    if (bitrateMatch) {
      const rate = parseFloat(bitrateMatch[1]);
      const unit = bitrateMatch[2];
      status.bitrate = unit === 'M' ? rate * 1000 : rate; // Convert to kbps
    }

    status.lastUpdate = new Date();
    this.streamStatuses.set(streamId, status);
  }

  /**
   * Generate RTSP URLs for all active streams
   */
  getActiveStreamUrls(): { [streamId: string]: string } {
    const urls: { [streamId: string]: string } = {};
    
    for (const [streamId, status] of this.streamStatuses.entries()) {
      if (status.status === 'running') {
        const config = this.streamConfigs.get(streamId);
        if (config) {
          urls[streamId] = `rtsp://localhost:${config.rtspPort}/${streamId}`;
        }
      }
    }
    
    return urls;
  }

  /**
   * Clean up all streams
   */
  async cleanup(): Promise<void> {
    console.log('Cleaning up FFmpeg streaming server...');
    
    const stopPromises = Array.from(this.streams.keys()).map(streamId => 
      this.stopStream(streamId).catch(err => 
        console.error(`Error stopping stream ${streamId}:`, err)
      )
    );
    
    await Promise.all(stopPromises);
    console.log('FFmpeg streaming server cleanup complete');
  }

  /**
   * Get next available port
   */
  getNextAvailableRtspPort(): number {
    const usedPorts = Array.from(this.streamConfigs.values()).map(config => config.rtspPort);
    let port = this.baseRtspPort;
    while (usedPorts.includes(port)) {
      port++;
    }
    return port;
  }

  /**
   * Generate stream configuration for truck cameras
   */
  generateTruckStreamConfigs(truckId: number, videoFiles: string[]): StreamConfig[] {
    const positions: StreamConfig['cameraPosition'][] = ['front', 'back', 'left', 'right', 'driver_facing', 'cargo'];
    const configs: StreamConfig[] = [];

    videoFiles.slice(0, 6).forEach((videoFile, index) => {
      const position = positions[index] || 'front';
      const config: StreamConfig = {
        id: `truck_${truckId}_${position}`,
        name: `Truck ${truckId} - ${position.replace('_', ' ').toUpperCase()}`,
        sourceVideo: videoFile,
        rtspPort: this.getNextAvailableRtspPort(),
        resolution: '1280x720',
        frameRate: 25,
        bitrate: '2000k',
        loop: true,
        cameraPosition: position,
        truckId,
        enabled: true
      };
      configs.push(config);
    });

    return configs;
  }
}

// Global FFmpeg streaming server instance
export const ffmpegServer = new FFmpegStreamingServer(
  path.join(process.cwd(), 'data', 'videos'),
  'ffmpeg'
);