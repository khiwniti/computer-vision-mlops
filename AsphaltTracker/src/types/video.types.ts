// Type definitions for enhanced video processing system

export interface VideoUploadInput {
  videoId: string;
  filename: string;
  metadata: {
    fileSize?: number;
    duration?: number;
    resolution?: {
      width: number;
      height: number;
    };
    uploadedBy?: string;
    siteId?: string;
    cameraId?: string;
    timestamp?: string;
  };
  startTime: number;
  projectPlan?: {
    totalArea: number;
    plannedDuration: number;
    qualityStandards: Record<string, any>;
  };
  plannedSchedule?: any;
  qualityStandards?: Record<string, any>;
  inspectionData?: any[];
  notificationRecipients?: string[];
}

export interface VideoProcessingResult {
  videoId: string;
  filename: string;
  status: 'processing' | 'completed' | 'failed';
  summary: string;
  detections: ObjectDetectionResult;
  activities: ActivityTrackingResult;
  safety: SafetyAnalysisResult;
  progress: ProgressTrackingResult;
  alerts: Alert[];
  processingTime: number;
  processedAt: string;
}

export interface FrameExtractionResult {
  frames: VideoFrame[];
  frameCount: number;
  settings: {
    intervalSeconds: number;
    maxFrames: number;
    quality: string;
    resolution: {
      width: number;
      height: number;
    };
  };
}

export interface VideoFrame {
  id: string;
  timestamp: number;
  path: string;
  videoId: string;
  index: number;
  resolution: {
    width: number;
    height: number;
  };
  extracted: boolean;
}

export interface ObjectDetectionResult {
  objects: DetectedObject[];
  summary: {
    totalObjects: number;
    uniqueCategories: number;
    categoryCounts: Record<string, number>;
    averageConfidence: number;
  };
  timeline: {
    timestamp: number;
    frameId: string;
    objectCount: number;
    categories: string[];
  }[];
}

export interface DetectedObject {
  id: string;
  category: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  frameId: string;
  timestamp: number;
}

export interface ActivityTrackingResult {
  activities: TrackedActivity[];
  timeline: {
    timestamp: number;
    detectedActivities: string[];
    objectCount: number;
  }[];
  summary: {
    totalActivities: number;
    uniqueActivityTypes: number;
    activityCounts: Record<string, number>;
    averageConfidence: number;
    duration: number;
  };
}

export interface TrackedActivity {
  id: string;
  type: string;
  timestamp: number;
  duration: number;
  confidence: number;
  involvedObjects: DetectedObject[];
  location: {
    x: number;
    y: number;
  };
}

export interface SafetyAnalysisResult {
  violations: SafetyViolation[];
  compliance: {
    score: number;
    grade: string;
    totalViolations: number;
    criticalViolations: number;
    highViolations: number;
    mediumViolations: number;
  };
  recommendations: string[];
}

export interface SafetyViolation {
  type: 'ppe_violation' | 'proximity_violation' | 'safety_zone_violation' | 'speed_violation';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  timestamp: number;
  affectedWorkers?: number;
  equipment?: string;
  distance?: number;
  conesCount?: number;
  barriersCount?: number;
}

export interface ProgressTrackingResult {
  progress: {
    completionPercentage: number;
    areaCompleted: number;
    pavingSpeed: number;
    materialUsage: number;
    qualityScore: number;
  };
  metrics: {
    efficiency: number;
    productivity: number;
    resourceUtilization: number;
  };
  timeline: {
    timestamp: number;
    activities: string[];
    progress: {
      areaCompleted: number;
      qualityScore: number;
    };
  }[];
}

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  segments: {
    start: number;
    end: number;
    text: string;
    confidence: number;
  }[];
}

export interface CaptionResult {
  captions: {
    frameId: string;
    timestamp: number;
    caption: string;
    confidence: number;
  }[];
}

export interface SummaryResult {
  summary: string;
  tags: string[];
  keyInsights: string[];
  recommendations: string[];
}

export interface IndexingResult {
  indexed: boolean;
  vectorId: string;
  embeddings: number[];
  searchable: boolean;
}

export interface Alert {
  id: string;
  type: 'safety' | 'progress' | 'quality' | 'equipment' | 'system';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: string;
  siteId?: string;
  videoId?: string;
  resolved: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

// Real-time streaming types
export interface StreamProcessingInput {
  streamId: string;
  cameraId: string;
  frameBuffer: Buffer[];
  settings: {
    batchSize: number;
    confidence: number;
    categories: string[];
  };
}

export interface RealtimeDetectionResult {
  streamId: string;
  cameraId: string;
  timestamp: string;
  detections: DetectedObject[];
  activities: TrackedActivity[];
  alerts: Alert[];
}

// Configuration types
export interface ProcessingSettings {
  realtime: {
    enabled: boolean;
    frameRate: number;
    bufferSize: number;
    processingDelay: number;
    batchSize: number;
  };
  frameExtraction: {
    intervalSeconds: number;
    quality: string;
    maxFrames: number;
    formats: string[];
    resolution: {
      width: number;
      height: number;
    };
  };
  analysis: {
    objectDetection: {
      enabled: boolean;
      confidence: number;
      categories: string[];
      trackingEnabled: boolean;
      persistentTracking: boolean;
    };
    safetyCompliance: {
      enabled: boolean;
      realTimeAlerts: boolean;
      checkPPE: boolean;
      checkSafetyZones: boolean;
      checkProximityAlerts: boolean;
      checkSpeedLimits: boolean;
      checkEquipmentStatus: boolean;
      alertThresholds: {
        proximityDistance: number;
        speedLimit: number;
        ppeCompliance: number;
      };
    };
    progressTracking: {
      enabled: boolean;
      trackPavingProgress: boolean;
      measureCoverage: boolean;
      calculateVolume: boolean;
      trackQuality: boolean;
      generateReports: boolean;
      metrics: {
        areaCompleted: boolean;
        pavingSpeed: boolean;
        materialUsage: boolean;
        qualityScore: boolean;
      };
    };
    activityRecognition: {
      enabled: boolean;
      activities: string[];
      confidenceThreshold: number;
      temporalTracking: boolean;
    };
  };
}

// Error types
export interface ProcessingError {
  code: string;
  message: string;
  stage: string;
  timestamp: string;
  videoId?: string;
  details?: any;
}
