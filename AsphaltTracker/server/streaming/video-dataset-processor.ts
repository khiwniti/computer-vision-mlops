// Video Dataset Processor for Kaggle Driving Videos
// Downloads, processes, and prepares driving videos for streaming simulation

import { spawn, ChildProcess } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';
import crypto from 'crypto';

export interface VideoMetadata {
  filename: string;
  duration: number;
  resolution: string;
  frameRate: number;
  size: number;
  codec: string;
  bitrate: number;
  createdAt: Date;
  checksum: string;
}

export interface ProcessingJob {
  id: string;
  status: 'pending' | 'downloading' | 'processing' | 'completed' | 'error';
  progress: number;
  sourceUrl?: string;
  outputFiles: string[];
  startTime: Date;
  endTime?: Date;
  error?: string;
  metadata?: VideoMetadata[];
}

export class VideoDatasetProcessor extends EventEmitter {
  private datasetPath: string;
  private tempPath: string;
  private processedPath: string;
  private processingJobs: Map<string, ProcessingJob> = new Map();
  private ffmpegPath: string;
  private ffprobePath: string;

  constructor(datasetPath: string, ffmpegPath: string = 'ffmpeg', ffprobePath: string = 'ffprobe') {
    super();
    this.datasetPath = path.resolve(datasetPath);
    this.tempPath = path.join(this.datasetPath, 'temp');
    this.processedPath = path.join(this.datasetPath, 'processed');
    this.ffmpegPath = ffmpegPath;
    this.ffprobePath = ffprobePath;
    
    this.ensureDirectories();
  }

  /**
   * Download and process Kaggle driving video dataset
   */
  async downloadKaggleDataset(apiKey?: string): Promise<string> {
    const jobId = this.generateJobId();
    const job: ProcessingJob = {
      id: jobId,
      status: 'downloading',
      progress: 0,
      outputFiles: [],
      startTime: new Date()
    };

    this.processingJobs.set(jobId, job);

    try {
      console.log('Starting Kaggle dataset download...');
      
      // Create download directory
      const downloadPath = path.join(this.tempPath, 'kaggle_download');
      await fs.mkdir(downloadPath, { recursive: true });

      // Download the dataset using kaggle API or curl
      const zipPath = await this.downloadDatasetFile(downloadPath, job);
      
      // Extract the dataset
      await this.extractDataset(zipPath, downloadPath, job);
      
      // Process individual videos
      const videoFiles = await this.findVideoFiles(downloadPath);
      await this.processVideoFiles(videoFiles, job);

      job.status = 'completed';
      job.endTime = new Date();
      job.progress = 100;
      
      console.log(`Dataset processing completed. Job ID: ${jobId}`);
      this.emit('jobCompleted', job);
      
      return jobId;
      
    } catch (error) {
      job.status = 'error';
      job.error = error.message;
      job.endTime = new Date();
      
      console.error('Dataset processing failed:', error);
      this.emit('jobError', { jobId, error: error.message });
      
      throw error;
    }
  }

  /**
   * Process uploaded video files
   */
  async processUploadedVideos(files: { filename: string, buffer: Buffer }[]): Promise<string> {
    const jobId = this.generateJobId();
    const job: ProcessingJob = {
      id: jobId,
      status: 'processing',
      progress: 0,
      outputFiles: [],
      startTime: new Date()
    };

    this.processingJobs.set(jobId, job);

    try {
      console.log(`Processing ${files.length} uploaded videos...`);
      
      // Save uploaded files to temp directory
      const uploadPath = path.join(this.tempPath, jobId);
      await fs.mkdir(uploadPath, { recursive: true });

      const videoFiles: string[] = [];
      for (const file of files) {
        const filePath = path.join(uploadPath, file.filename);
        await fs.writeFile(filePath, file.buffer);
        videoFiles.push(filePath);
      }

      // Process the video files
      await this.processVideoFiles(videoFiles, job);

      job.status = 'completed';
      job.endTime = new Date();
      job.progress = 100;
      
      this.emit('jobCompleted', job);
      return jobId;
      
    } catch (error) {
      job.status = 'error';
      job.error = error.message;
      job.endTime = new Date();
      
      this.emit('jobError', { jobId, error: error.message });
      throw error;
    }
  }

  /**
   * Get processing job status
   */
  getJobStatus(jobId: string): ProcessingJob | null {
    return this.processingJobs.get(jobId) || null;
  }

  /**
   * Get all processing jobs
   */
  getAllJobs(): ProcessingJob[] {
    return Array.from(this.processingJobs.values());
  }

