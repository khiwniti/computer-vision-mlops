import {
  users, trucks, drivers, vendors, cameras, geofences, alerts, trips, shipments, shipmentTrucks,
  aiIncidents, driverScores, fraudAlerts, gpsPoints, geofenceEvents, apiLogs, systemHealth, aiModels, reportSchedules,
  type User, type InsertUser, type Truck, type InsertTruck,
  type Driver, type InsertDriver, type Vendor, type InsertVendor,
  type Camera, type InsertCamera, type Geofence, type InsertGeofence,
  type Alert, type InsertAlert, type Trip, type InsertTrip,
  type Shipment, type InsertShipment, type ShipmentTruck, type InsertShipmentTruck,
  type AiIncident, type InsertAiIncident, type DriverScore, type InsertDriverScore,
  type FraudAlert, type InsertFraudAlert, type GpsPoint, type InsertGpsPoint,
  type GeofenceEvent, type InsertGeofenceEvent, type ApiLog, type InsertApiLog,
  type SystemHealth, type InsertSystemHealth, type AiModel, type InsertAiModel,
  type ReportSchedule, type InsertReportSchedule, type DashboardStats
} from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Truck operations
  getAllTrucks(): Promise<Truck[]>;
  getTruck(id: number): Promise<Truck | undefined>;
  createTruck(truck: InsertTruck): Promise<Truck>;
  updateTruck(id: number, truck: Partial<InsertTruck>): Promise<Truck | undefined>;
  deleteTruck(id: number): Promise<boolean>;

  // Driver operations
  getAllDrivers(): Promise<Driver[]>;
  getDriver(id: number): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: number, driver: Partial<InsertDriver>): Promise<Driver | undefined>;
  deleteDriver(id: number): Promise<boolean>;

  // Vendor operations
  getAllVendors(): Promise<Vendor[]>;
  getVendor(id: number): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: number, vendor: Partial<InsertVendor>): Promise<Vendor | undefined>;
  deleteVendor(id: number): Promise<boolean>;

  // Camera operations
  getCamerasByTruck(truckId: number): Promise<Camera[]>;
  createCamera(camera: InsertCamera): Promise<Camera>;
  updateCamera(id: number, camera: Partial<InsertCamera>): Promise<Camera | undefined>;

  // Geofence operations
  getAllGeofences(): Promise<Geofence[]>;
  getGeofence(id: number): Promise<Geofence | undefined>;
  createGeofence(geofence: InsertGeofence): Promise<Geofence>;
  updateGeofence(id: number, geofence: Partial<InsertGeofence>): Promise<Geofence | undefined>;
  deleteGeofence(id: number): Promise<boolean>;

  // Alert operations
  getAllAlerts(): Promise<Alert[]>;
  getRecentAlerts(limit?: number): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: number, alert: Partial<InsertAlert>): Promise<Alert | undefined>;
  getUnacknowledgedAlerts(): Promise<Alert[]>;

  // Trip operations
  getAllTrips(): Promise<Trip[]>;
  getTripsByTruck(truckId: number): Promise<Trip[]>;
  getTripsByDriver(driverId: number): Promise<Trip[]>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: number, trip: Partial<InsertTrip>): Promise<Trip | undefined>;

  // Shipment operations
  getAllShipments(): Promise<Shipment[]>;
  getShipment(id: number): Promise<Shipment | undefined>;
  createShipment(shipment: InsertShipment): Promise<Shipment>;
  updateShipment(id: number, shipment: Partial<InsertShipment>): Promise<Shipment | undefined>;
  deleteShipment(id: number): Promise<boolean>;

  // ShipmentTruck operations
  getShipmentTrucks(shipmentId: number): Promise<ShipmentTruck[]>;
  createShipmentTruck(shipmentTruck: InsertShipmentTruck): Promise<ShipmentTruck>;
  updateShipmentTruck(id: number, shipmentTruck: Partial<InsertShipmentTruck>): Promise<ShipmentTruck | undefined>;
  deleteShipmentTruck(id: number): Promise<boolean>;

  // AI Monitoring operations
  createAiIncident(incident: InsertAiIncident): Promise<AiIncident>;
  getAiIncidentsByTruck(truckId: number, limit?: number): Promise<AiIncident[]>;
  getAiIncidentsByDriver(driverId: number, limit?: number): Promise<AiIncident[]>;
  getRecentAiIncidents(limit?: number): Promise<AiIncident[]>;
  updateAiIncident(id: number, incident: Partial<InsertAiIncident>): Promise<AiIncident | undefined>;
  
  // Driver Score operations
  createDriverScore(score: InsertDriverScore): Promise<DriverScore>;
  getDriverScores(driverId: number, days?: number): Promise<DriverScore[]>;
  getLatestDriverScore(driverId: number): Promise<DriverScore | undefined>;
  updateDriverScore(id: number, score: Partial<InsertDriverScore>): Promise<DriverScore | undefined>;
  
  // Fraud Alert operations
  createFraudAlert(alert: InsertFraudAlert): Promise<FraudAlert>;
  getFraudAlerts(status?: string, limit?: number): Promise<FraudAlert[]>;
  updateFraudAlert(id: number, alert: Partial<InsertFraudAlert>): Promise<FraudAlert | undefined>;
  
  // GPS operations
  createGpsPoint(point: InsertGpsPoint): Promise<GpsPoint>;
  getGpsPoints(truckId: number, hours?: number): Promise<GpsPoint[]>;
  getLatestGpsPoint(truckId: number): Promise<GpsPoint | undefined>;
  
  // Geofence Event operations
  createGeofenceEvent(event: InsertGeofenceEvent): Promise<GeofenceEvent>;
  getGeofenceEvents(truckId?: number, geofenceId?: number, hours?: number): Promise<GeofenceEvent[]>;
  
  // API Log operations
  createApiLog(log: InsertApiLog): Promise<ApiLog>;
  getApiLogs(vendorId?: number, hours?: number): Promise<ApiLog[]>;
  
  // System Health operations
  createSystemHealth(health: InsertSystemHealth): Promise<SystemHealth>;
  getSystemHealth(component?: string, hours?: number): Promise<SystemHealth[]>;
  
  // AI Model operations
  createAiModel(model: InsertAiModel): Promise<AiModel>;
  getAiModels(): Promise<AiModel[]>;
  updateAiModel(id: number, model: Partial<InsertAiModel>): Promise<AiModel | undefined>;
  
  // Report Schedule operations
  createReportSchedule(schedule: InsertReportSchedule): Promise<ReportSchedule>;
  getReportSchedules(): Promise<ReportSchedule[]>;
  updateReportSchedule(id: number, schedule: Partial<InsertReportSchedule>): Promise<ReportSchedule | undefined>;
  
  // Additional utility methods
  getCamera(id: number): Promise<Camera | undefined>;
  getCameraByVendorId(vendorId: number, vendorCameraId: string): Promise<Camera | undefined>;
  getDashboardStats(): Promise<DashboardStats>;
}

