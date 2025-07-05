// Comprehensive Mock Data Generator for Testing All Platform Functions
// Generates realistic data for 100 trucks, drivers, vendors, cameras, and all related systems

import type {
  Truck, InsertTruck, Driver, InsertDriver, Vendor, InsertVendor, 
  Camera, InsertCamera, Geofence, InsertGeofence, Trip, InsertTrip,
  Shipment, InsertShipment, ShipmentTruck, InsertShipmentTruck,
  AiIncident, InsertAiIncident, DriverScore, InsertDriverScore,
  FraudAlert, InsertFraudAlert, GpsPoint, InsertGpsPoint,
  GeofenceEvent, InsertGeofenceEvent, Alert, InsertAlert
} from '@shared/schema';

// Realistic data pools
const DRIVER_NAMES = [
  'John Smith', 'Maria Garcia', 'David Johnson', 'Lisa Chen', 'Robert Williams',
  'Sarah Davis', 'Michael Brown', 'Jennifer Wilson', 'Christopher Miller', 'Amanda Taylor',
  'Daniel Rodriguez', 'Michelle Anderson', 'Kevin Martinez', 'Nicole Thomas', 'James Jackson',
  'Ashley White', 'Brian Harris', 'Emily Lewis', 'Ryan Clark', 'Jessica Robinson',
  'Matthew Walker', 'Stephanie Hall', 'Andrew Young', 'Melissa Allen', 'Joshua King',
  'Kimberly Wright', 'Anthony Lopez', 'Rebecca Hill', 'Mark Scott', 'Laura Green',
  'Steven Adams', 'Samantha Baker', 'Paul Gonzalez', 'Rachel Nelson', 'Jason Carter',
  'Lisa Mitchell', 'Eric Perez', 'Karen Roberts', 'Jonathan Turner', 'Amy Phillips',
  'Christopher Campbell', 'Patricia Parker', 'Justin Evans', 'Susan Edwards', 'Brandon Collins',
  'Mary Stewart', 'Sean Morris', 'Jennifer Rogers', 'Aaron Reed', 'Heather Cook',
  'Jacob Morgan', 'Denise Bell', 'Nicholas Murphy', 'Angela Bailey', 'Alexander Rivera',
  'Christine Cooper', 'Tyler Richardson', 'Donna Cox', 'Jordan Howard', 'Gloria Ward',
  'Marcus Torres', 'Frances Peterson', 'Carl Gray', 'Janet Ramirez', 'Arthur James',
  'Kathleen Watson', 'Harold Brooks', 'Diane Kelly', 'Gerald Sanders', 'Julie Price',
  'Ralph Bennett', 'Teresa Wood', 'Philip Barnes', 'Sandra Ross', 'Wayne Henderson',
  'Catherine Coleman', 'Albert Jenkins', 'Deborah Perry', 'Eugene Powell', 'Sharon Long',
  'Louis Patterson', 'Carolyn Hughes', 'Russell Flores', 'Beverly Washington', 'Roy Butler',
  'Pamela Simmons', 'Frank Foster', 'Barbara Gonzales', 'Gregory Bryant', 'Elizabeth Alexander',
  'Raymond Russell', 'Helen Griffin', 'Joe Diaz', 'Maria Hayes', 'Carl Myers',
  'Nancy Ford', 'Willie Hamilton', 'Linda Graham', 'Carl Sullivan', 'Donna Wallace',
  'Henry Woods', 'Joan Cole', 'Walter West', 'Ann Jordan', 'Lawrence Owens'
];