  /**
   * Get available processed videos
   */
  async getAvailableVideos(): Promise<VideoMetadata[]> {
    try {
      const metadataPath = path.join(this.processedPath, 'metadata.json');
      const data = await fs.readFile(metadataPath, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  /**
   * Download dataset file using curl
   */
  private async downloadDatasetFile(downloadPath: string, job: ProcessingJob): Promise<string> {
    const zipPath = path.join(downloadPath, 'driving-video-with-object-tracking.zip');
    const url = 'https://www.kaggle.com/api/v1/datasets/download/robikscube/driving-video-with-object-tracking';

    return new Promise((resolve, reject) => {
      console.log('Downloading dataset from Kaggle...');
      
      const curl = spawn('curl', [
        '-L',
        '-o', zipPath,
        '--progress-bar',
        url
      ]);

      curl.stdout?.on('data', (data) => {
        // Parse progress from curl output
        const output = data.toString();
        const progressMatch = output.match(/(\d+\.?\d*)%/);
        if (progressMatch) {
          job.progress = Math.floor(parseFloat(progressMatch[1]) * 0.3); // Download is 30% of total
          this.processingJobs.set(job.id, job);
          this.emit('jobProgress', { jobId: job.id, progress: job.progress });
        }
      });

      curl.on('close', (code) => {
        if (code === 0) {
          console.log('Dataset download completed');
          resolve(zipPath);
        } else {
          reject(new Error(`Download failed with code ${code}`));
        }
      });

      curl.on('error', (error) => {
        reject(new Error(`Download error: ${error.message}`));
      });
    });
  }

  /**
   * Extract dataset archive
   */
  private async extractDataset(zipPath: string, extractPath: string, job: ProcessingJob): Promise<void> {
    console.log('Extracting dataset archive...');
    
    return new Promise((resolve, reject) => {
      const unzip = spawn('unzip', ['-o', zipPath, '-d', extractPath]);

      unzip.on('close', (code) => {
        if (code === 0) {
          job.progress = 40; // Extraction is 10% more
          this.processingJobs.set(job.id, job);
          this.emit('jobProgress', { jobId: job.id, progress: job.progress });
          resolve();
        } else {
          reject(new Error(`Extraction failed with code ${code}`));
        }
      });

      unzip.on('error', (error) => {
        reject(new Error(`Extraction error: ${error.message}`));
      });
    });
  }

  /**
   * Find all video files in directory
   */
  private async findVideoFiles(directory: string): Promise<string[]> {
    const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv'];
    const videoFiles: string[] = [];

    async function scanDirectory(dir: string): Promise<void> {
      const items = await fs.readdir(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (item.isFile()) {
          const ext = path.extname(item.name).toLowerCase();
          if (videoExtensions.includes(ext)) {
            videoFiles.push(fullPath);
          }
        }
      }
    }

    await scanDirectory(directory);
    return videoFiles;
  }

  /**
   * Process video files for streaming
   */
  private async processVideoFiles(videoFiles: string[], job: ProcessingJob): Promise<void> {
    console.log(`Processing ${videoFiles.length} video files...`);
    
    const metadata: VideoMetadata[] = [];
    const processedVideos: string[] = [];
    
    for (let i = 0; i < videoFiles.length; i++) {
      const videoFile = videoFiles[i];
      
      try {
        // Get video metadata
        const videoMetadata = await this.getVideoMetadata(videoFile);
        
        // Process video for streaming optimization
        const processedFile = await this.optimizeVideoForStreaming(videoFile, i);
        
        processedVideos.push(processedFile);
        metadata.push({
          ...videoMetadata,
          filename: path.basename(processedFile)
        });
        
        // Update progress
        job.progress = 40 + Math.floor((i + 1) / videoFiles.length * 60);
        this.processingJobs.set(job.id, job);
        this.emit('jobProgress', { jobId: job.id, progress: job.progress });
        
      } catch (error) {
        console.error(`Error processing video ${videoFile}:`, error);
        // Continue with other videos
      }
    }

    // Save metadata
    await this.saveVideoMetadata(metadata);
    
    job.outputFiles = processedVideos;
    job.metadata = metadata;
    
    console.log(`Video processing completed. ${processedVideos.length} videos ready for streaming.`);
  }

  /**
   * Get video metadata using ffprobe
   */
  private async getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn(this.ffprobePath, [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        videoPath
      ]);

      let output = '';
      
      ffprobe.stdout?.on('data', (data) => {
        output += data.toString();
      });

      ffprobe.on('close', async (code) => {
        if (code === 0) {
          try {
            const probe = JSON.parse(output);
            const videoStream = probe.streams.find((s: any) => s.codec_type === 'video');
            
            if (!videoStream) {
              reject(new Error('No video stream found'));
              return;
            }

            const stats = await fs.stat(videoPath);
            const fileBuffer = await fs.readFile(videoPath);
            const checksum = crypto.createHash('md5').update(fileBuffer).digest('hex');

            const metadata: VideoMetadata = {
              filename: path.basename(videoPath),
              duration: parseFloat(probe.format.duration || '0'),
              resolution: `${videoStream.width}x${videoStream.height}`,
              frameRate: eval(videoStream.r_frame_rate || '25/1'), // Evaluate fraction
              size: stats.size,
              codec: videoStream.codec_name,
              bitrate: parseInt(probe.format.bit_rate || '0'),
              createdAt: new Date(),
              checksum
            };

            resolve(metadata);
          } catch (error) {
            reject(new Error(`Failed to parse video metadata: ${error.message}`));
          }
        } else {
          reject(new Error(`ffprobe failed with code ${code}`));
        }
      });

      ffprobe.on('error', (error) => {
        reject(new Error(`ffprobe error: ${error.message}`));
      });
    });
  }