// Database storage implementation using Drizzle ORM
export class DatabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    
    const sql = neon(databaseUrl);
    this.db = drizzle(sql);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Truck operations
  async getAllTrucks(): Promise<Truck[]> {
    return await this.db.select().from(trucks);
  }

  async getTruck(id: number): Promise<Truck | undefined> {
    const result = await this.db.select().from(trucks).where(eq(trucks.id, id));
    return result[0];
  }

  async createTruck(insertTruck: InsertTruck): Promise<Truck> {
    const result = await this.db.insert(trucks).values(insertTruck).returning();
    return result[0];
  }

  async updateTruck(id: number, updateData: Partial<InsertTruck>): Promise<Truck | undefined> {
    const result = await this.db.update(trucks).set(updateData).where(eq(trucks.id, id)).returning();
    return result[0];
  }

  async deleteTruck(id: number): Promise<boolean> {
    const result = await this.db.delete(trucks).where(eq(trucks.id, id)).returning();
    return result.length > 0;
  }

  // Driver operations
  async getAllDrivers(): Promise<Driver[]> {
    return await this.db.select().from(drivers);
  }

  async getDriver(id: number): Promise<Driver | undefined> {
    const result = await this.db.select().from(drivers).where(eq(drivers.id, id));
    return result[0];
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const result = await this.db.insert(drivers).values(insertDriver).returning();
    return result[0];
  }

  async updateDriver(id: number, updateData: Partial<InsertDriver>): Promise<Driver | undefined> {
    const result = await this.db.update(drivers).set(updateData).where(eq(drivers.id, id)).returning();
    return result[0];
  }

  async deleteDriver(id: number): Promise<boolean> {
    const result = await this.db.delete(drivers).where(eq(drivers.id, id)).returning();
    return result.length > 0;
  }

  // Vendor operations
  async getAllVendors(): Promise<Vendor[]> {
    return await this.db.select().from(vendors);
  }

  async getVendor(id: number): Promise<Vendor | undefined> {
    const result = await this.db.select().from(vendors).where(eq(vendors.id, id));
    return result[0];
  }

  async createVendor(insertVendor: InsertVendor): Promise<Vendor> {
    const result = await this.db.insert(vendors).values(insertVendor).returning();
    return result[0];
  }

  async updateVendor(id: number, updateData: Partial<InsertVendor>): Promise<Vendor | undefined> {
    const result = await this.db.update(vendors).set(updateData).where(eq(vendors.id, id)).returning();
    return result[0];
  }

  async deleteVendor(id: number): Promise<boolean> {
    const result = await this.db.delete(vendors).where(eq(vendors.id, id)).returning();
    return result.length > 0;
  }

  // Camera operations
  async getCamerasByTruck(truckId: number): Promise<Camera[]> {
    return await this.db.select().from(cameras).where(eq(cameras.truckId, truckId));
  }

  async createCamera(insertCamera: InsertCamera): Promise<Camera> {
    const result = await this.db.insert(cameras).values(insertCamera).returning();
    return result[0];
  }

  async updateCamera(id: number, updateData: Partial<InsertCamera>): Promise<Camera | undefined> {
    const result = await this.db.update(cameras).set(updateData).where(eq(cameras.id, id)).returning();
    return result[0];
  }

  // Geofence operations
  async getAllGeofences(): Promise<Geofence[]> {
    return await this.db.select().from(geofences);
  }

  async getGeofence(id: number): Promise<Geofence | undefined> {
    const result = await this.db.select().from(geofences).where(eq(geofences.id, id));
    return result[0];
  }

  async createGeofence(insertGeofence: InsertGeofence): Promise<Geofence> {
    const result = await this.db.insert(geofences).values(insertGeofence).returning();
    return result[0];
  }

  async updateGeofence(id: number, updateData: Partial<InsertGeofence>): Promise<Geofence | undefined> {
    const result = await this.db.update(geofences).set(updateData).where(eq(geofences.id, id)).returning();
    return result[0];
  }

  async deleteGeofence(id: number): Promise<boolean> {
    const result = await this.db.delete(geofences).where(eq(geofences.id, id)).returning();
    return result.length > 0;
  }

  // Alert operations
  async getAllAlerts(): Promise<Alert[]> {
    return await this.db.select().from(alerts).orderBy(desc(alerts.timestamp));
  }

  async getRecentAlerts(limit = 10): Promise<Alert[]> {
    return await this.db.select().from(alerts).orderBy(desc(alerts.timestamp)).limit(limit);
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const result = await this.db.insert(alerts).values(insertAlert).returning();
    return result[0];
  }

  async updateAlert(id: number, updateData: Partial<InsertAlert>): Promise<Alert | undefined> {
    const result = await this.db.update(alerts).set(updateData).where(eq(alerts.id, id)).returning();
    return result[0];
  }

  async getUnacknowledgedAlerts(): Promise<Alert[]> {
    return await this.db.select().from(alerts).where(eq(alerts.acknowledged, false));
  }

  // Trip operations
  async getAllTrips(): Promise<Trip[]> {
    return await this.db.select().from(trips);
  }

  async getTripsByTruck(truckId: number): Promise<Trip[]> {
    return await this.db.select().from(trips).where(eq(trips.truckId, truckId));
  }

  async getTripsByDriver(driverId: number): Promise<Trip[]> {
    return await this.db.select().from(trips).where(eq(trips.driverId, driverId));
  }

  async createTrip(insertTrip: InsertTrip): Promise<Trip> {
    const result = await this.db.insert(trips).values(insertTrip).returning();
    return result[0];
  }

  async updateTrip(id: number, updateData: Partial<InsertTrip>): Promise<Trip | undefined> {
    const result = await this.db.update(trips).set(updateData).where(eq(trips.id, id)).returning();
    return result[0];
  }

  // Shipment operations
  async getAllShipments(): Promise<Shipment[]> {
    return await this.db.select().from(shipments);
  }

  async getShipment(id: number): Promise<Shipment | undefined> {
    const result = await this.db.select().from(shipments).where(eq(shipments.id, id));
    return result[0];
  }

  async createShipment(insertShipment: InsertShipment): Promise<Shipment> {
    const result = await this.db.insert(shipments).values(insertShipment).returning();
    return result[0];
  }

  async updateShipment(id: number, updateData: Partial<InsertShipment>): Promise<Shipment | undefined> {
    const result = await this.db.update(shipments).set(updateData).where(eq(shipments.id, id)).returning();
    return result[0];
  }

  async deleteShipment(id: number): Promise<boolean> {
    const result = await this.db.delete(shipments).where(eq(shipments.id, id)).returning();
    return result.length > 0;
  }

  // ShipmentTruck operations
  async getShipmentTrucks(shipmentId: number): Promise<ShipmentTruck[]> {
    return await this.db.select().from(shipmentTrucks).where(eq(shipmentTrucks.shipmentId, shipmentId));
  }

  async createShipmentTruck(insertShipmentTruck: InsertShipmentTruck): Promise<ShipmentTruck> {
    const result = await this.db.insert(shipmentTrucks).values(insertShipmentTruck).returning();
    return result[0];
  }

  async updateShipmentTruck(id: number, updateData: Partial<InsertShipmentTruck>): Promise<ShipmentTruck | undefined> {
    const result = await this.db.update(shipmentTrucks).set(updateData).where(eq(shipmentTrucks.id, id)).returning();
    return result[0];
  }

  async deleteShipmentTruck(id: number): Promise<boolean> {
    const result = await this.db.delete(shipmentTrucks).where(eq(shipmentTrucks.id, id)).returning();
    return result.length > 0;
  }

  // AI Monitoring operations
  async createAiIncident(insertIncident: InsertAiIncident): Promise<AiIncident> {
    const result = await this.db.insert(aiIncidents).values(insertIncident).returning();
    return result[0];
  }

  async getAiIncidentsByTruck(truckId: number, limit = 50): Promise<AiIncident[]> {
    return await this.db.select().from(aiIncidents)
      .where(eq(aiIncidents.truckId, truckId))
      .orderBy(desc(aiIncidents.timestamp))
      .limit(limit);
  }

  async getAiIncidentsByDriver(driverId: number, limit = 50): Promise<AiIncident[]> {
    return await this.db.select().from(aiIncidents)
      .where(eq(aiIncidents.driverId, driverId))
      .orderBy(desc(aiIncidents.timestamp))
      .limit(limit);
  }

  async getRecentAiIncidents(limit = 20): Promise<AiIncident[]> {
    return await this.db.select().from(aiIncidents)
      .orderBy(desc(aiIncidents.timestamp))
      .limit(limit);
  }

  async updateAiIncident(id: number, updateData: Partial<InsertAiIncident>): Promise<AiIncident | undefined> {
    const result = await this.db.update(aiIncidents).set(updateData).where(eq(aiIncidents.id, id)).returning();
    return result[0];
  }

  // Driver Score operations
  async createDriverScore(insertScore: InsertDriverScore): Promise<DriverScore> {
    const result = await this.db.insert(driverScores).values(insertScore).returning();
    return result[0];
  }

  async getDriverScores(driverId: number, days = 30): Promise<DriverScore[]> {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);
    
    return await this.db.select().from(driverScores)
      .where(eq(driverScores.driverId, driverId))
      .orderBy(desc(driverScores.date));
  }

  async getLatestDriverScore(driverId: number): Promise<DriverScore | undefined> {
    const result = await this.db.select().from(driverScores)
      .where(eq(driverScores.driverId, driverId))
      .orderBy(desc(driverScores.date))
      .limit(1);
    return result[0];
  }

  async updateDriverScore(id: number, updateData: Partial<InsertDriverScore>): Promise<DriverScore | undefined> {
    const result = await this.db.update(driverScores).set(updateData).where(eq(driverScores.id, id)).returning();
    return result[0];
  }

  // Fraud Alert operations
  async createFraudAlert(insertAlert: InsertFraudAlert): Promise<FraudAlert> {
    const result = await this.db.insert(fraudAlerts).values(insertAlert).returning();
    return result[0];
  }

  async getFraudAlerts(status?: string, limit = 50): Promise<FraudAlert[]> {
    let query = this.db.select().from(fraudAlerts);
    
    if (status) {
      query = query.where(eq(fraudAlerts.status, status));
    }
    
    return await query.orderBy(desc(fraudAlerts.timestamp)).limit(limit);
  }

  async updateFraudAlert(id: number, updateData: Partial<InsertFraudAlert>): Promise<FraudAlert | undefined> {
    const result = await this.db.update(fraudAlerts).set(updateData).where(eq(fraudAlerts.id, id)).returning();
    return result[0];
  }

  // GPS operations
  async createGpsPoint(insertPoint: InsertGpsPoint): Promise<GpsPoint> {
    const result = await this.db.insert(gpsPoints).values(insertPoint).returning();
    return result[0];
  }

  async getGpsPoints(truckId: number, hours = 24): Promise<GpsPoint[]> {
    const timeLimit = new Date();
    timeLimit.setHours(timeLimit.getHours() - hours);
    
    return await this.db.select().from(gpsPoints)
      .where(eq(gpsPoints.truckId, truckId))
      .orderBy(desc(gpsPoints.timestamp));
  }

  async getLatestGpsPoint(truckId: number): Promise<GpsPoint | undefined> {
    const result = await this.db.select().from(gpsPoints)
      .where(eq(gpsPoints.truckId, truckId))
      .orderBy(desc(gpsPoints.timestamp))
      .limit(1);
    return result[0];
  }

  // Geofence Event operations
  async createGeofenceEvent(insertEvent: InsertGeofenceEvent): Promise<GeofenceEvent> {
    const result = await this.db.insert(geofenceEvents).values(insertEvent).returning();
    return result[0];
  }

  async getGeofenceEvents(truckId?: number, geofenceId?: number, hours = 24): Promise<GeofenceEvent[]> {
    const timeLimit = new Date();
    timeLimit.setHours(timeLimit.getHours() - hours);
    
    let query = this.db.select().from(geofenceEvents);
    
    if (truckId) {
      query = query.where(eq(geofenceEvents.truckId, truckId));
    }
    if (geofenceId) {
      query = query.where(eq(geofenceEvents.geofenceId, geofenceId));
    }
    
    return await query.orderBy(desc(geofenceEvents.timestamp));
  }

  // API Log operations
  async createApiLog(insertLog: InsertApiLog): Promise<ApiLog> {
    const result = await this.db.insert(apiLogs).values(insertLog).returning();
    return result[0];
  }

  async getApiLogs(vendorId?: number, hours = 24): Promise<ApiLog[]> {
    const timeLimit = new Date();
    timeLimit.setHours(timeLimit.getHours() - hours);
    
    let query = this.db.select().from(apiLogs);
    
    if (vendorId) {
      query = query.where(eq(apiLogs.vendorId, vendorId));
    }
    
    return await query.orderBy(desc(apiLogs.timestamp));
  }

  // System Health operations
  async createSystemHealth(insertHealth: InsertSystemHealth): Promise<SystemHealth> {
    const result = await this.db.insert(systemHealth).values(insertHealth).returning();
    return result[0];
  }

  async getSystemHealth(component?: string, hours = 24): Promise<SystemHealth[]> {
    const timeLimit = new Date();
    timeLimit.setHours(timeLimit.getHours() - hours);
    
    let query = this.db.select().from(systemHealth);
    
    if (component) {
      query = query.where(eq(systemHealth.component, component));
    }
    
    return await query.orderBy(desc(systemHealth.timestamp));
  }

  // AI Model operations
  async createAiModel(insertModel: InsertAiModel): Promise<AiModel> {
    const result = await this.db.insert(aiModels).values(insertModel).returning();
    return result[0];
  }

  async getAiModels(): Promise<AiModel[]> {
    return await this.db.select().from(aiModels);
  }

  async updateAiModel(id: number, updateData: Partial<InsertAiModel>): Promise<AiModel | undefined> {
    const result = await this.db.update(aiModels).set(updateData).where(eq(aiModels.id, id)).returning();
    return result[0];
  }

  // Report Schedule operations
  async createReportSchedule(insertSchedule: InsertReportSchedule): Promise<ReportSchedule> {
    const result = await this.db.insert(reportSchedules).values(insertSchedule).returning();
    return result[0];
  }

  async getReportSchedules(): Promise<ReportSchedule[]> {
    return await this.db.select().from(reportSchedules);
  }

  async updateReportSchedule(id: number, updateData: Partial<InsertReportSchedule>): Promise<ReportSchedule | undefined> {
    const result = await this.db.update(reportSchedules).set(updateData).where(eq(reportSchedules.id, id)).returning();
    return result[0];
  }

  // Additional utility methods
  async getCamera(id: number): Promise<Camera | undefined> {
    const result = await this.db.select().from(cameras).where(eq(cameras.id, id));
    return result[0];
  }

  async getCameraByVendorId(vendorId: number, vendorCameraId: string): Promise<Camera | undefined> {
    const result = await this.db.select().from(cameras)
      .where(eq(cameras.vendorId, vendorId) && eq(cameras.vendorCameraId, vendorCameraId));
    return result[0];
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const [trucks, drivers, cameras, incidents, alerts, scores] = await Promise.all([
      this.getAllTrucks(),
      this.getAllDrivers(),
      this.db.select().from(cameras),
      this.getRecentAiIncidents(100),
      this.getUnacknowledgedAlerts(),
      this.db.select().from(driverScores)
    ]);

    const activeTrucks = trucks.filter(t => t.status === 'online').length;
    const onlineDrivers = drivers.filter(d => d.status === 'active').length;
    const activeCameras = cameras.filter(c => c.status === 'online').length;
    const todayIncidents = incidents.filter(i => 
      i.timestamp && i.timestamp.toDateString() === new Date().toDateString()
    ).length;
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    const fraudAlerts = incidents.filter(i => i.incidentType === 'fraud').length;

    const totalScores = scores.length;
    const avgScore = totalScores > 0 
      ? scores.reduce((sum, s) => sum + (s.overallScore || 0), 0) / totalScores 
      : 0;

    return {
      totalTrucks: trucks.length,
      activeTrucks,
      onlineDrivers,
      activeCameras,
      todayIncidents,
      criticalAlerts,
      averageKpiScore: avgScore,
      fraudAlerts,
      systemHealth: criticalAlerts > 0 ? 'critical' : todayIncidents > 10 ? 'warning' : 'healthy'
    };
  }
}

