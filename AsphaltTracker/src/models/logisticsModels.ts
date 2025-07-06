// Enterprise Logistics and Supply Chain Models
// Comprehensive data models for real-world transportation operations

export interface Shipment {
  shipmentId: string;
  shipmentNumber: string; // Human-readable shipment number
  customerId: string;
  customerName: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';
  status: 'PLANNED' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'DELAYED' | 'EXCEPTION';
  
  // Shipment Details
  origin: Location;
  destination: Location;
  intermediateStops: Location[];
  totalDistance: number;
  estimatedDuration: number; // in minutes
  
  // Cargo Information
  cargo: CargoItem[];
  totalWeight: number;
  totalVolume: number;
  cargoValue: number;
  specialRequirements: string[];
  hazmatClass?: string;
  temperatureRequirements?: TemperatureRange;
  
  // Route Planning
  plannedRoute: RouteSegment[];
  actualRoute: RouteSegment[];
  geofences: Geofence[];
  routeOptimization: RouteOptimization;
  
  // Scheduling
  plannedPickupTime: Date;
  actualPickupTime?: Date;
  plannedDeliveryTime: Date;
  estimatedDeliveryTime: Date;
  actualDeliveryTime?: Date;
  
  // Vehicle Assignment
  assignedVehicleId: string;
  assignedDriverId: string;
  backupVehicleId?: string;
  
  // Documentation
  documents: ShipmentDocument[];
  proofOfDelivery?: ProofOfDelivery;
  
  // Compliance & Regulations
  regulatoryRequirements: RegulatoryRequirement[];
  permits: Permit[];
  inspections: Inspection[];
  
  // Financial
  rateQuote: RateQuote;
  actualCosts: ActualCosts;
  billingStatus: 'PENDING' | 'INVOICED' | 'PAID' | 'DISPUTED';
  
