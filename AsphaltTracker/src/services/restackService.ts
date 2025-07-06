// Restack Service Integration for AsphaltTracker
// Main service class that integrates Restack AI framework with existing Express.js application

import { Restack } from "@restackio/ai";
import config from "../restack.config.js";

// Import workflows
import { 
  truckMonitoringWorkflow, 
  batchTruckMonitoringWorkflow 
} from "../workflows/truckMonitoringWorkflow.js";
import { 
  gpsTrackingWorkflow, 
  fleetGpsTrackingWorkflow 
} from "../workflows/gpsTrackingWorkflow.js";
import { 
  incidentManagementWorkflow,
  batchIncidentProcessingWorkflow,
  continuousIncidentMonitoringWorkflow
} from "../workflows/incidentManagementWorkflow.js";

// Import activities
import {
  getTruckStatus,
  processGpsData,
  analyzeDriverBehavior,
  calculateKpiScore,
  sendAlert,
  updateDashboard
} from "../activities/truckActivities.js";
import {
  updateLocation,
  checkGeofences,
  calculateRoute,
  detectSpeedViolations,
  sendGeofenceAlert,
  updateTrackingDashboard,
  storeLocationHistory
} from "../activities/gpsActivities.js";

export class RestackService {
  private restack: Restack;
  private isInitialized = false;
  private isConnected = false;

  constructor() {
    this.restack = new Restack({
      connectionOptions: {
        address: process.env.RESTACK_ENGINE_ADDRESS || "localhost:7070",
        tls: process.env.NODE_ENV === "production"
      }
    });
  }

  /**
   * Initialize Restack service and register workflows/activities
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log("⚠️ Restack service already initialized");
      return;
    }

    try {
      console.log("🚀 Initializing Restack AI service for AsphaltTracker...");

      // Test connection
      await this.testConnection();

      // Register workflows
      await this.registerWorkflows();

      // Register activities
      await this.registerActivities();

      // Start worker
      await this.startWorker();

      this.isInitialized = true;
      console.log("✅ Restack AI service initialized successfully");

    } catch (error) {
      console.error("❌ Failed to initialize Restack service:", error);
      throw error;
    }
  }

  /**
   * Test connection to Restack engine
   */
  private async testConnection(): Promise<void> {
    try {
      // Simple health check to verify Restack connection
      const result = await this.restack.scheduleWorkflow("healthCheck", {}, {
        workflowId: `health-check-${Date.now()}`,
        taskQueue: config.worker.taskQueue
      });
      
      this.isConnected = true;
      console.log("✅ Restack engine connection established");
    } catch (error) {
      console.log("⚠️ Restack engine not available, running in compatibility mode");
      this.isConnected = false;
      // Don't throw error - allow app to run without Restack engine
    }
  }

  /**
   * Register all workflows with Restack
   */
  private async registerWorkflows(): Promise<void> {
    console.log("📋 Registering Restack workflows...");

    const workflows = [
      // Truck monitoring workflows
      { name: "truckMonitoringWorkflow", handler: truckMonitoringWorkflow },
      { name: "batchTruckMonitoringWorkflow", handler: batchTruckMonitoringWorkflow },
      
      // GPS tracking workflows
      { name: "gpsTrackingWorkflow", handler: gpsTrackingWorkflow },
      { name: "fleetGpsTrackingWorkflow", handler: fleetGpsTrackingWorkflow },
      
      // Incident management workflows
      { name: "incidentManagementWorkflow", handler: incidentManagementWorkflow },
      { name: "batchIncidentProcessingWorkflow", handler: batchIncidentProcessingWorkflow },
      { name: "continuousIncidentMonitoringWorkflow", handler: continuousIncidentMonitoringWorkflow }
    ];

    for (const workflow of workflows) {
      try {
        await this.restack.workflow(workflow.name, workflow.handler);
        console.log(`  ✓ Registered workflow: ${workflow.name}`);
      } catch (error) {
        console.warn(`  ⚠️ Failed to register workflow ${workflow.name}:`, error.message);
      }
    }

    console.log("✅ Workflow registration completed");
  }

  /**
   * Register all activities with Restack
   */
  private async registerActivities(): Promise<void> {
    console.log("⚙️ Registering Restack activities...");

    const activities = [
      // Truck activities
      { name: "getTruckStatus", handler: getTruckStatus },
      { name: "processGpsData", handler: processGpsData },
      { name: "analyzeDriverBehavior", handler: analyzeDriverBehavior },
      { name: "calculateKpiScore", handler: calculateKpiScore },
      { name: "sendAlert", handler: sendAlert },
      { name: "updateDashboard", handler: updateDashboard },
      
      // GPS activities
      { name: "updateLocation", handler: updateLocation },
      { name: "checkGeofences", handler: checkGeofences },
      { name: "calculateRoute", handler: calculateRoute },
      { name: "detectSpeedViolations", handler: detectSpeedViolations },
      { name: "sendGeofenceAlert", handler: sendGeofenceAlert },
      { name: "updateTrackingDashboard", handler: updateTrackingDashboard },
      { name: "storeLocationHistory", handler: storeLocationHistory }
    ];

    for (const activity of activities) {
      try {
        await this.restack.activity(activity.name, activity.handler);
        console.log(`  ✓ Registered activity: ${activity.name}`);
      } catch (error) {
        console.warn(`  ⚠️ Failed to register activity ${activity.name}:`, error.message);
      }
    }

    console.log("✅ Activity registration completed");
  }

