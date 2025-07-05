// Streaming API Routes for Real-Time CCTV Simulation
// REST API endpoints for managing FFmpeg streams and video dataset

import express from 'express';
import multer from 'multer';
import { streamManager } from '../streaming/stream-manager';
import { ffmpegServer } from '../streaming/ffmpeg-server';
import { videoDatasetProcessor } from '../streaming/video-dataset-processor';
import type { StreamConfig } from '../streaming/ffmpeg-server';

const router = express.Router();

// Configure multer for video uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  }
});

/**
 * GET /api/streams/status
 * Get overall streaming system status
 */
router.get('/status', async (req, res) => {
  try {
    const metrics = streamManager.getStreamMetrics();
    const ffmpegStreams = ffmpegServer.getAllStreamStatuses();
    const datasetStats = await videoDatasetProcessor.getDatasetStats();
    
    res.json({
      success: true,
      system: {
        status: metrics.errorStreams > metrics.runningStreams / 2 ? 'degraded' : 'healthy',
        uptime: process.uptime() * 1000,
        lastUpdate: new Date()
      },
      streams: metrics,
      dataset: datasetStats,
      activeStreams: ffmpegStreams.filter(s => s.status === 'running')
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/streams/groups
 * Get all stream groups (trucks with their camera streams)
 */
router.get('/groups', async (req, res) => {
  try {
    const streamGroups = streamManager.getAllStreamGroups();
    
    // Add detailed status for each stream in each group
    const detailedGroups = streamGroups.map(group => ({
      ...group,
      streams: group.streams.map(streamConfig => ({
        ...streamConfig,
        status: ffmpegServer.getStreamStatus(streamConfig.id),
        url: `rtsp://localhost:${streamConfig.rtspPort}/${streamConfig.id}`
      }))
    }));

    res.json({
      success: true,
      groups: detailedGroups,
      summary: {
        totalTrucks: streamGroups.length,
        runningTrucks: streamGroups.filter(g => g.status === 'all_running').length,
        partialTrucks: streamGroups.filter(g => g.status === 'partial_running').length,
        stoppedTrucks: streamGroups.filter(g => g.status === 'all_stopped').length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/streams/groups/:truckId
 * Get streams for a specific truck
 */
router.get('/groups/:truckId', async (req, res) => {
  try {
    const truckId = parseInt(req.params.truckId);
    const streamGroup = streamManager.getStreamGroup(truckId);
    
    if (!streamGroup) {
      return res.status(404).json({
        success: false,
        error: `Stream group not found for truck ${truckId}`
      });
    }

    // Add detailed status and URLs
    const detailedGroup = {
      ...streamGroup,
      streams: streamGroup.streams.map(streamConfig => ({
        ...streamConfig,
        status: ffmpegServer.getStreamStatus(streamConfig.id),
        url: `rtsp://localhost:${streamConfig.rtspPort}/${streamConfig.id}`
      }))
    };

    res.json({
      success: true,
      group: detailedGroup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/streams/groups/:truckId/start
 * Start all streams for a truck
 */
router.post('/groups/:truckId/start', async (req, res) => {
  try {
    const truckId = parseInt(req.params.truckId);
    await streamManager.startTruckStreams(truckId);
    
    res.json({
      success: true,
      message: `Started streams for truck ${truckId}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/streams/groups/:truckId/stop
 * Stop all streams for a truck
 */
router.post('/groups/:truckId/stop', async (req, res) => {
  try {
    const truckId = parseInt(req.params.truckId);
    await streamManager.stopTruckStreams(truckId);
    
    res.json({
      success: true,
      message: `Stopped streams for truck ${truckId}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/streams/groups/:truckId/restart
 * Restart all streams for a truck
 */
router.post('/groups/:truckId/restart', async (req, res) => {
  try {
    const truckId = parseInt(req.params.truckId);
    await streamManager.restartTruckStreams(truckId);
    
    res.json({
      success: true,
      message: `Restarted streams for truck ${truckId}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/streams/groups/:truckId/cameras/:position/start
 * Start a specific camera stream
 */
router.post('/groups/:truckId/cameras/:position/start', async (req, res) => {
  try {
    const truckId = parseInt(req.params.truckId);
    const position = req.params.position;
    
    await streamManager.startCameraStream(truckId, position);
    
    res.json({
      success: true,
      message: `Started ${position} camera stream for truck ${truckId}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/streams/groups/:truckId/cameras/:position/stop
 * Stop a specific camera stream
 */
router.post('/groups/:truckId/cameras/:position/stop', async (req, res) => {
  try {
    const truckId = parseInt(req.params.truckId);
    const position = req.params.position;
    
    await streamManager.stopCameraStream(truckId, position);
    
    res.json({
      success: true,
      message: `Stopped ${position} camera stream for truck ${truckId}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/streams/initialize
 * Initialize streams for all trucks
 */
router.post('/initialize', async (req, res) => {
  try {
    await streamManager.initializeAllTruckStreams();
    
    const metrics = streamManager.getStreamMetrics();
    
    res.json({
      success: true,
      message: 'Stream initialization completed',
      metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/streams/urls
 * Get all active stream URLs
 */
router.get('/urls', async (req, res) => {
  try {
    const urls = ffmpegServer.getActiveStreamUrls();
    
    res.json({
      success: true,
      urls,
      count: Object.keys(urls).length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/streams/dataset/download
 * Download and process Kaggle dataset
 */
router.post('/dataset/download', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    const jobId = await videoDatasetProcessor.downloadKaggleDataset(apiKey);
    
    res.json({
      success: true,
      jobId,
      message: 'Dataset download started'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/streams/dataset/upload
 * Upload and process video files
 */
router.post('/dataset/upload', upload.array('videos', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No video files provided'
      });
    }

    const files = (req.files as Express.Multer.File[]).map(file => ({
      filename: file.originalname,
      buffer: file.buffer
    }));

    const jobId = await videoDatasetProcessor.processUploadedVideos(files);
    
    res.json({
      success: true,
      jobId,
      message: `Processing ${files.length} uploaded videos`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/streams/dataset/jobs
 * Get all processing jobs
 */
router.get('/dataset/jobs', async (req, res) => {
  try {
    const jobs = videoDatasetProcessor.getAllJobs();
    
    res.json({
      success: true,
      jobs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/streams/dataset/jobs/:jobId
 * Get processing job status
 */
router.get('/dataset/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = videoDatasetProcessor.getJobStatus(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    res.json({
      success: true,
      job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/streams/dataset/jobs/:jobId
 * Clean up processing job
 */
router.delete('/dataset/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    await videoDatasetProcessor.cleanupJob(jobId);
    
    res.json({
      success: true,
      message: 'Job cleaned up successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/streams/dataset/videos
 * Get available processed videos
 */
router.get('/dataset/videos', async (req, res) => {
  try {
    const videos = await videoDatasetProcessor.getAvailableVideos();
    
    res.json({
      success: true,
      videos,
      count: videos.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/streams/dataset/stats
 * Get dataset statistics
 */
router.get('/dataset/stats', async (req, res) => {
  try {
    const stats = await videoDatasetProcessor.getDatasetStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/streams/custom
 * Create a custom stream configuration
 */
router.post('/custom', async (req, res) => {
  try {
    const streamConfig: StreamConfig = req.body;
    
    // Validate required fields
    if (!streamConfig.id || !streamConfig.sourceVideo || !streamConfig.rtspPort) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: id, sourceVideo, rtspPort'
      });
    }

    await ffmpegServer.startStream(streamConfig);
    
    res.json({
      success: true,
      message: `Custom stream ${streamConfig.id} started`,
      streamUrl: `rtsp://localhost:${streamConfig.rtspPort}/${streamConfig.id}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/streams/:streamId
 * Stop and remove a specific stream
 */
router.delete('/:streamId', async (req, res) => {
  try {
    const { streamId } = req.params;
    
    await ffmpegServer.stopStream(streamId);
    
    res.json({
      success: true,
      message: `Stream ${streamId} stopped`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/streams/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const metrics = streamManager.getStreamMetrics();
    const isHealthy = metrics.errorStreams < metrics.totalStreams * 0.1; // Less than 10% errors
    
    res.status(isHealthy ? 200 : 503).json({
      success: true,
      healthy: isHealthy,
      metrics,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      healthy: false,
      error: error.message,
      timestamp: new Date()
    });
  }
});

// Error handler for multer
router.use((error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 1GB per file.'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    error: error.message
  });
});

export default router;