  // Tracking & Monitoring
  trackingEvents: TrackingEvent[];
  alerts: ShipmentAlert[];
  exceptions: ShipmentException[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
}

export interface Location {
  locationId: string;
  name: string;
  address: Address;
  coordinates: GeoCoordinates;
  locationType: 'WAREHOUSE' | 'CUSTOMER' | 'DISTRIBUTION_CENTER' | 'TERMINAL' | 'FUEL_STATION' | 'REST_AREA';
  contactInfo: ContactInfo;
  operatingHours: OperatingHours;
  loadingDocks: LoadingDock[];
  restrictions: LocationRestriction[];
  geofence: Geofence;
}

export interface CargoItem {
  itemId: string;
  description: string;
  quantity: number;
  unitOfMeasure: string;
  weight: number;
  dimensions: Dimensions;
  value: number;
  sku?: string;
  lotNumber?: string;
  serialNumbers?: string[];
  expirationDate?: Date;
  specialHandling: string[];
  packagingType: string;
  stackable: boolean;
  fragile: boolean;
}

export interface RouteSegment {
  segmentId: string;
  fromLocation: Location;
  toLocation: Location;
  distance: number;
  estimatedDuration: number;
  actualDuration?: number;
  roadType: 'HIGHWAY' | 'ARTERIAL' | 'LOCAL' | 'TOLL' | 'RESTRICTED';
  trafficConditions: TrafficCondition[];
  weatherConditions: WeatherCondition[];
  roadRestrictions: RoadRestriction[];
  tollCosts: number;
  fuelConsumption: number;
}

export interface Geofence {
  geofenceId: string;
  name: string;
  type: 'CIRCULAR' | 'POLYGON' | 'CORRIDOR';
  coordinates: GeoCoordinates[];
  radius?: number; // for circular geofences
  purpose: 'PICKUP' | 'DELIVERY' | 'RESTRICTED_AREA' | 'SPEED_ZONE' | 'CUSTOMER_ZONE' | 'DEPOT';
  rules: GeofenceRule[];
  alerts: GeofenceAlert[];
  isActive: boolean;
}

export interface GeofenceRule {
  ruleId: string;
  condition: 'ENTER' | 'EXIT' | 'DWELL' | 'SPEED_VIOLATION';
  threshold?: number; // for dwell time or speed
  action: 'ALERT' | 'NOTIFICATION' | 'AUTOMATIC_UPDATE' | 'ESCALATION';
  recipients: string[];
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface Vehicle {
  vehicleId: string;
  vehicleNumber: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  vehicleType: 'TRUCK' | 'TRAILER' | 'VAN' | 'FLATBED' | 'TANKER' | 'REFRIGERATED';
  
  // Capacity & Specifications
  maxWeight: number;
  maxVolume: number;
  dimensions: Dimensions;
  fuelType: 'DIESEL' | 'GASOLINE' | 'ELECTRIC' | 'HYBRID' | 'CNG' | 'LNG';
  fuelCapacity: number;
  
  // Equipment & Features
  equipment: VehicleEquipment[];
  telematics: TelematicsDevice;
  cameras: CameraSystem[];
  sensors: VehicleSensor[];
  
  // Status & Condition
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | 'RETIRED';
  currentLocation: GeoCoordinates;
  currentMileage: number;
  fuelLevel: number;
  batteryLevel?: number; // for electric vehicles
  
  // Maintenance & Compliance
  maintenanceSchedule: MaintenanceSchedule;
  inspections: VehicleInspection[];
  registrations: VehicleRegistration[];
  insurance: InsurancePolicy[];
  
  // Performance Metrics
  performanceMetrics: VehiclePerformanceMetrics;
  
  // Assignment
  assignedDriverId?: string;
  homeDepotId: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Driver {
  driverId: string;
  employeeId: string;
  personalInfo: PersonalInfo;
  contactInfo: ContactInfo;
  
  // Licensing & Certifications
  driverLicense: DriverLicense;
  cdlClass: 'A' | 'B' | 'C' | null;
  endorsements: string[];
  certifications: Certification[];
  medicalCertificate: MedicalCertificate;
  
  // Employment
  employmentStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TERMINATED';
  hireDate: Date;
  department: string;
  supervisor: string;
  
  // Performance & Safety
  safetyScore: number;
  performanceRating: number;
  violations: TrafficViolation[];
  accidents: Accident[];
  trainingRecords: TrainingRecord[];
  
  // Hours of Service (HOS)
  hosStatus: HOSStatus;
  dutyStatus: 'ON_DUTY' | 'OFF_DUTY' | 'DRIVING' | 'SLEEPER_BERTH';
  availableHours: AvailableHours;
  
  // Current Assignment
  currentVehicleId?: string;
  currentShipmentId?: string;
  currentLocation?: GeoCoordinates;
  
  // Preferences & Restrictions
  preferredRoutes: string[];
  restrictions: DriverRestriction[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface TrackingEvent {
  eventId: string;
  shipmentId: string;
  eventType: 'PICKUP' | 'DELIVERY' | 'DEPARTURE' | 'ARRIVAL' | 'DELAY' | 'EXCEPTION' | 'GEOFENCE_ENTRY' | 'GEOFENCE_EXIT';
  timestamp: Date;
  location: GeoCoordinates;
  description: string;
  source: 'DRIVER' | 'SYSTEM' | 'CUSTOMER' | 'TELEMATICS' | 'MANUAL';
  metadata: Record<string, any>;
  attachments: EventAttachment[];
}

export interface ShipmentException {
  exceptionId: string;
  shipmentId: string;
  type: 'DELAY' | 'ROUTE_DEVIATION' | 'DAMAGE' | 'THEFT' | 'BREAKDOWN' | 'WEATHER' | 'TRAFFIC' | 'CUSTOMER_UNAVAILABLE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  detectedAt: Date;
  resolvedAt?: Date;
  resolution?: string;
  impact: ExceptionImpact;
  escalationLevel: number;
  assignedTo: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
}

export interface RouteOptimization {
  optimizationId: string;
  algorithm: 'SHORTEST_DISTANCE' | 'FASTEST_TIME' | 'FUEL_EFFICIENT' | 'COST_OPTIMIZED' | 'MULTI_OBJECTIVE';
  constraints: OptimizationConstraint[];
  objectives: OptimizationObjective[];
  results: OptimizationResult;
  computedAt: Date;
  validUntil: Date;
}

export interface FleetManagement {
  fleetId: string;
  fleetName: string;
  vehicles: Vehicle[];
  drivers: Driver[];
  utilization: FleetUtilization;
  performance: FleetPerformance;
  costs: FleetCosts;
  maintenance: FleetMaintenance;
  compliance: FleetCompliance;
}

export interface SupplyChainVisibility {
  shipmentId: string;
  milestones: Milestone[];
  kpis: SupplyChainKPI[];
  risks: SupplyChainRisk[];
  opportunities: SupplyChainOpportunity[];
  predictions: SupplyChainPrediction[];
}

// Supporting interfaces
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  county?: string;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  timestamp?: Date;
}

export interface ContactInfo {
  primaryContact: string;
  phone: string;
  email: string;
  alternatePhone?: string;
  alternateEmail?: string;
}

export interface OperatingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
  holidays: HolidaySchedule[];
}

export interface DaySchedule {
  isOpen: boolean;
  openTime?: string; // HH:MM format
  closeTime?: string; // HH:MM format
  breaks?: TimeSlot[];
}

export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: 'INCHES' | 'FEET' | 'METERS' | 'CENTIMETERS';
}

export interface TemperatureRange {
  min: number;
  max: number;
  unit: 'CELSIUS' | 'FAHRENHEIT';
}

export interface RateQuote {
  quoteId: string;
  baseRate: number;
  fuelSurcharge: number;
  accessorialCharges: AccessorialCharge[];
  taxes: TaxCharge[];
  totalAmount: number;
  currency: string;
  validUntil: Date;
}

export interface ActualCosts {
  fuelCosts: number;
  laborCosts: number;
  maintenanceCosts: number;
  tollCosts: number;
  otherCosts: CostItem[];
  totalCosts: number;
}

export interface HOSStatus {
  drive: number; // hours driven today
  onDuty: number; // hours on duty today
  cycle: number; // hours in current cycle
  break: number; // time since last break
  lastReset: Date;
  violations: HOSViolation[];
}

export interface AvailableHours {
  driveRemaining: number;
  onDutyRemaining: number;
  cycleRemaining: number;
  breakRequired: boolean;
  resetAvailable: Date;
}