  /**
   * Optimize video for streaming
   */
  private async optimizeVideoForStreaming(inputPath: string, index: number): Promise<string> {
    const outputFilename = `driving_sample_${index + 1}.mp4`;
    const outputPath = path.join(this.processedPath, outputFilename);

    return new Promise((resolve, reject) => {
      console.log(`Optimizing video: ${path.basename(inputPath)} -> ${outputFilename}`);
      
      const ffmpeg = spawn(this.ffmpegPath, [
        '-i', inputPath,
        
        // Video encoding settings optimized for streaming
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23', // Good quality/size balance
        '-maxrate', '2000k',
        '-bufsize', '4000k',
        '-vf', 'scale=1280:720', // Standardize resolution
        '-r', '25', // Standardize frame rate
        
        // Audio encoding
        '-c:a', 'aac',
        '-b:a', '128k',
        '-ar', '44100',
        
        // Output format
        '-f', 'mp4',
        '-movflags', '+faststart', // Enable web streaming
        
        '-y', // Overwrite output file
        outputPath
      ]);

      ffmpeg.stderr?.on('data', (data) => {
        const output = data.toString();
        // Could parse progress here if needed
        console.log(`FFmpeg [${outputFilename}]:`, output);
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log(`Video optimization completed: ${outputFilename}`);
          resolve(outputPath);
        } else {
          reject(new Error(`Video optimization failed with code ${code}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(new Error(`FFmpeg error: ${error.message}`));
      });
    });
  }

  /**
   * Save video metadata to file
   */
  private async saveVideoMetadata(metadata: VideoMetadata[]): Promise<void> {
    const metadataPath = path.join(this.processedPath, 'metadata.json');
    
    // Load existing metadata if it exists
    let existingMetadata: VideoMetadata[] = [];
    try {
      const data = await fs.readFile(metadataPath, 'utf8');
      existingMetadata = JSON.parse(data);
    } catch {
      // File doesn't exist or is invalid, start fresh
    }

    // Merge metadata, avoiding duplicates
    const combinedMetadata = [...existingMetadata];
    
    for (const newMeta of metadata) {
      const exists = existingMetadata.some(existing => 
        existing.checksum === newMeta.checksum || existing.filename === newMeta.filename
      );
      
      if (!exists) {
        combinedMetadata.push(newMeta);
      }
    }

    await fs.writeFile(metadataPath, JSON.stringify(combinedMetadata, null, 2));
    console.log(`Saved metadata for ${combinedMetadata.length} videos`);
  }

  /**
   * Ensure required directories exist
   */
  private async ensureDirectories(): Promise<void> {
    const directories = [this.datasetPath, this.tempPath, this.processedPath];
    
    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up temp files for a job
   */
  async cleanupJob(jobId: string): Promise<void> {
    const job = this.processingJobs.get(jobId);
    if (!job) return;

    try {
      const jobTempPath = path.join(this.tempPath, jobId);
      await fs.rm(jobTempPath, { recursive: true, force: true });
      console.log(`Cleaned up temp files for job ${jobId}`);
    } catch (error) {
      console.error(`Error cleaning up job ${jobId}:`, error);
    }
  }

  /**
   * Get dataset statistics
   */
  async getDatasetStats(): Promise<{
    totalVideos: number;
    totalSize: number;
    totalDuration: number;
    averageDuration: number;
    resolutions: { [key: string]: number };
    codecs: { [key: string]: number };
  }> {
    const metadata = await this.getAvailableVideos();
    
    const stats = {
      totalVideos: metadata.length,
      totalSize: metadata.reduce((sum, m) => sum + m.size, 0),
      totalDuration: metadata.reduce((sum, m) => sum + m.duration, 0),
      averageDuration: 0,
      resolutions: {} as { [key: string]: number },
      codecs: {} as { [key: string]: number }
    };

    if (stats.totalVideos > 0) {
      stats.averageDuration = stats.totalDuration / stats.totalVideos;
    }

    // Count resolutions and codecs
    metadata.forEach(m => {
      stats.resolutions[m.resolution] = (stats.resolutions[m.resolution] || 0) + 1;
      stats.codecs[m.codec] = (stats.codecs[m.codec] || 0) + 1;
    });

    return stats;
  }
}

// Global video dataset processor instance
export const videoDatasetProcessor = new VideoDatasetProcessor(
  path.join(process.cwd(), 'data', 'videos')
);