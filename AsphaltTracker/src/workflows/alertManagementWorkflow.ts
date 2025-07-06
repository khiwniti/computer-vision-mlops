// Alert Management Workflow for AsphaltTracker
// Handles safety alerts, progress notifications, and system alerts with intelligent routing

import { step, log } from "@restackio/ai/workflow";
import type { 
  AlertInput,
  AlertResult,
  AlertSeverity,
  AlertType,
  NotificationChannel,
  EscalationRule
} from "../types/alert.types";

/**
 * Main alert management workflow
 */
export async function alertManagementWorkflow(input: AlertInput): Promise<AlertResult> {
  const { alertId, type, severity, siteId, data, timestamp } = input;
  
  log.info("Processing alert", { alertId, type, severity, siteId });

  try {
    // Step 1: Validate and classify alert
    const classification = await step.classifyAlert({
      name: "classifyAlert",
      input: {
        alertId,
        type,
        severity,
        data,
        context: {
          siteId,
          timestamp,
          source: input.source || 'system'
        }
      }
    });

    // Step 2: Check for duplicate or related alerts
    const deduplication = await step.checkAlertDeduplication({
      name: "checkAlertDeduplication",
      input: {
        alertId,
        type,
        siteId,
        timeWindow: 300, // 5 minutes
        similarityThreshold: 0.8
      }
    });

    if (deduplication.isDuplicate) {
      log.info("Alert is duplicate, updating existing alert", { 
        alertId, 
        existingAlertId: deduplication.existingAlertId 
      });
      
      return await step.updateExistingAlert({
        name: "updateExistingAlert",
        input: {
          existingAlertId: deduplication.existingAlertId,
          newData: data,
          incrementCount: true
        }
      });
    }

    // Step 3: Enrich alert with context
    const enrichedAlert = await step.enrichAlert({
      name: "enrichAlert",
      input: {
        alertId,
        classification,
        siteData: await step.getSiteContext({ siteId }),
        historicalData: await step.getHistoricalAlerts({ siteId, type, timeRange: '24h' }),
        weatherData: await step.getWeatherContext({ siteId }),
        equipmentStatus: await step.getEquipmentStatus({ siteId })
      }
    });

    // Step 4: Determine notification recipients
    const recipients = await step.determineRecipients({
      name: "determineRecipients",
      input: {
        alertType: type,
        severity,
        siteId,
        timeOfDay: new Date(timestamp).getHours(),
        escalationRules: await step.getEscalationRules({ siteId, alertType: type })
      }
    });

    // Step 5: Generate alert message
    const alertMessage = await step.generateAlertMessage({
      name: "generateAlertMessage",
      input: {
        alert: enrichedAlert,
        recipients,
        channels: ['email', 'sms', 'push', 'dashboard'],
        includeContext: true,
        includeRecommendations: true
      }
    });

    // Step 6: Send immediate notifications for critical alerts
    if (severity === 'critical' || severity === 'high') {
      await step.sendImmediateNotifications({
        name: "sendImmediateNotifications",
        input: {
          alertId,
          message: alertMessage,
          recipients: recipients.immediate,
          channels: ['sms', 'push', 'phone_call'],
          priority: 'high'
        }
      });
    }

    // Step 7: Send standard notifications
    const notificationResults = await step.sendNotifications({
      name: "sendNotifications",
      input: {
        alertId,
        message: alertMessage,
        recipients: recipients.standard,
        channels: recipients.preferredChannels,
        deliveryOptions: {
          retryAttempts: 3,
          retryDelay: 30, // seconds
          confirmDelivery: severity === 'critical'
        }
      }
    });

    // Step 8: Update dashboard and real-time displays
    await step.updateDashboard({
      name: "updateDashboard",
      input: {
        alertId,
        alert: enrichedAlert,
        siteId,
        displayOptions: {
          showOnMap: true,
          highlightArea: true,
          showTimeline: true,
          autoRefresh: true
        }
      }
    });

    // Step 9: Log to audit trail
    await step.logToAuditTrail({
      name: "logToAuditTrail",
      input: {
        alertId,
        action: 'alert_processed',
        details: {
          type,
          severity,
          siteId,
          recipientCount: recipients.total,
          notificationsSent: notificationResults.sent,
          processingTime: Date.now() - new Date(timestamp).getTime()
        }
      }
    });

    // Step 10: Schedule follow-up actions
    const followUpActions = await step.scheduleFollowUpActions({
      name: "scheduleFollowUpActions",
      input: {
        alertId,
        type,
        severity,
        siteId,
        actions: [
          {
            action: 'check_resolution',
            delay: getFollowUpDelay(severity),
            condition: 'if_not_resolved'
          },
          {
            action: 'escalate',
            delay: getEscalationDelay(severity),
            condition: 'if_not_acknowledged'
          }
        ]
      }
    });

    // Step 11: Start escalation workflow if needed
    if (severity === 'critical') {
      await step.startEscalationWorkflow({
        name: "startEscalationWorkflow",
        input: {
          alertId,
          initialRecipients: recipients.immediate,
          escalationLevels: await step.getEscalationLevels({ siteId, alertType: type }),
          timeouts: {
            acknowledgment: 300, // 5 minutes
            resolution: 1800     // 30 minutes
          }
        }
      });
    }

    const result: AlertResult = {
      alertId,
      status: 'processed',
      classification: classification.category,
      severity,
      recipientCount: recipients.total,
      notificationsSent: notificationResults.sent,
      notificationsFailed: notificationResults.failed,
      followUpScheduled: followUpActions.scheduled,
      processingTime: Date.now() - new Date(timestamp).getTime(),
      processedAt: new Date().toISOString()
    };

    log.info("Alert processed successfully", result);
    return result;

  } catch (error) {
    log.error("Alert processing failed", { 
      alertId, 
      error: error.message,
      stack: error.stack 
    });

    // Send error notification to system administrators
    await step.sendErrorNotification({
      name: "sendErrorNotification",
      input: {
        originalAlertId: alertId,
        error: error.message,
        severity: 'high',
        recipients: ['system_admin', 'on_call_engineer']
      }
    });

    throw error;
  }
}

