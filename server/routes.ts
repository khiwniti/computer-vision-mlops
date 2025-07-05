import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import videoRoutes from "./vss-integration/video-routes.js";
import { 
  insertTruckSchema, insertDriverSchema, insertVendorSchema, 
  insertCameraSchema, insertGeofenceSchema, insertAlertSchema, insertTripSchema 
} from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store WebSocket connections
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected to WebSocket');
    
    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected from WebSocket');
    });
  });

  // Broadcast function for real-time updates
  const broadcast = (data: any) => {
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Error handling middleware for validation
  const handleValidationError = (error: unknown) => {
    if (error instanceof ZodError) {
      return {
        message: 'Validation error',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return { message: 'Invalid data provided' };
  };

  // Async route wrapper for error handling
  const asyncRoute = (fn: Function) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  // Validate numeric ID parameter
  const validateId = (id: string) => {
    const numId = parseInt(id);
    if (isNaN(numId) || numId <= 0) {
      throw new Error('Invalid ID parameter');
    }
    return numId;
  };

  // Truck routes
  app.get('/api/trucks', async (req, res) => {
    try {
      const trucks = await storage.getAllTrucks();
      res.json(trucks);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch trucks' });
    }
  });

  app.get('/api/trucks/:id', asyncRoute(async (req: any, res: any) => {
    try {
      const id = validateId(req.params.id);
      const truck = await storage.getTruck(id);
      if (!truck) {
        return res.status(404).json({ message: 'Truck not found' });
      }
      res.json(truck);
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid ID parameter') {
        return res.status(400).json({ message: 'Invalid truck ID' });
      }
      console.error('Error fetching truck:', error);
      res.status(500).json({ message: 'Failed to fetch truck' });
    }
  }));

  app.post('/api/trucks', asyncRoute(async (req: any, res: any) => {
    try {
      const validatedData = insertTruckSchema.parse(req.body);
      const truck = await storage.createTruck(validatedData);
      broadcast({ type: 'truck_created', data: truck });
      res.status(201).json(truck);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json(handleValidationError(error));
      }
      console.error('Error creating truck:', error);
      res.status(500).json({ message: 'Failed to create truck' });
    }
  }));

  app.patch('/api/trucks/:id', async (req, res) => {
    try {
      const truck = await storage.updateTruck(parseInt(req.params.id), req.body);
      if (!truck) {
        return res.status(404).json({ message: 'Truck not found' });
      }
      broadcast({ type: 'truck_updated', data: truck });
      res.json(truck);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update truck' });
    }
  });

  app.delete('/api/trucks/:id', async (req, res) => {
    try {
      const success = await storage.deleteTruck(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: 'Truck not found' });
      }
      broadcast({ type: 'truck_deleted', data: { id: parseInt(req.params.id) } });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete truck' });
    }
  });

  // Driver routes
  app.get('/api/drivers', async (req, res) => {
    try {
      const drivers = await storage.getAllDrivers();
      res.json(drivers);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch drivers' });
    }
  });

  app.post('/api/drivers', async (req, res) => {
    try {
      const validatedData = insertDriverSchema.parse(req.body);
      const driver = await storage.createDriver(validatedData);
      res.status(201).json(driver);
    } catch (error) {
      res.status(400).json({ message: 'Invalid driver data' });
    }
  });

  app.patch('/api/drivers/:id', async (req, res) => {
    try {
      const driver = await storage.updateDriver(parseInt(req.params.id), req.body);
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }
      res.json(driver);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update driver' });
    }
  });

  // Vendor routes
  app.get('/api/vendors', async (req, res) => {
    try {
      const vendors = await storage.getAllVendors();
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch vendors' });
    }
  });

  app.post('/api/vendors', async (req, res) => {
    try {
      const validatedData = insertVendorSchema.parse(req.body);
      const vendor = await storage.createVendor(validatedData);
      res.status(201).json(vendor);
    } catch (error) {
      res.status(400).json({ message: 'Invalid vendor data' });
    }
  });

  // Camera routes
  app.get('/api/trucks/:truckId/cameras', async (req, res) => {
    try {
      const cameras = await storage.getCamerasByTruck(parseInt(req.params.truckId));
      res.json(cameras);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch cameras' });
    }
  });

  app.post('/api/cameras', async (req, res) => {
    try {
      const validatedData = insertCameraSchema.parse(req.body);
      const camera = await storage.createCamera(validatedData);
      res.status(201).json(camera);
    } catch (error) {
      res.status(400).json({ message: 'Invalid camera data' });
    }
  });

  // Geofence routes
  app.get('/api/geofences', async (req, res) => {
    try {
      const geofences = await storage.getAllGeofences();
      res.json(geofences);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch geofences' });
    }
  });

  app.post('/api/geofences', async (req, res) => {
    try {
      const validatedData = insertGeofenceSchema.parse(req.body);
      const geofence = await storage.createGeofence(validatedData);
      res.status(201).json(geofence);
    } catch (error) {
      res.status(400).json({ message: 'Invalid geofence data' });
    }
  });

  // Alert routes
  app.get('/api/alerts', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const alerts = await storage.getRecentAlerts(limit);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch alerts' });
    }
  });

  app.post('/api/alerts', async (req, res) => {
    try {
      const validatedData = insertAlertSchema.parse(req.body);
      const alert = await storage.createAlert(validatedData);
      broadcast({ type: 'alert_created', data: alert });
      res.status(201).json(alert);
    } catch (error) {
      res.status(400).json({ message: 'Invalid alert data' });
    }
  });

  app.patch('/api/alerts/:id', async (req, res) => {
    try {
      const alert = await storage.updateAlert(parseInt(req.params.id), req.body);
      if (!alert) {
        return res.status(404).json({ message: 'Alert not found' });
      }
      res.json(alert);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update alert' });
    }
  });

  // Trip routes
  app.get('/api/trips', async (req, res) => {
    try {
      const trips = await storage.getAllTrips();
      res.json(trips);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch trips' });
    }
  });

  app.post('/api/trips', async (req, res) => {
    try {
      const validatedData = insertTripSchema.parse(req.body);
      const trip = await storage.createTrip(validatedData);
      res.status(201).json(trip);
    } catch (error) {
      res.status(400).json({ message: 'Invalid trip data' });
    }
  });

  // Dashboard stats endpoint
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const trucks = await storage.getAllTrucks();
      const drivers = await storage.getAllDrivers();
      const alerts = await storage.getUnacknowledgedAlerts();
      
      const activeTrucks = trucks.filter(truck => truck.status === 'online').length;
      const offlineTrucks = trucks.filter(truck => truck.status === 'offline').length;
      const activeDrivers = drivers.filter(driver => driver.status === 'active').length;
      const todayAlerts = alerts.length;
      
      res.json({
        activeTrucks,
        offlineTrucks,
        activeDrivers,
        todayAlerts
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
  });

  // Video analytics routes
  app.use('/api/video', videoRoutes);

  // Streaming API routes
  const streamRoutes = await import('./streaming-api/stream-routes.js');
  app.use('/api/streams', streamRoutes.default);

  // GPS tracking routes
  const gpsRoutes = await import('./gps/gps-routes.js');
  app.use('/api/gps', gpsRoutes.default);

  // Predictive analytics routes
  const analyticsRoutes = await import('./analytics/analytics-routes.js');
  app.use('/api/analytics', analyticsRoutes.default);

  // Mock data and simulation routes
  const mockRoutes = await import('./mock-data/mock-api-routes.js');
  app.use('/api/mock', mockRoutes.default);

  return httpServer;
}
