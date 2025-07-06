// Enhanced Video Processing Workflow for AsphaltTracker
// Integrates NVIDIA VSS API with Restack.io for production-ready video analysis

import { step, log } from "@restackio/ai/workflow";
import type { 
  VideoUploadInput, 
  VideoProcessingResult, 
  FrameExtractionResult,
  ObjectDetectionResult,
  ActivityTrackingResult,
  SafetyAnalysisResult,
  ProgressTrackingResult
} from "../types/video.types";

/**
 * Main video processing workflow that orchestrates the entire AI analysis pipeline
 */
export async function videoProcessingWorkflow(input: VideoUploadInput): Promise<VideoProcessingResult> {
  const { videoId, filename, metadata } = input;
  
  log.info("Starting enhanced video processing workflow", { videoId, filename });

  try {
    // Step 1: Validate and prepare video
    const validationResult = await step.validateVideo({
      name: "validateVideo",
      input: { videoId, filename, metadata }
    });

    if (!validationResult.isValid) {
      throw new Error(`Video validation failed: ${validationResult.error}`);
    }

    // Step 2: Extract frames with enhanced settings
    const frameExtractionResult: FrameExtractionResult = await step.extractFramesEnhanced({
      name: "extractFramesEnhanced",
      input: { 
        videoId, 
        videoPath: validationResult.videoPath,
        settings: {
          intervalSeconds: 2,
          maxFrames: 500,
          quality: 'high',
          resolution: { width: 1920, height: 1080 }
        }
      }
    });

    // Step 3: Transcribe audio using NVIDIA ASR
    const transcriptionResult = await step.transcribeAudioNvidia({
      name: "transcribeAudioNvidia",
      input: { 
        videoId, 
        videoPath: validationResult.videoPath,
        language: 'en-US'
      }
    });

    // Step 4: Perform object detection and tracking
    const objectDetectionResult: ObjectDetectionResult = await step.performObjectDetection({
      name: "performObjectDetection",
      input: { 
        videoId,
        frames: frameExtractionResult.frames,
        categories: [
          'asphalt_paver', 'road_roller', 'dump_truck', 'excavator',
          'construction_worker', 'safety_vest', 'hard_hat',
          'safety_cone', 'barrier', 'warning_sign'
        ],
        confidence: 0.7
      }
    });

    // Step 5: Track activities and behaviors
    const activityTrackingResult: ActivityTrackingResult = await step.trackActivities({
      name: "trackActivities",
      input: {
        videoId,
        frames: frameExtractionResult.frames,
        detections: objectDetectionResult.objects,
        activities: [
          'paving', 'rolling', 'material_delivery', 'equipment_setup',
          'quality_inspection', 'safety_briefing', 'maintenance'
        ]
      }
    });

    // Step 6: Analyze safety compliance
    const safetyAnalysisResult: SafetyAnalysisResult = await step.analyzeSafetyCompliance({
      name: "analyzeSafetyCompliance",
      input: {
        videoId,
        detections: objectDetectionResult.objects,
        activities: activityTrackingResult.activities,
        safetyRules: {
          ppeRequired: true,
          safetyZones: true,
          proximityAlerts: true,
          speedLimits: true
        }
      }
    });

    // Step 7: Track construction progress
    const progressTrackingResult: ProgressTrackingResult = await step.trackConstructionProgress({
      name: "trackConstructionProgress",
      input: {
        videoId,
        detections: objectDetectionResult.objects,
        activities: activityTrackingResult.activities,
        metrics: {
          areaCompleted: true,
          pavingSpeed: true,
          materialUsage: true,
          qualityScore: true
        }
      }
    });

    // Step 8: Generate captions using NVIDIA VILA
    const captionResult = await step.generateCaptionsNvidia({
      name: "generateCaptionsNvidia",
      input: {
        videoId,
        frames: frameExtractionResult.frames,
        model: 'nvidia/vila',
        prompt: 'Describe this construction site image in detail, focusing on equipment, workers, activities, and safety aspects.'
      }
    });

    // Step 9: Generate comprehensive summary using NVIDIA Llama
    const summaryResult = await step.generateSummaryNvidia({
      name: "generateSummaryNvidia",
      input: {
        videoId,
        captions: captionResult.captions,
        transcript: transcriptionResult.transcript,
        detections: objectDetectionResult,
        activities: activityTrackingResult,
        safety: safetyAnalysisResult,
        progress: progressTrackingResult,
        model: 'meta/llama-3.1-70b-instruct'
      }
    });

    // Step 10: Index for search capabilities
    const indexingResult = await step.indexVideoData({
      name: "indexVideoData",
      input: {
        videoId,
        content: {
          captions: captionResult.captions,
          transcript: transcriptionResult.transcript,
          summary: summaryResult.summary,
          tags: summaryResult.tags
        },
        embeddings: {
          model: 'nvidia/llama-3_2-nv-embedqa-1b-v2'
        }
      }
    });

    // Step 11: Generate alerts if needed
    const alertsResult = await step.generateAlerts({
      name: "generateAlerts",
      input: {
        videoId,
        safety: safetyAnalysisResult,
        activities: activityTrackingResult,
        progress: progressTrackingResult,
        alertThresholds: {
          safetyViolations: 1,
          progressDelay: 0.2,
          qualityIssues: 0.8
        }
      }
    });

    // Step 12: Save final results
    const saveResult = await step.saveProcessingResults({
      name: "saveProcessingResults",
      input: {
        videoId,
        filename,
        results: {
          frames: frameExtractionResult,
          transcript: transcriptionResult,
          detections: objectDetectionResult,
          activities: activityTrackingResult,
          safety: safetyAnalysisResult,
          progress: progressTrackingResult,
          captions: captionResult,
          summary: summaryResult,
          indexing: indexingResult,
          alerts: alertsResult
        },
        metadata: {
          ...metadata,
          processingVersion: '2.0',
          aiModelsUsed: ['VILA', 'Llama-3.1-70B', 'Embedding', 'ASR'],
          processedAt: new Date().toISOString()
        }
      }
    });

    const result: VideoProcessingResult = {
      videoId,
      filename,
      status: 'completed',
      summary: summaryResult.summary,
      detections: objectDetectionResult,
      activities: activityTrackingResult,
      safety: safetyAnalysisResult,
      progress: progressTrackingResult,
      alerts: alertsResult.alerts,
      processingTime: Date.now() - input.startTime,
      processedAt: new Date().toISOString()
    };

    log.info("Video processing workflow completed successfully", { 
      videoId, 
      processingTime: result.processingTime,
      alertsGenerated: alertsResult.alerts.length
    });

    return result;

  } catch (error) {
    log.error("Video processing workflow failed", { 
      videoId, 
      error: error.message,
      stack: error.stack 
    });

    // Generate error alert
    await step.generateErrorAlert({
      name: "generateErrorAlert",
      input: {
        videoId,
        error: error.message,
        stage: 'video_processing',
        severity: 'high'
      }
    });

    throw error;
  }
}

