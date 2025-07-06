// Activity Tracking Workflow for Real-time Construction Monitoring
// Tracks construction activities, equipment usage, and progress metrics

import { step, log } from "@restackio/ai/workflow";
import type { 
  ActivityTrackingInput,
  ActivityTrackingResult,
  EquipmentActivity,
  WorkerActivity,
  ProgressMetrics,
  ActivityPattern
} from "../types/activity.types";

/**
 * Main activity tracking workflow for construction site monitoring
 */
export async function activityTrackingWorkflow(input: ActivityTrackingInput): Promise<ActivityTrackingResult> {
  const { siteId, timeRange, cameras, equipmentList } = input;
  
  log.info("Starting activity tracking workflow", { siteId, timeRange });

  try {
    // Step 1: Collect data from all cameras
    const cameraData = await step.collectCameraData({
      name: "collectCameraData",
      input: {
        siteId,
        cameras,
        timeRange,
        frameRate: 30,
        resolution: 'high'
      }
    });

    // Step 2: Detect equipment activities
    const equipmentActivities: EquipmentActivity[] = await step.detectEquipmentActivities({
      name: "detectEquipmentActivities",
      input: {
        siteId,
        cameraData: cameraData.frames,
        equipmentTypes: [
          'asphalt_paver',
          'road_roller', 
          'dump_truck',
          'excavator',
          'bulldozer',
          'grader'
        ],
        trackingSettings: {
          confidence: 0.8,
          persistentTracking: true,
          motionAnalysis: true
        }
      }
    });

    // Step 3: Track worker activities and safety compliance
    const workerActivities: WorkerActivity[] = await step.trackWorkerActivities({
      name: "trackWorkerActivities",
      input: {
        siteId,
        cameraData: cameraData.frames,
        safetyChecks: {
          ppeDetection: true,
          safetyZones: true,
          proximityAlerts: true,
          workPatterns: true
        },
        activityTypes: [
          'paving_operation',
          'quality_inspection',
          'material_handling',
          'equipment_operation',
          'safety_briefing',
          'maintenance_work'
        ]
      }
    });

    // Step 4: Analyze paving progress and coverage
    const progressMetrics: ProgressMetrics = await step.analyzePavingProgress({
      name: "analyzePavingProgress",
      input: {
        siteId,
        equipmentActivities,
        workerActivities,
        projectPlan: {
          totalArea: input.projectPlan?.totalArea || 0,
          plannedDuration: input.projectPlan?.plannedDuration || 0,
          qualityStandards: input.projectPlan?.qualityStandards || {}
        },
        measurements: {
          areaCompleted: true,
          pavingSpeed: true,
          materialUsage: true,
          qualityMetrics: true
        }
      }
    });

    // Step 5: Identify activity patterns and anomalies
    const activityPatterns: ActivityPattern[] = await step.identifyActivityPatterns({
      name: "identifyActivityPatterns",
      input: {
        siteId,
        equipmentActivities,
        workerActivities,
        historicalData: true,
        patternTypes: [
          'equipment_utilization',
          'worker_productivity',
          'safety_incidents',
          'quality_issues',
          'schedule_deviations'
        ]
      }
    });

    // Step 6: Generate productivity insights
    const productivityInsights = await step.generateProductivityInsights({
      name: "generateProductivityInsights",
      input: {
        siteId,
        activities: [...equipmentActivities, ...workerActivities],
        progressMetrics,
        patterns: activityPatterns,
        benchmarks: {
          industryStandards: true,
          historicalPerformance: true,
          projectTargets: true
        }
      }
    });

    // Step 7: Check for schedule adherence
    const scheduleAnalysis = await step.analyzeScheduleAdherence({
      name: "analyzeScheduleAdherence",
      input: {
        siteId,
        progressMetrics,
        plannedSchedule: input.plannedSchedule,
        currentDate: new Date().toISOString(),
        factors: {
          weatherImpact: true,
          equipmentDowntime: true,
          materialDelays: true,
          workforceAvailability: true
        }
      }
    });

    // Step 8: Generate quality assessment
    const qualityAssessment = await step.assessConstructionQuality({
      name: "assessConstructionQuality",
      input: {
        siteId,
        activities: equipmentActivities,
        progressMetrics,
        qualityStandards: input.qualityStandards || {},
        inspectionData: input.inspectionData || []
      }
    });

    // Step 9: Create activity timeline
    const activityTimeline = await step.createActivityTimeline({
      name: "createActivityTimeline",
      input: {
        siteId,
        equipmentActivities,
        workerActivities,
        timeRange,
        granularity: 'hourly',
        includeMetrics: true
      }
    });

    // Step 10: Generate recommendations
    const recommendations = await step.generateActivityRecommendations({
      name: "generateActivityRecommendations",
      input: {
        siteId,
        progressMetrics,
        patterns: activityPatterns,
        productivity: productivityInsights,
        schedule: scheduleAnalysis,
        quality: qualityAssessment,
        optimizationGoals: [
          'increase_productivity',
          'improve_safety',
          'reduce_delays',
          'enhance_quality'
        ]
      }
    });

    // Step 11: Update real-time dashboard
    await step.updateActivityDashboard({
      name: "updateActivityDashboard",
      input: {
        siteId,
        metrics: progressMetrics,
        activities: {
          equipment: equipmentActivities,
          workers: workerActivities
        },
        insights: productivityInsights,
        recommendations: recommendations.recommendations,
        lastUpdated: new Date().toISOString()
      }
    });

    // Step 12: Send notifications if needed
    const notifications = await step.checkNotificationTriggers({
      name: "checkNotificationTriggers",
      input: {
        siteId,
        progressMetrics,
        scheduleAnalysis,
        qualityAssessment,
        patterns: activityPatterns,
        thresholds: {
          scheduleDelay: 0.1, // 10% delay
          qualityIssue: 0.8,  // Quality score below 80%
          safetyViolation: 1,  // Any safety violation
          productivityDrop: 0.2 // 20% productivity drop
        }
      }
    });

    if (notifications.shouldNotify) {
      await step.sendActivityNotifications({
        name: "sendActivityNotifications",
        input: {
          siteId,
          notifications: notifications.notifications,
          recipients: input.notificationRecipients || [],
          channels: ['email', 'sms', 'dashboard', 'mobile_app']
        }
      });
    }

    const result: ActivityTrackingResult = {
      siteId,
      timeRange,
      equipmentActivities,
      workerActivities,
      progressMetrics,
      activityPatterns,
      productivity: productivityInsights,
      schedule: scheduleAnalysis,
      quality: qualityAssessment,
      timeline: activityTimeline,
      recommendations: recommendations.recommendations,
      notifications: notifications.notifications,
      processedAt: new Date().toISOString()
    };

    log.info("Activity tracking workflow completed", { 
      siteId,
      equipmentCount: equipmentActivities.length,
      workerCount: workerActivities.length,
      progressPercentage: progressMetrics.completionPercentage,
      recommendationsCount: recommendations.recommendations.length
    });

    return result;

  } catch (error) {
    log.error("Activity tracking workflow failed", { 
      siteId, 
      error: error.message,
      stack: error.stack 
    });

    // Generate error notification
    await step.generateErrorNotification({
      name: "generateErrorNotification",
      input: {
        siteId,
        error: error.message,
        workflow: 'activity_tracking',
        severity: 'high',
        timestamp: new Date().toISOString()
      }
    });

    throw error;
  }
}