const VENDOR_COMPANIES = [
  {
    name: 'TransLogistics Solutions Inc.',
    contactPerson: 'John Anderson',
    apiType: 'hikvision' as const,
    trucksCount: 25,
    capabilities: ['live_stream', 'recordings', 'ptz', 'motion_detection', 'night_vision']
  },
  {
    name: 'FleetMaster Professional Services',
    contactPerson: 'Sarah Johnson',
    apiType: 'dahua' as const,
    trucksCount: 20,
    capabilities: ['live_stream', 'recordings', 'audio', 'face_recognition']
  },
  {
    name: 'RoadRunner Transport Systems',
    contactPerson: 'Mike Wilson',
    apiType: 'axis' as const,
    trucksCount: 20,
    capabilities: ['live_stream', 'recordings', 'analytics', 'thermal']
  },
  {
    name: 'Highway Heroes Logistics',
    contactPerson: 'Lisa Garcia',
    apiType: 'custom' as const,
    trucksCount: 20,
    capabilities: ['live_stream', 'recordings', 'object_detection', 'license_plate']
  },
  {
    name: 'Express Freight Dynamics',
    contactPerson: 'Robert Martinez',
    apiType: 'hikvision' as const,
    trucksCount: 15,
    capabilities: ['live_stream', 'recordings', 'ptz', 'infrared']
  }
];

const LOCATIONS = [
  { name: 'New York, NY', lat: 40.7128, lng: -74.0060 },
  { name: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437 },
  { name: 'Chicago, IL', lat: 41.8781, lng: -87.6298 },
  { name: 'Houston, TX', lat: 29.7604, lng: -95.3698 },
  { name: 'Phoenix, AZ', lat: 33.4484, lng: -112.0740 },
  { name: 'Philadelphia, PA', lat: 39.9526, lng: -75.1652 },
  { name: 'San Antonio, TX', lat: 29.4241, lng: -98.4936 },
  { name: 'San Diego, CA', lat: 32.7157, lng: -117.1611 },
  { name: 'Dallas, TX', lat: 32.7767, lng: -96.7970 },
  { name: 'San Jose, CA', lat: 37.3382, lng: -121.8863 }
];

const CAMERA_POSITIONS = ['front', 'back', 'left', 'right', 'driver_facing', 'cargo'] as const;
const TRUCK_STATUSES = ['online', 'offline', 'idle', 'maintenance'] as const;
const DRIVER_STATUSES = ['active', 'inactive', 'suspended'] as const;

// Utility functions
const randomChoice = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];
const randomFloat = (min: number, max: number): number => Math.random() * (max - min) + min;
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const randomBool = (probability: number = 0.5): boolean => Math.random() < probability;

// Generate vendors
export function generateVendors(): InsertVendor[] {
  return VENDOR_COMPANIES.map((vendor, index) => ({
    name: vendor.name,
    contactPerson: vendor.contactPerson,
    phone: `+1-555-${String(1000 + index * 111).slice(0, 4)}`,
    email: `contact@${vendor.name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
    apiEndpoint: `https://api.${vendor.name.toLowerCase().replace(/[^a-z]/g, '')}.com/v1`,
    apiKey: `${vendor.apiType}_key_${Math.random().toString(36).substring(7)}`,
    apiType: vendor.apiType,
    authConfig: {
      username: 'admin',
      password: 'secure123',
      token: `token_${Math.random().toString(36).substring(7)}`
    },
    endpoints: {
      streams: '/streams',
      recordings: '/recordings',
      cameras: '/cameras',
      events: '/events'
    },
    capabilities: vendor.capabilities,
    status: index < 4 ? 'active' : 'inactive',
    lastHealthCheck: new Date(),
    trucksCount: vendor.trucksCount,
    connectionStatus: index < 4 ? 'connected' : 'disconnected'
  }));
}

