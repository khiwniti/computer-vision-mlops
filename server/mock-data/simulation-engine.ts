// Real-time Simulation Engine
// Simulates live truck movements, status changes, and AI incidents for testing

import { EventEmitter } from 'events';
import { storage } from '../storage';
import type {
  Truck, Driver, InsertGpsPoint, InsertAiIncident, InsertDriverScore,
  InsertFraudAlert, InsertGeofenceEvent, InsertAlert
} from '@shared/schema';

interface SimulationConfig {
  truckCount: number;
  updateIntervalMs: number;
  incidentProbability: number;
  fraudProbability: number;
  statusChangeProbability: number;
  gpsUpdateEnabled: boolean;
  aiIncidentsEnabled: boolean;
  fraudDetectionEnabled: boolean;
}

interface TruckSimulation {
  truck: Truck;
  driver: Driver;
  currentRoute: RoutePoint[];
  routeIndex: number;
  lastUpdate: Date;
  isActive: boolean;
  targetSpeed: number;
  currentSpeed: number;
  heading: number;
  fuelLevel: number;
  engineStatus: 'on' | 'off' | 'idle';
}

interface RoutePoint {
  lat: number;
  lng: number;
  speed: number;
  address: string;
}

export class SimulationEngine extends EventEmitter {
  private config: SimulationConfig;
  private simulations: Map<number, TruckSimulation> = new Map();
  private timer?: NodeJS.Timeout;
  private isRunning: boolean = false;
  private routes: RoutePoint[][] = [];

  constructor(config: Partial<SimulationConfig> = {}) {
    super();
    this.config = {
      truckCount: 100,
      updateIntervalMs: 30000, // 30 seconds
      incidentProbability: 0.001, // 0.1% per update
      fraudProbability: 0.0005, // 0.05% per update
      statusChangeProbability: 0.002, // 0.2% per update
      gpsUpdateEnabled: true,
      aiIncidentsEnabled: true,
      fraudDetectionEnabled: true,
      ...config
    };
    
    this.generateRoutes();
  }

  /**
   * Generate realistic routes for truck simulation
   */
  private generateRoutes(): void {
    const routeTemplates = [
      // Interstate routes
      {
        name: 'I-95 Corridor',
        points: [
          { lat: 40.7128, lng: -74.0060, speed: 65, address: 'New York, NY' },
          { lat: 39.9526, lng: -75.1652, speed: 70, address: 'Philadelphia, PA' },
          { lat: 38.9072, lng: -77.0369, speed: 65, address: 'Washington, DC' },
          { lat: 36.8485, lng: -76.2859, speed: 70, address: 'Norfolk, VA' },
          { lat: 35.7796, lng: -78.6382, speed: 65, address: 'Raleigh, NC' }
        ]
      },
      {
        name: 'I-10 Cross Country',
        points: [
          { lat: 34.0522, lng: -118.2437, speed: 70, address: 'Los Angeles, CA' },
          { lat: 33.4484, lng: -112.0740, speed: 75, address: 'Phoenix, AZ' },
          { lat: 31.7619, lng: -106.4850, speed: 70, address: 'El Paso, TX' },
          { lat: 29.7604, lng: -95.3698, speed: 65, address: 'Houston, TX' },
          { lat: 29.9511, lng: -90.0715, speed: 60, address: 'New Orleans, LA' }
        ]
      },
      {
        name: 'I-40 East-West',
        points: [
          { lat: 35.2271, lng: -80.8431, speed: 70, address: 'Charlotte, NC' },
          { lat: 35.2094, lng: -85.3267, speed: 65, address: 'Chattanooga, TN' },
          { lat: 36.1627, lng: -86.7816, speed: 65, address: 'Nashville, TN' },
          { lat: 35.1495, lng: -90.0490, speed: 70, address: 'Memphis, TN' },
          { lat: 35.4676, lng: -97.5164, speed: 75, address: 'Oklahoma City, OK' }
        ]
      }
    ];

    // Generate routes with variations for each truck
    for (let i = 0; i < this.config.truckCount; i++) {
      const template = routeTemplates[i % routeTemplates.length];
      const route: RoutePoint[] = [];
      
      // Add intermediate points between main stops
      for (let j = 0; j < template.points.length - 1; j++) {
        const start = template.points[j];
        const end = template.points[j + 1];
        
        route.push(start);
        
        // Add 3-5 intermediate points
        const intermediateCount = Math.floor(Math.random() * 3) + 3;
        for (let k = 1; k <= intermediateCount; k++) {
          const progress = k / (intermediateCount + 1);
          route.push({
            lat: start.lat + (end.lat - start.lat) * progress,
            lng: start.lng + (end.lng - start.lng) * progress,
            speed: start.speed + Math.random() * 10 - 5, // Vary speed
            address: `${template.name} Mile ${Math.floor(progress * 100 + j * 100)}`
          });
        }
      }
      
      route.push(template.points[template.points.length - 1]);
      this.routes.push(route);
    }
  }

