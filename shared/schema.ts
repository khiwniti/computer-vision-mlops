import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const trucks = pgTable("trucks", {
  id: serial("id").primaryKey(),
  truckNumber: text("truck_number").notNull().unique(),
  driverId: integer("driver_id"),
  vendorId: integer("vendor_id"),
  status: text("status").notNull(), // online, offline, idle, maintenance
  latitude: real("latitude"),
  longitude: real("longitude"),
  speed: real("speed"),
  heading: real("heading"),
  lastUpdate: timestamp("last_update").defaultNow(),
  kpiScore: real("kpi_score"),
  location: text("location"),
});

export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  licenseNumber: text("license_number").notNull().unique(),
  phone: text("phone"),
  email: text("email"),
  vendorId: integer("vendor_id"),
  status: text("status").notNull(), // active, inactive, suspended
  kpiScore: real("kpi_score"),
  totalTrips: integer("total_trips").default(0),
  safetyScore: real("safety_score"),
});

export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  phone: text("phone"),
  email: text("email"),
  apiEndpoint: text("api_endpoint"),
  apiKey: text("api_key"),
  apiType: text("api_type").notNull(), // hikvision, dahua, axis, custom
  authConfig: jsonb("auth_config"), // vendor-specific auth configuration
  endpoints: jsonb("endpoints"), // vendor-specific API endpoints
  capabilities: jsonb("capabilities"), // supported features (live_stream, recordings, ptz, etc.)
  status: text("status").notNull(), // active, inactive, error
  lastHealthCheck: timestamp("last_health_check"),
  trucksCount: integer("trucks_count").default(0),
  connectionStatus: text("connection_status").default("unknown"), // connected, disconnected, error
});

export const cameras = pgTable("cameras", {
  id: serial("id").primaryKey(),
  truckId: integer("truck_id").notNull(),
  vendorId: integer("vendor_id").notNull(),
  position: text("position").notNull(), // front, back, left, right, driver_facing, cargo
  streamUrl: text("stream_url"),
  recordingUrl: text("recording_url"),
  vendorCameraId: text("vendor_camera_id"), // vendor's internal camera ID
  resolution: text("resolution"), // 1080p, 4K, etc.
  capabilities: jsonb("capabilities"), // night_vision, audio, ptz, motion_detection
  aiEnabled: boolean("ai_enabled").default(true),
  status: text("status").notNull(), // online, offline, maintenance, error
  lastUpdate: timestamp("last_update").defaultNow(),
  lastFrame: timestamp("last_frame"),
  frameRate: real("frame_rate"),
  quality: text("quality"), // high, medium, low
});

export const geofences = pgTable("geofences", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // circular, polygon
  coordinates: jsonb("coordinates").notNull(),
  radius: real("radius"), // for circular geofences
  isActive: boolean("is_active").default(true),
  alertOnEnter: boolean("alert_on_enter").default(false),
  alertOnExit: boolean("alert_on_exit").default(false),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  truckId: integer("truck_id"),
  driverId: integer("driver_id"),
  type: text("type").notNull(), // speed_violation, geofence_violation, camera_offline, fraud_detection
  severity: text("severity").notNull(), // low, medium, high, critical
  title: text("title").notNull(),
  description: text("description"),
  timestamp: timestamp("timestamp").defaultNow(),
  acknowledged: boolean("acknowledged").default(false),
  resolvedAt: timestamp("resolved_at"),
});

export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  truckId: integer("truck_id").notNull(),
  driverId: integer("driver_id").notNull(),
  shipmentId: integer("shipment_id"), // Link trips to shipments
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  startLocation: text("start_location"),
  endLocation: text("end_location"),
  distance: real("distance"),
  duration: integer("duration"), // in minutes
  status: text("status").notNull(), // active, completed, cancelled
  kpiScore: real("kpi_score"),
});

