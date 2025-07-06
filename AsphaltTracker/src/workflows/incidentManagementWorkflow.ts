// Incident Management Workflow - AI-powered incident detection and response
// Integrates with camera feeds and real-time monitoring

import { workflow, activity, proxyActivities } from "@restackio/ai";

// Import activities
const {
  detectIncident,
  classifyIncident,
  captureEvidence,
  notifyStakeholders,
  createIncidentReport,
  escalateIncident,
  trackResolution,
  updateIncidentStatus,
  analyzeIncidentPattern
} = proxyActivities({
  scheduleToCloseTimeout: "2 minutes",
  scheduleToStartTimeout: "1 minute",
  startToCloseTimeout: "10 minutes"
});

// Workflow input types
export interface IncidentDetectionInput {
  truckId: number;
  driverId?: number;
  cameraFeeds: Array<{
    cameraId: number;
    position: string;
    streamUrl: string;
    aiEnabled: boolean;
  }>;
  detectionTypes: string[];
  confidenceThreshold: number;
  autoEscalation: boolean;
}

export interface IncidentData {
  id: number;
  truckId: number;
  driverId?: number;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  timestamp: Date;
  location?: { lat: number; lng: number };
  cameraId: number;
  cameraPosition: string;
  description: string;
  evidenceUrls: string[];
  status: "detected" | "acknowledged" | "investigating" | "resolved" | "false_positive";
}

// Workflow result type
export interface IncidentManagementResult {
  incidentId: number;
  status: "resolved" | "escalated" | "ongoing" | "error";
  resolutionTime?: number; // in minutes
  actionsTaken: string[];
  stakeholdersNotified: string[];
  evidenceCollected: number;
  finalSeverity: string;
  summary: string;
}

/**
 * Incident Management Workflow
 * Handles complete incident lifecycle from detection to resolution
 */
