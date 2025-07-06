// GPS Tracking and Geo-fencing Manager
// Real-time GPS data processing with geo-fence monitoring

import { EventEmitter } from 'events';
import { storage } from '../storage';
import type { 
  GpsPoint, InsertGpsPoint, GeofenceEvent, InsertGeofenceEvent, 
  Geofence, Truck, Driver 
} from '@shared/schema';

export interface LiveGpsData {
  truckId: number;
  driverId?: number;
  latitude: number;
  longitude: number;
  altitude?: number;
  speed: number;
  heading: number;
  accuracy: number;
  timestamp: Date;
  satelliteCount?: number;
  hdop?: number; // Horizontal Dilution of Precision
}

export interface GeofenceViolation {
  truckId: number;
  driverId?: number;
  geofenceId: number;
  geofenceName: string;
  violationType: 'entry' | 'exit' | 'speed_limit' | 'unauthorized_area';
  location: { lat: number; lng: number };
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface GpsMetrics {
  activeTrucks: number;
  totalGpsPoints: number;
  averageAccuracy: number;
  geofenceViolations: number;
  lastUpdate: Date;
  coverage: {
    excellent: number; // < 5m accuracy
    good: number;      // 5-15m accuracy
    fair: number;      // 15-30m accuracy
    poor: number;      // > 30m accuracy
  };
}

export class GpsManager extends EventEmitter {
  private livePositions: Map<number, LiveGpsData> = new Map();
  private activeGeofences: Map<number, Geofence> = new Map();
  private truckGeofenceStates: Map<number, Set<number>> = new Map(); // truck -> geofences inside
  private simulationTimer?: NodeJS.Timeout;
  private updateInterval: number = 5000; // 5 seconds
  private isSimulating: boolean = false;

  constructor() {
    super();
    this.loadGeofences();
  }

  /**
   * Start GPS simulation for all trucks
   */
  async startSimulation(): Promise<void> {
    if (this.isSimulating) return;

    this.isSimulating = true;
    console.log('Starting GPS simulation...');

    // Initialize positions for all trucks
    await this.initializeTruckPositions();

    // Start simulation timer
    this.simulationTimer = setInterval(() => {
      this.updateAllPositions();
    }, this.updateInterval);

    this.emit('simulationStarted');
  }

  /**
   * Stop GPS simulation
   */
  stopSimulation(): void {
    if (!this.isSimulating) return;

    this.isSimulating = false;
    console.log('Stopping GPS simulation...');

    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = undefined;
    }

    this.emit('simulationStopped');
  }

  /**
   * Process real-time GPS data
   */
  async processGpsData(gpsData: LiveGpsData): Promise<void> {
    try {
      // Store in live positions
      this.livePositions.set(gpsData.truckId, gpsData);

      // Save to database
      const gpsPoint: InsertGpsPoint = {
        truckId: gpsData.truckId,
        driverId: gpsData.driverId,
        latitude: gpsData.latitude,
        longitude: gpsData.longitude,
        altitude: gpsData.altitude,
        speed: gpsData.speed,
        heading: gpsData.heading,
        accuracy: gpsData.accuracy,
        timestamp: gpsData.timestamp,
        satelliteCount: gpsData.satelliteCount,
        hdop: gpsData.hdop
      };

      await storage.createGpsPoint(gpsPoint);

      // Check geofence violations
      await this.checkGeofenceViolations(gpsData);

      // Emit position update
      this.emit('positionUpdate', gpsData);

    } catch (error) {
      console.error('Error processing GPS data:', error);
      this.emit('error', { truckId: gpsData.truckId, error: error.message });
    }
  }

  /**
   * Get current position for a truck
   */
  getCurrentPosition(truckId: number): LiveGpsData | null {
    return this.livePositions.get(truckId) || null;
  }

  /**
   * Get all current positions
   */
  getAllCurrentPositions(): LiveGpsData[] {
    return Array.from(this.livePositions.values());
  }