/**
 * Continuous activity monitoring workflow for real-time updates
 */
export async function continuousActivityMonitoringWorkflow(input: {
  siteId: string;
  monitoringInterval: number; // in minutes
}): Promise<void> {
  const { siteId, monitoringInterval } = input;
  
  log.info("Starting continuous activity monitoring", { siteId, monitoringInterval });

  while (true) {
    try {
      // Get current activity snapshot
      const currentActivities = await step.getCurrentActivitySnapshot({
        name: "getCurrentActivitySnapshot",
        input: {
          siteId,
          timeWindow: monitoringInterval,
          includeMetrics: true
        }
      });

      // Check for immediate issues
      const immediateIssues = await step.checkImmediateIssues({
        name: "checkImmediateIssues",
        input: {
          siteId,
          activities: currentActivities,
          thresholds: {
            safetyViolation: 'immediate',
            equipmentFailure: 'immediate',
            qualityIssue: 'high',
            scheduleDeviation: 'medium'
          }
        }
      });

      // Send immediate alerts if needed
      if (immediateIssues.criticalIssues.length > 0) {
        await step.sendImmediateAlerts({
          name: "sendImmediateAlerts",
          input: {
            siteId,
            issues: immediateIssues.criticalIssues,
            channels: ['sms', 'push_notification', 'dashboard_alert']
          }
        });
      }

      // Update real-time metrics
      await step.updateRealtimeMetrics({
        name: "updateRealtimeMetrics",
        input: {
          siteId,
          activities: currentActivities,
          timestamp: new Date().toISOString()
        }
      });

      // Wait for next monitoring cycle
      await step.sleep(monitoringInterval * 60 * 1000); // Convert minutes to milliseconds

    } catch (error) {
      log.error("Continuous monitoring cycle failed", { 
        siteId, 
        error: error.message 
      });
      
      // Wait before retrying
      await step.sleep(30000); // 30 seconds
    }
  }
}
