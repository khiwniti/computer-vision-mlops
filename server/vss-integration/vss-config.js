// VSS (Video Search and Summarization) Configuration
// This file contains configuration for integrating NVIDIA's VSS with AsphaltTracker

export const vssConfig = {
  // VSS Engine Configuration
  engine: {
    host: process.env.VSS_ENGINE_HOST || 'localhost',
    port: process.env.VSS_ENGINE_PORT || 8000,
    apiVersion: 'v1'
  },

  // Model Configuration
  models: {
    // Vision Language Model for video understanding
    vlm: {
      name: process.env.VLM_MODEL || 'nvidia/vila',
      endpoint: process.env.VLM_ENDPOINT || 'http://localhost:8001'
    },
    
    // Large Language Model for summarization
    llm: {
      name: process.env.LLM_MODEL || 'meta/llama-3.1-70b-instruct',
      endpoint: process.env.LLM_ENDPOINT || 'http://localhost:8002'
    },

    // Embedding model for search
    embedding: {
      name: process.env.EMBEDDING_MODEL || 'llama-3_2-nv-embedqa-1b-v2',
      endpoint: process.env.EMBEDDING_ENDPOINT || 'http://localhost:8003'
    },

    // Reranker model for better search results
    reranker: {
      name: process.env.RERANKER_MODEL || 'llama-3_2-nv-rerankqa-1b-v2',
      endpoint: process.env.RERANKER_ENDPOINT || 'http://localhost:8004'
    }
  },

  // Processing Configuration
  processing: {
    // Frame extraction settings
    frameExtraction: {
      intervalSeconds: 5, // Extract frame every 5 seconds
      quality: 'high',
      maxFrames: 100
    },

    // Video chunking settings
    chunking: {
      chunkDurationSeconds: 30,
      overlapSeconds: 5
    },

    // Analysis settings specific to construction/asphalt monitoring
    analysis: {
      // Construction-specific object detection
      objectDetection: {
        enabled: true,
        categories: [
          'construction_vehicle',
          'worker',
          'safety_equipment',
          'road_marking',
          'asphalt_paver',
          'roller',
          'truck',
          'cone'
        ]
      },

      // Safety compliance checking
      safetyCompliance: {
        enabled: true,
        checkPPE: true,
        checkSafetyZones: true,
        checkProximityAlerts: true
      },

      // Progress monitoring
      progressTracking: {
        enabled: true,
        trackPavingProgress: true,
        measureCoverage: true
      }
    }
  },

  // Storage Configuration
  storage: {
    // Video storage
    videoStorage: {
      path: process.env.VIDEO_STORAGE_PATH || './uploads/videos',
      maxSize: '10GB',
      retentionDays: 30
    },

    // Processed data storage
    processedStorage: {
      path: process.env.PROCESSED_STORAGE_PATH || './data/processed',
      vectorDB: {
        enabled: true,
        type: 'chroma', // or 'weaviate', 'pinecone'
        host: process.env.VECTOR_DB_HOST || 'localhost',
        port: process.env.VECTOR_DB_PORT || 8005
      },
      graphDB: {
        enabled: true,
        type: 'neo4j', // or 'networkx'
        host: process.env.GRAPH_DB_HOST || 'localhost',
        port: process.env.GRAPH_DB_PORT || 7687
      }
    }
  },

  // API Configuration
  api: {
    // Rate limiting
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    },

    // Authentication
    auth: {
      enabled: process.env.VSS_AUTH_ENABLED === 'true',
      apiKey: process.env.VSS_API_KEY
    }
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableVSSLogs: true,
    enablePerformanceLogs: true
  }
};

export default vssConfig;