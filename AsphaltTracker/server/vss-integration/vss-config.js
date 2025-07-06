// Enhanced VSS (Video Search and Summarization) Configuration
// This file contains configuration for integrating NVIDIA's VSS API with AsphaltTracker
// Updated for production-ready real-time activity tracking

export const vssConfig = {
  // NVIDIA API Configuration
  nvidia: {
    apiKey: process.env.NVIDIA_API_KEY,
    baseUrl: 'https://api.nvidia.com/v1',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  },

  // VSS Engine Configuration (for local deployment)
  engine: {
    host: process.env.VSS_ENGINE_HOST || 'localhost',
    port: process.env.VSS_ENGINE_PORT || 8000,
    apiVersion: 'v1',
    useLocal: process.env.VSS_USE_LOCAL === 'true'
  },

  // Enhanced Model Configuration with NVIDIA NIM endpoints
  models: {
    // Vision Language Model for video understanding
    vlm: {
      name: process.env.VLM_MODEL || 'nvidia/vila',
      endpoint: process.env.VLM_ENDPOINT || 'https://api.nvidia.com/v1/vlm/nvidia/vila',
      local_endpoint: 'http://localhost:8001',
      maxTokens: 4096,
      temperature: 0.1
    },

    // Large Language Model for summarization
    llm: {
      name: process.env.LLM_MODEL || 'meta/llama-3.1-70b-instruct',
      endpoint: process.env.LLM_ENDPOINT || 'https://api.nvidia.com/v1/chat/completions',
      local_endpoint: 'http://localhost:8002',
      maxTokens: 8192,
      temperature: 0.2
    },

    // Embedding model for search
    embedding: {
      name: process.env.EMBEDDING_MODEL || 'nvidia/llama-3_2-nv-embedqa-1b-v2',
      endpoint: process.env.EMBEDDING_ENDPOINT || 'https://api.nvidia.com/v1/embeddings',
      local_endpoint: 'http://localhost:8003',
      dimensions: 1024
    },

    // Reranker model for better search results
    reranker: {
      name: process.env.RERANKER_MODEL || 'nvidia/llama-3_2-nv-rerankqa-1b-v2',
      endpoint: process.env.RERANKER_ENDPOINT || 'https://api.nvidia.com/v1/ranking',
      local_endpoint: 'http://localhost:8004',
      topK: 10
    },

    // Audio processing for video transcription
    asr: {
      name: process.env.ASR_MODEL || 'nvidia/parakeet-ctc-0_6b-asr',
      endpoint: process.env.ASR_ENDPOINT || 'https://api.nvidia.com/v1/asr',
      local_endpoint: 'http://localhost:8005',
      language: 'en-US'
    }
  },

  // Enhanced Processing Configuration for Real-time Activity Tracking
  processing: {
    // Real-time streaming settings
    realtime: {
      enabled: true,
      frameRate: 30, // Process 30 FPS for real-time
      bufferSize: 100, // Frame buffer size
      processingDelay: 100, // ms delay between processing
      batchSize: 5 // Process frames in batches
    },

    // Frame extraction settings
    frameExtraction: {
      intervalSeconds: 2, // Extract frame every 2 seconds for better tracking
      quality: 'high',
      maxFrames: 500, // Increased for longer videos
      formats: ['jpg', 'png'],
      resolution: {
        width: 1920,
        height: 1080
      }
    },

    // Video chunking settings
    chunking: {
      chunkDurationSeconds: 15, // Smaller chunks for real-time processing
      overlapSeconds: 3,
      maxChunks: 100,
      parallelProcessing: true
    },

    // Enhanced analysis settings for construction/asphalt monitoring
    analysis: {
      // Advanced object detection with confidence scoring
      objectDetection: {
        enabled: true,
        confidence: 0.7,
        categories: [
          // Construction vehicles
          'asphalt_paver',
          'road_roller',
          'dump_truck',
          'excavator',
          'bulldozer',
          'grader',
          'compactor',

          // Personnel and safety
          'construction_worker',
          'safety_vest',
          'hard_hat',
          'safety_boots',
          'gloves',

          // Equipment and materials
          'safety_cone',
          'barrier',
          'warning_sign',
          'asphalt_material',
          'road_marking',

          // Infrastructure
          'road_surface',
          'curb',
          'sidewalk',
          'traffic_light'
        ],
        trackingEnabled: true,
        persistentTracking: true
      },

      // Enhanced safety compliance with real-time alerts
      safetyCompliance: {
        enabled: true,
        realTimeAlerts: true,
        checkPPE: true,
        checkSafetyZones: true,
        checkProximityAlerts: true,
        checkSpeedLimits: true,
        checkEquipmentStatus: true,
        alertThresholds: {
          proximityDistance: 5, // meters
          speedLimit: 25, // km/h
          ppeCompliance: 0.95 // 95% compliance required
        }
      },

      // Advanced progress tracking with measurements
      progressTracking: {
        enabled: true,
        trackPavingProgress: true,
        measureCoverage: true,
        calculateVolume: true,
        trackQuality: true,
        generateReports: true,
        metrics: {
          areaCompleted: true,
          pavingSpeed: true,
          materialUsage: true,
          qualityScore: true
        }
      },

      // Activity recognition and classification
      activityRecognition: {
        enabled: true,
        activities: [
          'paving',
          'rolling',
          'material_delivery',
          'equipment_setup',
          'quality_inspection',
          'safety_briefing',
          'maintenance',
          'cleanup'
        ],
        confidenceThreshold: 0.8,
        temporalTracking: true
      }
    }
  },

  // Enhanced Storage Configuration for Production
  storage: {
    // Video storage with cloud support
    videoStorage: {
      path: process.env.VIDEO_STORAGE_PATH || './uploads/videos',
      maxSize: process.env.MAX_VIDEO_SIZE || '50GB',
      retentionDays: parseInt(process.env.VIDEO_RETENTION_DAYS || '90'),
      cloudStorage: {
        enabled: process.env.CLOUD_STORAGE_ENABLED === 'true',
        provider: process.env.CLOUD_PROVIDER || 's3', // s3, gcs, azure
        bucket: process.env.STORAGE_BUCKET,
        region: process.env.STORAGE_REGION
      },
      compression: {
        enabled: true,
        quality: 0.8,
        format: 'h264'
      }
    },

    // Enhanced processed data storage
    processedStorage: {
      path: process.env.PROCESSED_STORAGE_PATH || './data/processed',

      // Vector database for semantic search
      vectorDB: {
        enabled: true,
        type: process.env.VECTOR_DB_TYPE || 'chroma',
        host: process.env.VECTOR_DB_HOST || 'localhost',
        port: process.env.VECTOR_DB_PORT || 8005,
        collection: 'asphalt_tracker_videos',
        dimensions: 1024,
        indexType: 'hnsw'
      },

      // Graph database for relationship tracking
      graphDB: {
        enabled: true,
        type: process.env.GRAPH_DB_TYPE || 'neo4j',
        host: process.env.GRAPH_DB_HOST || 'localhost',
        port: process.env.GRAPH_DB_PORT || 7687,
        database: 'asphalt_tracker',
        username: process.env.NEO4J_USERNAME || 'neo4j',
        password: process.env.NEO4J_PASSWORD
      },

      // Time series database for activity tracking
      timeSeriesDB: {
        enabled: true,
        type: process.env.TSDB_TYPE || 'influxdb',
        host: process.env.TSDB_HOST || 'localhost',
        port: process.env.TSDB_PORT || 8086,
        database: 'activity_tracking',
        retention: '30d'
      }
    }
  },

  // Enhanced API Configuration
  api: {
    // Rate limiting with different tiers
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.API_RATE_LIMIT || '1000'),
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      standardHeaders: true,
      legacyHeaders: false
    },

    // Enhanced authentication and authorization
    auth: {
      enabled: process.env.VSS_AUTH_ENABLED !== 'false',
      apiKey: process.env.VSS_API_KEY,
      jwtSecret: process.env.JWT_SECRET,
      tokenExpiry: '24h',
      refreshTokenExpiry: '7d'
    },

    // CORS configuration
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
    }
  },

  // Enhanced Logging and Monitoring Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableVSSLogs: true,
    enablePerformanceLogs: true,
    enableAuditLogs: true,
    logFormat: 'json',
    logRotation: {
      enabled: true,
      maxFiles: 10,
      maxSize: '100MB'
    }
  },

  // Performance and Optimization Settings
  performance: {
    // Caching configuration
    cache: {
      enabled: true,
      ttl: 3600, // 1 hour
      maxSize: 1000,
      type: 'redis'
    },

    // Queue configuration for background processing
    queue: {
      enabled: true,
      concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5'),
      retryAttempts: 3,
      retryDelay: 5000,
      removeOnComplete: 100,
      removeOnFail: 50
    },

    // Resource limits
    limits: {
      maxConcurrentProcessing: parseInt(process.env.MAX_CONCURRENT_PROCESSING || '10'),
      maxVideoSize: '500MB',
      maxVideoDuration: 3600, // 1 hour in seconds
      processingTimeout: 1800000 // 30 minutes in ms
    }
  },

  // Health check and monitoring
  health: {
    enabled: true,
    endpoint: '/health',
    checks: [
      'nvidia_api',
      'vector_db',
      'graph_db',
      'time_series_db',
      'storage',
      'queue'
    ],
    timeout: 5000
  }
};

export default vssConfig;