  /**
   * Start Restack worker
   */
  private async startWorker(): Promise<void> {
    console.log("👷 Starting Restack worker...");

    try {
      await this.restack.worker({
        taskQueue: config.worker.taskQueue,
        maxConcurrentWorkflows: config.worker.maxConcurrentWorkflows,
        maxConcurrentActivities: config.worker.maxConcurrentActivities
      });

      console.log("✅ Restack worker started successfully");
    } catch (error) {
      console.warn("⚠️ Failed to start Restack worker:", error.message);
      // Don't throw - allow app to continue without worker
    }
  }

  /**
   * Start truck monitoring workflow
   */
  async startTruckMonitoring(params: {
    truckId: number;
    driverId?: number;
    monitoringDuration: number;
    alertThresholds: {
      speedLimit: number;
      kpiMinScore: number;
      incidentSeverity: string;
    };
  }): Promise<string> {
    if (!this.isConnected) {
      throw new Error("Restack engine not available");
    }

    const workflowId = `truck-monitoring-${params.truckId}-${Date.now()}`;
    
    try {
      await this.restack.scheduleWorkflow("truckMonitoringWorkflow", params, {
        workflowId,
        taskQueue: config.worker.taskQueue
      });

      console.log(`🚛 Started truck monitoring workflow for Truck ${params.truckId} (ID: ${workflowId})`);
      return workflowId;
    } catch (error) {
      console.error(`❌ Failed to start truck monitoring for Truck ${params.truckId}:`, error);
      throw error;
    }
  }

  /**
   * Start GPS tracking workflow
   */
  async startGpsTracking(params: {
    truckId: number;
    trackingDuration: number;
    updateInterval: number;
    geofenceChecking: boolean;
    speedLimit: number;
  }): Promise<string> {
    if (!this.isConnected) {
      throw new Error("Restack engine not available");
    }

    const workflowId = `gps-tracking-${params.truckId}-${Date.now()}`;
    
    try {
      await this.restack.scheduleWorkflow("gpsTrackingWorkflow", params, {
        workflowId,
        taskQueue: config.worker.taskQueue
      });

      console.log(`📍 Started GPS tracking workflow for Truck ${params.truckId} (ID: ${workflowId})`);
      return workflowId;
    } catch (error) {
      console.error(`❌ Failed to start GPS tracking for Truck ${params.truckId}:`, error);
      throw error;
    }
  }

  /**
   * Start fleet monitoring for multiple trucks
   */
  async startFleetMonitoring(params: {
    truckIds: number[];
    monitoringDuration: number;
    alertThresholds: {
      speedLimit: number;
      kpiMinScore: number;
      incidentSeverity: string;
    };
  }): Promise<string> {
    if (!this.isConnected) {
      throw new Error("Restack engine not available");
    }

    const workflowId = `fleet-monitoring-${Date.now()}`;
    
    try {
      await this.restack.scheduleWorkflow("batchTruckMonitoringWorkflow", params, {
        workflowId,
        taskQueue: config.worker.taskQueue
      });

      console.log(`🚛 Started fleet monitoring workflow for ${params.truckIds.length} trucks (ID: ${workflowId})`);
      return workflowId;
    } catch (error) {
      console.error(`❌ Failed to start fleet monitoring:`, error);
      throw error;
    }
  }

  /**
   * Get workflow status
   */
  async getWorkflowStatus(workflowId: string): Promise<any> {
    if (!this.isConnected) {
      throw new Error("Restack engine not available");
    }

    try {
      const status = await this.restack.getWorkflowStatus(workflowId);
      return status;
    } catch (error) {
      console.error(`❌ Failed to get workflow status for ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel workflow
   */
  async cancelWorkflow(workflowId: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Restack engine not available");
    }

    try {
      await this.restack.cancelWorkflow(workflowId);
      console.log(`⏹️ Cancelled workflow: ${workflowId}`);
    } catch (error) {
      console.error(`❌ Failed to cancel workflow ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Get service health status
   */
  getHealthStatus(): {
    initialized: boolean;
    connected: boolean;
    engine: string;
    taskQueue: string;
  } {
    return {
      initialized: this.isInitialized,
      connected: this.isConnected,
      engine: process.env.RESTACK_ENGINE_ADDRESS || "localhost:7070",
      taskQueue: config.worker.taskQueue
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log("🛑 Shutting down Restack service...");
    
    try {
      // Stop worker and close connections
      await this.restack.shutdown();
      console.log("✅ Restack service shutdown completed");
    } catch (error) {
      console.error("❌ Error during Restack service shutdown:", error);
    }
  }
}

// Export singleton instance
export const restackService = new RestackService();