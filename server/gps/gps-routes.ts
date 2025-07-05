// GPS Tracking and Geo-fencing API Routes
// REST API endpoints for GPS data and geofence management

import express from 'express';
import { gpsManager } from './gps-manager';
import { storage } from '../storage';
import type { LiveGpsData, GeofenceViolation } from './gps-manager';
import { insertGeofenceSchema } from '@shared/schema';
import { ZodError } from 'zod';

const router = express.Router();

/**
 * GET /api/gps/status
 * Get GPS system status and metrics
 */
router.get('/status', async (req, res) => {
  try {
    const metrics = gpsManager.getGpsMetrics();
    const livePositions = gpsManager.getAllCurrentPositions();
    
    res.json({
      success: true,
      system: {
        status: 'operational',
        lastUpdate: new Date()
      },
      metrics,
      activeTrucks: livePositions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/gps/positions
 * Get all current truck positions
 */
router.get('/positions', async (req, res) => {
  try {
    const positions = gpsManager.getAllCurrentPositions();
    
    res.json({
      success: true,
      positions,
      count: positions.length,
      lastUpdate: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/gps/positions/:truckId
 * Get current position for a specific truck
 */
router.get('/positions/:truckId', async (req, res) => {
  try {
    const truckId = parseInt(req.params.truckId);
    const position = gpsManager.getCurrentPosition(truckId);
    
    if (!position) {
      return res.status(404).json({
        success: false,
        error: `No GPS data found for truck ${truckId}`
      });
    }

    res.json({
      success: true,
      position
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/gps/positions
 * Submit GPS data for a truck
 */
router.post('/positions', async (req, res) => {
  try {
    const gpsData: LiveGpsData = req.body;
    
    // Validate required fields
    if (!gpsData.truckId || gpsData.latitude === undefined || gpsData.longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: truckId, latitude, longitude'
      });
    }

    // Set timestamp if not provided
    if (!gpsData.timestamp) {
      gpsData.timestamp = new Date();
    }

    await gpsManager.processGpsData(gpsData);
    
    res.json({
      success: true,
      message: 'GPS data processed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/gps/history/:truckId
 * Get GPS history for a truck
 */
router.get('/history/:truckId', async (req, res) => {
  try {
    const truckId = parseInt(req.params.truckId);
    const hours = parseInt(req.query.hours as string) || 24;
    
    const history = await gpsManager.getTruckHistory(truckId, hours);
    
    res.json({
      success: true,
      history,
      count: history.length,
      truckId,
      period: `${hours} hours`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/gps/simulation/start
 * Start GPS simulation
 */
router.post('/simulation/start', async (req, res) => {
  try {
    await gpsManager.startSimulation();
    
    res.json({
      success: true,
      message: 'GPS simulation started'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/gps/simulation/stop
 * Stop GPS simulation
 */
router.post('/simulation/stop', async (req, res) => {
  try {
    gpsManager.stopSimulation();
    
    res.json({
      success: true,
      message: 'GPS simulation stopped'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/gps/geofences
 * Get all geofences
 */
router.get('/geofences', async (req, res) => {
  try {
    const geofences = await storage.getAllGeofences();
    
    res.json({
      success: true,
      geofences,
      count: geofences.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/gps/geofences
 * Create a new geofence
 */
router.post('/geofences', async (req, res) => {
  try {
    const validatedData = insertGeofenceSchema.parse(req.body);
    await gpsManager.createGeofence(validatedData);
    
    res.status(201).json({
      success: true,
      message: 'Geofence created successfully'
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/gps/geofences/:id
 * Update a geofence
 */
router.put('/geofences/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await gpsManager.updateGeofence(id, req.body);
    
    res.json({
      success: true,
      message: 'Geofence updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/gps/geofences/:id
 * Delete a geofence
 */
router.delete('/geofences/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await gpsManager.deleteGeofence(id);
    
    res.json({
      success: true,
      message: 'Geofence deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/gps/geofences/:id/events
 * Get geofence events for a specific geofence
 */
router.get('/geofences/:id/events', async (req, res) => {
  try {
    const geofenceId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit as string) || 100;
    
    const events = await storage.getGeofenceEventsByGeofence(geofenceId, limit);
    
    res.json({
      success: true,
      events,
      count: events.length,
      geofenceId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/gps/trucks/:truckId/events
 * Get geofence events for a specific truck
 */
router.get('/trucks/:truckId/events', async (req, res) => {
  try {
    const truckId = parseInt(req.params.truckId);
    const limit = parseInt(req.query.limit as string) || 100;
    
    const events = await storage.getGeofenceEventsByTruck(truckId, limit);
    
    res.json({
      success: true,
      events,
      count: events.length,
      truckId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/gps/violations
 * Get recent geofence violations
 */
router.get('/violations', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const severity = req.query.severity as string;
    
    // This would typically query recent violations from database
    // For now, we'll return an empty array as violations are emitted in real-time
    const violations: GeofenceViolation[] = [];
    
    res.json({
      success: true,
      violations,
      count: violations.length,
      filters: { limit, severity }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/gps/analytics/coverage
 * Get GPS coverage analytics
 */
router.get('/analytics/coverage', async (req, res) => {
  try {
    const metrics = gpsManager.getGpsMetrics();
    
    res.json({
      success: true,
      coverage: metrics.coverage,
      averageAccuracy: metrics.averageAccuracy,
      activeTrucks: metrics.activeTrucks,
      lastUpdate: metrics.lastUpdate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/gps/analytics/routes
 * Get route analytics for trucks
 */
router.get('/analytics/routes', async (req, res) => {
  try {
    const truckId = req.query.truckId ? parseInt(req.query.truckId as string) : undefined;
    const hours = parseInt(req.query.hours as string) || 24;
    
    let routeData;
    
    if (truckId) {
      routeData = await gpsManager.getTruckHistory(truckId, hours);
    } else {
      // Get route data for all trucks
      const positions = gpsManager.getAllCurrentPositions();
      routeData = positions;
    }
    
    res.json({
      success: true,
      routes: routeData,
      count: routeData.length,
      period: `${hours} hours`,
      truckId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/gps/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const metrics = gpsManager.getGpsMetrics();
    const isHealthy = metrics.activeTrucks > 0 && metrics.averageAccuracy < 50;
    
    res.status(isHealthy ? 200 : 503).json({
      success: true,
      healthy: isHealthy,
      metrics: {
        activeTrucks: metrics.activeTrucks,
        averageAccuracy: metrics.averageAccuracy,
        lastUpdate: metrics.lastUpdate
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      healthy: false,
      error: error.message,
      timestamp: new Date()
    });
  }
});

export default router;