// In-memory storage for development/testing
export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private trucks: Map<number, Truck> = new Map();
  private drivers: Map<number, Driver> = new Map();
  private vendors: Map<number, Vendor> = new Map();
  private cameras: Map<number, Camera> = new Map();
  private geofences: Map<number, Geofence> = new Map();
  private alerts: Map<number, Alert> = new Map();
  private trips: Map<number, Trip> = new Map();
  private shipments: Map<number, Shipment> = new Map();
  private shipmentTrucks: Map<number, ShipmentTruck> = new Map();
  private aiIncidents: Map<number, AiIncident> = new Map();
  private driverScores: Map<number, DriverScore> = new Map();
  private fraudAlerts: Map<number, FraudAlert> = new Map();
  private gpsPoints: Map<number, GpsPoint> = new Map();
  private geofenceEvents: Map<number, GeofenceEvent> = new Map();
  private apiLogs: Map<number, ApiLog> = new Map();
  private systemHealth: Map<number, SystemHealth> = new Map();
  private aiModels: Map<number, AiModel> = new Map();
  private reportSchedules: Map<number, ReportSchedule> = new Map();
  private currentIds: Map<string, number> = new Map();

  constructor() {
    // Initialize counters
    this.currentIds.set('users', 1);
    this.currentIds.set('trucks', 1);
    this.currentIds.set('drivers', 1);
    this.currentIds.set('vendors', 1);
    this.currentIds.set('cameras', 1);
    this.currentIds.set('geofences', 1);
    this.currentIds.set('alerts', 1);
    this.currentIds.set('trips', 1);
    this.currentIds.set('shipments', 1);
    this.currentIds.set('shipmentTrucks', 1);
    this.currentIds.set('aiIncidents', 1);
    this.currentIds.set('driverScores', 1);
    this.currentIds.set('fraudAlerts', 1);
    this.currentIds.set('gpsPoints', 1);
    this.currentIds.set('geofenceEvents', 1);
    this.currentIds.set('apiLogs', 1);
    this.currentIds.set('systemHealth', 1);
    this.currentIds.set('aiModels', 1);
    this.currentIds.set('reportSchedules', 1);
  }

  private getNextId(table: string): number {
    const current = this.currentIds.get(table) || 1;
    this.currentIds.set(table, current + 1);
    return current;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.getNextId('users');
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Truck operations
  async getAllTrucks(): Promise<Truck[]> {
    return Array.from(this.trucks.values());
  }

  async getTruck(id: number): Promise<Truck | undefined> {
    return this.trucks.get(id);
  }

  async createTruck(insertTruck: InsertTruck): Promise<Truck> {
    const id = this.getNextId('trucks');
    const truck: Truck = { 
      id,
      truckNumber: insertTruck.truckNumber,
      driverId: insertTruck.driverId ?? null,
      vendorId: insertTruck.vendorId ?? null,
      status: insertTruck.status,
      latitude: insertTruck.latitude ?? null,
      longitude: insertTruck.longitude ?? null,
      speed: insertTruck.speed ?? null,
      heading: insertTruck.heading ?? null,
      lastUpdate: new Date(),
      kpiScore: insertTruck.kpiScore ?? null,
      location: insertTruck.location ?? null
    };
    this.trucks.set(id, truck);
    return truck;
  }

  async updateTruck(id: number, updateData: Partial<InsertTruck>): Promise<Truck | undefined> {
    const truck = this.trucks.get(id);
    if (!truck) return undefined;
    
    const updatedTruck: Truck = { 
      ...truck, 
      ...updateData, 
      lastUpdate: new Date() 
    };
    this.trucks.set(id, updatedTruck);
    return updatedTruck;
  }

  async deleteTruck(id: number): Promise<boolean> {
    return this.trucks.delete(id);
  }

  // Driver operations
  async getAllDrivers(): Promise<Driver[]> {
    return Array.from(this.drivers.values());
  }

  async getDriver(id: number): Promise<Driver | undefined> {
    return this.drivers.get(id);
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const id = this.getNextId('drivers');
    const driver: Driver = { 
      id,
      name: insertDriver.name,
      licenseNumber: insertDriver.licenseNumber,
      phone: insertDriver.phone ?? null,
      email: insertDriver.email ?? null,
      vendorId: insertDriver.vendorId ?? null,
      status: insertDriver.status,
      kpiScore: insertDriver.kpiScore ?? null,
      totalTrips: insertDriver.totalTrips ?? null,
      safetyScore: insertDriver.safetyScore ?? null
    };
    this.drivers.set(id, driver);
    return driver;
  }

  async updateDriver(id: number, updateData: Partial<InsertDriver>): Promise<Driver | undefined> {
    const driver = this.drivers.get(id);
    if (!driver) return undefined;
    
    const updatedDriver: Driver = { ...driver, ...updateData };
    this.drivers.set(id, updatedDriver);
    return updatedDriver;
  }

  async deleteDriver(id: number): Promise<boolean> {
    return this.drivers.delete(id);
  }

  // Vendor operations
  async getAllVendors(): Promise<Vendor[]> {
    return Array.from(this.vendors.values());
  }

  async getVendor(id: number): Promise<Vendor | undefined> {
    return this.vendors.get(id);
  }

  async createVendor(insertVendor: InsertVendor): Promise<Vendor> {
    const id = this.getNextId('vendors');
    const vendor: Vendor = { 
      id,
      name: insertVendor.name,
      contactPerson: insertVendor.contactPerson ?? null,
      phone: insertVendor.phone ?? null,
      email: insertVendor.email ?? null,
      apiEndpoint: insertVendor.apiEndpoint ?? null,
      apiKey: insertVendor.apiKey ?? null,
      status: insertVendor.status,
      trucksCount: insertVendor.trucksCount ?? null
    };
    this.vendors.set(id, vendor);
    return vendor;
  }

  async updateVendor(id: number, updateData: Partial<InsertVendor>): Promise<Vendor | undefined> {
    const vendor = this.vendors.get(id);
    if (!vendor) return undefined;
    
    const updatedVendor: Vendor = { ...vendor, ...updateData };
    this.vendors.set(id, updatedVendor);
    return updatedVendor;
  }

  async deleteVendor(id: number): Promise<boolean> {
    return this.vendors.delete(id);
  }

  // Camera operations
  async getCamerasByTruck(truckId: number): Promise<Camera[]> {
    return Array.from(this.cameras.values()).filter(camera => camera.truckId === truckId);
  }

  async createCamera(insertCamera: InsertCamera): Promise<Camera> {
    const id = this.getNextId('cameras');
    const camera: Camera = { 
      id,
      truckId: insertCamera.truckId,
      position: insertCamera.position,
      streamUrl: insertCamera.streamUrl ?? null,
      status: insertCamera.status,
      lastUpdate: new Date()
    };
    this.cameras.set(id, camera);
    return camera;
  }

  async updateCamera(id: number, updateData: Partial<InsertCamera>): Promise<Camera | undefined> {
    const camera = this.cameras.get(id);
    if (!camera) return undefined;
    
    const updatedCamera: Camera = { 
      ...camera, 
      ...updateData, 
      lastUpdate: new Date() 
    };
    this.cameras.set(id, updatedCamera);
    return updatedCamera;
  }

  // Geofence operations
  async getAllGeofences(): Promise<Geofence[]> {
    return Array.from(this.geofences.values());
  }

  async getGeofence(id: number): Promise<Geofence | undefined> {
    return this.geofences.get(id);
  }

  async createGeofence(insertGeofence: InsertGeofence): Promise<Geofence> {
    const id = this.getNextId('geofences');
    const geofence: Geofence = { 
      id,
      name: insertGeofence.name,
      type: insertGeofence.type,
      coordinates: insertGeofence.coordinates,
      radius: insertGeofence.radius ?? null,
      isActive: insertGeofence.isActive ?? null,
      alertOnEnter: insertGeofence.alertOnEnter ?? null,
      alertOnExit: insertGeofence.alertOnExit ?? null
    };
    this.geofences.set(id, geofence);
    return geofence;
  }

  async updateGeofence(id: number, updateData: Partial<InsertGeofence>): Promise<Geofence | undefined> {
    const geofence = this.geofences.get(id);
    if (!geofence) return undefined;
    
    const updatedGeofence: Geofence = { ...geofence, ...updateData };
    this.geofences.set(id, updatedGeofence);
    return updatedGeofence;
  }

  async deleteGeofence(id: number): Promise<boolean> {
    return this.geofences.delete(id);
  }

  // Alert operations
  async getAllAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values()).sort((a, b) => 
      (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)
    );
  }

  async getRecentAlerts(limit = 10): Promise<Alert[]> {
    const alerts = await this.getAllAlerts();
    return alerts.slice(0, limit);
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = this.getNextId('alerts');
    const alert: Alert = { 
      id,
      truckId: insertAlert.truckId ?? null,
      driverId: insertAlert.driverId ?? null,
      type: insertAlert.type,
      severity: insertAlert.severity,
      title: insertAlert.title,
      description: insertAlert.description ?? null,
      timestamp: new Date(),
      acknowledged: insertAlert.acknowledged ?? null,
      resolvedAt: insertAlert.resolvedAt ?? null
    };
    this.alerts.set(id, alert);
    return alert;
  }

  async updateAlert(id: number, updateData: Partial<InsertAlert>): Promise<Alert | undefined> {
    const alert = this.alerts.get(id);
    if (!alert) return undefined;
    
    const updatedAlert: Alert = { ...alert, ...updateData };
    this.alerts.set(id, updatedAlert);
    return updatedAlert;
  }

  async getUnacknowledgedAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(alert => !alert.acknowledged);
  }

  // Trip operations
  async getAllTrips(): Promise<Trip[]> {
    return Array.from(this.trips.values());
  }

  async getTripsByTruck(truckId: number): Promise<Trip[]> {
    return Array.from(this.trips.values()).filter(trip => trip.truckId === truckId);
  }

  async getTripsByDriver(driverId: number): Promise<Trip[]> {
    return Array.from(this.trips.values()).filter(trip => trip.driverId === driverId);
  }

  async createTrip(insertTrip: InsertTrip): Promise<Trip> {
    const id = this.getNextId('trips');
    const trip: Trip = {
      id,
      truckId: insertTrip.truckId,
      driverId: insertTrip.driverId,
      shipmentId: insertTrip.shipmentId ?? null,
      startTime: insertTrip.startTime,
      endTime: insertTrip.endTime ?? null,
      startLocation: insertTrip.startLocation ?? null,
      endLocation: insertTrip.endLocation ?? null,
      distance: insertTrip.distance ?? null,
      duration: insertTrip.duration ?? null,
      status: insertTrip.status,
      kpiScore: insertTrip.kpiScore ?? null
    };
    this.trips.set(id, trip);
    return trip;
  }

  async updateTrip(id: number, updateData: Partial<InsertTrip>): Promise<Trip | undefined> {
    const trip = this.trips.get(id);
    if (!trip) return undefined;
    
    const updatedTrip: Trip = { ...trip, ...updateData };
    this.trips.set(id, updatedTrip);
    return updatedTrip;
  }

  // Shipment operations
  async getAllShipments(): Promise<Shipment[]> {
    return Array.from(this.shipments.values());
  }

  async getShipment(id: number): Promise<Shipment | undefined> {
    return this.shipments.get(id);
  }

  async createShipment(insertShipment: InsertShipment): Promise<Shipment> {
    const id = this.getNextId('shipments');
    const shipment: Shipment = {
      id,
      shipmentNumber: insertShipment.shipmentNumber,
      customerName: insertShipment.customerName,
      origin: insertShipment.origin,
      destination: insertShipment.destination,
      plannedDeparture: insertShipment.plannedDeparture,
      actualDeparture: insertShipment.actualDeparture ?? null,
      plannedArrival: insertShipment.plannedArrival,
      actualArrival: insertShipment.actualArrival ?? null,
      status: insertShipment.status,
      priority: insertShipment.priority,
      totalTrucks: insertShipment.totalTrucks ?? null,
      activeTrucks: insertShipment.activeTrucks ?? null,
      completedTrucks: insertShipment.completedTrucks ?? null,
      estimatedDistance: insertShipment.estimatedDistance ?? null,
      actualDistance: insertShipment.actualDistance ?? null,
      notes: insertShipment.notes ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.shipments.set(id, shipment);
    return shipment;
  }

  async updateShipment(id: number, updateData: Partial<InsertShipment>): Promise<Shipment | undefined> {
    const shipment = this.shipments.get(id);
    if (!shipment) return undefined;
    
    const updatedShipment: Shipment = {
      ...shipment,
      ...updateData,
      updatedAt: new Date()
    };
    this.shipments.set(id, updatedShipment);
    return updatedShipment;
  }

  async deleteShipment(id: number): Promise<boolean> {
    return this.shipments.delete(id);
  }

  // ShipmentTruck operations
  async getShipmentTrucks(shipmentId: number): Promise<ShipmentTruck[]> {
    return Array.from(this.shipmentTrucks.values()).filter(st => st.shipmentId === shipmentId);
  }

  async createShipmentTruck(insertShipmentTruck: InsertShipmentTruck): Promise<ShipmentTruck> {
    const id = this.getNextId('shipmentTrucks');
    const shipmentTruck: ShipmentTruck = {
      id,
      shipmentId: insertShipmentTruck.shipmentId,
      truckId: insertShipmentTruck.truckId,
      driverId: insertShipmentTruck.driverId,
      assignedAt: new Date(),
      position: insertShipmentTruck.position ?? null,
      status: insertShipmentTruck.status,
      departureTime: insertShipmentTruck.departureTime ?? null,
      arrivalTime: insertShipmentTruck.arrivalTime ?? null,
      currentDistance: insertShipmentTruck.currentDistance ?? null,
      estimatedArrival: insertShipmentTruck.estimatedArrival ?? null
    };
    this.shipmentTrucks.set(id, shipmentTruck);
    return shipmentTruck;
  }

  async updateShipmentTruck(id: number, updateData: Partial<InsertShipmentTruck>): Promise<ShipmentTruck | undefined> {
    const shipmentTruck = this.shipmentTrucks.get(id);
    if (!shipmentTruck) return undefined;
    
    const updatedShipmentTruck: ShipmentTruck = { ...shipmentTruck, ...updateData };
    this.shipmentTrucks.set(id, updatedShipmentTruck);
    return updatedShipmentTruck;
  }

  async deleteShipmentTruck(id: number): Promise<boolean> {
    return this.shipmentTrucks.delete(id);
  }

  // AI Monitoring operations - MemStorage
  async createAiIncident(insertIncident: InsertAiIncident): Promise<AiIncident> {
    const id = this.getNextId('aiIncidents');
    const incident: AiIncident = {
      id,
      truckId: insertIncident.truckId,
      driverId: insertIncident.driverId ?? null,
      cameraId: insertIncident.cameraId,
      incidentType: insertIncident.incidentType,
      severity: insertIncident.severity,
      confidence: insertIncident.confidence,
      description: insertIncident.description,
      videoClipUrl: insertIncident.videoClipUrl ?? null,
      imageUrl: insertIncident.imageUrl ?? null,
      metadata: insertIncident.metadata ?? null,
      timestamp: new Date(),
      location: insertIncident.location ?? null,
      acknowledged: insertIncident.acknowledged ?? null,
      reviewedBy: insertIncident.reviewedBy ?? null,
      reviewedAt: insertIncident.reviewedAt ?? null,
      falsePositive: insertIncident.falsePositive ?? null,
      actionTaken: insertIncident.actionTaken ?? null
    };
    this.aiIncidents.set(id, incident);
    return incident;
  }

  async getAiIncidentsByTruck(truckId: number, limit = 50): Promise<AiIncident[]> {
    const incidents = Array.from(this.aiIncidents.values())
      .filter(i => i.truckId === truckId)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
    return incidents.slice(0, limit);
  }

  async getAiIncidentsByDriver(driverId: number, limit = 50): Promise<AiIncident[]> {
    const incidents = Array.from(this.aiIncidents.values())
      .filter(i => i.driverId === driverId)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
    return incidents.slice(0, limit);
  }

  async getRecentAiIncidents(limit = 20): Promise<AiIncident[]> {
    const incidents = Array.from(this.aiIncidents.values())
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
    return incidents.slice(0, limit);
  }

  async updateAiIncident(id: number, updateData: Partial<InsertAiIncident>): Promise<AiIncident | undefined> {
    const incident = this.aiIncidents.get(id);
    if (!incident) return undefined;
    
    const updatedIncident: AiIncident = { ...incident, ...updateData };
    this.aiIncidents.set(id, updatedIncident);
    return updatedIncident;
  }

  // Driver Score operations - MemStorage
  async createDriverScore(insertScore: InsertDriverScore): Promise<DriverScore> {
    const id = this.getNextId('driverScores');
    const score: DriverScore = {
      id,
      driverId: insertScore.driverId,
      date: insertScore.date,
      shiftStart: insertScore.shiftStart ?? null,
      shiftEnd: insertScore.shiftEnd ?? null,
      overallScore: insertScore.overallScore,
      safetyScore: insertScore.safetyScore,
      efficiencyScore: insertScore.efficiencyScore,
      complianceScore: insertScore.complianceScore,
      drowsinessEvents: insertScore.drowsinessEvents ?? null,
      phoneUsageEvents: insertScore.phoneUsageEvents ?? null,
      seatbeltViolations: insertScore.seatbeltViolations ?? null,
      smokingEvents: insertScore.smokingEvents ?? null,
      harshBrakingEvents: insertScore.harshBrakingEvents ?? null,
      harshAccelerationEvents: insertScore.harshAccelerationEvents ?? null,
      speedingViolations: insertScore.speedingViolations ?? null,
      totalDistance: insertScore.totalDistance ?? null,
      totalDuration: insertScore.totalDuration ?? null,
      fuelEfficiency: insertScore.fuelEfficiency ?? null,
      routeAdherence: insertScore.routeAdherence ?? null,
      onTimeDeliveries: insertScore.onTimeDeliveries ?? null,
      lateDeliveries: insertScore.lateDeliveries ?? null,
      documentationComplete: insertScore.documentationComplete ?? null,
      communicationScore: insertScore.communicationScore ?? null,
      policyViolations: insertScore.policyViolations ?? null,
      milesPerHour: insertScore.milesPerHour ?? null,
      incidentsPerMile: insertScore.incidentsPerMile ?? null,
      createdAt: new Date()
    };
    this.driverScores.set(id, score);
    return score;
  }

  async getDriverScores(driverId: number, days = 30): Promise<DriverScore[]> {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);
    
    return Array.from(this.driverScores.values())
      .filter(s => s.driverId === driverId && s.date >= dateLimit)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getLatestDriverScore(driverId: number): Promise<DriverScore | undefined> {
    const scores = Array.from(this.driverScores.values())
      .filter(s => s.driverId === driverId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    return scores[0];
  }

  async updateDriverScore(id: number, updateData: Partial<InsertDriverScore>): Promise<DriverScore | undefined> {
    const score = this.driverScores.get(id);
    if (!score) return undefined;
    
    const updatedScore: DriverScore = { ...score, ...updateData };
    this.driverScores.set(id, updatedScore);
    return updatedScore;
  }

  // Fraud Alert operations - MemStorage
  async createFraudAlert(insertAlert: InsertFraudAlert): Promise<FraudAlert> {
    const id = this.getNextId('fraudAlerts');
    const alert: FraudAlert = {
      id,
      truckId: insertAlert.truckId,
      driverId: insertAlert.driverId ?? null,
      alertType: insertAlert.alertType,
      severity: insertAlert.severity,
      description: insertAlert.description,
      evidenceUrls: insertAlert.evidenceUrls ?? null,
      detectedBy: insertAlert.detectedBy,
      location: insertAlert.location ?? null,
      timestamp: new Date(),
      duration: insertAlert.duration ?? null,
      estimatedLoss: insertAlert.estimatedLoss ?? null,
      actualLoss: insertAlert.actualLoss ?? null,
      status: insertAlert.status ?? 'open',
      assignedTo: insertAlert.assignedTo ?? null,
      priority: insertAlert.priority,
      investigationNotes: insertAlert.investigationNotes ?? null,
      resolutionDetails: insertAlert.resolutionDetails ?? null,
      resolvedAt: insertAlert.resolvedAt ?? null,
      metadata: insertAlert.metadata ?? null,
      tags: insertAlert.tags ?? null
    };
    this.fraudAlerts.set(id, alert);
    return alert;
  }

  async getFraudAlerts(status?: string, limit = 50): Promise<FraudAlert[]> {
    let alerts = Array.from(this.fraudAlerts.values());
    
    if (status) {
      alerts = alerts.filter(a => a.status === status);
    }
    
    return alerts
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  async updateFraudAlert(id: number, updateData: Partial<InsertFraudAlert>): Promise<FraudAlert | undefined> {
    const alert = this.fraudAlerts.get(id);
    if (!alert) return undefined;
    
    const updatedAlert: FraudAlert = { ...alert, ...updateData };
    this.fraudAlerts.set(id, updatedAlert);
    return updatedAlert;
  }

  // GPS operations - MemStorage
  async createGpsPoint(insertPoint: InsertGpsPoint): Promise<GpsPoint> {
    const id = this.getNextId('gpsPoints');
    const point: GpsPoint = {
      id,
      truckId: insertPoint.truckId,
      driverId: insertPoint.driverId ?? null,
      latitude: insertPoint.latitude,
      longitude: insertPoint.longitude,
      altitude: insertPoint.altitude ?? null,
      speed: insertPoint.speed ?? null,
      heading: insertPoint.heading ?? null,
      accuracy: insertPoint.accuracy ?? null,
      timestamp: new Date(),
      address: insertPoint.address ?? null,
      isMoving: insertPoint.isMoving ?? null,
      engineStatus: insertPoint.engineStatus ?? null,
      fuelLevel: insertPoint.fuelLevel ?? null,
      odometerReading: insertPoint.odometerReading ?? null
    };
    this.gpsPoints.set(id, point);
    return point;
  }

  async getGpsPoints(truckId: number, hours = 24): Promise<GpsPoint[]> {
    const timeLimit = new Date();
    timeLimit.setHours(timeLimit.getHours() - hours);
    
    return Array.from(this.gpsPoints.values())
      .filter(p => p.truckId === truckId && p.timestamp >= timeLimit)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }

  async getLatestGpsPoint(truckId: number): Promise<GpsPoint | undefined> {
    const points = Array.from(this.gpsPoints.values())
      .filter(p => p.truckId === truckId)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
    return points[0];
  }

  // Geofence Event operations - MemStorage
  async createGeofenceEvent(insertEvent: InsertGeofenceEvent): Promise<GeofenceEvent> {
    const id = this.getNextId('geofenceEvents');
    const event: GeofenceEvent = {
      id,
      truckId: insertEvent.truckId,
      driverId: insertEvent.driverId ?? null,
      geofenceId: insertEvent.geofenceId,
      eventType: insertEvent.eventType,
      timestamp: new Date(),
      location: insertEvent.location ?? null,
      speed: insertEvent.speed ?? null,
      duration: insertEvent.duration ?? null,
      authorized: insertEvent.authorized ?? null,
      alertGenerated: insertEvent.alertGenerated ?? null,
      notes: insertEvent.notes ?? null
    };
    this.geofenceEvents.set(id, event);
    return event;
  }

  async getGeofenceEvents(truckId?: number, geofenceId?: number, hours = 24): Promise<GeofenceEvent[]> {
    const timeLimit = new Date();
    timeLimit.setHours(timeLimit.getHours() - hours);
    
    let events = Array.from(this.geofenceEvents.values())
      .filter(e => e.timestamp >= timeLimit);
    
    if (truckId) {
      events = events.filter(e => e.truckId === truckId);
    }
    if (geofenceId) {
      events = events.filter(e => e.geofenceId === geofenceId);
    }
    
    return events.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }

  // API Log operations - MemStorage
  async createApiLog(insertLog: InsertApiLog): Promise<ApiLog> {
    const id = this.getNextId('apiLogs');
    const log: ApiLog = {
      id,
      vendorId: insertLog.vendorId,
      endpoint: insertLog.endpoint,
      method: insertLog.method,
      statusCode: insertLog.statusCode ?? null,
      responseTime: insertLog.responseTime ?? null,
      requestSize: insertLog.requestSize ?? null,
      responseSize: insertLog.responseSize ?? null,
      errorMessage: insertLog.errorMessage ?? null,
      timestamp: new Date(),
      successful: insertLog.successful ?? null
    };
    this.apiLogs.set(id, log);
    return log;
  }

  async getApiLogs(vendorId?: number, hours = 24): Promise<ApiLog[]> {
    const timeLimit = new Date();
    timeLimit.setHours(timeLimit.getHours() - hours);
    
    let logs = Array.from(this.apiLogs.values())
      .filter(l => l.timestamp >= timeLimit);
    
    if (vendorId) {
      logs = logs.filter(l => l.vendorId === vendorId);
    }
    
    return logs.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }

  // System Health operations - MemStorage
  async createSystemHealth(insertHealth: InsertSystemHealth): Promise<SystemHealth> {
    const id = this.getNextId('systemHealth');
    const health: SystemHealth = {
      id,
      component: insertHealth.component,
      status: insertHealth.status,
      metric: insertHealth.metric,
      value: insertHealth.value,
      threshold: insertHealth.threshold ?? null,
      message: insertHealth.message ?? null,
      timestamp: new Date()
    };
    this.systemHealth.set(id, health);
    return health;
  }

  async getSystemHealth(component?: string, hours = 24): Promise<SystemHealth[]> {
    const timeLimit = new Date();
    timeLimit.setHours(timeLimit.getHours() - hours);
    
    let health = Array.from(this.systemHealth.values())
      .filter(h => h.timestamp >= timeLimit);
    
    if (component) {
      health = health.filter(h => h.component === component);
    }
    
    return health.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }

  // AI Model operations - MemStorage
  async createAiModel(insertModel: InsertAiModel): Promise<AiModel> {
    const id = this.getNextId('aiModels');
    const model: AiModel = {
      id,
      name: insertModel.name,
      version: insertModel.version,
      modelType: insertModel.modelType,
      status: insertModel.status,
      accuracy: insertModel.accuracy ?? null,
      lastTrained: insertModel.lastTrained ?? null,
      deployedAt: insertModel.deployedAt ?? null,
      configuration: insertModel.configuration ?? null,
      performanceMetrics: insertModel.performanceMetrics ?? null
    };
    this.aiModels.set(id, model);
    return model;
  }

  async getAiModels(): Promise<AiModel[]> {
    return Array.from(this.aiModels.values());
  }

  async updateAiModel(id: number, updateData: Partial<InsertAiModel>): Promise<AiModel | undefined> {
    const model = this.aiModels.get(id);
    if (!model) return undefined;
    
    const updatedModel: AiModel = { ...model, ...updateData };
    this.aiModels.set(id, updatedModel);
    return updatedModel;
  }

  // Report Schedule operations - MemStorage
  async createReportSchedule(insertSchedule: InsertReportSchedule): Promise<ReportSchedule> {
    const id = this.getNextId('reportSchedules');
    const schedule: ReportSchedule = {
      id,
      name: insertSchedule.name,
      reportType: insertSchedule.reportType,
      schedule: insertSchedule.schedule,
      recipients: insertSchedule.recipients ?? null,
      parameters: insertSchedule.parameters ?? null,
      isActive: insertSchedule.isActive ?? null,
      lastRun: insertSchedule.lastRun ?? null,
      nextRun: insertSchedule.nextRun ?? null,
      createdBy: insertSchedule.createdBy ?? null,
      createdAt: new Date()
    };
    this.reportSchedules.set(id, schedule);
    return schedule;
  }

  async getReportSchedules(): Promise<ReportSchedule[]> {
    return Array.from(this.reportSchedules.values());
  }

  async updateReportSchedule(id: number, updateData: Partial<InsertReportSchedule>): Promise<ReportSchedule | undefined> {
    const schedule = this.reportSchedules.get(id);
    if (!schedule) return undefined;
    
    const updatedSchedule: ReportSchedule = { ...schedule, ...updateData };
    this.reportSchedules.set(id, updatedSchedule);
    return updatedSchedule;
  }

  // Additional utility methods - MemStorage
  async getCamera(id: number): Promise<Camera | undefined> {
    return this.cameras.get(id);
  }

  async getCameraByVendorId(vendorId: number, vendorCameraId: string): Promise<Camera | undefined> {
    return Array.from(this.cameras.values())
      .find(c => c.vendorId === vendorId && c.vendorCameraId === vendorCameraId);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const trucks = Array.from(this.trucks.values());
    const drivers = Array.from(this.drivers.values());
    const cameras = Array.from(this.cameras.values());
    const incidents = Array.from(this.aiIncidents.values());
    const alerts = Array.from(this.alerts.values());
    const scores = Array.from(this.driverScores.values());

    const activeTrucks = trucks.filter(t => t.status === 'online').length;
    const onlineDrivers = drivers.filter(d => d.status === 'active').length;
    const activeCameras = cameras.filter(c => c.status === 'online').length;
    const todayIncidents = incidents.filter(i => 
      i.timestamp && i.timestamp.toDateString() === new Date().toDateString()
    ).length;
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    const fraudAlerts = incidents.filter(i => i.incidentType === 'fraud').length;

    const totalScores = scores.length;
    const avgScore = totalScores > 0 
      ? scores.reduce((sum, s) => sum + (s.overallScore || 0), 0) / totalScores 
      : 0;

    return {
      totalTrucks: trucks.length,
      activeTrucks,
      onlineDrivers,
      activeCameras,
      todayIncidents,
      criticalAlerts,
      averageKpiScore: avgScore,
      fraudAlerts,
      systemHealth: criticalAlerts > 0 ? 'critical' : todayIncidents > 10 ? 'warning' : 'healthy'
    };
  }
}

// Use database storage if DATABASE_URL is provided, otherwise use memory storage
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
