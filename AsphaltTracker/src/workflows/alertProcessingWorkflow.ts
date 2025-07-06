// Alert Processing Workflow
// Intelligent alert processing, routing, and notification management

import { step, workflow } from "@restackio/ai";

export const alertProcessingWorkflow = workflow("alertProcessingWorkflow", async (input?: {
  alertQueue?: string;
  batchSize?: number;
  priorityFilter?: string[];
}) => {
  console.log(`🚨 Starting alert processing workflow`);

  try {
    // Step 1: Get pending alerts from queue
    const pendingAlerts = await step("getPendingAlerts", {
      queue: input?.alertQueue || "main_alert_queue",
      batchSize: input?.batchSize || 50,
      priorityFilter: input?.priorityFilter,
      includeMetadata: true
    });

    if (!pendingAlerts || pendingAlerts.length === 0) {
      console.log("📭 No pending alerts to process");
      return {
        status: "no_pending_alerts",
        timestamp: new Date().toISOString()
      };
    }

    console.log(`📋 Processing ${pendingAlerts.length} pending alerts`);

    // Step 2: Load notification rules and recipient configurations
    const notificationRules = await step("loadNotificationRules", {
      includeEscalationRules: true,
      includeScheduleRules: true,
      activeOnly: true
    });

    // Step 3: Process each alert
    const processedAlerts = [];
    const failedAlerts = [];

    for (const alert of pendingAlerts) {
      try {
        // Step 3a: Classify and enrich alert
        const enrichedAlert = await step("classifyAlert", {
          alert,
          contextualData: true,
          historicalAnalysis: true
        });

        // Step 3b: Check for duplicate alerts
        const duplicateCheck = await step("checkAlertDeduplication", {
          alert: enrichedAlert,
          timeWindow: 300, // 5 minutes
          similarityThreshold: 0.8
        });

        if (duplicateCheck.isDuplicate) {
          console.log(`⏭️ Skipping duplicate alert: ${alert.id}`);
          await step("updateExistingAlert", {
            existingAlertId: duplicateCheck.existingAlertId,
            newOccurrence: enrichedAlert,
            incrementCount: true
          });
          continue;
        }

        // Step 3c: Enrich alert with additional context
        const contextEnrichedAlert = await step("enrichAlert", {
          alert: enrichedAlert,
          includeLocationData: true,
          includePersonnelData: true,
          includeEquipmentData: true,
          includeWeatherData: true
        });

        // Step 3d: Determine recipients based on rules
        const recipients = await step("determineRecipients", {
          alert: contextEnrichedAlert,
          notificationRules,
          considerSchedule: true,
          considerAvailability: true
        });

        // Step 3e: Generate personalized alert messages
        const alertMessages = await step("generateAlertMessage", {
          alert: contextEnrichedAlert,
          recipients,
          includeActionItems: true,
          includeContext: true
        });

        // Step 3f: Send immediate notifications for critical alerts
        if (contextEnrichedAlert.severity === 'critical') {
          await step("sendImmediateNotifications", {
            alert: contextEnrichedAlert,
            messages: alertMessages,
            channels: ["sms", "push", "webhook"],
            bypassSchedule: true
          });
        }

        // Step 3g: Send standard notifications
        const notificationResults = await step("sendNotifications", {
          alert: contextEnrichedAlert,
          messages: alertMessages,
          respectSchedule: contextEnrichedAlert.severity !== 'critical'
        });

        // Step 3h: Update dashboard with new alert
        await step("updateDashboard", {
          alert: contextEnrichedAlert,
          action: "add",
          realTimeUpdate: true
        });

        // Step 3i: Log alert to audit trail
        await step("logToAuditTrail", {
          alert: contextEnrichedAlert,
          recipients,
          notificationResults,
          timestamp: new Date().toISOString()
        });

        // Step 3j: Schedule follow-up actions if needed
        if (contextEnrichedAlert.requiresFollowUp) {
          await step("scheduleFollowUpActions", {
            alert: contextEnrichedAlert,
            followUpRules: notificationRules.followUpRules,
            escalationRules: notificationRules.escalationRules
          });
        }

        // Step 3k: Start escalation workflow for high-priority alerts
        if (contextEnrichedAlert.severity === 'critical' || contextEnrichedAlert.severity === 'high') {
          await step("startEscalationWorkflow", {
            alert: contextEnrichedAlert,
            escalationRules: notificationRules.escalationRules,
            initialDelay: contextEnrichedAlert.severity === 'critical' ? 300 : 900 // 5 or 15 minutes
          });
        }

        processedAlerts.push({
          ...contextEnrichedAlert,
          processingStatus: "completed",
          recipientCount: recipients.length,
          notificationsSent: notificationResults.successful,
          notificationsFailed: notificationResults.failed
        });

      } catch (alertError) {
        console.error(`❌ Failed to process alert ${alert.id}:`, alertError);
        
        failedAlerts.push({
          ...alert,
          processingStatus: "failed",
          error: alertError.message
        });

        // Generate error alert for failed processing
        await step("generateErrorAlert", {
          type: "alert_processing_failure",
          originalAlert: alert,
          error: alertError.message,
          severity: "medium"
        });
      }
    }

    // Step 4: Process bulk alert analytics
    const alertAnalytics = await step("processAlertAnalytics", {
      processedAlerts,
      failedAlerts,
      timeWindow: 3600, // 1 hour
      includePatterns: true,
      includeTrends: true
    });

    // Step 5: Generate alert summary report
    const alertSummary = await step("generateAlertSummary", {
      processedAlerts,
      failedAlerts,
      analytics: alertAnalytics,
      timeRange: "last_hour"
    });

    // Step 6: Update alert processing metrics
    await step("updateAlertProcessingMetrics", {
      totalProcessed: processedAlerts.length,
      totalFailed: failedAlerts.length,
      averageProcessingTime: alertAnalytics.averageProcessingTime,
      notificationSuccessRate: alertAnalytics.notificationSuccessRate,
      timestamp: new Date().toISOString()
    });

    // Step 7: Check for alert processing bottlenecks
    const bottleneckAnalysis = await step("analyzeProcessingBottlenecks", {
      processingMetrics: alertAnalytics,
      queueMetrics: true,
      systemLoad: true
    });

    if (bottleneckAnalysis.hasBottlenecks) {
      await step("generateBottleneckAlert", {
        bottlenecks: bottleneckAnalysis.bottlenecks,
        severity: "medium",
        recommendations: bottleneckAnalysis.recommendations
      });
    }

    // Step 8: Clean up processed alerts from queue
    await step("cleanupProcessedAlerts", {
      processedAlertIds: processedAlerts.map(a => a.id),
      archiveFailedAlerts: true,
      retentionPeriod: "30d"
    });

    console.log(`✅ Alert processing completed - ${processedAlerts.length} processed, ${failedAlerts.length} failed`);

    return {
      status: "completed",
      timestamp: new Date().toISOString(),
      summary: {
        totalAlerts: pendingAlerts.length,
        processedSuccessfully: processedAlerts.length,
        processingFailed: failedAlerts.length,
        notificationsSent: processedAlerts.reduce((sum, a) => sum + (a.notificationsSent || 0), 0),
        criticalAlerts: processedAlerts.filter(a => a.severity === 'critical').length,
        averageProcessingTime: alertAnalytics.averageProcessingTime
      },
      analytics: {
        alertTypes: alertAnalytics.alertTypeDistribution,
        severityDistribution: alertAnalytics.severityDistribution,
        notificationSuccessRate: alertAnalytics.notificationSuccessRate,
        trends: alertAnalytics.trends
      },
      performance: {
        processingRate: processedAlerts.length / (alertAnalytics.totalProcessingTime / 1000), // alerts per second
        successRate: processedAlerts.length / pendingAlerts.length,
        hasBottlenecks: bottleneckAnalysis.hasBottlenecks
      }
    };

  } catch (error) {
    console.error(`❌ Alert processing workflow failed:`, error);

    // Generate critical system alert
    await step("generateCriticalSystemAlert", {
      type: "alert_processing_system_failure",
      error: error.message,
      severity: "critical",
      timestamp: new Date().toISOString(),
      impact: "Alert processing temporarily unavailable"
    });

    return {
      status: "failed",
      error: error.message,
      timestamp: new Date().toISOString(),
      impact: "alert_processing_unavailable"
    };
  }
});
