// Enterprise Fleet Management Service
// Comprehensive vehicle and driver management with real-time monitoring

import { Vehicle, Driver, FleetManagement, HOSStatus, VehiclePerformanceMetrics } from '../models/logisticsModels';

export class FleetManagementService {
  private vehicles: Map<string, Vehicle> = new Map();
  private drivers: Map<string, Driver> = new Map();
  private fleets: Map<string, FleetManagement> = new Map();
  private vehicleLocations: Map<string, any> = new Map();
  private driverHOS: Map<string, HOSStatus> = new Map();

  /**
   * Vehicle Management
   */
  async addVehicle(vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    const vehicleId = this.generateVehicleId();
    
    const vehicle: Vehicle = {
      vehicleId,
      vehicleNumber: vehicleData.vehicleNumber!,
      vin: vehicleData.vin!,
      make: vehicleData.make!,
      model: vehicleData.model!,
      year: vehicleData.year!,
      vehicleType: vehicleData.vehicleType!,
      
      // Capacity
      maxWeight: vehicleData.maxWeight!,
      maxVolume: vehicleData.maxVolume!,
      dimensions: vehicleData.dimensions!,
      fuelType: vehicleData.fuelType!,
      fuelCapacity: vehicleData.fuelCapacity!,
      
      // Equipment
      equipment: vehicleData.equipment || [],
      telematics: vehicleData.telematics!,
      cameras: vehicleData.cameras || [],
      sensors: vehicleData.sensors || [],
      
      // Status
      status: 'AVAILABLE',
      currentLocation: { latitude: 0, longitude: 0 },
      currentMileage: vehicleData.currentMileage || 0,
      fuelLevel: 100,
      
      // Maintenance
      maintenanceSchedule: vehicleData.maintenanceSchedule!,
      inspections: [],
      registrations: vehicleData.registrations || [],
      insurance: vehicleData.insurance || [],
      
      // Performance
      performanceMetrics: {
        fuelEfficiency: 0,
        averageSpeed: 0,
        idleTime: 0,
        maintenanceCosts: 0,
        utilizationRate: 0,
        safetyScore: 100
      },
      
      // Assignment
      homeDepotId: vehicleData.homeDepotId!,
      
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.vehicles.set(vehicleId, vehicle);
    console.log(`🚛 Vehicle ${vehicle.vehicleNumber} added to fleet`);
    return vehicle;
  }

  async updateVehicleLocation(vehicleId: string, location: any, telemetryData?: any): Promise<void> {
    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle) return;

    vehicle.currentLocation = location;
    vehicle.updatedAt = new Date();

    // Update telemetry data
    if (telemetryData) {
      vehicle.fuelLevel = telemetryData.fuelLevel || vehicle.fuelLevel;
      vehicle.currentMileage = telemetryData.mileage || vehicle.currentMileage;
      
      if (telemetryData.batteryLevel !== undefined) {
        vehicle.batteryLevel = telemetryData.batteryLevel;
      }
    }

    // Store location history
    this.vehicleLocations.set(vehicleId, {
      ...location,
      timestamp: new Date(),
      telemetry: telemetryData
    });

    // Update performance metrics
    await this.updateVehiclePerformanceMetrics(vehicleId, telemetryData);
  }