/**
 * Alert escalation workflow
 */
export async function alertEscalationWorkflow(input: {
  alertId: string;
  escalationLevel: number;
  timeoutMinutes: number;
}): Promise<void> {
  const { alertId, escalationLevel, timeoutMinutes } = input;
  
  log.info("Starting alert escalation", { alertId, escalationLevel });

  try {
    // Wait for timeout period
    await step.sleep(timeoutMinutes * 60 * 1000);

    // Check if alert has been acknowledged or resolved
    const alertStatus = await step.checkAlertStatus({
      name: "checkAlertStatus",
      input: { alertId }
    });

    if (alertStatus.isResolved || alertStatus.isAcknowledged) {
      log.info("Alert resolved or acknowledged, stopping escalation", { alertId });
      return;
    }

    // Get next escalation level
    const nextLevel = await step.getNextEscalationLevel({
      name: "getNextEscalationLevel",
      input: {
        alertId,
        currentLevel: escalationLevel,
        alertType: alertStatus.type,
        siteId: alertStatus.siteId
      }
    });

    if (!nextLevel.hasNext) {
      log.warn("Maximum escalation level reached", { alertId, escalationLevel });
      
      // Send final escalation notification
      await step.sendFinalEscalationNotification({
        name: "sendFinalEscalationNotification",
        input: {
          alertId,
          recipients: ['executive_team', 'emergency_contacts'],
          message: 'Critical alert has reached maximum escalation level without resolution'
        }
      });
      return;
    }

    // Send escalation notifications
    await step.sendEscalationNotifications({
      name: "sendEscalationNotifications",
      input: {
        alertId,
        escalationLevel: nextLevel.level,
        recipients: nextLevel.recipients,
        channels: nextLevel.channels,
        urgency: 'high'
      }
    });

    // Schedule next escalation if needed
    if (nextLevel.hasNext) {
      await step.scheduleNextEscalation({
        name: "scheduleNextEscalation",
        input: {
          alertId,
          nextLevel: nextLevel.level + 1,
          timeoutMinutes: nextLevel.timeoutMinutes
        }
      });
    }

  } catch (error) {
    log.error("Alert escalation failed", { 
      alertId, 
      escalationLevel, 
      error: error.message 
    });
    throw error;
  }
}

/**
 * Bulk alert processing workflow for handling multiple alerts
 */
export async function bulkAlertProcessingWorkflow(input: {
  alerts: AlertInput[];
  batchSize?: number;
}): Promise<AlertResult[]> {
  const { alerts, batchSize = 10 } = input;
  
  log.info("Processing bulk alerts", { count: alerts.length, batchSize });

  const results: AlertResult[] = [];
  
  try {
    // Process alerts in batches
    for (let i = 0; i < alerts.length; i += batchSize) {
      const batch = alerts.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(alert => 
          step.processAlert({
            name: `processAlert_${alert.alertId}`,
            input: alert
          })
        )
      );

      // Collect results and handle failures
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          log.error("Alert processing failed in batch", { 
            alertId: batch[index].alertId,
            error: result.reason 
          });
          
          results.push({
            alertId: batch[index].alertId,
            status: 'failed',
            error: result.reason.message,
            processedAt: new Date().toISOString()
          } as AlertResult);
        }
      });

      // Small delay between batches to avoid overwhelming the system
      if (i + batchSize < alerts.length) {
        await step.sleep(1000); // 1 second
      }
    }

    log.info("Bulk alert processing completed", { 
      total: alerts.length,
      successful: results.filter(r => r.status === 'processed').length,
      failed: results.filter(r => r.status === 'failed').length
    });

    return results;

  } catch (error) {
    log.error("Bulk alert processing failed", { error: error.message });
    throw error;
  }
}

// Helper functions
function getFollowUpDelay(severity: AlertSeverity): number {
  switch (severity) {
    case 'critical': return 300;    // 5 minutes
    case 'high': return 900;        // 15 minutes
    case 'medium': return 1800;     // 30 minutes
    case 'low': return 3600;        // 1 hour
    default: return 1800;
  }
}

function getEscalationDelay(severity: AlertSeverity): number {
  switch (severity) {
    case 'critical': return 600;    // 10 minutes
    case 'high': return 1800;       // 30 minutes
    case 'medium': return 3600;     // 1 hour
    case 'low': return 7200;        // 2 hours
    default: return 1800;
  }
}