export async function incidentManagementWorkflow(
  input: IncidentDetectionInput
): Promise<IncidentManagementResult> {
  const { 
    truckId, 
    driverId, 
    cameraFeeds, 
    detectionTypes, 
    confidenceThreshold, 
    autoEscalation 
  } = input;
  
  let actionsTaken: string[] = [];
  let stakeholdersNotified: string[] = [];
  let evidenceCollected = 0;
  const startTime = Date.now();

  console.log(`🚨 Starting incident management workflow for Truck ${truckId}`);

  try {
    // Step 1: Detect incident from camera feeds
    const detectionResult = await detectIncident({
      truckId,
      cameraFeeds,
      detectionTypes,
      confidenceThreshold,
      analysisDuration: 30, // seconds
      multiCamera: true
    });

    if (!detectionResult.incidentDetected) {
      return {
        incidentId: 0,
        status: "resolved",
        actionsTaken: ["no_incident_detected"],
        stakeholdersNotified: [],
        evidenceCollected: 0,
        finalSeverity: "none",
        summary: `No incidents detected for Truck ${truckId}`
      };
    }

    const incident = detectionResult.incident;
    actionsTaken.push("incident_detected");

    // Step 2: Classify and assess incident severity
    const classification = await classifyIncident({
      incident,
      contextData: {
        driverId,
        truckHistory: true,
        timeOfDay: new Date().getHours(),
        weather: "clear", // Could be enhanced with weather API
        roadConditions: "normal"
      },
      riskFactors: true
    });

    incident.severity = classification.severity;
    incident.type = classification.type;
    incident.description = classification.description;
    actionsTaken.push("incident_classified");

    // Step 3: Capture evidence (video clips, images, data)
    const evidenceCapture = await captureEvidence({
      incident,
      cameraFeeds,
      captureTypes: ["video_clip", "still_images", "telemetry_data"],
      duration: {
        beforeIncident: 30, // seconds
        afterIncident: 60   // seconds
      },
      quality: "high"
    });

    evidenceCollected = evidenceCapture.filesGenerated;
    incident.evidenceUrls = evidenceCapture.urls;
    actionsTaken.push("evidence_captured");

    // Step 4: Create formal incident report
    const incidentReport = await createIncidentReport({
      incident,
      evidence: evidenceCapture,
      classification,
      truckData: {
        truckId,
        driverId,
        location: incident.location,
        speed: detectionResult.contextData?.speed,
        heading: detectionResult.contextData?.heading
      },
      autoGenerate: true
    });

    actionsTaken.push("report_created");

    // Step 5: Notify stakeholders based on severity
    const notificationList = determineNotificationList(incident.severity, incident.type);
    
    for (const stakeholder of notificationList) {
      await notifyStakeholders({
        stakeholder,
        incident,
        report: incidentReport,
        urgency: mapSeverityToUrgency(incident.severity),
        channels: ["email", "sms", "dashboard"]
      });
      
      stakeholdersNotified.push(stakeholder);
    }
    
    actionsTaken.push("stakeholders_notified");

    // Step 6: Auto-escalation for critical incidents
    let escalated = false;
    if (autoEscalation && (incident.severity === "critical" || incident.severity === "high")) {
      const escalationResult = await escalateIncident({
        incident,
        escalationLevel: incident.severity === "critical" ? "emergency" : "priority",
        notifyManagement: true,
        requestImmediate: incident.severity === "critical"
      });
      
      if (escalationResult.success) {
        escalated = true;
        actionsTaken.push("incident_escalated");
        stakeholdersNotified.push(...escalationResult.additionalNotifications);
      }
    }

    // Step 7: Monitor for resolution or require manual intervention
    const resolutionResult = await trackResolution({
      incidentId: incident.id,
      autoResolve: incident.severity === "low",
      resolutionTimeout: getResolutionTimeout(incident.severity),
      followUpRequired: incident.severity !== "low"
    });

    let finalStatus: IncidentManagementResult["status"] = "ongoing";
    let resolutionTime: number | undefined;

    if (resolutionResult.resolved) {
      finalStatus = "resolved";
      resolutionTime = Math.round((Date.now() - startTime) / (1000 * 60)); // minutes
      actionsTaken.push("incident_resolved");
      
      // Update incident status to resolved
      await updateIncidentStatus({
        incidentId: incident.id,
        status: "resolved",
        resolution: resolutionResult.resolution,
        resolvedBy: resolutionResult.resolvedBy || "system"
      });
    } else if (escalated) {
      finalStatus = "escalated";
      actionsTaken.push("escalation_active");
    }

    // Step 8: Pattern analysis for future prevention
    workflow.scheduleActivity(analyzeIncidentPattern, {
      incident,
      truckId,
      driverId,
      timeWindow: "30d",
      findSimilar: true
    });

    const result: IncidentManagementResult = {
      incidentId: incident.id,
      status: finalStatus,
      resolutionTime,
      actionsTaken,
      stakeholdersNotified,
      evidenceCollected,
      finalSeverity: incident.severity,
      summary: `${incident.severity.toUpperCase()} ${incident.type} incident ${finalStatus} for Truck ${truckId}. ${actionsTaken.length} actions taken, ${stakeholdersNotified.length} stakeholders notified.`
    };

    console.log(`✅ Incident management workflow completed for Truck ${truckId}:`, result.summary);
    return result;

  } catch (error) {
    console.error(`❌ Error in incident management workflow for Truck ${truckId}:`, error);
    
    return {
      incidentId: 0,
      status: "error",
      actionsTaken,
      stakeholdersNotified,
      evidenceCollected,
      finalSeverity: "error",
      summary: `Incident management failed for Truck ${truckId}: ${error.message}`
    };
  }
}

/**
 * Batch Incident Processing Workflow
 * Processes multiple incidents concurrently
 */