/**
 * Real-time video stream processing workflow
 */
export async function realTimeStreamProcessingWorkflow(input: {
  streamId: string;
  cameraId: string;
  frameBuffer: Buffer[];
}): Promise<void> {
  const { streamId, cameraId, frameBuffer } = input;
  
  log.info("Starting real-time stream processing", { streamId, cameraId });

  try {
    // Process frames in real-time
    const realtimeDetections = await step.processRealtimeFrames({
      name: "processRealtimeFrames",
      input: {
        streamId,
        cameraId,
        frames: frameBuffer,
        settings: {
          batchSize: 5,
          confidence: 0.8,
          categories: ['construction_worker', 'safety_vest', 'hard_hat', 'safety_cone']
        }
      }
    });

    // Check for immediate safety alerts
    const immediateAlerts = await step.checkImmediateSafety({
      name: "checkImmediateSafety",
      input: {
        streamId,
        cameraId,
        detections: realtimeDetections,
        rules: {
          ppeCompliance: true,
          proximityAlerts: true,
          restrictedAreas: true
        }
      }
    });

    // Send real-time alerts if needed
    if (immediateAlerts.alerts.length > 0) {
      await step.sendRealtimeAlerts({
        name: "sendRealtimeAlerts",
        input: {
          streamId,
          cameraId,
          alerts: immediateAlerts.alerts,
          channels: ['websocket', 'email', 'sms']
        }
      });
    }

    // Update activity tracking
    await step.updateActivityTracking({
      name: "updateActivityTracking",
      input: {
        streamId,
        cameraId,
        detections: realtimeDetections,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    log.error("Real-time stream processing failed", { 
      streamId, 
      cameraId, 
      error: error.message 
    });
    throw error;
  }
}