  /**
   * Check geofence violations for GPS data
   */
  private async checkGeofenceViolations(gpsData: LiveGpsData): Promise<void> {
    const currentGeofences = this.truckGeofenceStates.get(gpsData.truckId) || new Set();
    const newGeofences = new Set<number>();

    // Check each active geofence
    for (const [geofenceId, geofence] of this.activeGeofences.entries()) {
      const isInside = this.isPointInsideGeofence(
        { lat: gpsData.latitude, lng: gpsData.longitude },
        geofence
      );

      if (isInside) {
        newGeofences.add(geofenceId);

        // Check for entry violation
        if (!currentGeofences.has(geofenceId)) {
          await this.handleGeofenceViolation(gpsData, geofence, 'entry');
        }

        // Check for speed limit violations
        if (geofence.maxSpeed && gpsData.speed > geofence.maxSpeed) {
          await this.handleGeofenceViolation(gpsData, geofence, 'speed_limit');
        }

        // Check for unauthorized area
        if (!geofence.authorized) {
          await this.handleGeofenceViolation(gpsData, geofence, 'unauthorized_area');
        }
      } else if (currentGeofences.has(geofenceId)) {
        // Exit violation
        await this.handleGeofenceViolation(gpsData, geofence, 'exit');
      }
    }

    // Update truck geofence state
    this.truckGeofenceStates.set(gpsData.truckId, newGeofences);
  }

  /**
   * Handle geofence violation
   */
  private async handleGeofenceViolation(
    gpsData: LiveGpsData, 
    geofence: Geofence, 
    violationType: GeofenceViolation['violationType']
  ): Promise<void> {
    const violation: GeofenceViolation = {
      truckId: gpsData.truckId,
      driverId: gpsData.driverId,
      geofenceId: geofence.id,
      geofenceName: geofence.name,
      violationType,
      location: { lat: gpsData.latitude, lng: gpsData.longitude },
      timestamp: gpsData.timestamp,
      severity: this.calculateViolationSeverity(violationType, geofence),
      description: this.generateViolationDescription(violationType, geofence, gpsData)
    };

    // Save geofence event
    const geofenceEvent: InsertGeofenceEvent = {
      truckId: gpsData.truckId,
      driverId: gpsData.driverId,
      geofenceId: geofence.id,
      eventType: violationType,
      latitude: gpsData.latitude,
      longitude: gpsData.longitude,
      speed: gpsData.speed,
      timestamp: gpsData.timestamp,
      authorized: geofence.authorized || false
    };

    await storage.createGeofenceEvent(geofenceEvent);

    // Emit violation event
    this.emit('geofenceViolation', violation);

    console.log(`Geofence violation: Truck ${gpsData.truckId} ${violationType} ${geofence.name}`);
  }

  /**
   * Calculate violation severity
   */
  private calculateViolationSeverity(
    violationType: GeofenceViolation['violationType'], 
    geofence: Geofence
  ): GeofenceViolation['severity'] {
    switch (violationType) {
      case 'unauthorized_area':
        return 'critical';
      case 'speed_limit':
        return 'high';
      case 'exit':
        return geofence.type === 'restricted' ? 'medium' : 'low';
      case 'entry':
        return geofence.authorized ? 'low' : 'high';
      default:
        return 'medium';
    }
  }

  /**
   * Generate violation description
   */
  private generateViolationDescription(
    violationType: GeofenceViolation['violationType'],
    geofence: Geofence,
    gpsData: LiveGpsData
  ): string {
    const truckInfo = `Truck ${gpsData.truckId}`;
    const location = `${geofence.name}`;
    const time = gpsData.timestamp.toLocaleString();

    switch (violationType) {
      case 'entry':
        return `${truckInfo} entered ${location} at ${time}`;
      case 'exit':
        return `${truckInfo} exited ${location} at ${time}`;
      case 'speed_limit':
        return `${truckInfo} exceeded speed limit (${gpsData.speed.toFixed(1)} mph) in ${location} at ${time}`;
      case 'unauthorized_area':
        return `${truckInfo} entered unauthorized area ${location} at ${time}`;
      default:
        return `${truckInfo} geofence event in ${location} at ${time}`;
    }
  }