// Generate drivers
export function generateDrivers(count: number = 100): InsertDriver[] {
  return Array.from({ length: count }, (_, index) => {
    const driverIndex = index % DRIVER_NAMES.length;
    const name = DRIVER_NAMES[driverIndex];
    const vendorId = Math.floor(index / 20) + 1; // Distribute evenly across vendors
    
    return {
      name,
      licenseNumber: `DL-${String(index + 1).padStart(6, '0')}`,
      phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      email: `${name.toLowerCase().replace(' ', '.')}${index > 49 ? index : ''}@${VENDOR_COMPANIES[vendorId - 1]?.name.toLowerCase().replace(/[^a-z]/g, '') || 'company'}.com`,
      vendorId,
      status: randomChoice(DRIVER_STATUSES),
      kpiScore: randomFloat(60, 95),
      totalTrips: randomInt(50, 500),
      safetyScore: randomFloat(65, 98)
    };
  });
}

// Generate trucks
export function generateTrucks(count: number = 100): InsertTruck[] {
  return Array.from({ length: count }, (_, index) => {
    const location = randomChoice(LOCATIONS);
    const status = randomChoice(TRUCK_STATUSES);
    const vendorId = Math.floor(index / 20) + 1;
    
    return {
      truckNumber: `TRK-${String(index + 1).padStart(3, '0')}`,
      driverId: index + 1,
      vendorId,
      status,
      latitude: location.lat + randomFloat(-0.1, 0.1),
      longitude: location.lng + randomFloat(-0.1, 0.1),
      speed: status === 'online' ? randomFloat(20, 75) : 0,
      heading: randomFloat(0, 360),
      kpiScore: randomFloat(65, 92),
      location: `${location.name} Area`
    };
  });
}

// Generate cameras (4-6 per truck)
export function generateCameras(truckCount: number = 100): InsertCamera[] {
  const cameras: InsertCamera[] = [];
  
  for (let truckId = 1; truckId <= truckCount; truckId++) {
    const truck = { id: truckId, vendorId: Math.floor((truckId - 1) / 20) + 1 };
    const numCameras = randomInt(4, 6);
    const positions = [...CAMERA_POSITIONS].slice(0, numCameras);
    
    positions.forEach((position, index) => {
      cameras.push({
        truckId,
        vendorId: truck.vendorId,
        position,
        streamUrl: `rtsp://truck${truckId}-${position}.stream.${VENDOR_COMPANIES[truck.vendorId - 1]?.name.toLowerCase().replace(/[^a-z]/g, '') || 'vendor'}.com/live`,
        recordingUrl: `https://recordings.${VENDOR_COMPANIES[truck.vendorId - 1]?.name.toLowerCase().replace(/[^a-z]/g, '') || 'vendor'}.com/truck${truckId}/${position}`,
        vendorCameraId: `CAM-${truckId}-${position.toUpperCase()}`,
        resolution: randomChoice(['1080p', '4K', '720p']),
        capabilities: {
          night_vision: randomBool(0.8),
          audio: randomBool(0.6),
          ptz: randomBool(0.3),
          motion_detection: randomBool(0.9),
          analytics: randomBool(0.7)
        },
        aiEnabled: randomBool(0.85),
        status: randomBool(0.95) ? 'online' : 'offline',
        frameRate: randomChoice([15, 24, 30]),
        quality: randomChoice(['high', 'medium', 'low'])
      });
    });
  }
  
  return cameras;
}

// Generate geofences
export function generateGeofences(): InsertGeofence[] {
  const geofences: InsertGeofence[] = [];
  
  // City-based geofences
  LOCATIONS.forEach((location, index) => {
    geofences.push({
      name: `${location.name} City Limits`,
      type: 'circular',
      coordinates: { lat: location.lat, lng: location.lng },
      radius: randomFloat(15000, 25000),
      isActive: true,
      alertOnEnter: randomBool(0.3),
      alertOnExit: randomBool(0.7)
    });
    
    // Add restricted zones
    geofences.push({
      name: `${location.name} Restricted Zone`,
      type: 'circular',
      coordinates: { 
        lat: location.lat + randomFloat(-0.05, 0.05), 
        lng: location.lng + randomFloat(-0.05, 0.05) 
      },
      radius: randomFloat(2000, 5000),
      isActive: true,
      alertOnEnter: true,
      alertOnExit: true
    });
  });
  
  // Highway corridors
  geofences.push({
    name: 'Interstate 95 Corridor',
    type: 'polygon',
    coordinates: [
      { lat: 40.7128, lng: -74.0060 },
      { lat: 39.9526, lng: -75.1652 },
      { lat: 38.9072, lng: -77.0369 },
      { lat: 35.7796, lng: -78.6382 }
    ],
    isActive: true,
    alertOnEnter: false,
    alertOnExit: true
  });
  
  return geofences;
}

