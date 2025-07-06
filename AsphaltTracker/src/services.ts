// AsphaltTracker Services Entry Point
// Following Restack.io blueprint structure with agents, workflows, functions, and services

import { Restack } from "@restackio/ai";
import { config } from "../restack.config";

// Import agents
import { VideoAnalysisAgent } from "./agents/videoAnalysisAgent";
import { ActivityMonitorAgent } from "./agents/activityMonitorAgent";
import { SafetyAgent } from "./agents/safetyAgent";
import { AlertAgent } from "./agents/alertAgent";

// Import workflows
import { videoProcessingWorkflow } from "./workflows/videoProcessingWorkflow";
import { activityTrackingWorkflow } from "./workflows/activityTrackingWorkflow";
import { safetyMonitoringWorkflow } from "./workflows/safetyMonitoringWorkflow";
import { alertProcessingWorkflow } from "./workflows/alertProcessingWorkflow";
import { infrastructureInitializationWorkflow, infrastructureMaintenanceWorkflow } from "./workflows/infrastructureWorkflow";
import { dailyShipmentPlanningWorkflow, realTimeShipmentTrackingWorkflow, fleetOptimizationWorkflow, supplyChainAnalyticsWorkflow } from "./workflows/enterpriseLogisticsWorkflow";

// Import functions
import { nvidiaVSSFunctions } from "./functions/nvidiaVSSFunctions";
import { databaseFunctions } from "./functions/databaseFunctions";
import { notificationFunctions } from "./functions/notificationFunctions";
import { infrastructureFunctions } from "./functions/infrastructureFunctions";
import { enterpriseLogisticsFunctions } from "./functions/enterpriseLogisticsFunctions";

