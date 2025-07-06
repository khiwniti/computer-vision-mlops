// Restack AI Framework Configuration
// AsphaltTracker Logistics Management Platform

import { RestackConfig } from "@restackio/ai";

export const config: RestackConfig = {
  // Application identification
  appName: "asphalt-tracker",
  appVersion: "1.0.0",
  
  // Service configuration
  services: {
    // Core logistics service
    logistics: {
      workflows: [
        "truckMonitoringWorkflow",
        "gpsTrackingWorkflow", 
        "incidentManagementWorkflow",
        "kpiAnalysisWorkflow"
      ],
      activities: [
        "getTruckStatus",
        "processGpsData", 
        "analyzeDriverBehavior",
        "detectIncidents",
        "calculateKpiScore",
        "sendAlert",
        "updateLocation",
        "manageGeofence"
      ]
    },
    
    // Streaming and camera service
    streaming: {
      workflows: [
        "cameraStreamingWorkflow",
        "aiAnalysisWorkflow",
        "videoProcessingWorkflow"
      ],
      activities: [
        "initializeStreams",
        "processVideoFeed",
        "runAiDetection",
        "storeVideoClip",
        "updateStreamStatus"
      ]
    },
    
    // Analytics and reporting service  
    analytics: {
      workflows: [
        "reportGenerationWorkflow",
        "predictiveAnalysisWorkflow",
        "dataAggregationWorkflow"
      ],
      activities: [
        "aggregateMetrics",
        "generateReport",
        "runPredictiveModel",
        "calculateTrends",
        "createInsights"
      ]
    }
  },

  // Worker configuration
  worker: {
    taskQueue: "asphalt-tracker-queue",
    maxConcurrentWorkflows: 100,
    maxConcurrentActivities: 50
  },

  // Database and storage
  database: {
    connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/asphalt_tracker",
    pool: {
      min: 2,
      max: 10
    }
  },

  // Redis for caching and sessions
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
    keyPrefix: "restack:asphalt-tracker:"
  },

  // Logging configuration
  logging: {
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    format: "json",
    destinations: ["console", "file"]
  },

  // Environment-specific settings
  environment: {
    development: {
      debug: true,
      hotReload: true,
      mockData: true
    },
    production: {
      debug: false,
      hotReload: false,
      mockData: false,
      ssl: true
    }
  },

  // Health and monitoring
  health: {
    endpoint: "/health",
    checks: [
      "database",
      "redis", 
      "workflows",
      "activities"
    ]
  },

  // API Gateway integration
  api: {
    port: parseInt(process.env.PORT || "5000"),
    host: process.env.HOST || "0.0.0.0",
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true
    }
  },

  // Real-time features
  realtime: {
    websocket: {
      enabled: true,
      port: parseInt(process.env.WS_PORT || "5001")
    },
    events: [
      "truck.location.updated",
      "incident.detected", 
      "camera.status.changed",
      "kpi.score.calculated",
      "geofence.violation"
    ]
  },

  // Integration settings
  integrations: {
    // Multi-vendor CCTV support
    cctv: {
      vendors: ["hikvision", "dahua", "axis", "bosch"],
      defaultProtocol: "rtsp",
      timeout: 30000
    },
    
    // GPS tracking
    gps: {
      updateInterval: 5000,
      accuracy: "high",
      geofencing: true
    },

    // AI/ML services
    ai: {
      models: {
        driverBehavior: "yolo-v8-driver-analysis",
        objectDetection: "yolo-v8-general",
        fraudDetection: "custom-fraud-model"
      },
      confidence: 0.75
    }
  },

  // Security settings
  security: {
    encryption: {
      algorithm: "aes-256-gcm",
      keyRotation: "30d"
    },
    authentication: {
      sessionTimeout: "24h",
      refreshTokenExpiry: "7d"
    }
  }
};

export default config;