// Generate shipments
export function generateShipments(count: number = 50): InsertShipment[] {
  return Array.from({ length: count }, (_, index) => {
    const origin = randomChoice(LOCATIONS);
    const destination = randomChoice(LOCATIONS.filter(l => l !== origin));
    const plannedDeparture = new Date(Date.now() + randomInt(0, 7) * 24 * 60 * 60 * 1000);
    const plannedArrival = new Date(plannedDeparture.getTime() + randomInt(8, 48) * 60 * 60 * 1000);
    const totalTrucks = randomInt(1, 5);
    
    return {
      shipmentNumber: `SHP-${String(index + 1).padStart(4, '0')}`,
      customerName: `Customer ${String.fromCharCode(65 + (index % 26))} Corp`,
      origin: origin.name,
      destination: destination.name,
      plannedDeparture,
      plannedArrival,
      status: randomChoice(['planned', 'in_progress', 'completed', 'delayed']),
      priority: randomChoice(['low', 'medium', 'high', 'urgent']),
      totalTrucks,
      activeTrucks: randomInt(0, totalTrucks),
      completedTrucks: randomInt(0, totalTrucks),
      estimatedDistance: randomFloat(100, 2000),
      notes: `Shipment from ${origin.name} to ${destination.name}`
    };
  });
}

// Generate trips
export function generateTrips(truckCount: number = 100, tripsPerTruck: number = 5): InsertTrip[] {
  const trips: InsertTrip[] = [];
  
  for (let truckId = 1; truckId <= truckCount; truckId++) {
    for (let i = 0; i < tripsPerTruck; i++) {
      const startTime = new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000);
      const duration = randomInt(60, 480); // 1-8 hours
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
      const origin = randomChoice(LOCATIONS);
      const destination = randomChoice(LOCATIONS.filter(l => l !== origin));
      
      trips.push({
        truckId,
        driverId: truckId,
        shipmentId: Math.floor(Math.random() * 50) + 1,
        startTime,
        endTime: randomBool(0.8) ? endTime : null,
        startLocation: origin.name,
        endLocation: destination.name,
        distance: randomFloat(50, 800),
        duration,
        status: randomChoice(['active', 'completed', 'cancelled']),
        kpiScore: randomFloat(60, 95)
      });
    }
  }
  
  return trips;
}

// Generate AI incidents
export function generateAiIncidents(truckCount: number = 100, incidentsPerTruck: number = 10): InsertAiIncident[] {
  const incidents: InsertAiIncident[] = [];
  const incidentTypes = [
    'drowsiness', 'phone_usage', 'seatbelt_violation', 'smoking', 'harsh_driving', 
    'fraud', 'distracted_driving', 'aggressive_driving', 'cargo_tampering'
  ];
  
  for (let truckId = 1; truckId <= truckCount; truckId++) {
    for (let i = 0; i < incidentsPerTruck; i++) {
      const incidentType = randomChoice(incidentTypes);
      const cameraId = (truckId - 1) * 4 + randomInt(1, 4);
      const timestamp = new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000);
      
      incidents.push({
        truckId,
        driverId: truckId,
        cameraId,
        incidentType,
        severity: randomChoice(['low', 'medium', 'high', 'critical']),
        confidence: randomFloat(0.6, 0.98),
        description: `${incidentType.replace('_', ' ')} detected on truck TRK-${String(truckId).padStart(3, '0')}`,
        videoClipUrl: `https://clips.ai-system.com/truck${truckId}/${timestamp.getTime()}.mp4`,
        imageUrl: `https://clips.ai-system.com/truck${truckId}/${timestamp.getTime()}.jpg`,
        metadata: {
          duration: randomInt(5, 30),
          frame_count: randomInt(150, 900),
          ai_model: 'driver_behavior_v2.1',
          processing_time: randomInt(50, 200)
        },
        timestamp,
        location: {
          lat: randomFloat(25, 50),
          lng: randomFloat(-125, -65),
          address: randomChoice(LOCATIONS).name
        },
        acknowledged: randomBool(0.4),
        falsePositive: randomBool(0.1)
      });
    }
  }
  
  return incidents;
}

