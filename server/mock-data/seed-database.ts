// Database Seeding System
// Populates the database with comprehensive mock data for testing all platform functions

import { storage } from '../storage';
import { generateAllMockData } from './comprehensive-mock-generator';
import { generateAllAnalyticsData } from './ai-analytics-generator';
import { simulationEngine } from './simulation-engine';

export interface SeedOptions {
  clearExisting?: boolean;
  includeAnalytics?: boolean;
  includeHistoricalData?: boolean;
  truckCount?: number;
  daysOfHistory?: number;
  startSimulation?: boolean;
}

export interface SeedResult {
  success: boolean;
  message: string;
  data: {
    vendors: number;
    drivers: number;
    trucks: number;
    cameras: number;
    geofences: number;
    shipments: number;
    trips: number;
    aiIncidents?: number;
    driverScores?: number;
    fraudAlerts?: number;
    gpsPoints?: number;
    geofenceEvents?: number;
    systemAlerts?: number;
    systemHealth?: number;
    apiLogs?: number;
  };
  errors: string[];
  duration: number;
}

export class DatabaseSeeder {
  private errors: string[] = [];

  /**
   * Seed the database with comprehensive mock data
   */
  async seedDatabase(options: SeedOptions = {}): Promise<SeedResult> {
    const startTime = Date.now();
    this.errors = [];

    const config = {
      clearExisting: true,
      includeAnalytics: true,
      includeHistoricalData: true,
      truckCount: 100,
      daysOfHistory: 30,
      startSimulation: false,
      ...options
    };

    console.log('Starting database seeding with options:', config);

    try {
      // Clear existing data if requested
      if (config.clearExisting) {
        console.log('Clearing existing data...');
        await this.clearDatabase();
      }

      // Generate core mock data
      console.log('Generating core mock data...');
      const mockData = generateAllMockData();

      // Seed vendors first (foreign key dependencies)
      console.log('Seeding vendors...');
      const vendors = await this.seedVendors(mockData.vendors);

      // Seed drivers
      console.log('Seeding drivers...');
      const drivers = await this.seedDrivers(mockData.drivers);

      // Seed trucks
      console.log('Seeding trucks...');
      const trucks = await this.seedTrucks(mockData.trucks);

      // Seed cameras
      console.log('Seeding cameras...');
      const cameras = await this.seedCameras(mockData.cameras);

      // Seed geofences
      console.log('Seeding geofences...');
      const geofences = await this.seedGeofences(mockData.geofences);

      // Seed shipments
      console.log('Seeding shipments...');
      const shipments = await this.seedShipments(mockData.shipments);

      // Seed trips
      console.log('Seeding trips...');
      const trips = await this.seedTrips(mockData.trips);

      let analyticsData: any = {};
      
      if (config.includeAnalytics) {
        console.log('Generating analytics data...');
        analyticsData = generateAllAnalyticsData();

        // Seed AI incidents
        console.log('Seeding AI incidents...');
        await this.seedAiIncidents(mockData.aiIncidents);

        // Seed driver scores
        console.log('Seeding driver scores...');
        await this.seedDriverScores(mockData.driverScores);

        // Seed fraud alerts
        console.log('Seeding fraud alerts...');
        await this.seedFraudAlerts(analyticsData.fraudAlerts);

        // Seed GPS points
        console.log('Seeding GPS points...');
        await this.seedGpsPoints(analyticsData.gpsPoints);

        // Seed geofence events
        console.log('Seeding geofence events...');
        await this.seedGeofenceEvents(analyticsData.geofenceEvents);

        // Seed system alerts
        console.log('Seeding system alerts...');
        await this.seedSystemAlerts(analyticsData.systemAlerts);

        // Seed system health
        console.log('Seeding system health...');
        await this.seedSystemHealth(analyticsData.systemHealth);

        // Seed API logs
        console.log('Seeding API logs...');
        await this.seedApiLogs(analyticsData.apiLogs);
      }

      // Initialize simulation if requested
      if (config.startSimulation) {
        console.log('Starting real-time simulation...');
        await simulationEngine.initialize();
        simulationEngine.start();
      }

      const duration = Date.now() - startTime;
      console.log(`Database seeding completed in ${duration}ms`);

      return {
        success: true,
        message: 'Database seeded successfully',
        data: {
          vendors: vendors.length,
          drivers: drivers.length,
          trucks: trucks.length,
          cameras: cameras.length,
          geofences: geofences.length,
          shipments: shipments.length,
          trips: trips.length,
          ...(config.includeAnalytics && {
            aiIncidents: mockData.aiIncidents.length,
            driverScores: mockData.driverScores.length,
            fraudAlerts: analyticsData.fraudAlerts?.length || 0,
            gpsPoints: analyticsData.gpsPoints?.length || 0,
            geofenceEvents: analyticsData.geofenceEvents?.length || 0,
            systemAlerts: analyticsData.systemAlerts?.length || 0,
            systemHealth: analyticsData.systemHealth?.length || 0,
            apiLogs: analyticsData.apiLogs?.length || 0
          })
        },
        errors: this.errors,
        duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('Database seeding failed:', error);
      
      return {
        success: false,
        message: `Database seeding failed: ${error.message}`,
        data: {
          vendors: 0,
          drivers: 0,
          trucks: 0,
          cameras: 0,
          geofences: 0,
          shipments: 0,
          trips: 0
        },
        errors: [...this.errors, error.message],
        duration
      };
    }
  }

  /**
   * Clear all data from the database
   */
  private async clearDatabase(): Promise<void> {
    try {
      // Note: In a real implementation, you would run DELETE statements
      // This is a placeholder for the clearing logic
      console.log('Database clearing would happen here...');
      // await storage.clearAllData();
    } catch (error) {
      this.errors.push(`Failed to clear database: ${error.message}`);
      throw error;
    }
  }

  /**
   * Seed vendors
   */
  private async seedVendors(vendors: any[]): Promise<any[]> {
    const seededVendors = [];
    
    for (const vendor of vendors) {
      try {
        const created = await storage.createVendor(vendor);
        seededVendors.push(created);
      } catch (error) {
        this.errors.push(`Failed to seed vendor ${vendor.name}: ${error.message}`);
      }
    }
    
    return seededVendors;
  }

  /**
   * Seed drivers
   */
  private async seedDrivers(drivers: any[]): Promise<any[]> {
    const seededDrivers = [];
    
    for (const driver of drivers) {
      try {
        const created = await storage.createDriver(driver);
        seededDrivers.push(created);
      } catch (error) {
        this.errors.push(`Failed to seed driver ${driver.name}: ${error.message}`);
      }
    }
    
    return seededDrivers;
  }

  /**
   * Seed trucks
   */
  private async seedTrucks(trucks: any[]): Promise<any[]> {
    const seededTrucks = [];
    
    for (const truck of trucks) {
      try {
        const created = await storage.createTruck(truck);
        seededTrucks.push(created);
      } catch (error) {
        this.errors.push(`Failed to seed truck ${truck.truckNumber}: ${error.message}`);
      }
    }
    
    return seededTrucks;
  }

  /**
   * Seed cameras
   */
  private async seedCameras(cameras: any[]): Promise<any[]> {
    const seededCameras = [];
    
    for (const camera of cameras) {
      try {
        const created = await storage.createCamera(camera);
        seededCameras.push(created);
      } catch (error) {
        this.errors.push(`Failed to seed camera for truck ${camera.truckId}: ${error.message}`);
      }
    }
    
    return seededCameras;
  }

  /**
   * Seed geofences
   */
  private async seedGeofences(geofences: any[]): Promise<any[]> {
    const seededGeofences = [];
    
    for (const geofence of geofences) {
      try {
        const created = await storage.createGeofence(geofence);
        seededGeofences.push(created);
      } catch (error) {
        this.errors.push(`Failed to seed geofence ${geofence.name}: ${error.message}`);
      }
    }
    
    return seededGeofences;
  }

  /**
   * Seed shipments
   */
  private async seedShipments(shipments: any[]): Promise<any[]> {
    const seededShipments = [];
    
    for (const shipment of shipments) {
      try {
        const created = await storage.createShipment(shipment);
        seededShipments.push(created);
      } catch (error) {
        this.errors.push(`Failed to seed shipment ${shipment.shipmentNumber}: ${error.message}`);
      }
    }
    
    return seededShipments;
  }

  /**
   * Seed trips
   */
  private async seedTrips(trips: any[]): Promise<any[]> {
    const seededTrips = [];
    
    for (const trip of trips) {
      try {
        const created = await storage.createTrip(trip);
        seededTrips.push(created);
      } catch (error) {
        this.errors.push(`Failed to seed trip for truck ${trip.truckId}: ${error.message}`);
      }
    }
    
    return seededTrips;
  }

  /**
   * Seed AI incidents
   */
  private async seedAiIncidents(incidents: any[]): Promise<void> {
    for (const incident of incidents) {
      try {
        await storage.createAiIncident(incident);
      } catch (error) {
        this.errors.push(`Failed to seed AI incident: ${error.message}`);
      }
    }
  }

  /**
   * Seed driver scores
   */
  private async seedDriverScores(scores: any[]): Promise<void> {
    for (const score of scores) {
      try {
        await storage.createDriverScore(score);
      } catch (error) {
        this.errors.push(`Failed to seed driver score: ${error.message}`);
      }
    }
  }

  /**
   * Seed fraud alerts
   */
  private async seedFraudAlerts(alerts: any[]): Promise<void> {
    for (const alert of alerts) {
      try {
        await storage.createFraudAlert(alert);
      } catch (error) {
        this.errors.push(`Failed to seed fraud alert: ${error.message}`);
      }
    }
  }

  /**
   * Seed GPS points
   */
  private async seedGpsPoints(points: any[]): Promise<void> {
    // Batch process GPS points for better performance
    const batchSize = 100;
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);
      
      try {
        await Promise.all(batch.map(point => storage.createGpsPoint(point)));
      } catch (error) {
        this.errors.push(`Failed to seed GPS points batch ${i}-${i + batchSize}: ${error.message}`);
      }
    }
  }

  /**
   * Seed geofence events
   */
  private async seedGeofenceEvents(events: any[]): Promise<void> {
    for (const event of events) {
      try {
        await storage.createGeofenceEvent(event);
      } catch (error) {
        this.errors.push(`Failed to seed geofence event: ${error.message}`);
      }
    }
  }

  /**
   * Seed system alerts
   */
  private async seedSystemAlerts(alerts: any[]): Promise<void> {
    for (const alert of alerts) {
      try {
        await storage.createAlert(alert);
      } catch (error) {
        this.errors.push(`Failed to seed system alert: ${error.message}`);
      }
    }
  }

  /**
   * Seed system health data
   */
  private async seedSystemHealth(healthData: any[]): Promise<void> {
    // Batch process health data for better performance
    const batchSize = 50;
    for (let i = 0; i < healthData.length; i += batchSize) {
      const batch = healthData.slice(i, i + batchSize);
      
      try {
        await Promise.all(batch.map(health => storage.createSystemHealth(health)));
      } catch (error) {
        this.errors.push(`Failed to seed system health batch ${i}-${i + batchSize}: ${error.message}`);
      }
    }
  }

  /**
   * Seed API logs
   */
  private async seedApiLogs(logs: any[]): Promise<void> {
    // Batch process API logs for better performance
    const batchSize = 100;
    for (let i = 0; i < logs.length; i += batchSize) {
      const batch = logs.slice(i, i + batchSize);
      
      try {
        await Promise.all(batch.map(log => storage.createApiLog(log)));
      } catch (error) {
        this.errors.push(`Failed to seed API logs batch ${i}-${i + batchSize}: ${error.message}`);
      }
    }
  }

  /**
   * Get seeding status
   */
  async getSeedingStatus(): Promise<{
    hasData: boolean;
    counts: Record<string, number>;
    lastSeeded?: Date;
  }> {
    try {
      const [trucks, drivers, vendors, cameras] = await Promise.all([
        storage.getAllTrucks(),
        storage.getAllDrivers(),
        storage.getAllVendors(),
        storage.getCamerasByTruck(1) // Sample check
      ]);

      return {
        hasData: trucks.length > 0,
        counts: {
          trucks: trucks.length,
          drivers: drivers.length,
          vendors: vendors.length,
          cameras: cameras.length
        },
        lastSeeded: trucks.length > 0 ? new Date() : undefined
      };
    } catch (error) {
      console.error('Failed to get seeding status:', error);
      return {
        hasData: false,
        counts: {}
      };
    }
  }
}

// Global seeder instance
export const databaseSeeder = new DatabaseSeeder();

// Convenience functions
export async function seedDatabase(options: SeedOptions = {}): Promise<SeedResult> {
  return databaseSeeder.seedDatabase(options);
}

export async function seedWithDefaults(): Promise<SeedResult> {
  return databaseSeeder.seedDatabase({
    clearExisting: true,
    includeAnalytics: true,
    includeHistoricalData: true,
    truckCount: 100,
    daysOfHistory: 30,
    startSimulation: false
  });
}

export async function seedAndStartSimulation(): Promise<SeedResult> {
  return databaseSeeder.seedDatabase({
    clearExisting: true,
    includeAnalytics: true,
    includeHistoricalData: true,
    truckCount: 100,
    daysOfHistory: 30,
    startSimulation: true
  });
}

export default databaseSeeder;