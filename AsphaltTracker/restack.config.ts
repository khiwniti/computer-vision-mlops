// Restack AI Framework Configuration
// AsphaltTracker Logistics Management Platform

import { RestackConfig } from "@restackio/ai";

export const config: RestackConfig = {
  // Application identification
  appName: "asphalt-tracker",
  appVersion: "1.0.0",
  
  // Enhanced service configuration with AI-powered video analytics
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

    // Enhanced video processing service with NVIDIA VSS integration
    videoProcessing: {
      workflows: [
        "videoProcessingWorkflow",
        "realTimeStreamProcessingWorkflow",
        "bulkVideoProcessingWorkflow"
      ],
      activities: [
        "validateVideo",
        "extractFramesEnhanced",
        "transcribeAudioNvidia",
        "performObjectDetection",
        "trackActivities",
        "analyzeSafetyCompliance",
        "trackConstructionProgress",
        "generateCaptionsNvidia",
        "generateSummaryNvidia",
        "indexVideoData",
        "generateAlerts",
        "saveProcessingResults",
        "processRealtimeFrames",
        "checkImmediateSafety",
        "sendRealtimeAlerts",
        "updateActivityTracking"
      ]
    },

    // Activity tracking and monitoring service
    activityTracking: {
      workflows: [
        "activityTrackingWorkflow",
        "continuousActivityMonitoringWorkflow",
        "equipmentUtilizationWorkflow",
        "safetyComplianceWorkflow"
      ],
      activities: [
        "collectCameraData",
        "detectEquipmentActivities",
        "trackWorkerActivities",
        "analyzePavingProgress",
        "identifyActivityPatterns",
        "generateProductivityInsights",
        "analyzeScheduleAdherence",
        "assessConstructionQuality",
        "createActivityTimeline",
        "generateActivityRecommendations",
        "updateActivityDashboard",
        "checkNotificationTriggers",
        "sendActivityNotifications",
        "getCurrentActivitySnapshot",
        "checkImmediateIssues",
        "sendImmediateAlerts",
        "updateRealtimeMetrics"
      ]
    },

    // Alert management service
    alertManagement: {
      workflows: [
        "alertManagementWorkflow",
        "alertEscalationWorkflow",
        "bulkAlertProcessingWorkflow",
        "alertAnalyticsWorkflow"
      ],
      activities: [
        "classifyAlert",
        "checkAlertDeduplication",
        "enrichAlert",
        "determineRecipients",
        "generateAlertMessage",
        "sendImmediateNotifications",
        "sendNotifications",
        "updateDashboard",
        "logToAuditTrail",
        "scheduleFollowUpActions",
        "startEscalationWorkflow",
        "checkAlertStatus",
        "getNextEscalationLevel",
        "sendEscalationNotifications",
        "scheduleNextEscalation",
        "sendFinalEscalationNotification",
        "processAlert",
        "updateExistingAlert",
        "generateErrorAlert",
        "generateErrorNotification"
      ]
    },

    // Streaming and camera service (enhanced)
    streaming: {
      workflows: [
        "cameraStreamingWorkflow",
        "aiAnalysisWorkflow",
        "multiCameraCoordinationWorkflow",
        "streamHealthMonitoringWorkflow"
      ],
      activities: [
        "initializeStreams",
        "processVideoFeed",
        "runAiDetection",
        "storeVideoClip",
        "updateStreamStatus",
        "coordinateMultiCamera",
        "detectStreamIssues",
        "optimizeStreamQuality",
        "manageStreamStorage"
      ]
    },

    // Analytics and reporting service (enhanced)
    analytics: {
      workflows: [
        "reportGenerationWorkflow",
        "predictiveAnalysisWorkflow",
        "dataAggregationWorkflow",
        "performanceAnalyticsWorkflow",
        "costAnalysisWorkflow"
      ],
      activities: [
        "aggregateMetrics",
        "generateReport",
        "runPredictiveModel",
        "calculateTrends",
        "createInsights",
        "analyzePerformanceMetrics",
        "calculateCostMetrics",
        "generatePredictions",
        "createDashboardData",
        "exportReports"
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

  // Enhanced integration settings with NVIDIA VSS
  integrations: {
    // NVIDIA VSS API integration
    nvidia: {
      apiKey: process.env.NVIDIA_API_KEY,
      baseUrl: "https://api.nvidia.com/v1",
      models: {
        vlm: "nvidia/vila",
        llm: "meta/llama-3.1-70b-instruct",
        embedding: "nvidia/llama-3_2-nv-embedqa-1b-v2",
        reranker: "nvidia/llama-3_2-nv-rerankqa-1b-v2",
        asr: "nvidia/parakeet-ctc-0_6b-asr"
      },
      timeout: 30000,
      retryAttempts: 3,
      rateLimits: {
        requestsPerMinute: 100,
        tokensPerMinute: 10000
      }
    },

    // Multi-vendor CCTV support (enhanced)
    cctv: {
      vendors: ["hikvision", "dahua", "axis", "bosch", "pelco", "samsung"],
      defaultProtocol: "rtsp",
      timeout: 30000,
      streamSettings: {
        resolution: "1920x1080",
        frameRate: 30,
        bitrate: "2000k",
        codec: "h264"
      },
      analytics: {
        motionDetection: true,
        objectTracking: true,
        faceRecognition: false,
        licenseReading: false
      }
    },

    // GPS tracking (enhanced)
    gps: {
      updateInterval: 5000,
      accuracy: "high",
      geofencing: true,
      providers: ["garmin", "trimble", "leica"],
      features: {
        realTimeTracking: true,
        routeOptimization: true,
        geofenceAlerts: true,
        speedMonitoring: true
      }
    },

    // Enhanced AI/ML services
    ai: {
      // Local models for backup/offline operation
      localModels: {
        objectDetection: "yolo-v8-construction",
        activityRecognition: "custom-activity-model",
        safetyCompliance: "safety-detection-model",
        qualityAssessment: "quality-analysis-model"
      },
      // Cloud models (NVIDIA)
      cloudModels: {
        videoAnalysis: "nvidia/vila",
        textGeneration: "meta/llama-3.1-70b-instruct",
        embedding: "nvidia/llama-3_2-nv-embedqa-1b-v2",
        speechRecognition: "nvidia/parakeet-ctc-0_6b-asr"
      },
      confidence: 0.75,
      fallbackStrategy: "local", // Use local models if cloud fails
      batchProcessing: {
        enabled: true,
        batchSize: 10,
        maxWaitTime: 5000 // milliseconds
      }
    },

    // Vector database for semantic search
    vectorDB: {
      provider: "chroma", // or "weaviate", "pinecone"
      host: process.env.VECTOR_DB_HOST || "localhost",
      port: process.env.VECTOR_DB_PORT || 8005,
      collection: "asphalt_tracker_videos",
      dimensions: 1024,
      indexType: "hnsw",
      similarity: "cosine"
    },

    // Graph database for relationship tracking
    graphDB: {
      provider: "neo4j",
      host: process.env.GRAPH_DB_HOST || "localhost",
      port: process.env.GRAPH_DB_PORT || 7687,
      database: "asphalt_tracker",
      username: process.env.NEO4J_USERNAME || "neo4j",
      password: process.env.NEO4J_PASSWORD
    },

    // Time series database for metrics
    timeSeriesDB: {
      provider: "influxdb",
      host: process.env.TSDB_HOST || "localhost",
      port: process.env.TSDB_PORT || 8086,
      database: "activity_tracking",
      retention: "30d",
      precision: "ms"
    },

    // Cloud storage for videos and data
    cloudStorage: {
      enabled: process.env.CLOUD_STORAGE_ENABLED === "true",
      provider: process.env.CLOUD_PROVIDER || "s3", // s3, gcs, azure
      bucket: process.env.STORAGE_BUCKET,
      region: process.env.STORAGE_REGION,
      encryption: true,
      lifecycle: {
        archiveAfterDays: 90,
        deleteAfterDays: 365
      }
    },

    // Notification services
    notifications: {
      email: {
        provider: "smtp",
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      },
      sms: {
        provider: "twilio", // or "aws-sns"
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        fromNumber: process.env.TWILIO_FROM_NUMBER
      },
      push: {
        provider: "firebase",
        serverKey: process.env.FIREBASE_SERVER_KEY,
        projectId: process.env.FIREBASE_PROJECT_ID
      },
      slack: {
        enabled: process.env.SLACK_ENABLED === "true",
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channels: {
          alerts: "#alerts",
          reports: "#reports",
          system: "#system"
        }
      }
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