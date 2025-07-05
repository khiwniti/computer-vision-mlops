// Frame Extractor for Real-Time Stream Processing
// Extracts frames from RTSP streams and feeds them to AI analysis pipeline

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { aiAnalyzer, FrameData } from '../ai-pipeline/ai-analyzer';
import { streamManager } from './stream-manager';
import { ffmpegServer } from './ffmpeg-server';

export interface FrameExtractionConfig {
  streamId: string;
  rtspUrl: string;
  extractionRate: number; // frames per second to extract
  resolution: string;
  enableAI: boolean;
  cameraId: number;
  truckId: number;
  driverId?: number;
}

export interface ExtractionStatus {
  streamId: string;
  status: 'running' | 'stopped' | 'error';
  framesExtracted: number;
  framesProcessed: number;
  lastFrameTime?: Date;
  errorRate: number;
  averageProcessingTime: number; // ms
  startTime: Date;
  error?: string;
}

export class FrameExtractor extends EventEmitter {
  private extractors: Map<string, ChildProcess> = new Map();
  private extractionConfigs: Map<string, FrameExtractionConfig> = new Map();
  private extractionStatuses: Map<string, ExtractionStatus> = new Map();
  private frameQueues: Map<string, Buffer[]> = new Map();
  private ffmpegPath: string;
  private maxQueueSize: number = 30; // Max frames to buffer per stream
  private processingInterval?: NodeJS.Timeout;

  constructor(ffmpegPath: string = 'ffmpeg') {
    super();
    this.ffmpegPath = ffmpegPath;
    
    // Start frame processing loop
    this.startFrameProcessing();
    
    // Listen to stream manager events
    streamManager.on('streamStarted', this.handleStreamStarted.bind(this));
    streamManager.on('streamStopped', this.handleStreamStopped.bind(this));
    
    // Cleanup on exit
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
  }

  /**
   * Start frame extraction for a stream
   */
  async startExtraction(config: FrameExtractionConfig): Promise<void> {
    if (this.extractors.has(config.streamId)) {
      throw new Error(`Frame extraction already running for stream ${config.streamId}`);
    }

    console.log(`Starting frame extraction for stream ${config.streamId}`);
    
    // Initialize status
    const status: ExtractionStatus = {
      streamId: config.streamId,
      status: 'running',
      framesExtracted: 0,
      framesProcessed: 0,
      errorRate: 0,
      averageProcessingTime: 0,
      startTime: new Date()
    };

    this.extractionConfigs.set(config.streamId, config);
    this.extractionStatuses.set(config.streamId, status);
    this.frameQueues.set(config.streamId, []);

    try {
      const extractor = this.createFrameExtractor(config);
      this.extractors.set(config.streamId, extractor);
      
      this.emit('extractionStarted', { streamId: config.streamId, config });
      
    } catch (error) {
      status.status = 'error';
      status.error = error.message;
      this.extractionStatuses.set(config.streamId, status);
      
      this.emit('extractionError', { streamId: config.streamId, error: error.message });
      throw error;
    }
  }

  /**
   * Stop frame extraction for a stream
   */
  async stopExtraction(streamId: string): Promise<void> {
    const extractor = this.extractors.get(streamId);
    if (!extractor) {
      throw new Error(`No frame extraction running for stream ${streamId}`);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        extractor.kill('SIGKILL');
        reject(new Error('Force killed frame extractor'));
      }, 5000);

      extractor.on('exit', () => {
        clearTimeout(timeout);
        this.extractors.delete(streamId);
        this.frameQueues.delete(streamId);
        
        // Update status
        const status = this.extractionStatuses.get(streamId);
        if (status) {
          status.status = 'stopped';
          this.extractionStatuses.set(streamId, status);
        }

        this.emit('extractionStopped', { streamId });
        resolve();
      });

