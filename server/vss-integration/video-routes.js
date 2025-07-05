// Video Analytics API Routes for AsphaltTracker
// Provides REST API endpoints for video upload, processing, and analysis

import express from 'express';
import multer from 'multer';
import path from 'path';
import VideoProcessor from './video-processor.js';
import { vssConfig } from './vss-config.js';

const router = express.Router();
const videoProcessor = new VideoProcessor();

// Configure multer for video uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is a video
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  }
});

/**
 * POST /api/video/upload
 * Upload and process video file
 */
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No video file provided'
      });
    }

    const metadata = {
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedBy: req.user?.id || 'anonymous',
      uploadedAt: new Date(),
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : []
    };

    const result = await videoProcessor.processVideo(
      req.file.originalname,
      req.file.buffer,
      metadata
    );

    res.json(result);
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/video/status/:videoId
 * Get processing status for a video
 */
router.get('/status/:videoId', (req, res) => {
  try {
    const { videoId } = req.params;
    const status = videoProcessor.getProcessingStatus(videoId);
    
    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/video/status
 * Get all processing statuses
 */
router.get('/status', (req, res) => {
  try {
    const statuses = videoProcessor.getAllProcessingStatuses();
    res.json({
      success: true,
      statuses
    });
  } catch (error) {
    console.error('Status list error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/video/library
 * Get processed video library
 */
router.get('/library', async (req, res) => {
  try {
    const { page = 1, limit = 20, tag, search } = req.query;
    
    // This would typically query your database
    // For now, we'll simulate with processing queue data
    let videos = videoProcessor.getAllProcessingStatuses()
      .filter(video => video.status === 'completed')
      .map(video => ({
        id: video.id,
        filename: video.filename,
        uploadTime: video.startTime,
        status: video.status,
        metadata: video.metadata
      }));

    // Apply filters
    if (tag) {
      videos = videos.filter(video => 
        video.metadata?.tags?.includes(tag)
      );
    }

    if (search) {
      videos = videos.filter(video =>
        video.filename.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedVideos = videos.slice(startIndex, endIndex);

    res.json({
      success: true,
      videos: paginatedVideos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: videos.length,
        pages: Math.ceil(videos.length / limit)
      }
    });
  } catch (error) {
    console.error('Library query error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/video/search
 * Search videos using natural language query
 */
router.post('/search', async (req, res) => {
  try {
    const { query, limit = 10 } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const results = await videoProcessor.searchVideos(query);
    
    res.json({
      success: true,
      query,
      results: results.slice(0, limit)
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/video/details/:videoId
 * Get detailed analysis for a video
 */
router.get('/details/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    // In a real implementation, this would query your database
    const videoData = videoProcessor.getProcessingStatus(videoId);
    
    if (!videoData || videoData.status !== 'completed') {
      return res.status(404).json({
        success: false,
        error: 'Video not found or not processed'
      });
    }

    // Load detailed results from file
    const fs = await import('fs/promises');
    const resultsPath = path.join(
      vssConfig.storage.processedStorage.path,
      `${videoId}.json`
    );
    
    try {
      const resultsData = await fs.readFile(resultsPath, 'utf8');
      const results = JSON.parse(resultsData);
      
      res.json({
        success: true,
        video: {
          id: videoId,
          ...results
        }
      });
    } catch (fileError) {
      res.status(404).json({
        success: false,
        error: 'Video analysis data not found'
      });
    }
  } catch (error) {
    console.error('Video details error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/video/analytics/summary
 * Get analytics summary for all videos
 */
router.get('/analytics/summary', async (req, res) => {
  try {
    const videos = videoProcessor.getAllProcessingStatuses();
    
    const summary = {
      totalVideos: videos.length,
      processingVideos: videos.filter(v => v.status === 'processing').length,
      completedVideos: videos.filter(v => v.status === 'completed').length,
      failedVideos: videos.filter(v => v.status === 'error').length,
      totalProcessingTime: videos.reduce((sum, v) => {
        if (v.status === 'completed' && v.startTime && v.lastUpdate) {
          return sum + (new Date(v.lastUpdate) - new Date(v.startTime));
        }
        return sum;
      }, 0),
      averageProcessingTime: 0
    };

    if (summary.completedVideos > 0) {
      summary.averageProcessingTime = summary.totalProcessingTime / summary.completedVideos;
    }

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/video/:videoId
 * Delete a video and its analysis data
 */
router.delete('/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    // Remove from processing queue
    const videoData = videoProcessor.getProcessingStatus(videoId);
    if (videoData) {
      videoProcessor.processingQueue.delete(videoId);
    }

    // Delete video file and analysis data
    const fs = await import('fs/promises');
    const videoPath = path.join(vssConfig.storage.videoStorage.path, `${videoId}.mp4`);
    const resultsPath = path.join(vssConfig.storage.processedStorage.path, `${videoId}.json`);
    
    try {
      await fs.unlink(videoPath);
    } catch (error) {
      console.log('Video file not found:', videoPath);
    }
    
    try {
      await fs.unlink(resultsPath);
    } catch (error) {
      console.log('Results file not found:', resultsPath);
    }

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Video deletion error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handler for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 500MB.'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    error: error.message
  });
});

export default router;