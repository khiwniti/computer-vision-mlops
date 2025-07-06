// API response types for the frontend
export interface Truck {
  id: number;
  truckNumber: string;
  driverId: number | null;
  vendorId: number | null;
  status: string;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  heading: number | null;
  lastUpdate: string | null;
  kpiScore: number | null;
  location: string | null;
}

export interface Driver {
  id: number;
  name: string;
  licenseNumber: string;
  phone: string | null;
  email: string | null;
  vendorId: number | null;
  status: string;
  kpiScore: number | null;
  totalTrips: number | null;
  safetyScore: number | null;
}

export interface Vendor {
  id: number;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  apiEndpoint: string | null;
  apiKey: string | null;
  status: string;
  trucksCount: number | null;
}

export interface Camera {
  id: number;
  truckId: number;
  position: string;
  streamUrl: string | null;
  status: string;
  lastUpdate: string | null;
}

export interface Geofence {
  id: number;
  name: string;
  type: string;
  coordinates: any;
  radius: number | null;
  isActive: boolean | null;
  alertOnEnter: boolean | null;
  alertOnExit: boolean | null;
}

export interface Alert {
  id: number;
  truckId: number | null;
  driverId: number | null;
  type: string;
  severity: string;
  title: string;
  description: string | null;
  timestamp: string | null;
  acknowledged: boolean | null;
  resolvedAt: string | null;
}

export interface Trip {
  id: number;
  truckId: number;
  driverId: number;
  startTime: string;
  endTime: string | null;
  startLocation: string | null;
  endLocation: string | null;
  distance: number | null;
  duration: number | null;
  status: string;
  kpiScore: number | null;
}

export interface DashboardStats {
  activeTrucks: number;
  offlineTrucks: number;
  activeDrivers: number;
  todayAlerts: number;
}