      extractor.kill('SIGTERM');
    });
  }

  /**
   * Get extraction status
   */
  getExtractionStatus(streamId: string): ExtractionStatus | null {
    return this.extractionStatuses.get(streamId) || null;
  }

  /**
   * Get all extraction statuses
   */
  getAllExtractionStatuses(): ExtractionStatus[] {
    return Array.from(this.extractionStatuses.values());
  }

  /**
   * Create FFmpeg frame extractor process
   */
  private createFrameExtractor(config: FrameExtractionConfig): ChildProcess {
    const args = [
      // Input options
      '-i', config.rtspUrl,
      '-rtsp_transport', 'tcp',
      '-reconnect', '1',
      '-reconnect_streamed', '1',
      '-reconnect_delay_max', '5',
      
      // Video processing
      '-vf', `fps=${config.extractionRate},scale=${config.resolution}`,
      '-c:v', 'png', // PNG for lossless frame capture
      '-f', 'image2pipe',
      '-'
    ];

    console.log(`Starting frame extractor for ${config.streamId}:`, this.ffmpegPath, args.join(' '));

    const extractor = spawn(this.ffmpegPath, args, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Buffer to accumulate frame data
    let frameBuffer = Buffer.alloc(0);
    const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

    extractor.stdout?.on('data', (data: Buffer) => {
      frameBuffer = Buffer.concat([frameBuffer, data]);
      
      // Extract complete PNG frames
      let startIndex = 0;
      while (startIndex < frameBuffer.length) {
        const pngStart = frameBuffer.indexOf(pngSignature, startIndex);
        if (pngStart === -1) break;
        
        const nextPngStart = frameBuffer.indexOf(pngSignature, pngStart + 8);
        const frameEnd = nextPngStart === -1 ? frameBuffer.length : nextPngStart;
        
        if (frameEnd > pngStart + 8) {
          const frameData = frameBuffer.slice(pngStart, frameEnd);
          this.handleExtractedFrame(config.streamId, frameData);
          startIndex = frameEnd;
        } else {
          break;
        }
      }
      
      // Keep remaining data for next iteration
      if (startIndex > 0) {
        frameBuffer = frameBuffer.slice(startIndex);
      }
    });

    extractor.stderr?.on('data', (data) => {
      const output = data.toString();
      console.log(`Frame extractor stderr [${config.streamId}]:`, output);
      
      // Update statistics based on FFmpeg output
      this.updateExtractionStats(config.streamId, output);
    });

    extractor.on('error', (error) => {
      console.error(`Frame extractor error [${config.streamId}]:`, error);
      const status = this.extractionStatuses.get(config.streamId);
      if (status) {
        status.status = 'error';
        status.error = error.message;
        this.extractionStatuses.set(config.streamId, status);
      }
      this.emit('extractionError', { streamId: config.streamId, error: error.message });
    });

    extractor.on('exit', (code, signal) => {
      console.log(`Frame extractor exited [${config.streamId}] with code ${code}, signal ${signal}`);
      
      const status = this.extractionStatuses.get(config.streamId);
      if (status && status.status !== 'stopped') {
        status.status = code === 0 ? 'stopped' : 'error';
        if (code !== 0) {
          status.error = `Process exited with code ${code}`;
        }
        this.extractionStatuses.set(config.streamId, status);
      }
    });

    return extractor;
  }

  /**
   * Handle extracted frame data
   */
  private handleExtractedFrame(streamId: string, frameData: Buffer): void {
    const status = this.extractionStatuses.get(streamId);
    if (!status) return;

    // Update statistics
    status.framesExtracted++;
    status.lastFrameTime = new Date();
    this.extractionStatuses.set(streamId, status);

    // Add to queue for processing
    const queue = this.frameQueues.get(streamId);
    if (queue) {
      // Drop oldest frames if queue is full
      while (queue.length >= this.maxQueueSize) {
        queue.shift();
      }
      queue.push(frameData);
    }

    this.emit('frameExtracted', { streamId, frameSize: frameData.length });
  }

  /**
   * Process frames from all queues
   */
  private startFrameProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processQueuedFrames();
    }, 1000); // Process frames every second
  }

  /**
   * Process all queued frames
   */
  private async processQueuedFrames(): Promise<void> {
    for (const [streamId, queue] of this.frameQueues.entries()) {
      const config = this.extractionConfigs.get(streamId);
      const status = this.extractionStatuses.get(streamId);
      
      if (!config || !status || queue.length === 0) continue;

      // Process up to 5 frames per second per stream
      const framesToProcess = queue.splice(0, Math.min(5, queue.length));
      
      for (const frameBuffer of framesToProcess) {
        try {
          await this.processFrame(config, frameBuffer);
          status.framesProcessed++;
        } catch (error) {
          console.error(`Error processing frame for stream ${streamId}:`, error);
          status.errorRate = (status.errorRate + 1) / 2; // Simple moving average
        }
      }
      
      this.extractionStatuses.set(streamId, status);
    }
  }

  /**
   * Process individual frame with AI analysis
   */
  private async processFrame(config: FrameExtractionConfig, frameBuffer: Buffer): Promise<void> {
    if (!config.enableAI) return;

    const frameData: FrameData = {
      cameraId: config.cameraId,
      truckId: config.truckId,
      driverId: config.driverId,
      timestamp: new Date(),
      imageBuffer: frameBuffer,
      metadata: {
        frameRate: config.extractionRate,
        resolution: config.resolution,
        quality: 1.0
      }
    };

    // Send frame to AI analyzer
    aiAnalyzer.addFrame(frameData);
    
    this.emit('frameProcessed', { 
      streamId: config.streamId, 
      frameSize: frameBuffer.length,
      aiEnabled: config.enableAI
    });
  }

  /**
   * Update extraction statistics from FFmpeg output
   */
  private updateExtractionStats(streamId: string, output: string): void {
    const status = this.extractionStatuses.get(streamId);
    if (!status) return;

    // Parse frame rate from FFmpeg output
    const frameMatch = output.match(/frame=\s*(\d+)/);
    if (frameMatch) {
      const frameCount = parseInt(frameMatch[1]);
      if (frameCount > status.framesExtracted) {
        status.framesExtracted = frameCount;
      }
    }

    // Parse fps from FFmpeg output
    const fpsMatch = output.match(/fps=\s*(\d+\.?\d*)/);
    if (fpsMatch) {
      const fps = parseFloat(fpsMatch[1]);
      // Update processing time estimate
      status.averageProcessingTime = fps > 0 ? 1000 / fps : 0;
    }

    this.extractionStatuses.set(streamId, status);
  }

  /**
   * Handle stream started event from stream manager
   */
  private async handleStreamStarted(event: { streamId: string, config: any }): Promise<void> {
    try {
      // Get stream configuration
      const streamConfig = event.config;
      
      // Create frame extraction configuration
      const extractionConfig: FrameExtractionConfig = {
        streamId: event.streamId,
        rtspUrl: `rtsp://localhost:${streamConfig.rtspPort}/${streamConfig.id}`,
        extractionRate: 2, // Extract 2 frames per second for AI analysis
        resolution: '640x480', // Smaller resolution for faster processing
        enableAI: true,
        cameraId: 0, // Would map to actual camera ID from database
        truckId: streamConfig.truckId,
        driverId: undefined // Would be set when driver is assigned
      };

      // Start frame extraction with a small delay to ensure stream is ready
      setTimeout(() => {
        this.startExtraction(extractionConfig).catch(error => {
          console.error(`Failed to start frame extraction for ${event.streamId}:`, error);
        });
      }, 3000);
      
    } catch (error) {
      console.error('Error handling stream started event:', error);
    }
  }

  /**
   * Handle stream stopped event from stream manager
   */
  private async handleStreamStopped(event: { streamId: string }): Promise<void> {
    try {
      if (this.extractors.has(event.streamId)) {
        await this.stopExtraction(event.streamId);
      }
    } catch (error) {
      console.error(`Error stopping frame extraction for ${event.streamId}:`, error);
    }
  }

  /**
   * Get extraction metrics summary
   */
  getExtractionMetrics(): {
    totalExtractions: number;
    runningExtractions: number;
    totalFramesExtracted: number;
    totalFramesProcessed: number;
    averageErrorRate: number;
    averageProcessingTime: number;
  } {
    const statuses = Array.from(this.extractionStatuses.values());
    
    return {
      totalExtractions: statuses.length,
      runningExtractions: statuses.filter(s => s.status === 'running').length,
      totalFramesExtracted: statuses.reduce((sum, s) => sum + s.framesExtracted, 0),
      totalFramesProcessed: statuses.reduce((sum, s) => sum + s.framesProcessed, 0),
      averageErrorRate: statuses.length > 0 
        ? statuses.reduce((sum, s) => sum + s.errorRate, 0) / statuses.length 
        : 0,
      averageProcessingTime: statuses.length > 0
        ? statuses.reduce((sum, s) => sum + s.averageProcessingTime, 0) / statuses.length
        : 0
    };
  }

  /**
   * Start extraction for all active streams
   */
  async startAllExtractions(): Promise<void> {
    const streamGroups = streamManager.getAllStreamGroups();
    
    for (const group of streamGroups) {
      for (const streamConfig of group.streams) {
        const streamStatus = ffmpegServer.getStreamStatus(streamConfig.id);
        
        if (streamStatus?.status === 'running') {
          const extractionConfig: FrameExtractionConfig = {
            streamId: streamConfig.id,
            rtspUrl: `rtsp://localhost:${streamConfig.rtspPort}/${streamConfig.id}`,
            extractionRate: 2,
            resolution: '640x480',
            enableAI: true,
            cameraId: 0, // Would map from database
            truckId: streamConfig.truckId,
            driverId: undefined
          };

          try {
            await this.startExtraction(extractionConfig);
          } catch (error) {
            console.error(`Failed to start extraction for stream ${streamConfig.id}:`, error);
          }
        }
      }
    }
  }

  /**
   * Stop all extractions
   */
  async stopAllExtractions(): Promise<void> {
    const streamIds = Array.from(this.extractors.keys());
    
    for (const streamId of streamIds) {
      try {
        await this.stopExtraction(streamId);
      } catch (error) {
        console.error(`Failed to stop extraction for stream ${streamId}:`, error);
      }
    }
  }

  /**
   * Cleanup all resources
   */
  async cleanup(): Promise<void> {
    console.log('Cleaning up frame extractor...');
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    
    await this.stopAllExtractions();
    
    this.extractionConfigs.clear();
    this.extractionStatuses.clear();
    this.frameQueues.clear();
    
    console.log('Frame extractor cleanup complete');
  }
}

// Global frame extractor instance
export const frameExtractor = new FrameExtractor();