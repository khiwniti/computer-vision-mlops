import { 
  users, trucks, drivers, vendors, cameras, geofences, alerts, trips,
  type User, type InsertUser, type Truck, type InsertTruck, 
  type Driver, type InsertDriver, type Vendor, type InsertVendor,
  type Camera, type InsertCamera, type Geofence, type InsertGeofence,
  type Alert, type InsertAlert, type Trip, type InsertTrip
} from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private trucks: Map<number, Truck> = new Map();
  private drivers: Map<number, Driver> = new Map();
  private vendors: Map<number, Vendor> = new Map();
  private cameras: Map<number, Camera> = new Map();
  private geofences: Map<number, Geofence> = new Map();
  private alerts: Map<number, Alert> = new Map();
  private trips: Map<number, Trip> = new Map();
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
      ...insertTruck, 
      id, 
      lastUpdate: new Date() 
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
    const driver: Driver = { ...insertDriver, id };
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
    const vendor: Vendor = { ...insertVendor, id };
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
      ...insertCamera, 
      id, 
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
    const geofence: Geofence = { ...insertGeofence, id };
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
      ...insertAlert, 
      id, 
      timestamp: new Date() 
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
    const trip: Trip = { ...insertTrip, id };
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
}

export const storage = new MemStorage();