export const shipments = pgTable("shipments", {
  id: serial("id").primaryKey(),
  shipmentNumber: text("shipment_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  plannedDeparture: timestamp("planned_departure").notNull(),
  actualDeparture: timestamp("actual_departure"),
  plannedArrival: timestamp("planned_arrival").notNull(),
  actualArrival: timestamp("actual_arrival"),
  status: text("status").notNull(), // planned, in_progress, completed, cancelled, delayed
  priority: text("priority").notNull(), // low, medium, high, urgent
  totalTrucks: integer("total_trucks").default(0),
  activeTrucks: integer("active_trucks").default(0),
  completedTrucks: integer("completed_trucks").default(0),
  estimatedDistance: real("estimated_distance"),
  actualDistance: real("actual_distance"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const shipmentTrucks = pgTable("shipment_trucks", {
  id: serial("id").primaryKey(),
  shipmentId: integer("shipment_id").notNull(),
  truckId: integer("truck_id").notNull(),
  driverId: integer("driver_id").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  position: integer("position"), // Position in convoy (1-10)
  status: text("status").notNull(), // assigned, departed, in_transit, arrived, completed
  departureTime: timestamp("departure_time"),
  arrivalTime: timestamp("arrival_time"),
  currentDistance: real("current_distance"),
  estimatedArrival: timestamp("estimated_arrival"),
});

// AI Monitoring and Analytics Tables

export const aiIncidents = pgTable("ai_incidents", {
  id: serial("id").primaryKey(),
  truckId: integer("truck_id").notNull(),
  driverId: integer("driver_id"),
  cameraId: integer("camera_id").notNull(),
  incidentType: text("incident_type").notNull(), // drowsiness, phone_usage, seatbelt, smoking, harsh_driving, fraud
  severity: text("severity").notNull(), // low, medium, high, critical
  confidence: real("confidence").notNull(), // AI confidence score 0-1
  description: text("description").notNull(),
  videoClipUrl: text("video_clip_url"),
  imageUrl: text("image_url"),
  metadata: jsonb("metadata"), // additional AI analysis data
  timestamp: timestamp("timestamp").defaultNow(),
  location: jsonb("location"), // lat, lng, address
  acknowledged: boolean("acknowledged").default(false),
  reviewedBy: integer("reviewed_by"), // user who reviewed
  reviewedAt: timestamp("reviewed_at"),
  falsePositive: boolean("false_positive").default(false),
  actionTaken: text("action_taken"),
});

export const driverScores = pgTable("driver_scores", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull(),
  date: timestamp("date").notNull(),
  shiftStart: timestamp("shift_start"),
  shiftEnd: timestamp("shift_end"),
  
  // Core KPI Scores (0-100)
  overallScore: real("overall_score").notNull(),
  safetyScore: real("safety_score").notNull(),
  efficiencyScore: real("efficiency_score").notNull(),
  complianceScore: real("compliance_score").notNull(),
  
  // Safety Metrics
  drowsinessEvents: integer("drowsiness_events").default(0),
  phoneUsageEvents: integer("phone_usage_events").default(0),
  seatbeltViolations: integer("seatbelt_violations").default(0),
  smokingEvents: integer("smoking_events").default(0),
  harshBrakingEvents: integer("harsh_braking_events").default(0),
  harshAccelerationEvents: integer("harsh_acceleration_events").default(0),
  speedingViolations: integer("speeding_violations").default(0),
  
  // Efficiency Metrics
  totalDistance: real("total_distance").default(0),
  totalDuration: integer("total_duration").default(0), // minutes
  fuelEfficiency: real("fuel_efficiency"),
  routeAdherence: real("route_adherence"), // percentage
  onTimeDeliveries: integer("on_time_deliveries").default(0),
  lateDeliveries: integer("late_deliveries").default(0),
  
  // Compliance Metrics
  documentationComplete: boolean("documentation_complete").default(true),
  communicationScore: real("communication_score"),
  policyViolations: integer("policy_violations").default(0),
  
  // Calculated fields
  milesPerHour: real("miles_per_hour"),
  incidentsPerMile: real("incidents_per_mile"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const fraudAlerts = pgTable("fraud_alerts", {
  id: serial("id").primaryKey(),
  truckId: integer("truck_id").notNull(),
  driverId: integer("driver_id"),
  alertType: text("alert_type").notNull(), // route_deviation, unauthorized_stop, cargo_tampering, time_manipulation, fuel_theft
  severity: text("severity").notNull(), // low, medium, high, critical
  description: text("description").notNull(),
  evidenceUrls: jsonb("evidence_urls"), // video clips, images, documents
  detectedBy: text("detected_by").notNull(), // ai, gps, manual, sensor
  
  // Location and timing
  location: jsonb("location"),
  timestamp: timestamp("timestamp").defaultNow(),
  duration: integer("duration"), // in minutes
  
  // Financial impact
  estimatedLoss: real("estimated_loss"),
  actualLoss: real("actual_loss"),
  
  // Investigation
  status: text("status").default("open"), // open, investigating, resolved, false_positive
  assignedTo: integer("assigned_to"), // investigator user ID
  priority: text("priority").notNull(), // low, medium, high, urgent
  investigationNotes: text("investigation_notes"),
  resolutionDetails: text("resolution_details"),
  resolvedAt: timestamp("resolved_at"),
  
  // Metadata
  metadata: jsonb("metadata"), // additional analysis data
  tags: jsonb("tags"), // custom tags for categorization
});

export const gpsPoints = pgTable("gps_points", {
  id: serial("id").primaryKey(),
  truckId: integer("truck_id").notNull(),
  driverId: integer("driver_id"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  altitude: real("altitude"),
  speed: real("speed"), // mph or km/h
  heading: real("heading"), // degrees
  accuracy: real("accuracy"), // GPS accuracy in meters
  timestamp: timestamp("timestamp").defaultNow(),
  address: text("address"), // reverse geocoded address
  isMoving: boolean("is_moving").default(true),
  engineStatus: text("engine_status"), // on, off, idle
  fuelLevel: real("fuel_level"), // percentage
  odometerReading: real("odometer_reading"),
});

export const geofenceEvents = pgTable("geofence_events", {
  id: serial("id").primaryKey(),
  truckId: integer("truck_id").notNull(),
  driverId: integer("driver_id"),
  geofenceId: integer("geofence_id").notNull(),
  eventType: text("event_type").notNull(), // enter, exit, dwell
  timestamp: timestamp("timestamp").defaultNow(),
  location: jsonb("location"), // lat, lng where event occurred
  speed: real("speed"),
  duration: integer("duration"), // for dwell events, in minutes
  authorized: boolean("authorized").default(true),
  alertGenerated: boolean("alert_generated").default(false),
  notes: text("notes"),
});

export const apiLogs = pgTable("api_logs", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull(),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(), // GET, POST, PUT, DELETE
  statusCode: integer("status_code"),
  responseTime: integer("response_time"), // milliseconds
  requestSize: integer("request_size"), // bytes
  responseSize: integer("response_size"), // bytes
  errorMessage: text("error_message"),
  timestamp: timestamp("timestamp").defaultNow(),
  successful: boolean("successful").default(true),
});

export const systemHealth = pgTable("system_health", {
  id: serial("id").primaryKey(),
  component: text("component").notNull(), // camera, gps, ai_processor, database
  status: text("status").notNull(), // healthy, warning, critical, down
  metric: text("metric").notNull(), // cpu_usage, memory_usage, disk_space, response_time
  value: real("value").notNull(),
  threshold: real("threshold"),
  message: text("message"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const aiModels = pgTable("ai_models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  version: text("version").notNull(),
  modelType: text("model_type").notNull(), // driver_behavior, fraud_detection, object_detection
  status: text("status").notNull(), // active, inactive, training, updating
  accuracy: real("accuracy"), // model accuracy score
  lastTrained: timestamp("last_trained"),
  deployedAt: timestamp("deployed_at"),
  configuration: jsonb("configuration"),
  performanceMetrics: jsonb("performance_metrics"),
});

export const reportSchedules = pgTable("report_schedules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  reportType: text("report_type").notNull(), // daily_kpi, weekly_summary, monthly_analysis, fraud_report
  schedule: text("schedule").notNull(), // cron expression
  recipients: jsonb("recipients"), // email addresses
  parameters: jsonb("parameters"), // report configuration
  isActive: boolean("is_active").default(true),
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTruckSchema = createInsertSchema(trucks).omit({
  id: true,
  lastUpdate: true,
});

export const insertDriverSchema = createInsertSchema(drivers).omit({
  id: true,
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
});

export const insertCameraSchema = createInsertSchema(cameras).omit({
  id: true,
  lastUpdate: true,
});

export const insertGeofenceSchema = createInsertSchema(geofences).omit({
  id: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  timestamp: true,
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
});

export const insertShipmentSchema = createInsertSchema(shipments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShipmentTruckSchema = createInsertSchema(shipmentTrucks).omit({
  id: true,
  assignedAt: true,
});

// AI Monitoring Insert Schemas
export const insertAiIncidentSchema = createInsertSchema(aiIncidents).omit({
  id: true,
  timestamp: true,
});

export const insertDriverScoreSchema = createInsertSchema(driverScores).omit({
  id: true,
  createdAt: true,
});

export const insertFraudAlertSchema = createInsertSchema(fraudAlerts).omit({
  id: true,
  timestamp: true,
});

export const insertGpsPointSchema = createInsertSchema(gpsPoints).omit({
  id: true,
  timestamp: true,
});

export const insertGeofenceEventSchema = createInsertSchema(geofenceEvents).omit({
  id: true,
  timestamp: true,
});

export const insertApiLogSchema = createInsertSchema(apiLogs).omit({
  id: true,
  timestamp: true,
});

export const insertSystemHealthSchema = createInsertSchema(systemHealth).omit({
  id: true,
  timestamp: true,
});

export const insertAiModelSchema = createInsertSchema(aiModels).omit({
  id: true,
});

export const insertReportScheduleSchema = createInsertSchema(reportSchedules).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Truck = typeof trucks.$inferSelect;
export type InsertTruck = z.infer<typeof insertTruckSchema>;

export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = z.infer<typeof insertDriverSchema>;

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;

export type Camera = typeof cameras.$inferSelect;
export type InsertCamera = z.infer<typeof insertCameraSchema>;

export type Geofence = typeof geofences.$inferSelect;
export type InsertGeofence = z.infer<typeof insertGeofenceSchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;

export type Shipment = typeof shipments.$inferSelect;
export type InsertShipment = z.infer<typeof insertShipmentSchema>;

export type ShipmentTruck = typeof shipmentTrucks.$inferSelect;
export type InsertShipmentTruck = z.infer<typeof insertShipmentTruckSchema>;

// AI Monitoring Types
export type AiIncident = typeof aiIncidents.$inferSelect;
export type InsertAiIncident = z.infer<typeof insertAiIncidentSchema>;

export type DriverScore = typeof driverScores.$inferSelect;
export type InsertDriverScore = z.infer<typeof insertDriverScoreSchema>;

export type FraudAlert = typeof fraudAlerts.$inferSelect;
export type InsertFraudAlert = z.infer<typeof insertFraudAlertSchema>;

export type GpsPoint = typeof gpsPoints.$inferSelect;
export type InsertGpsPoint = z.infer<typeof insertGpsPointSchema>;

export type GeofenceEvent = typeof geofenceEvents.$inferSelect;
export type InsertGeofenceEvent = z.infer<typeof insertGeofenceEventSchema>;

export type ApiLog = typeof apiLogs.$inferSelect;
export type InsertApiLog = z.infer<typeof insertApiLogSchema>;

export type SystemHealth = typeof systemHealth.$inferSelect;
export type InsertSystemHealth = z.infer<typeof insertSystemHealthSchema>;

export type AiModel = typeof aiModels.$inferSelect;
export type InsertAiModel = z.infer<typeof insertAiModelSchema>;

export type ReportSchedule = typeof reportSchedules.$inferSelect;
export type InsertReportSchedule = z.infer<typeof insertReportScheduleSchema>;

// Compound Types for Complex Queries
export interface TruckWithCameras extends Truck {
  cameras: Camera[];
  driver?: Driver;
  vendor?: Vendor;
  currentLocation?: GpsPoint;
  latestScore?: DriverScore;
}

export interface DriverWithScores extends Driver {
  scores: DriverScore[];
  currentTruck?: Truck;
  recentIncidents: AiIncident[];
  activeAlerts: Alert[];
}

export interface VendorWithStatus extends Vendor {
  trucks: Truck[];
  cameras: Camera[];
  lastApiCall?: ApiLog;
  healthStatus: 'healthy' | 'warning' | 'error';
}

export interface LiveMonitoringData {
  truck: TruckWithCameras;
  liveGps: GpsPoint;
  activeCameras: Camera[];
  recentIncidents: AiIncident[];
  currentScore: DriverScore;
  activeAlerts: Alert[];
}

export interface DashboardStats {
  totalTrucks: number;
  activeTrucks: number;
  onlineDrivers: number;
  activeCameras: number;
  todayIncidents: number;
  criticalAlerts: number;
  averageKpiScore: number;
  fraudAlerts: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}
