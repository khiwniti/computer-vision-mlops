// Mock API Routes for Testing and Simulation
// REST API endpoints for managing mock data and simulation

import express from 'express';
import { databaseSeeder, type SeedOptions } from './seed-database';
import { simulationEngine } from './simulation-engine';
import { streamingIntegration } from './streaming-integration';
import { generateAllMockData } from './comprehensive-mock-generator';
import { generateAllAnalyticsData } from './ai-analytics-generator';

const router = express.Router();

/**
 * GET /api/mock/status
 * Get current status of mock data and simulation
 */
router.get('/status', async (req, res) => {
  try {
    const [seedingStatus, simulationStatus] = await Promise.all([
      databaseSeeder.getSeedingStatus(),
      Promise.resolve(simulationEngine.getStatus())
    ]);

    res.json({
      success: true,
      status: {
        database: seedingStatus,
        simulation: simulationStatus,
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date()
    });
  }
});

/**
 * POST /api/mock/populate
 * Populate database with mock data
 */
router.post('/populate', async (req, res) => {
  try {
    const options: SeedOptions = {
      clearExisting: req.body.clearExisting ?? true,
      includeAnalytics: req.body.includeAnalytics ?? true,
      includeHistoricalData: req.body.includeHistoricalData ?? true,
      truckCount: req.body.truckCount ?? 100,
      daysOfHistory: req.body.daysOfHistory ?? 30,
      startSimulation: req.body.startSimulation ?? false
    };

    console.log('Populating database with options:', options);
    const result = await databaseSeeder.seedDatabase(options);

    res.json({
      success: result.success,
      message: result.message,
      data: result.data,
      errors: result.errors,
      duration: result.duration,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date()
    });
  }
});

/**
 * POST /api/mock/populate/quick
 * Quick populate with default settings
 */
router.post('/populate/quick', async (req, res) => {
  try {
    console.log('Quick populating database with defaults...');
    const result = await databaseSeeder.seedDatabase({
      clearExisting: true,
      includeAnalytics: true,
      includeHistoricalData: false, // Faster setup
      truckCount: 50, // Smaller dataset for quick testing
      daysOfHistory: 7,
      startSimulation: false
    });

    res.json({
      success: result.success,
      message: result.message,
      data: result.data,
      errors: result.errors,
      duration: result.duration,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date()
    });
  }
});

/**
 * POST /api/mock/simulation/start
 * Start real-time simulation
 */
router.post('/simulation/start', async (req, res) => {
  try {
    const config = {
      updateIntervalMs: req.body.updateIntervalMs ?? 30000,
      incidentProbability: req.body.incidentProbability ?? 0.001,
      fraudProbability: req.body.fraudProbability ?? 0.0005,
      statusChangeProbability: req.body.statusChangeProbability ?? 0.002,
      gpsUpdateEnabled: req.body.gpsUpdateEnabled ?? true,
      aiIncidentsEnabled: req.body.aiIncidentsEnabled ?? true,
      fraudDetectionEnabled: req.body.fraudDetectionEnabled ?? true
    };

    // Update configuration if provided
    simulationEngine.updateConfig(config);

    // Initialize if not already done
    if (!simulationEngine.getStatus().isRunning) {
      await simulationEngine.initialize();
    }

    simulationEngine.start();

    res.json({
      success: true,
      message: 'Simulation started successfully',
      status: simulationEngine.getStatus(),
      config,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date()
    });
  }
});

/**
 * POST /api/mock/simulation/stop
 * Stop real-time simulation
 */
router.post('/simulation/stop', async (req, res) => {
  try {
    simulationEngine.stop();

    res.json({
      success: true,
      message: 'Simulation stopped successfully',
      status: simulationEngine.getStatus(),
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date()
    });
  }
});

/**
 * GET /api/mock/simulation/status
 * Get simulation status
 */
router.get('/simulation/status', async (req, res) => {
  try {
    const status = simulationEngine.getStatus();

    res.json({
      success: true,
      status,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date()
    });
  }
});

/**
 * PUT /api/mock/simulation/config
 * Update simulation configuration
 */
router.put('/simulation/config', async (req, res) => {
  try {
    const config = {
      ...(req.body.updateIntervalMs && { updateIntervalMs: req.body.updateIntervalMs }),
      ...(req.body.incidentProbability && { incidentProbability: req.body.incidentProbability }),
      ...(req.body.fraudProbability && { fraudProbability: req.body.fraudProbability }),
      ...(req.body.statusChangeProbability && { statusChangeProbability: req.body.statusChangeProbability }),
      ...(typeof req.body.gpsUpdateEnabled === 'boolean' && { gpsUpdateEnabled: req.body.gpsUpdateEnabled }),
      ...(typeof req.body.aiIncidentsEnabled === 'boolean' && { aiIncidentsEnabled: req.body.aiIncidentsEnabled }),
      ...(typeof req.body.fraudDetectionEnabled === 'boolean' && { fraudDetectionEnabled: req.body.fraudDetectionEnabled })
    };

    simulationEngine.updateConfig(config);

    res.json({
      success: true,
      message: 'Simulation configuration updated',
      status: simulationEngine.getStatus(),
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date()
    });
  }
});

/**
 * DELETE /api/mock/reset
 * Reset all mock data and stop simulation
 */
router.delete('/reset', async (req, res) => {
  try {
    // Stop simulation first
    if (simulationEngine.getStatus().isRunning) {
      simulationEngine.stop();
    }

    // Clear and repopulate database
    const result = await databaseSeeder.seedDatabase({
      clearExisting: true,
      includeAnalytics: false,
      includeHistoricalData: false,
      truckCount: 10, // Minimal data for reset
      daysOfHistory: 1,
      startSimulation: false
    });

    res.json({
      success: true,
      message: 'Mock data reset successfully',
      data: result.data,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date()
    });
  }
});

/**
 * GET /api/mock/generate/preview
 * Preview generated mock data without saving to database
 */
router.get('/generate/preview', async (req, res) => {
  try {
    const truckCount = parseInt(req.query.truckCount as string) || 5;
    const includeAnalytics = req.query.includeAnalytics === 'true';

    // Generate sample data
    const mockData = generateAllMockData();
    const analyticsData = includeAnalytics ? generateAllAnalyticsData() : {};

    // Return limited preview
    const preview = {
      vendors: mockData.vendors.slice(0, 3),
      drivers: mockData.drivers.slice(0, truckCount),
      trucks: mockData.trucks.slice(0, truckCount),
      cameras: mockData.cameras.slice(0, truckCount * 4),
      geofences: mockData.geofences.slice(0, 5),
      shipments: mockData.shipments.slice(0, 5),
      trips: mockData.trips.slice(0, 10),
      ...(includeAnalytics && {
        aiIncidents: mockData.aiIncidents.slice(0, 10),
        driverScores: mockData.driverScores.slice(0, 10),
        fraudAlerts: analyticsData.fraudAlerts?.slice(0, 5),
        gpsPoints: analyticsData.gpsPoints?.slice(0, 20),
        systemAlerts: analyticsData.systemAlerts?.slice(0, 10)
      })
    };

    res.json({
      success: true,
      preview,
      counts: {
        vendors: mockData.vendors.length,
        drivers: mockData.drivers.length,
        trucks: mockData.trucks.length,
        cameras: mockData.cameras.length,
        geofences: mockData.geofences.length,
        shipments: mockData.shipments.length,
        trips: mockData.trips.length,
        ...(includeAnalytics && {
          aiIncidents: mockData.aiIncidents.length,
          driverScores: mockData.driverScores.length,
          fraudAlerts: analyticsData.fraudAlerts?.length || 0,
          gpsPoints: analyticsData.gpsPoints?.length || 0,
          systemAlerts: analyticsData.systemAlerts?.length || 0
        })
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date()
    });
  }
});

/**
 * POST /api/mock/test/all-systems
 * Test all platform functions with mock data
 */
router.post('/test/all-systems', async (req, res) => {
  try {
    console.log('Starting comprehensive system test...');
    
    // 1. Populate database
    const seedResult = await databaseSeeder.seedDatabase({
      clearExisting: true,
      includeAnalytics: true,
      includeHistoricalData: true,
      truckCount: 100,
      daysOfHistory: 30,
      startSimulation: false
    });

    if (!seedResult.success) {
      throw new Error(`Database seeding failed: ${seedResult.message}`);
    }

    // 2. Initialize and start simulation
    await simulationEngine.initialize();
    simulationEngine.start();

    // 3. Wait a few seconds for simulation to generate some data
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 4. Test data retrieval (sample tests)
    const testResults = {
      database: seedResult.success,
      simulation: simulationEngine.getStatus().isRunning,
      dataGenerated: seedResult.data,
      errors: seedResult.errors
    };

    res.json({
      success: true,
      message: 'Comprehensive system test completed',
      testResults,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date()
    });
  }
});

/**
 * GET /api/mock/health
 * Health check for mock system
 */
router.get('/health', async (req, res) => {
  try {
    const [seedingStatus, simulationStatus] = await Promise.all([
      databaseSeeder.getSeedingStatus(),
      Promise.resolve(simulationEngine.getStatus())
    ]);

    const health = {
      status: 'healthy',
      database: {
        hasData: seedingStatus.hasData,
        counts: seedingStatus.counts
      },
      simulation: {
        isRunning: simulationStatus.isRunning,
        activeTrucks: simulationStatus.activeTrucks || 0
      },
      timestamp: new Date()
    };

    res.json({
      success: true,
      health
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      health: {
        status: 'unhealthy',
        error: error.message
      },
      timestamp: new Date()
    });
  }
});

/**
 * POST /api/mock/streaming/start
 * Start streaming integration
 */
router.post('/streaming/start', async (req, res) => {
  try {
    const config = {
      enabled: req.body.enabled ?? true,
      streamQuality: req.body.streamQuality ?? 'medium',
      frameRate: req.body.frameRate ?? 30,
      enableRecording: req.body.enableRecording ?? true
    };

    streamingIntegration.updateConfig(config);
    await streamingIntegration.initialize();
    streamingIntegration.start();

    res.json({
      success: true,
      message: 'Streaming integration started',
      status: streamingIntegration.getStreamingStatus(),
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date()
    });
  }
});

/**
 * POST /api/mock/streaming/stop
 * Stop streaming integration
 */
router.post('/streaming/stop', async (req, res) => {
  try {
    streamingIntegration.stop();

    res.json({
      success: true,
      message: 'Streaming integration stopped',
      status: streamingIntegration.getStreamingStatus(),
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date()
    });
  }
});

/**
 * GET /api/mock/streaming/status
 * Get streaming integration status
 */
router.get('/streaming/status', async (req, res) => {
  try {
    const status = streamingIntegration.getStreamingStatus();
    const analytics = streamingIntegration.getStreamAnalytics();

    res.json({
      success: true,
      status,
      analytics,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date()
    });
  }
});

/**
 * GET /api/mock/streaming/truck/:truckId
 * Get streaming status for specific truck
 */
router.get('/streaming/truck/:truckId', async (req, res) => {
  try {
    const truckId = parseInt(req.params.truckId);
    const truckStreaming = streamingIntegration.getTruckStreamingStatus(truckId);

    if (!truckStreaming) {
      return res.status(404).json({
        success: false,
        error: `Truck ${truckId} not found in streaming system`,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      truckStreaming,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date()
    });
  }
});

/**
 * POST /api/mock/streaming/simulate/camera-failure
 * Simulate camera failure for testing
 */
router.post('/streaming/simulate/camera-failure', async (req, res) => {
  try {
    const { truckId, position } = req.body;
    
    if (!truckId || !position) {
      return res.status(400).json({
        success: false,
        error: 'truckId and position are required',
        timestamp: new Date()
      });
    }

    await streamingIntegration.simulateCameraFailure(truckId, position);

    res.json({
      success: true,
      message: `Camera failure simulated for truck ${truckId}, position ${position}`,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date()
    });
  }
});

/**
 * POST /api/mock/streaming/simulate/camera-recovery
 * Simulate camera recovery for testing
 */
router.post('/streaming/simulate/camera-recovery', async (req, res) => {
  try {
    const { truckId, position } = req.body;
    
    if (!truckId || !position) {
      return res.status(400).json({
        success: false,
        error: 'truckId and position are required',
        timestamp: new Date()
      });
    }

    await streamingIntegration.simulateCameraRecovery(truckId, position);

    res.json({
      success: true,
      message: `Camera recovery simulated for truck ${truckId}, position ${position}`,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date()
    });
  }
});

/**
 * GET /api/mock/info
 * Get information about available mock data generators
 */
router.get('/info', (req, res) => {
  res.json({
    success: true,
    info: {
      description: 'Mock Data and Simulation API for AsphaltTracker Platform',
      version: '1.0.0',
      capabilities: [
        'Generate 100 trucks with full vendor assignments',
        'Create 400+ cameras with realistic configurations',
        'Generate AI incidents and driver behavior data',
        'Simulate real-time GPS tracking and movement',
        'Create fraud alerts and compliance violations',
        'Generate comprehensive analytics and KPI data',
        'Real-time simulation with configurable parameters',
        'Streaming integration with mock video feeds',
        'Camera failure and recovery simulation'
      ],
      endpoints: {
        status: 'GET /api/mock/status - Get system status',
        populate: 'POST /api/mock/populate - Populate database with full data',
        quickPopulate: 'POST /api/mock/populate/quick - Quick setup with minimal data',
        startSimulation: 'POST /api/mock/simulation/start - Start real-time simulation',
        stopSimulation: 'POST /api/mock/simulation/stop - Stop simulation',
        simulationStatus: 'GET /api/mock/simulation/status - Get simulation status',
        updateConfig: 'PUT /api/mock/simulation/config - Update simulation settings',
        startStreaming: 'POST /api/mock/streaming/start - Start streaming integration',
        stopStreaming: 'POST /api/mock/streaming/stop - Stop streaming integration',
        streamingStatus: 'GET /api/mock/streaming/status - Get streaming status',
        truckStreaming: 'GET /api/mock/streaming/truck/:truckId - Get truck streaming status',
        simulateFailure: 'POST /api/mock/streaming/simulate/camera-failure - Simulate camera failure',
        simulateRecovery: 'POST /api/mock/streaming/simulate/camera-recovery - Simulate camera recovery',
        reset: 'DELETE /api/mock/reset - Reset all data',
        preview: 'GET /api/mock/generate/preview - Preview generated data',
        testAll: 'POST /api/mock/test/all-systems - Comprehensive system test',
        health: 'GET /api/mock/health - Health check',
        info: 'GET /api/mock/info - This information'
      },
      dataTypes: [
        'vendors', 'drivers', 'trucks', 'cameras', 'geofences',
        'shipments', 'trips', 'aiIncidents', 'driverScores',
        'fraudAlerts', 'gpsPoints', 'geofenceEvents', 'systemAlerts',
        'systemHealth', 'apiLogs', 'streamingData'
      ]
    },
    timestamp: new Date()
  });
});

export default router;