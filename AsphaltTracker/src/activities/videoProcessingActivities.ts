// Enhanced Video Processing Activities for AsphaltTracker
// Integrates with NVIDIA VSS API for AI-powered video analysis

import { log } from "@restackio/ai/activity";
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs/promises';
import path from 'path';

// NVIDIA API client configuration
const nvidiaClient = axios.create({
  baseURL: process.env.NVIDIA_API_BASE_URL || 'https://api.nvidia.com/v1',
  timeout: 30000,
  headers: {
    'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Validate uploaded video file
 */
export async function validateVideo(input: {
  videoId: string;
  filename: string;
  metadata: any;
}): Promise<{ isValid: boolean; videoPath?: string; error?: string }> {
  try {
    const { videoId, filename, metadata } = input;
    
    log.info("Validating video", { videoId, filename });

    // Check file extension
    const allowedExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm'];
    const ext = path.extname(filename).toLowerCase();
    
    if (!allowedExtensions.includes(ext)) {
      return {
        isValid: false,
        error: `Unsupported video format: ${ext}. Allowed: ${allowedExtensions.join(', ')}`
      };
    }

    // Check file size (if provided in metadata)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (metadata.fileSize && metadata.fileSize > maxSize) {
      return {
        isValid: false,
        error: `File too large: ${metadata.fileSize} bytes. Maximum: ${maxSize} bytes`
      };
    }

    const videoPath = path.join(
      process.env.VIDEO_STORAGE_PATH || './uploads/videos',
      `${videoId}${ext}`
    );

    return {
      isValid: true,
      videoPath
    };

  } catch (error) {
    log.error("Video validation failed", { error: error.message });
    return {
      isValid: false,
      error: error.message
    };
  }
}

/**
 * Extract frames from video with enhanced settings
 */
export async function extractFramesEnhanced(input: {
  videoId: string;
  videoPath: string;
  settings: {
    intervalSeconds: number;
    maxFrames: number;
    quality: string;
    resolution: { width: number; height: number };
  };
}): Promise<{ frames: any[]; frameCount: number }> {
  try {
    const { videoId, videoPath, settings } = input;
    
    log.info("Extracting frames", { videoId, settings });

    // In production, use ffmpeg with GPU acceleration
    // For now, simulate frame extraction
    const frames = [];
    const frameCount = Math.min(settings.maxFrames, 100); // Simulate max 100 frames

    for (let i = 0; i < frameCount; i++) {
      const timestamp = i * settings.intervalSeconds;
      const frameId = `${videoId}_frame_${i}`;
      const framePath = path.join(
        process.env.PROCESSED_STORAGE_PATH || './data/processed',
        'frames',
        `${frameId}.jpg`
      );

      frames.push({
        id: frameId,
        timestamp,
        path: framePath,
        videoId,
        index: i,
        resolution: settings.resolution,
        extracted: true
      });
    }

    log.info("Frame extraction completed", { videoId, frameCount: frames.length });

    return {
      frames,
      frameCount: frames.length
    };

  } catch (error) {
    log.error("Frame extraction failed", { error: error.message });
    throw error;
  }
}

/**
 * Transcribe audio using NVIDIA ASR API
 */
export async function transcribeAudioNvidia(input: {
  videoId: string;
  videoPath: string;
  language: string;
}): Promise<{ transcript: string; confidence: number; segments: any[] }> {
  try {
    const { videoId, videoPath, language } = input;
    
    log.info("Transcribing audio with NVIDIA ASR", { videoId, language });

    // Extract audio from video (in production, use ffmpeg)
    // For now, simulate audio extraction and transcription
    const mockTranscript = {
      text: "Construction crew discussing paving operations and safety procedures. Equipment operators coordinating material delivery and quality control measures.",
      confidence: 0.85,
      segments: [
        {
          start: 0,
          end: 10,
          text: "Construction crew discussing paving operations",
          confidence: 0.9
        },
        {
          start: 10,
          end: 20,
          text: "Equipment operators coordinating material delivery",
          confidence: 0.8
        }
      ]
    };

    // In production, make actual API call:
    /*
    const audioBuffer = await extractAudioFromVideo(videoPath);
    const formData = new FormData();
    formData.append('audio', audioBuffer, 'audio.wav');
    
    const response = await nvidiaClient.post('/asr', formData, {
      headers: {
        ...formData.getHeaders(),
        'Accept-Language': language
      }
    });
    
    const transcript = response.data;
    */

    log.info("Audio transcription completed", { 
      videoId, 
      textLength: mockTranscript.text.length,
      confidence: mockTranscript.confidence 
    });

    return {
      transcript: mockTranscript.text,
      confidence: mockTranscript.confidence,
      segments: mockTranscript.segments
    };

  } catch (error) {
    log.error("Audio transcription failed", { error: error.message });
    // Return empty transcript on failure
    return {
      transcript: '',
      confidence: 0,
      segments: []
    };
  }
}

/**
 * Perform object detection on video frames
 */
export async function performObjectDetection(input: {
  videoId: string;
  frames: any[];
  categories: string[];
  confidence: number;
}): Promise<{ objects: any[]; summary: any; timeline: any[] }> {
  try {
    const { videoId, frames, categories, confidence } = input;
    
    log.info("Performing object detection", { 
      videoId, 
      frameCount: frames.length, 
      categories: categories.length 
    });

    const objects = [];
    const timeline = [];

    // Simulate object detection for each frame
    for (const frame of frames) {
      const frameDetections = [];
      const numObjects = Math.floor(Math.random() * 5) + 1;

      for (let i = 0; i < numObjects; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const objConfidence = 0.7 + Math.random() * 0.3;

        if (objConfidence >= confidence) {
          const detection = {
            id: `${frame.id}_obj_${i}`,
            category,
            confidence: objConfidence,
            bbox: {
              x: Math.random() * 0.8,
              y: Math.random() * 0.8,
              width: 0.1 + Math.random() * 0.2,
              height: 0.1 + Math.random() * 0.2
            },
            frameId: frame.id,
            timestamp: frame.timestamp
          };

          frameDetections.push(detection);
          objects.push(detection);
        }
      }

      timeline.push({
        timestamp: frame.timestamp,
        frameId: frame.id,
        objectCount: frameDetections.length,
        categories: [...new Set(frameDetections.map(d => d.category))]
      });
    }

    // Generate summary
    const categoryCounts = {};
    objects.forEach(obj => {
      categoryCounts[obj.category] = (categoryCounts[obj.category] || 0) + 1;
    });

    const summary = {
      totalObjects: objects.length,
      uniqueCategories: Object.keys(categoryCounts).length,
      categoryCounts,
      averageConfidence: objects.reduce((sum, obj) => sum + obj.confidence, 0) / objects.length || 0
    };

    log.info("Object detection completed", { 
      videoId, 
      totalObjects: objects.length,
      categories: Object.keys(categoryCounts)
    });

    return {
      objects,
      summary,
      timeline
    };

  } catch (error) {
    log.error("Object detection failed", { error: error.message });
    throw error;
  }
}

/**
 * Track construction activities
 */
export async function trackActivities(input: {
  videoId: string;
  frames: any[];
  detections: any[];
  activities: string[];
}): Promise<{ activities: any[]; timeline: any[]; summary: any }> {
  try {
    const { videoId, frames, detections, activities } = input;
    
    log.info("Tracking activities", { videoId, activities: activities.length });

    const trackedActivities = [];
    const timeline = [];

    // Simulate activity recognition based on object detections
    const activityPatterns = {
      'paving': ['asphalt_paver', 'construction_worker'],
      'rolling': ['road_roller', 'construction_worker'],
      'material_delivery': ['dump_truck', 'construction_worker'],
      'equipment_setup': ['construction_worker', 'safety_cone'],
      'quality_inspection': ['construction_worker', 'hard_hat'],
      'safety_briefing': ['construction_worker', 'safety_vest']
    };

    // Group detections by timestamp
    const detectionsByTime = {};
    detections.forEach(detection => {
      const timeKey = Math.floor(detection.timestamp / 10) * 10; // Group by 10-second intervals
      if (!detectionsByTime[timeKey]) {
        detectionsByTime[timeKey] = [];
      }
      detectionsByTime[timeKey].push(detection);
    });

    // Analyze each time interval for activities
    Object.entries(detectionsByTime).forEach(([timeKey, timeDetections]) => {
      const timestamp = parseInt(timeKey);
      const presentCategories = [...new Set(timeDetections.map(d => d.category))];

      activities.forEach(activity => {
        const requiredObjects = activityPatterns[activity] || [];
        const hasRequiredObjects = requiredObjects.some(obj => 
          presentCategories.includes(obj)
        );

        if (hasRequiredObjects) {
          const confidence = 0.6 + Math.random() * 0.4;
          
          trackedActivities.push({
            id: `${videoId}_activity_${timestamp}_${activity}`,
            type: activity,
            timestamp,
            duration: 10, // 10-second intervals
            confidence,
            involvedObjects: timeDetections.filter(d => 
              requiredObjects.includes(d.category)
            ),
            location: {
              x: Math.random(),
              y: Math.random()
            }
          });
        }
      });

      timeline.push({
        timestamp,
        detectedActivities: trackedActivities
          .filter(a => a.timestamp === timestamp)
          .map(a => a.type),
        objectCount: timeDetections.length
      });
    });

    // Generate summary
    const activityCounts = {};
    trackedActivities.forEach(activity => {
      activityCounts[activity.type] = (activityCounts[activity.type] || 0) + 1;
    });

    const summary = {
      totalActivities: trackedActivities.length,
      uniqueActivityTypes: Object.keys(activityCounts).length,
      activityCounts,
      averageConfidence: trackedActivities.reduce((sum, a) => sum + a.confidence, 0) / trackedActivities.length || 0,
      duration: Math.max(...trackedActivities.map(a => a.timestamp)) - Math.min(...trackedActivities.map(a => a.timestamp))
    };

    log.info("Activity tracking completed", { 
      videoId, 
      totalActivities: trackedActivities.length,
      activityTypes: Object.keys(activityCounts)
    });

    return {
      activities: trackedActivities,
      timeline,
      summary
    };

  } catch (error) {
    log.error("Activity tracking failed", { error: error.message });
    throw error;
  }
}

/**
 * Analyze safety compliance
 */
export async function analyzeSafetyCompliance(input: {
  videoId: string;
  detections: any[];
  activities: any[];
  safetyRules: {
    ppeRequired: boolean;
    safetyZones: boolean;
    proximityAlerts: boolean;
    speedLimits: boolean;
  };
}): Promise<{ violations: any[]; compliance: any; recommendations: string[] }> {
  try {
    const { videoId, detections, activities, safetyRules } = input;

    log.info("Analyzing safety compliance", { videoId, safetyRules });

    const violations = [];
    const recommendations = [];

    // Check PPE compliance
    if (safetyRules.ppeRequired) {
      const workers = detections.filter(d => d.category === 'construction_worker');
      const safetyVests = detections.filter(d => d.category === 'safety_vest');
      const hardHats = detections.filter(d => d.category === 'hard_hat');

      const ppeComplianceRate = workers.length > 0 ?
        Math.min(safetyVests.length, hardHats.length) / workers.length : 1;

      if (ppeComplianceRate < 0.95) {
        violations.push({
          type: 'ppe_violation',
          severity: 'high',
          description: `PPE compliance rate: ${(ppeComplianceRate * 100).toFixed(1)}%`,
          timestamp: Date.now(),
          affectedWorkers: workers.length - Math.min(safetyVests.length, hardHats.length)
        });
        recommendations.push('Ensure all workers wear required PPE (safety vest and hard hat)');
      }
    }

    // Check proximity alerts
    if (safetyRules.proximityAlerts) {
      const equipment = detections.filter(d =>
        ['asphalt_paver', 'road_roller', 'dump_truck', 'excavator'].includes(d.category)
      );
      const workers = detections.filter(d => d.category === 'construction_worker');

      equipment.forEach(eq => {
        workers.forEach(worker => {
          if (eq.timestamp === worker.timestamp) {
            const distance = Math.sqrt(
              Math.pow(eq.bbox.x - worker.bbox.x, 2) +
              Math.pow(eq.bbox.y - worker.bbox.y, 2)
            );

            if (distance < 0.1) { // Simulate proximity threshold
              violations.push({
                type: 'proximity_violation',
                severity: 'critical',
                description: `Worker too close to ${eq.category}`,
                timestamp: eq.timestamp,
                equipment: eq.category,
                distance: distance * 100 // Convert to meters (simulated)
              });
            }
          }
        });
      });

      if (violations.filter(v => v.type === 'proximity_violation').length > 0) {
        recommendations.push('Maintain safe distance from operating equipment');
      }
    }

    // Check safety zone compliance
    if (safetyRules.safetyZones) {
      const safetyCones = detections.filter(d => d.category === 'safety_cone');
      const barriers = detections.filter(d => d.category === 'barrier');

      if (safetyCones.length < 5 && barriers.length < 3) {
        violations.push({
          type: 'safety_zone_violation',
          severity: 'medium',
          description: 'Insufficient safety zone markers',
          timestamp: Date.now(),
          conesCount: safetyCones.length,
          barriersCount: barriers.length
        });
        recommendations.push('Install adequate safety cones and barriers around work areas');
      }
    }

    // Calculate overall compliance score
    const totalChecks = Object.values(safetyRules).filter(Boolean).length;
    const violationTypes = [...new Set(violations.map(v => v.type))];
    const complianceScore = totalChecks > 0 ?
      (totalChecks - violationTypes.length) / totalChecks : 1;

    const compliance = {
      score: complianceScore,
      grade: getComplianceGrade(complianceScore),
      totalViolations: violations.length,
      criticalViolations: violations.filter(v => v.severity === 'critical').length,
      highViolations: violations.filter(v => v.severity === 'high').length,
      mediumViolations: violations.filter(v => v.severity === 'medium').length
    };

    log.info("Safety analysis completed", {
      videoId,
      complianceScore: compliance.score,
      violations: violations.length
    });

    return {
      violations,
      compliance,
      recommendations
    };

  } catch (error) {
    log.error("Safety analysis failed", { error: error.message });
    throw error;
  }
}

/**
 * Track construction progress
 */
export async function trackConstructionProgress(input: {
  videoId: string;
  detections: any[];
  activities: any[];
  metrics: {
    areaCompleted: boolean;
    pavingSpeed: boolean;
    materialUsage: boolean;
    qualityScore: boolean;
  };
}): Promise<{ progress: any; metrics: any; timeline: any[] }> {
  try {
    const { videoId, detections, activities, metrics } = input;

    log.info("Tracking construction progress", { videoId, metrics });

    const progressData = {
      completionPercentage: 0,
      areaCompleted: 0,
      pavingSpeed: 0,
      materialUsage: 0,
      qualityScore: 0
    };

    const timeline = [];

    // Calculate area completed based on paving activities
    if (metrics.areaCompleted) {
      const pavingActivities = activities.filter(a => a.type === 'paving');
      const totalPavingTime = pavingActivities.reduce((sum, a) => sum + a.duration, 0);

      // Simulate area calculation (in production, use actual measurements)
      progressData.areaCompleted = totalPavingTime * 10; // 10 sq meters per second (simulated)
      progressData.completionPercentage = Math.min(progressData.areaCompleted / 1000, 1) * 100; // Assume 1000 sq meters total
    }

    // Calculate paving speed
    if (metrics.pavingSpeed) {
      const pavers = detections.filter(d => d.category === 'asphalt_paver');
      const pavingActivities = activities.filter(a => a.type === 'paving');

      if (pavingActivities.length > 0) {
        const avgDuration = pavingActivities.reduce((sum, a) => sum + a.duration, 0) / pavingActivities.length;
        progressData.pavingSpeed = 50 / avgDuration; // Simulate speed calculation
      }
    }

    // Estimate material usage
    if (metrics.materialUsage) {
      const trucks = detections.filter(d => d.category === 'dump_truck');
      const deliveryActivities = activities.filter(a => a.type === 'material_delivery');

      progressData.materialUsage = deliveryActivities.length * 20; // 20 tons per delivery (simulated)
    }

    // Calculate quality score
    if (metrics.qualityScore) {
      const inspectionActivities = activities.filter(a => a.type === 'quality_inspection');
      const rollingActivities = activities.filter(a => a.type === 'rolling');

      // Quality score based on inspection frequency and rolling operations
      const inspectionRatio = inspectionActivities.length / Math.max(activities.length, 1);
      const rollingRatio = rollingActivities.length / Math.max(activities.length, 1);

      progressData.qualityScore = (inspectionRatio + rollingRatio) * 50; // Scale to 0-100
    }

    // Generate timeline
    const timeIntervals = [...new Set(activities.map(a => Math.floor(a.timestamp / 60) * 60))]; // 1-minute intervals

    timeIntervals.forEach(interval => {
      const intervalActivities = activities.filter(a =>
        Math.floor(a.timestamp / 60) * 60 === interval
      );

      timeline.push({
        timestamp: interval,
        activities: intervalActivities.map(a => a.type),
        progress: {
          areaCompleted: progressData.areaCompleted * (interval / Math.max(...timeIntervals)),
          qualityScore: progressData.qualityScore
        }
      });
    });

    const result = {
      progress: progressData,
      metrics: {
        efficiency: calculateEfficiency(progressData),
        productivity: calculateProductivity(activities),
        resourceUtilization: calculateResourceUtilization(detections)
      },
      timeline
    };

    log.info("Progress tracking completed", {
      videoId,
      completionPercentage: progressData.completionPercentage,
      qualityScore: progressData.qualityScore
    });

    return result;

  } catch (error) {
    log.error("Progress tracking failed", { error: error.message });
    throw error;
  }
}

// Helper functions
function getComplianceGrade(score: number): string {
  if (score >= 0.95) return 'A';
  if (score >= 0.85) return 'B';
  if (score >= 0.75) return 'C';
  if (score >= 0.65) return 'D';
  return 'F';
}

function calculateEfficiency(progress: any): number {
  // Simulate efficiency calculation
  return Math.min(progress.pavingSpeed * progress.qualityScore / 100, 100);
}

function calculateProductivity(activities: any[]): number {
  // Simulate productivity calculation based on activity frequency
  const productiveActivities = activities.filter(a =>
    ['paving', 'rolling', 'material_delivery'].includes(a.type)
  );
  return (productiveActivities.length / Math.max(activities.length, 1)) * 100;
}

function calculateResourceUtilization(detections: any[]): number {
  // Simulate resource utilization based on equipment usage
  const equipment = detections.filter(d =>
    ['asphalt_paver', 'road_roller', 'dump_truck', 'excavator'].includes(d.category)
  );
  const uniqueEquipment = [...new Set(equipment.map(e => e.category))];
  return (uniqueEquipment.length / 4) * 100; // Assume 4 types of equipment available
}