  /**
   * Check if point is inside geofence
   */
  private isPointInsideGeofence(point: { lat: number; lng: number }, geofence: Geofence): boolean {
    if (geofence.type === 'circle') {
      // Parse center coordinates
      const center = JSON.parse(geofence.coordinates);
      const radius = geofence.radius || 1000; // Default 1km

      const distance = this.calculateDistance(point, center);
      return distance <= radius;
    } else if (geofence.type === 'polygon') {
      // Parse polygon coordinates
      const polygon = JSON.parse(geofence.coordinates);
      return this.isPointInPolygon(point, polygon);
    }

    return false;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Check if point is inside polygon
   */
  private isPointInPolygon(point: { lat: number; lng: number }, polygon: { lat: number; lng: number }[]): boolean {
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (((polygon[i].lat > point.lat) !== (polygon[j].lat > point.lat)) &&
          (point.lng < (polygon[j].lng - polygon[i].lng) * (point.lat - polygon[i].lat) / (polygon[j].lat - polygon[i].lat) + polygon[i].lng)) {
        inside = !inside;
      }
    }
    
    return inside;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Load active geofences
   */
  private async loadGeofences(): Promise<void> {
    try {
      const geofences = await storage.getAllGeofences();
      this.activeGeofences.clear();
      
      geofences.forEach(geofence => {
        if (geofence.active) {
          this.activeGeofences.set(geofence.id, geofence);
        }
      });

      console.log(`Loaded ${this.activeGeofences.size} active geofences`);
    } catch (error) {
      console.error('Error loading geofences:', error);
    }
  }

  /**
   * Initialize truck positions for simulation
   */
  private async initializeTruckPositions(): Promise<void> {
    try {
      const trucks = await storage.getAllTrucks();
      
      for (const truck of trucks) {
        if (truck.status === 'active' || truck.status === 'online') {
          // Generate random position in New York area for simulation
          const baseLocation = { lat: 40.7128, lng: -74.0060 };
          const randomOffset = {
            lat: (Math.random() - 0.5) * 0.1, // ~5.5 km range
            lng: (Math.random() - 0.5) * 0.1
          };

          const gpsData: LiveGpsData = {
            truckId: truck.id,
            driverId: await this.getAssignedDriver(truck.id),
            latitude: baseLocation.lat + randomOffset.lat,
            longitude: baseLocation.lng + randomOffset.lng,
            altitude: 50 + Math.random() * 100,
            speed: Math.random() * 60, // 0-60 mph
            heading: Math.random() * 360,
            accuracy: 3 + Math.random() * 10, // 3-13 meters
            timestamp: new Date(),
            satelliteCount: 8 + Math.floor(Math.random() * 5), // 8-12 satellites
            hdop: 0.8 + Math.random() * 1.2 // 0.8-2.0 HDOP
          };

          await this.processGpsData(gpsData);
        }
      }
    } catch (error) {
      console.error('Error initializing truck positions:', error);
    }
  }

  /**
   * Update all truck positions (simulation)
   */
  private async updateAllPositions(): Promise<void> {
    const updates: Promise<void>[] = [];

    for (const [truckId, currentPos] of this.livePositions.entries()) {
      const newPosition = this.simulateMovement(currentPos);
      updates.push(this.processGpsData(newPosition));
    }

    await Promise.all(updates);
  }

  /**
   * Simulate truck movement
   */
  private simulateMovement(currentPos: LiveGpsData): LiveGpsData {
    // Simulate realistic truck movement
    const speedChange = (Math.random() - 0.5) * 10; // ±5 mph change
    const headingChange = (Math.random() - 0.5) * 30; // ±15 degree change
    
    const newSpeed = Math.max(0, Math.min(70, currentPos.speed + speedChange));
    const newHeading = (currentPos.heading + headingChange + 360) % 360;
    
    // Calculate new position based on speed and heading
    const distanceKm = (newSpeed * 1.60934) * (this.updateInterval / 1000 / 3600); // km moved
    const deltaLat = (distanceKm / 111.32) * Math.cos(this.toRadians(newHeading - 90));
    const deltaLng = (distanceKm / (111.32 * Math.cos(this.toRadians(currentPos.latitude)))) * Math.sin(this.toRadians(newHeading - 90));

    return {
      ...currentPos,
      latitude: currentPos.latitude + deltaLat,
      longitude: currentPos.longitude + deltaLng,
      speed: newSpeed,
      heading: newHeading,
      accuracy: 3 + Math.random() * 10,
      timestamp: new Date(),
      satelliteCount: Math.max(4, currentPos.satelliteCount + Math.floor((Math.random() - 0.5) * 3)),
      hdop: Math.max(0.5, Math.min(5.0, (currentPos.hdop || 1.0) + (Math.random() - 0.5) * 0.5))
    };
  }

  /**
   * Get assigned driver for truck
   */
  private async getAssignedDriver(truckId: number): Promise<number | undefined> {
    try {
      // This would typically query current trips or assignments
      const drivers = await storage.getAllDrivers();
      const activeDrivers = drivers.filter(d => d.status === 'active');
      
      if (activeDrivers.length > 0) {
        const randomIndex = Math.floor(Math.random() * activeDrivers.length);
        return activeDrivers[randomIndex].id;
      }
    } catch (error) {
      console.error('Error getting assigned driver:', error);
    }
    
    return undefined;
  }

  /**
   * Get GPS metrics
   */
  getGpsMetrics(): GpsMetrics {
    const positions = Array.from(this.livePositions.values());
    
    const coverage = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0
    };

    positions.forEach(pos => {
      if (pos.accuracy < 5) coverage.excellent++;
      else if (pos.accuracy < 15) coverage.good++;
      else if (pos.accuracy < 30) coverage.fair++;
      else coverage.poor++;
    });

    const averageAccuracy = positions.length > 0 
      ? positions.reduce((sum, pos) => sum + pos.accuracy, 0) / positions.length 
      : 0;

    return {
      activeTrucks: positions.length,
      totalGpsPoints: positions.length, // Would be cumulative in real implementation
      averageAccuracy,
      geofenceViolations: 0, // Would track violations count
      lastUpdate: new Date(),
      coverage
    };
  }