  /**
   * Initialize simulation with truck and driver data
   */
  async initialize(): Promise<void> {
    try {
      const [trucks, drivers] = await Promise.all([
        storage.getAllTrucks(),
        storage.getAllDrivers()
      ]);

      trucks.forEach((truck, index) => {
        const driver = drivers.find(d => d.id === truck.driverId);
        if (!driver) return;

        const route = this.routes[index % this.routes.length];
        this.simulations.set(truck.id, {
          truck,
          driver,
          currentRoute: route,
          routeIndex: Math.floor(Math.random() * route.length),
          lastUpdate: new Date(),
          isActive: truck.status === 'online',
          targetSpeed: route[0]?.speed || 60,
          currentSpeed: truck.speed || 0,
          heading: truck.heading || 0,
          fuelLevel: Math.random() * 40 + 60, // 60-100%
          engineStatus: truck.status === 'online' ? 'on' : 'off'
        });
      });

      console.log(`Simulation initialized with ${this.simulations.size} trucks`);
      this.emit('initialized', { truckCount: this.simulations.size });
    } catch (error) {
      console.error('Failed to initialize simulation:', error);
      throw error;
    }
  }

  /**
   * Start the simulation
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.timer = setInterval(() => {
      this.updateSimulation();
    }, this.config.updateIntervalMs);
    
    console.log('Simulation started');
    this.emit('started');
  }

  /**
   * Stop the simulation
   */
  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    
    console.log('Simulation stopped');
    this.emit('stopped');
  }

  /**
   * Main simulation update loop
   */
  private async updateSimulation(): Promise<void> {
    const updatePromises: Promise<void>[] = [];
    
    for (const [truckId, simulation] of this.simulations) {
      updatePromises.push(this.updateTruckSimulation(simulation));
    }
    
    try {
      await Promise.all(updatePromises);
      this.emit('updated', { timestamp: new Date(), truckCount: this.simulations.size });
    } catch (error) {
      console.error('Error updating simulation:', error);
    }
  }

  /**
   * Update individual truck simulation
   */
  private async updateTruckSimulation(simulation: TruckSimulation): Promise<void> {
    try {
      // Check for status changes
      await this.updateTruckStatus(simulation);
      
      if (!simulation.isActive) return;

      // Update GPS position
      if (this.config.gpsUpdateEnabled) {
        await this.updateGpsPosition(simulation);
      }

      // Generate AI incidents
      if (this.config.aiIncidentsEnabled && Math.random() < this.config.incidentProbability) {
        await this.generateAiIncident(simulation);
      }

      // Generate fraud alerts
      if (this.config.fraudDetectionEnabled && Math.random() < this.config.fraudProbability) {
        await this.generateFraudAlert(simulation);
      }

      // Update driver scores periodically
      const hoursSinceLastUpdate = (Date.now() - simulation.lastUpdate.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastUpdate >= 1) {
        await this.updateDriverScore(simulation);
      }

      simulation.lastUpdate = new Date();
    } catch (error) {
      console.error(`Error updating truck ${simulation.truck.id}:`, error);
    }
  }

  /**
   * Update truck status (online/offline/maintenance)
   */
  private async updateTruckStatus(simulation: TruckSimulation): Promise<void> {
    if (Math.random() < this.config.statusChangeProbability) {
      const currentStatus = simulation.truck.status;
      let newStatus = currentStatus;
      
      // Status change logic
      if (currentStatus === 'online') {
        newStatus = Math.random() < 0.1 ? 'maintenance' : 
                   Math.random() < 0.05 ? 'offline' : 'online';
      } else if (currentStatus === 'offline') {
        newStatus = Math.random() < 0.7 ? 'online' : 'offline';
      } else if (currentStatus === 'maintenance') {
        newStatus = Math.random() < 0.3 ? 'online' : 'maintenance';
      }
      
      if (newStatus !== currentStatus) {
        simulation.truck.status = newStatus;
        simulation.isActive = newStatus === 'online';
        simulation.engineStatus = newStatus === 'online' ? 'on' : 'off';
        simulation.currentSpeed = newStatus === 'online' ? simulation.targetSpeed : 0;
        
        await storage.updateTruck(simulation.truck.id, { 
          status: newStatus,
          speed: simulation.currentSpeed
        });
        
        this.emit('statusChanged', { 
          truckId: simulation.truck.id, 
          oldStatus: currentStatus, 
          newStatus 
        });
      }
    }
  }

  /**
   * Update GPS position along route
   */
  private async updateGpsPosition(simulation: TruckSimulation): Promise<void> {
    const route = simulation.currentRoute;
    if (route.length === 0) return;

    // Move to next point in route
    simulation.routeIndex = (simulation.routeIndex + 1) % route.length;
    const currentPoint = route[simulation.routeIndex];
    
    // Add some randomness to position
    const lat = currentPoint.lat + (Math.random() - 0.5) * 0.001;
    const lng = currentPoint.lng + (Math.random() - 0.5) * 0.001;
    
    // Update speed and heading
    simulation.targetSpeed = currentPoint.speed + (Math.random() - 0.5) * 10;
    simulation.currentSpeed += (simulation.targetSpeed - simulation.currentSpeed) * 0.3;
    simulation.heading = (simulation.heading + (Math.random() - 0.5) * 30) % 360;
    
    // Update fuel level
    simulation.fuelLevel = Math.max(10, simulation.fuelLevel - Math.random() * 0.5);
    
    // Store GPS point
    const gpsPoint: InsertGpsPoint = {
      truckId: simulation.truck.id,
      driverId: simulation.driver.id,
      latitude: lat,
      longitude: lng,
      altitude: 100 + Math.random() * 500,
      speed: simulation.currentSpeed,
      heading: simulation.heading,
      accuracy: 1 + Math.random() * 3,
      address: currentPoint.address,
      isMoving: simulation.currentSpeed > 5,
      engineStatus: simulation.engineStatus,
      fuelLevel: simulation.fuelLevel,
      odometerReading: Math.random() * 200000 + 50000
    };
    
    await storage.createGpsPoint(gpsPoint);
    
    // Update truck record
    await storage.updateTruck(simulation.truck.id, {
      latitude: lat,
      longitude: lng,
      speed: simulation.currentSpeed,
      heading: simulation.heading,
      location: currentPoint.address
    });
  }

  /**
   * Generate AI incident
   */
  private async generateAiIncident(simulation: TruckSimulation): Promise<void> {
    const incidentTypes = [
      'drowsiness', 'phone_usage', 'seatbelt_violation', 'smoking',
      'harsh_driving', 'distracted_driving', 'aggressive_driving'
    ];
    
    const incidentType = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];
    const severity = Math.random() < 0.1 ? 'critical' :
                    Math.random() < 0.2 ? 'high' :
                    Math.random() < 0.4 ? 'medium' : 'low';
    
    const incident: InsertAiIncident = {
      truckId: simulation.truck.id,
      driverId: simulation.driver.id,
      cameraId: (simulation.truck.id - 1) * 4 + Math.floor(Math.random() * 4) + 1,
      incidentType,
      severity,
      confidence: 0.7 + Math.random() * 0.28,
      description: `${incidentType.replace('_', ' ')} detected during simulation`,
      videoClipUrl: `https://simulation.clips.com/truck${simulation.truck.id}/${Date.now()}.mp4`,
      imageUrl: `https://simulation.clips.com/truck${simulation.truck.id}/${Date.now()}.jpg`,
      metadata: {
        simulation: true,
        route_point: simulation.routeIndex,
        speed: simulation.currentSpeed
      },
      location: {
        lat: simulation.truck.latitude,
        lng: simulation.truck.longitude,
        address: simulation.truck.location
      },
      acknowledged: false,
      falsePositive: false
    };
    
    await storage.createAiIncident(incident);
    this.emit('incidentGenerated', { truckId: simulation.truck.id, incidentType, severity });
  }

  /**
   * Generate fraud alert
   */
  private async generateFraudAlert(simulation: TruckSimulation): Promise<void> {
    const fraudTypes = [
      'route_deviation', 'unauthorized_stop', 'time_manipulation', 'fuel_theft'
    ];
    
    const alertType = fraudTypes[Math.floor(Math.random() * fraudTypes.length)];
    const severity = Math.random() < 0.05 ? 'critical' :
                    Math.random() < 0.15 ? 'high' :
                    Math.random() < 0.3 ? 'medium' : 'low';
    
    const fraudAlert: InsertFraudAlert = {
      truckId: simulation.truck.id,
      driverId: simulation.driver.id,
      alertType,
      severity,
      description: `Simulated ${alertType.replace('_', ' ')} detected`,
      evidenceUrls: [`https://simulation.evidence.com/truck${simulation.truck.id}/${Date.now()}.json`],
      detectedBy: 'ai',
      location: {
        lat: simulation.truck.latitude,
        lng: simulation.truck.longitude,
        address: simulation.truck.location
      },
      duration: Math.floor(Math.random() * 60) + 5,
      estimatedLoss: Math.random() * 1000 + 100,
      status: 'open',
      priority: severity === 'critical' ? 'urgent' : severity,
      metadata: {
        simulation: true,
        confidence: 0.8 + Math.random() * 0.2
      },
      tags: ['simulation', alertType, severity]
    };
    
    await storage.createFraudAlert(fraudAlert);
    this.emit('fraudGenerated', { truckId: simulation.truck.id, alertType, severity });
  }

  /**
   * Update driver score based on recent performance
   */
  private async updateDriverScore(simulation: TruckSimulation): Promise<void> {
    const baseScore = 80 + Math.random() * 15; // 80-95 base range
    const variation = (Math.random() - 0.5) * 10; // ±5 variation
    
    const driverScore: InsertDriverScore = {
      driverId: simulation.driver.id,
      date: new Date(),
      shiftStart: new Date(Date.now() - 8 * 60 * 60 * 1000),
      shiftEnd: new Date(),
      overallScore: Math.max(0, Math.min(100, baseScore + variation)),
      safetyScore: Math.max(0, Math.min(100, baseScore + variation + Math.random() * 5)),
      efficiencyScore: Math.max(0, Math.min(100, baseScore + variation + Math.random() * 5)),
      complianceScore: Math.max(0, Math.min(100, baseScore + variation + Math.random() * 5)),
      drowsinessEvents: Math.floor(Math.random() * 2),
      phoneUsageEvents: Math.floor(Math.random() * 1),
      seatbeltViolations: Math.floor(Math.random() * 1),
      smokingEvents: 0,
      harshBrakingEvents: Math.floor(Math.random() * 3),
      harshAccelerationEvents: Math.floor(Math.random() * 2),
      speedingViolations: Math.floor(Math.random() * 2),
      totalDistance: simulation.currentSpeed * 8, // 8 hour shift estimate
      totalDuration: 480, // 8 hours in minutes
      fuelEfficiency: 6 + Math.random() * 3,
      routeAdherence: 85 + Math.random() * 15,
      onTimeDeliveries: Math.floor(Math.random() * 5) + 3,
      lateDeliveries: Math.floor(Math.random() * 2),
      documentationComplete: Math.random() > 0.1,
      communicationScore: 80 + Math.random() * 20,
      policyViolations: Math.floor(Math.random() * 1),
      milesPerHour: simulation.currentSpeed,
      incidentsPerMile: Math.random() * 0.01
    };
    
    await storage.createDriverScore(driverScore);
  }

  /**
   * Get simulation status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      truckCount: this.simulations.size,
      config: this.config,
      activeTrucks: Array.from(this.simulations.values()).filter(s => s.isActive).length,
      lastUpdate: new Date()
    };
  }

  /**
   * Update simulation configuration
   */
  updateConfig(newConfig: Partial<SimulationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart timer if interval changed
    if (this.isRunning && newConfig.updateIntervalMs) {
      this.stop();
      this.start();
    }
    
    this.emit('configUpdated', this.config);
  }

  /**
   * Cleanup simulation
   */
  cleanup(): void {
    this.stop();
    this.simulations.clear();
    this.removeAllListeners();
  }
}

// Global simulation instance
export const simulationEngine = new SimulationEngine();

export default simulationEngine;