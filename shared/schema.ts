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
  status: text("status").notNull(), // active, inactive
  trucksCount: integer("trucks_count").default(0),
});

export const cameras = pgTable("cameras", {
  id: serial("id").primaryKey(),
  truckId: integer("truck_id").notNull(),
  position: text("position").notNull(), // front, back, left, right
  streamUrl: text("stream_url"),
  status: text("status").notNull(), // online, offline, maintenance
  lastUpdate: timestamp("last_update").defaultNow(),
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
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  startLocation: text("start_location"),
  endLocation: text("end_location"),
  distance: real("distance"),
  duration: integer("duration"), // in minutes
  status: text("status").notNull(), // active, completed, cancelled
  kpiScore: real("kpi_score"),
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
