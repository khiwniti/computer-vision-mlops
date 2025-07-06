// Truck Monitoring Workflow - Real-time fleet management  
// Integrates with existing AsphaltTracker logistics platform

import { step } from "@restackio/ai/workflow";

// Import activity functions
import {
  getTruckStatus,
  processGpsData,
  analyzeDriverBehavior,
  calculateKpiScore,
  sendAlert,
  updateDashboard
} from "../activities/simpleTruckActivities.js";

// Workflow input type
export interface TruckMonitoringInput {
  truckId: number;
  driverId?: number;
  monitoringDuration: number; // in minutes
  alertThresholds: {
    speedLimit: number;
    kpiMinScore: number;
    incidentSeverity: string;
  };
}

// Workflow result type
export interface TruckMonitoringResult {
  truckId: number;
  status: "completed" | "terminated" | "error";
  totalIncidents: number;
  averageKpiScore: number;
  alertsSent: number;
  monitoringDuration: number;
  summary: string;
}

/**
 * Main Truck Monitoring Workflow
 * Orchestrates real-time monitoring for a single truck
 */
export async function truckMonitoringWorkflow(
  input: TruckMonitoringInput
): Promise<TruckMonitoringResult> {
  const { truckId, driverId, monitoringDuration, alertThresholds } = input;
  
  let totalIncidents = 0;
  let alertsSent = 0;
  let kpiScores: number[] = [];
  const startTime = Date.now();
  const endTime = startTime + (monitoringDuration * 60 * 1000);

  console.log(`🚛 Starting monitoring workflow for Truck ${truckId}`);

  try {
    // Continuous monitoring loop
    while (Date.now() < endTime) {
      // Step 1: Get current truck status
      const truckStatus = await step().getTruckStatus({
        truckId,
        includeLocation: true,
        includeCameras: true,
        includeDriver: true
      });

      if (!truckStatus.online) {
        console.log(`⚠️ Truck ${truckId} is offline, pausing monitoring`);
        await new Promise(resolve => setTimeout(resolve, 30000));
        continue;
      }

      // Step 2: Process GPS data for geofencing and speed monitoring
      const gpsData = await step().processGpsData({
        truckId,
        location: truckStatus.location,
        speed: truckStatus.speed,
        heading: truckStatus.heading,
        checkGeofences: true,
        speedLimit: alertThresholds.speedLimit
      });

      // Step 3: Analyze driver behavior from camera feeds
      const behaviorAnalysis = await step().analyzeDriverBehavior({
        truckId,
        driverId,
        cameraFeeds: [],
        analysisTypes: ["drowsiness", "distraction", "seatbelt", "phone_usage"],
        confidence: 0.75
      });

      // Step 4: Combine incidents from GPS and behavior analysis
      const incidents = [...gpsData.violations, ...behaviorAnalysis.incidents];

      // Update incident count
      totalIncidents += incidents.length;

      // Step 5: Calculate KPI score
      const kpiScore = await step().calculateKpiScore({
        truckId,
        driverId,
        gpsData,
        behaviorAnalysis,
        incidents,
        timeWindow: "5m"
      });

      kpiScores.push(kpiScore.score);

      // Check for critical incidents or low KPI scores
      const criticalIncidents = incidents.filter(i => i.severity === "critical");
      const lowKpiScore = kpiScore.score < alertThresholds.kpiMinScore;

      if (criticalIncidents.length > 0 || lowKpiScore) {
        // Step 6: Send alerts for critical issues
        await step().sendAlert({
          truckId,
          driverId,
          alertType: criticalIncidents.length > 0 ? "critical_incident" : "low_kpi",
          incidents: criticalIncidents,
          kpiScore: kpiScore.score,
          urgency: "high"
        });
        
        alertsSent++;
      }

      // Step 7: Update real-time dashboard
      await step().updateDashboard({
        truckId,
        status: truckStatus,
        kpiScore: kpiScore.score,
        incidents: incidents.length,
        lastUpdate: new Date()
      });

      // Wait before next monitoring cycle (5 seconds) 
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    const averageKpiScore = kpiScores.length > 0 
      ? kpiScores.reduce((sum, score) => sum + score, 0) / kpiScores.length 
      : 0;

    const result: TruckMonitoringResult = {
      truckId,
      status: "completed",
      totalIncidents,
      averageKpiScore,
      alertsSent,
      monitoringDuration,
      summary: `Monitoring completed for Truck ${truckId}. ${totalIncidents} incidents detected, avg KPI: ${averageKpiScore.toFixed(1)}`
    };

    console.log(`✅ Monitoring workflow completed for Truck ${truckId}:`, result.summary);
    return result;

  } catch (error) {
    console.error(`❌ Error in monitoring workflow for Truck ${truckId}:`, error);
    
    return {
      truckId,
      status: "error",
      totalIncidents,
      averageKpiScore: kpiScores.length > 0 ? kpiScores.reduce((a, b) => a + b) / kpiScores.length : 0,
      alertsSent,
      monitoringDuration,
      summary: `Monitoring failed for Truck ${truckId}: ${error.message}`
    };
  }
}

/**
 * Batch Truck Monitoring Workflow
 * Monitors multiple trucks concurrently
 */
export async function batchTruckMonitoringWorkflow(inputs: {
  truckIds: number[];
  monitoringDuration: number;
  alertThresholds: TruckMonitoringInput["alertThresholds"];
}): Promise<TruckMonitoringResult[]> {
  const { truckIds, monitoringDuration, alertThresholds } = inputs;
  
  console.log(`🚛 Starting batch monitoring for ${truckIds.length} trucks`);

  // Start monitoring workflows for all trucks concurrently
  const monitoringPromises = truckIds.map(truckId =>
    workflow.executeChild(truckMonitoringWorkflow, {
      truckId,
      monitoringDuration,
      alertThresholds
    })
  );

  // Wait for all monitoring workflows to complete
  const results = await Promise.all(monitoringPromises);
  
  console.log(`✅ Batch monitoring completed for ${truckIds.length} trucks`);
  return results;
}