  /**
   * Create a new geofence
   */
  async createGeofence(geofence: Omit<Geofence, 'id' | 'createdAt'>): Promise<void> {
    try {
      const newGeofence = await storage.createGeofence(geofence);
      
      if (newGeofence.active) {
        this.activeGeofences.set(newGeofence.id, newGeofence);
      }
      
      this.emit('geofenceCreated', newGeofence);
    } catch (error) {
      console.error('Error creating geofence:', error);
      throw error;
    }
  }

  /**
   * Update geofence
   */
  async updateGeofence(id: number, updates: Partial<Geofence>): Promise<void> {
    try {
      const updatedGeofence = await storage.updateGeofence(id, updates);
      
      if (updatedGeofence) {
        if (updatedGeofence.active) {
          this.activeGeofences.set(id, updatedGeofence);
        } else {
          this.activeGeofences.delete(id);
        }
        
        this.emit('geofenceUpdated', updatedGeofence);
      }
    } catch (error) {
      console.error('Error updating geofence:', error);
      throw error;
    }
  }

  /**
   * Delete geofence
   */
  async deleteGeofence(id: number): Promise<void> {
    try {
      await storage.deleteGeofence(id);
      this.activeGeofences.delete(id);
      
      this.emit('geofenceDeleted', { id });
    } catch (error) {
      console.error('Error deleting geofence:', error);
      throw error;
    }
  }

  /**
   * Get truck history for a time period
   */
  async getTruckHistory(truckId: number, hours: number = 24): Promise<GpsPoint[]> {
    try {
      return await storage.getGpsPoints(truckId, hours);
    } catch (error) {
      console.error('Error getting truck history:', error);
      return [];
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.stopSimulation();
    this.livePositions.clear();
    this.activeGeofences.clear();
    this.truckGeofenceStates.clear();
    this.removeAllListeners();
  }
}

// Global GPS manager instance
export const gpsManager = new GpsManager();