export async function batchIncidentProcessingWorkflow(inputs: {
  incidents: IncidentDetectionInput[];
  priorityThreshold: string;
}): Promise<IncidentManagementResult[]> {
  const { incidents, priorityThreshold } = inputs;
  
  console.log(`🚨 Starting batch incident processing for ${incidents.length} incidents`);

  // Separate critical incidents for priority processing
  const criticalIncidents = incidents.filter(i => 
    i.detectionTypes.includes("emergency") || 
    i.detectionTypes.includes("critical")
  );
  
  const standardIncidents = incidents.filter(i => 
    !criticalIncidents.includes(i)
  );

  // Process critical incidents first
  const criticalResults = await Promise.all(
    criticalIncidents.map(incident =>
      workflow.executeChild(incidentManagementWorkflow, incident)
    )
  );

  // Process standard incidents in batches
  const standardResults = await Promise.all(
    standardIncidents.map(incident =>
      workflow.executeChild(incidentManagementWorkflow, incident)
    )
  );

  const allResults = [...criticalResults, ...standardResults];
  
  console.log(`✅ Batch incident processing completed: ${allResults.length} incidents processed`);
  return allResults;
}

/**
 * Continuous Incident Monitoring Workflow
 * Monitors for incidents across fleet continuously
 */
export async function continuousIncidentMonitoringWorkflow(inputs: {
  truckIds: number[];
  monitoringDuration: number; // in hours
  detectionConfig: {
    types: string[];
    confidence: number;
    autoEscalation: boolean;
  };
}): Promise<{ totalIncidents: number; criticalIncidents: number; summary: string }> {
  const { truckIds, monitoringDuration, detectionConfig } = inputs;
  const endTime = Date.now() + (monitoringDuration * 60 * 60 * 1000);
  
  let totalIncidents = 0;
  let criticalIncidents = 0;

  console.log(`🔍 Starting continuous incident monitoring for ${truckIds.length} trucks`);

  while (Date.now() < endTime) {
    // Monitor each truck for incidents
    const monitoringPromises = truckIds.map(async (truckId) => {
      // This would integrate with real camera feeds
      const mockCameraFeeds = [
        { cameraId: truckId * 10 + 1, position: "front", streamUrl: `rtsp://truck${truckId}_front`, aiEnabled: true },
        { cameraId: truckId * 10 + 2, position: "driver_facing", streamUrl: `rtsp://truck${truckId}_driver`, aiEnabled: true }
      ];

      return workflow.executeChild(incidentManagementWorkflow, {
        truckId,
        cameraFeeds: mockCameraFeeds,
        detectionTypes: detectionConfig.types,
        confidenceThreshold: detectionConfig.confidence,
        autoEscalation: detectionConfig.autoEscalation
      });
    });

    const results = await Promise.all(monitoringPromises);
    
    for (const result of results) {
      if (result.incidentId > 0) {
        totalIncidents++;
        if (result.finalSeverity === "critical") {
          criticalIncidents++;
        }
      }
    }

    // Wait 30 seconds before next monitoring cycle
    await workflow.sleep("30 seconds");
  }

  return {
    totalIncidents,
    criticalIncidents,
    summary: `Continuous monitoring completed: ${totalIncidents} total incidents (${criticalIncidents} critical) detected across ${truckIds.length} trucks over ${monitoringDuration} hours`
  };
}

// Helper functions
function determineNotificationList(severity: string, type: string): string[] {
  const notifications: string[] = [];
  
  switch (severity) {
    case "critical":
      notifications.push("emergency_response", "fleet_manager", "driver_supervisor", "safety_officer");
      break;
    case "high":
      notifications.push("fleet_manager", "driver_supervisor", "safety_officer");
      break;
    case "medium":
      notifications.push("driver_supervisor", "fleet_coordinator");
      break;
    case "low":
      notifications.push("fleet_coordinator");
      break;
  }

  // Add type-specific notifications
  if (type.includes("safety") || type.includes("emergency")) {
    notifications.push("safety_department");
  }
  
  return [...new Set(notifications)]; // Remove duplicates
}

function mapSeverityToUrgency(severity: string): string {
  switch (severity) {
    case "critical": return "immediate";
    case "high": return "urgent";
    case "medium": return "normal";
    case "low": return "low";
    default: return "normal";
  }
}

function getResolutionTimeout(severity: string): number {
  switch (severity) {
    case "critical": return 30; // 30 minutes
    case "high": return 120;    // 2 hours
    case "medium": return 480;  // 8 hours
    case "low": return 1440;    // 24 hours
    default: return 480;
  }
}