async function main() {
  console.log("🚀 Starting AsphaltTracker Services...");

  // Initialize Restack client
  const client = new Restack({
    connectionOptions: {
      address: process.env.RESTACK_ENGINE_ADDRESS || "localhost:5233",
      apiKey: process.env.RESTACK_ENGINE_API_KEY,
    },
  });

  // Register agents
  console.log("📋 Registering agents...");
  
  const videoAnalysisAgent = new VideoAnalysisAgent();
  const activityMonitorAgent = new ActivityMonitorAgent();
  const safetyAgent = new SafetyAgent();
  const alertAgent = new AlertAgent();

  await client.registerAgent(videoAnalysisAgent);
  await client.registerAgent(activityMonitorAgent);
  await client.registerAgent(safetyAgent);
  await client.registerAgent(alertAgent);

  // Register workflows
  console.log("🔄 Registering workflows...");
  
  await client.registerWorkflow(videoProcessingWorkflow);
  await client.registerWorkflow(activityTrackingWorkflow);
  await client.registerWorkflow(safetyMonitoringWorkflow);
  await client.registerWorkflow(alertProcessingWorkflow);
  await client.registerWorkflow(infrastructureInitializationWorkflow);
  await client.registerWorkflow(infrastructureMaintenanceWorkflow);
  await client.registerWorkflow(dailyShipmentPlanningWorkflow);
  await client.registerWorkflow(realTimeShipmentTrackingWorkflow);
  await client.registerWorkflow(fleetOptimizationWorkflow);
  await client.registerWorkflow(supplyChainAnalyticsWorkflow);

  // Register functions
  console.log("⚙️ Registering functions...");
  
  await client.registerFunctions(nvidiaVSSFunctions);
  await client.registerFunctions(databaseFunctions);
  await client.registerFunctions(notificationFunctions);
  await client.registerFunctions(infrastructureFunctions);
  await client.registerFunctions(enterpriseLogisticsFunctions);

  // Start scheduled workflows
  console.log("⏰ Starting scheduled workflows...");
  
  // Video processing queue (every 30 seconds)
  await client.scheduleWorkflow({
    workflowName: "videoProcessingWorkflow",
    workflowId: "video-processing-scheduler",
    schedule: {
      cron: "*/30 * * * * *",
    },
  });

  // Activity tracking (every 10 seconds)
  await client.scheduleWorkflow({
    workflowName: "activityTrackingWorkflow", 
    workflowId: "activity-tracking-scheduler",
    schedule: {
      cron: "*/10 * * * * *",
    },
  });

  // Safety monitoring (every 5 seconds)
  await client.scheduleWorkflow({
    workflowName: "safetyMonitoringWorkflow",
    workflowId: "safety-monitoring-scheduler", 
    schedule: {
      cron: "*/5 * * * * *",
    },
  });

  // Alert processing (every second)
  await client.scheduleWorkflow({
    workflowName: "alertProcessingWorkflow",
    workflowId: "alert-processing-scheduler",
    schedule: {
      cron: "*/1 * * * * *",
    },
  });

  // Infrastructure maintenance (daily at 2 AM)
  await client.scheduleWorkflow({
    workflowName: "infrastructureMaintenanceWorkflow",
    workflowId: "infrastructure-maintenance-scheduler",
    schedule: {
      cron: "0 0 2 * * *", // Daily at 2:00 AM
    },
    input: {
      performHealthCheck: true,
      createBackup: true,
      optimizePerformance: true,
      cleanupOldData: true
    }
  });

  // Daily shipment planning (every day at 6 AM)
  await client.scheduleWorkflow({
    workflowName: "dailyShipmentPlanningWorkflow",
    workflowId: "daily-shipment-planning-scheduler",
    schedule: {
      cron: "0 0 6 * * *", // Daily at 6:00 AM
    },
    input: {
      date: new Date(),
      autoDispatch: true
    }
  });

  // Fleet optimization (weekly on Sundays at 3 AM)
  await client.scheduleWorkflow({
    workflowName: "fleetOptimizationWorkflow",
    workflowId: "fleet-optimization-scheduler",
    schedule: {
      cron: "0 0 3 * * 0", // Weekly on Sunday at 3:00 AM
    },
    input: {
      optimizationType: "WEEKLY",
      includeMaintenanceScheduling: true,
      includeDriverScheduling: true,
      includeRouteOptimization: true
    }
  });

  // Supply chain analytics (daily at 7 AM)
  await client.scheduleWorkflow({
    workflowName: "supplyChainAnalyticsWorkflow",
    workflowId: "supply-chain-analytics-scheduler",
    schedule: {
      cron: "0 0 7 * * *", // Daily at 7:00 AM
    },
    input: {
      analysisType: "PERFORMANCE",
      timeframe: "DAILY",
      includeForecasting: true,
      includeBenchmarking: true
    }
  });

  // Initialize infrastructure on startup
  console.log("🏗️ Initializing infrastructure...");
  try {
    await client.executeWorkflow({
      workflowName: "infrastructureInitializationWorkflow",
      workflowId: `infrastructure-init-${Date.now()}`,
      input: {
        initializeDatabase: true,
        initializeRedis: true,
        initializeVectorDb: true,
        initializeTimeSeriesDb: true,
        seedData: true,
        force: false
      }
    });
    console.log("✅ Infrastructure initialized successfully");
  } catch (error) {
    console.error("⚠️ Infrastructure initialization failed:", error);
    console.log("🔄 Services will continue without full infrastructure...");
  }

  // Start the service
  console.log("🎯 Starting Restack service...");
  
  await client.start({
    taskQueue: config.worker.taskQueue,
    options: {
      maxConcurrentWorkflowTaskExecutions: config.worker.maxConcurrentWorkflows,
      maxConcurrentActivityTaskExecutions: config.worker.maxConcurrentActivities,
    },
  });

  console.log("✅ AsphaltTracker services started successfully!");
  console.log(`📊 Dashboard: http://localhost:5233`);
  console.log(`🔧 Task Queue: ${config.worker.taskQueue}`);
  console.log(`🎬 Max Concurrent Workflows: ${config.worker.maxConcurrentWorkflows}`);
  console.log(`⚡ Max Concurrent Activities: ${config.worker.maxConcurrentActivities}`);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the services
main().catch((error) => {
  console.error("❌ Failed to start AsphaltTracker services:", error);
  process.exit(1);
});

export { main };