  async getVehiclesByStatus(status: string[]): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values())
      .filter(vehicle => status.includes(vehicle.status));
  }

  async getAvailableVehicles(requirements?: {
    vehicleType?: string;
    minCapacity?: number;
    location?: any;
    radius?: number;
  }): Promise<Vehicle[]> {
    let vehicles = Array.from(this.vehicles.values())
      .filter(v => v.status === 'AVAILABLE');

    if (requirements?.vehicleType) {
      vehicles = vehicles.filter(v => v.vehicleType === requirements.vehicleType);
    }

    if (requirements?.minCapacity) {
      vehicles = vehicles.filter(v => v.maxWeight >= requirements.minCapacity);
    }

    if (requirements?.location && requirements?.radius) {
      vehicles = vehicles.filter(v => 
        this.calculateDistance(v.currentLocation, requirements.location!) <= requirements.radius!
      );
    }

    return vehicles;
  }

  /**
   * Driver Management
   */
  async addDriver(driverData: Partial<Driver>): Promise<Driver> {
    const driverId = this.generateDriverId();
    
    const driver: Driver = {
      driverId,
      employeeId: driverData.employeeId!,
      personalInfo: driverData.personalInfo!,
      contactInfo: driverData.contactInfo!,
      
      // Licensing
      driverLicense: driverData.driverLicense!,
      cdlClass: driverData.cdlClass || null,
      endorsements: driverData.endorsements || [],
      certifications: driverData.certifications || [],
      medicalCertificate: driverData.medicalCertificate!,
      
      // Employment
      employmentStatus: 'ACTIVE',
      hireDate: driverData.hireDate!,
      department: driverData.department!,
      supervisor: driverData.supervisor!,
      
      // Performance
      safetyScore: 100,
      performanceRating: 5,
      violations: [],
      accidents: [],
      trainingRecords: [],
      
      // HOS
      hosStatus: {
        drive: 0,
        onDuty: 0,
        cycle: 0,
        break: 0,
        lastReset: new Date(),
        violations: []
      },
      dutyStatus: 'OFF_DUTY',
      availableHours: {
        driveRemaining: 11,
        onDutyRemaining: 14,
        cycleRemaining: 70,
        breakRequired: false,
        resetAvailable: new Date()
      },
      
      // Preferences
      preferredRoutes: driverData.preferredRoutes || [],
      restrictions: driverData.restrictions || [],
      
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.drivers.set(driverId, driver);
    this.driverHOS.set(driverId, driver.hosStatus);
    
    console.log(`👨‍💼 Driver ${driver.personalInfo.firstName} ${driver.personalInfo.lastName} added to fleet`);
    return driver;
  }

  async updateDriverHOS(driverId: string, dutyStatus: string, location?: any): Promise<void> {
    const driver = this.drivers.get(driverId);
    if (!driver) return;

    const now = new Date();
    const hosStatus = this.driverHOS.get(driverId)!;

    // Calculate time since last update
    const timeDiff = (now.getTime() - driver.updatedAt.getTime()) / (1000 * 60 * 60); // hours

    // Update HOS based on previous duty status
    switch (driver.dutyStatus) {
      case 'DRIVING':
        hosStatus.drive += timeDiff;
        hosStatus.onDuty += timeDiff;
        break;
      case 'ON_DUTY':
        hosStatus.onDuty += timeDiff;
        break;
      case 'OFF_DUTY':
        hosStatus.break += timeDiff;
        break;
    }

    // Update duty status
    driver.dutyStatus = dutyStatus as any;
    driver.updatedAt = now;

    // Calculate available hours
    driver.availableHours = {
      driveRemaining: Math.max(0, 11 - hosStatus.drive),
      onDutyRemaining: Math.max(0, 14 - hosStatus.onDuty),
      cycleRemaining: Math.max(0, 70 - hosStatus.cycle),
      breakRequired: hosStatus.drive >= 8 && hosStatus.break < 0.5,
      resetAvailable: new Date(hosStatus.lastReset.getTime() + 34 * 60 * 60 * 1000) // 34 hours
    };

    // Check for violations
    await this.checkHOSViolations(driverId);

    console.log(`⏰ HOS updated for driver ${driver.employeeId}: ${dutyStatus}`);
  }

  async getAvailableDrivers(requirements?: {
    cdlClass?: string;
    endorsements?: string[];
    location?: any;
    radius?: number;
    minAvailableHours?: number;
  }): Promise<Driver[]> {
    let drivers = Array.from(this.drivers.values())
      .filter(d => d.employmentStatus === 'ACTIVE' && d.dutyStatus === 'OFF_DUTY');

    if (requirements?.cdlClass) {
      drivers = drivers.filter(d => d.cdlClass === requirements.cdlClass);
    }

    if (requirements?.endorsements) {
      drivers = drivers.filter(d => 
        requirements.endorsements!.every(e => d.endorsements.includes(e))
      );
    }

    if (requirements?.minAvailableHours) {
      drivers = drivers.filter(d => 
        d.availableHours.driveRemaining >= requirements.minAvailableHours!
      );
    }

    return drivers;
  }

  /**
   * Fleet Analytics and Reporting
   */
  async getFleetUtilization(fleetId?: string): Promise<any> {
    const vehicles = fleetId 
      ? this.fleets.get(fleetId)?.vehicles || []
      : Array.from(this.vehicles.values());

    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter(v => v.status === 'IN_USE').length;
    const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE').length;
    const maintenanceVehicles = vehicles.filter(v => v.status === 'MAINTENANCE').length;

    return {
      totalVehicles,
      activeVehicles,
      availableVehicles,
      maintenanceVehicles,
      utilizationRate: totalVehicles > 0 ? (activeVehicles / totalVehicles) * 100 : 0,
      availabilityRate: totalVehicles > 0 ? (availableVehicles / totalVehicles) * 100 : 0
    };
  }

  async getFleetPerformanceMetrics(fleetId?: string): Promise<any> {
    const vehicles = fleetId 
      ? this.fleets.get(fleetId)?.vehicles || []
      : Array.from(this.vehicles.values());

    const metrics = vehicles.map(v => v.performanceMetrics);
    
    return {
      averageFuelEfficiency: this.calculateAverage(metrics.map(m => m.fuelEfficiency)),
      averageSpeed: this.calculateAverage(metrics.map(m => m.averageSpeed)),
      totalIdleTime: metrics.reduce((sum, m) => sum + m.idleTime, 0),
      totalMaintenanceCosts: metrics.reduce((sum, m) => sum + m.maintenanceCosts, 0),
      averageUtilization: this.calculateAverage(metrics.map(m => m.utilizationRate)),
      averageSafetyScore: this.calculateAverage(metrics.map(m => m.safetyScore))
    };
  }

  async getDriverPerformanceMetrics(driverId?: string): Promise<any> {
    const drivers = driverId 
      ? [this.drivers.get(driverId)].filter(Boolean)
      : Array.from(this.drivers.values());

    return {
      totalDrivers: drivers.length,
      averageSafetyScore: this.calculateAverage(drivers.map(d => d.safetyScore)),
      averagePerformanceRating: this.calculateAverage(drivers.map(d => d.performanceRating)),
      totalViolations: drivers.reduce((sum, d) => sum + d.violations.length, 0),
      totalAccidents: drivers.reduce((sum, d) => sum + d.accidents.length, 0),
      hosCompliance: this.calculateHOSCompliance(drivers)
    };
  }

  /**
   * Maintenance Management
   */
  async scheduleMaintenanceCheck(vehicleId: string, maintenanceType: string, scheduledDate: Date): Promise<void> {
    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle) return;

    const maintenanceItem = {
      id: `MAINT-${Date.now()}`,
      type: maintenanceType,
      scheduledDate,
      status: 'SCHEDULED',
      description: `${maintenanceType} maintenance for ${vehicle.vehicleNumber}`,
      estimatedCost: this.estimateMaintenanceCost(maintenanceType),
      estimatedDuration: this.estimateMaintenanceDuration(maintenanceType)
    };

    // Add to vehicle maintenance schedule
    if (!vehicle.maintenanceSchedule.upcomingMaintenance) {
      vehicle.maintenanceSchedule.upcomingMaintenance = [];
    }
    vehicle.maintenanceSchedule.upcomingMaintenance.push(maintenanceItem);

    console.log(`🔧 Maintenance scheduled for vehicle ${vehicle.vehicleNumber}: ${maintenanceType}`);
  }

  async getMaintenanceAlerts(): Promise<any[]> {
    const alerts = [];
    
    for (const vehicle of this.vehicles.values()) {
      // Check mileage-based maintenance
      if (vehicle.currentMileage >= vehicle.maintenanceSchedule.nextServiceMileage) {
        alerts.push({
          vehicleId: vehicle.vehicleId,
          vehicleNumber: vehicle.vehicleNumber,
          type: 'MILEAGE_MAINTENANCE',
          severity: 'HIGH',
          message: `Vehicle ${vehicle.vehicleNumber} is due for mileage-based maintenance`,
          dueDate: new Date()
        });
      }

      // Check time-based maintenance
      if (new Date() >= vehicle.maintenanceSchedule.nextServiceDate) {
        alerts.push({
          vehicleId: vehicle.vehicleId,
          vehicleNumber: vehicle.vehicleNumber,
          type: 'TIME_MAINTENANCE',
          severity: 'MEDIUM',
          message: `Vehicle ${vehicle.vehicleNumber} is due for scheduled maintenance`,
          dueDate: vehicle.maintenanceSchedule.nextServiceDate
        });
      }
    }

    return alerts;
  }

  // Private helper methods
  private generateVehicleId(): string {
    return `VEH-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  private generateDriverId(): string {
    return `DRV-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  private calculateDistance(point1: any, point2: any): number {
    // Haversine formula for distance calculation
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private async updateVehiclePerformanceMetrics(vehicleId: string, telemetryData: any): Promise<void> {
    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle || !telemetryData) return;

    // Update fuel efficiency
    if (telemetryData.fuelConsumption && telemetryData.distance) {
      vehicle.performanceMetrics.fuelEfficiency = telemetryData.distance / telemetryData.fuelConsumption;
    }

    // Update average speed
    if (telemetryData.speed) {
      vehicle.performanceMetrics.averageSpeed = 
        (vehicle.performanceMetrics.averageSpeed + telemetryData.speed) / 2;
    }

    // Update idle time
    if (telemetryData.isIdle) {
      vehicle.performanceMetrics.idleTime += 1; // increment by 1 minute
    }
  }

  private async checkHOSViolations(driverId: string): Promise<void> {
    const driver = this.drivers.get(driverId);
    const hosStatus = this.driverHOS.get(driverId);
    if (!driver || !hosStatus) return;

    const violations = [];

    // Check drive time violation (11 hours max)
    if (hosStatus.drive > 11) {
      violations.push({
        type: 'DRIVE_TIME_EXCEEDED',
        severity: 'CRITICAL',
        description: 'Driver exceeded 11-hour drive limit',
        timestamp: new Date()
      });
    }

    // Check on-duty time violation (14 hours max)
    if (hosStatus.onDuty > 14) {
      violations.push({
        type: 'ON_DUTY_TIME_EXCEEDED',
        severity: 'CRITICAL',
        description: 'Driver exceeded 14-hour on-duty limit',
        timestamp: new Date()
      });
    }

    // Check break requirement (30 minutes after 8 hours)
    if (hosStatus.drive >= 8 && hosStatus.break < 0.5) {
      violations.push({
        type: 'BREAK_REQUIRED',
        severity: 'HIGH',
        description: 'Driver requires 30-minute break',
        timestamp: new Date()
      });
    }

    hosStatus.violations.push(...violations);
    
    if (violations.length > 0) {
      console.log(`⚠️ HOS violations detected for driver ${driver.employeeId}`);
    }
  }

  private calculateHOSCompliance(drivers: Driver[]): number {
    const totalDrivers = drivers.length;
    if (totalDrivers === 0) return 100;

    const compliantDrivers = drivers.filter(d => 
      this.driverHOS.get(d.driverId)?.violations.length === 0
    ).length;

    return (compliantDrivers / totalDrivers) * 100;
  }

  private estimateMaintenanceCost(maintenanceType: string): number {
    const costs = {
      'OIL_CHANGE': 150,
      'TIRE_ROTATION': 100,
      'BRAKE_INSPECTION': 200,
      'ENGINE_SERVICE': 500,
      'TRANSMISSION_SERVICE': 300,
      'ANNUAL_INSPECTION': 250
    };
    return costs[maintenanceType] || 200;
  }

  private estimateMaintenanceDuration(maintenanceType: string): number {
    const durations = {
      'OIL_CHANGE': 2, // hours
      'TIRE_ROTATION': 1,
      'BRAKE_INSPECTION': 3,
      'ENGINE_SERVICE': 8,
      'TRANSMISSION_SERVICE': 6,
      'ANNUAL_INSPECTION': 4
    };
    return durations[maintenanceType] || 3;
  }
}

export default FleetManagementService;