// Generate driver scores (daily)
export function generateDriverScores(driverCount: number = 100, daysBack: number = 30): InsertDriverScore[] {
  const scores: InsertDriverScore[] = [];
  
  for (let driverId = 1; driverId <= driverCount; driverId++) {
    for (let day = 0; day < daysBack; day++) {
      const date = new Date(Date.now() - day * 24 * 60 * 60 * 1000);
      const shiftStart = new Date(date);
      shiftStart.setHours(6 + randomInt(0, 4), randomInt(0, 59));
      const shiftEnd = new Date(shiftStart.getTime() + randomInt(6, 12) * 60 * 60 * 1000);
      
      // Generate realistic performance trends
      const basePerformance = 75 + Math.sin(day / 7) * 10; // Weekly cycles
      const safetyScore = Math.max(0, Math.min(100, basePerformance + randomFloat(-10, 15)));
      const efficiencyScore = Math.max(0, Math.min(100, basePerformance + randomFloat(-8, 12)));
      const complianceScore = Math.max(0, Math.min(100, basePerformance + randomFloat(-5, 10)));
      const overallScore = (safetyScore * 0.4 + efficiencyScore * 0.35 + complianceScore * 0.25);
      
      scores.push({
        driverId,
        date,
        shiftStart,
        shiftEnd,
        overallScore,
        safetyScore,
        efficiencyScore,
        complianceScore,
        drowsinessEvents: randomInt(0, 3),
        phoneUsageEvents: randomInt(0, 2),
        seatbeltViolations: randomInt(0, 1),
        smokingEvents: randomInt(0, 1),
        harshBrakingEvents: randomInt(0, 5),
        harshAccelerationEvents: randomInt(0, 4),
        speedingViolations: randomInt(0, 2),
        totalDistance: randomFloat(150, 600),
        totalDuration: randomInt(360, 720),
        fuelEfficiency: randomFloat(6.5, 9.2),
        routeAdherence: randomFloat(85, 99),
        onTimeDeliveries: randomInt(2, 8),
        lateDeliveries: randomInt(0, 2),
        documentationComplete: randomBool(0.9),
        communicationScore: randomFloat(80, 100),
        policyViolations: randomInt(0, 1),
        milesPerHour: randomFloat(35, 65),
        incidentsPerMile: randomFloat(0, 0.02)
      });
    }
  }
  
  return scores;
}

// Main generator function
export function generateAllMockData() {
  return {
    vendors: generateVendors(),
    drivers: generateDrivers(100),
    trucks: generateTrucks(100),
    cameras: generateCameras(100),
    geofences: generateGeofences(),
    shipments: generateShipments(50),
    trips: generateTrips(100, 5),
    aiIncidents: generateAiIncidents(100, 10),
    driverScores: generateDriverScores(100, 30)
  };
}

export default {
  generateVendors,
  generateDrivers,
  generateTrucks,
  generateCameras,
  generateGeofences,
  generateShipments,
  generateTrips,
  generateAiIncidents,
  generateDriverScores,
  generateAllMockData
};