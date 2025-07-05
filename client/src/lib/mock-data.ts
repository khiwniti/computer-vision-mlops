import { Truck, Driver, Vendor, Camera, Alert, Geofence } from "@shared/schema";

// Generate mock data for development and testing
export const generateMockTrucks = (count: number): Truck[] => {
  const trucks: Truck[] = [];
  const statuses = ['online', 'offline', 'idle', 'maintenance'];
  const locations = [
    'Highway 45, Mile 23',
    'Interstate 95, Exit 42',
    'Route 66, Mile 154',
    'Highway 101, Mile 67',
    'Interstate 40, Mile 89',
    'Route 287, Mile 34',
    'Highway 75, Mile 156',
    'Interstate 35, Mile 78'
  ];

  for (let i = 1; i <= count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const latitude = 40.7128 + (Math.random() - 0.5) * 0.5;
    const longitude = -74.0060 + (Math.random() - 0.5) * 0.5;
    
    trucks.push({
      id: i,
      truckNumber: `TRK-${String(i).padStart(3, '0')}`,
      driverId: i,
      vendorId: Math.floor(Math.random() * 5) + 1,
      status,
      latitude,
      longitude,
      speed: status === 'online' ? Math.floor(Math.random() * 80) + 20 : 0,
      heading: Math.floor(Math.random() * 360),
      lastUpdate: new Date(),
      kpiScore: Math.floor(Math.random() * 40) + 60,
      location: locations[Math.floor(Math.random() * locations.length)]
    });
  }

  return trucks;
};

export const generateMockDrivers = (count: number): Driver[] => {
  const drivers: Driver[] = [];
  const names = [
    'John Doe', 'Mike Johnson', 'Sarah Wilson', 'David Brown', 'Lisa Garcia',
    'Robert Martinez', 'Jennifer Davis', 'Michael Rodriguez', 'Ashley Miller',
    'Christopher Anderson', 'Amanda Taylor', 'Daniel Thomas', 'Michelle Jackson'
  ];

  for (let i = 1; i <= count; i++) {
    const name = names[Math.floor(Math.random() * names.length)];
    drivers.push({
      id: i,
      name,
      licenseNumber: `DL-${String(i).padStart(6, '0')}`,
      phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      email: `${name.toLowerCase().replace(' ', '.')}@company.com`,
      vendorId: Math.floor(Math.random() * 5) + 1,
      status: Math.random() > 0.1 ? 'active' : 'inactive',
      kpiScore: Math.floor(Math.random() * 40) + 60,
      totalTrips: Math.floor(Math.random() * 500) + 50,
      safetyScore: Math.floor(Math.random() * 30) + 70
    });
  }

  return drivers;
};

export const generateMockVendors = (): Vendor[] => {
  return [
    {
      id: 1,
      name: 'TransLogistics Inc.',
      contactPerson: 'John Smith',
      phone: '+1-555-0001',
      email: 'contact@translogistics.com',
      apiEndpoint: 'https://api.translogistics.com/v1',
      apiKey: 'tl_key_123456789',
      status: 'active',
      trucksCount: 25
    },
    {
      id: 2,
      name: 'FleetMaster Solutions',
      contactPerson: 'Jane Doe',
      phone: '+1-555-0002',
      email: 'support@fleetmaster.com',
      apiEndpoint: 'https://api.fleetmaster.com/v2',
      apiKey: 'fm_key_987654321',
      status: 'active',
      trucksCount: 20
    },
    {
      id: 3,
      name: 'RoadRunner Transport',
      contactPerson: 'Bob Johnson',
      phone: '+1-555-0003',
      email: 'info@roadrunner.com',
      apiEndpoint: 'https://api.roadrunner.com/v1',
      apiKey: 'rr_key_456789123',
      status: 'active',
      trucksCount: 30
    },
    {
      id: 4,
      name: 'Highway Heroes LLC',
      contactPerson: 'Alice Brown',
      phone: '+1-555-0004',
      email: 'admin@highwayheroes.com',
      apiEndpoint: 'https://api.highwayheroes.com/v1',
      apiKey: 'hh_key_789123456',
      status: 'active',
      trucksCount: 15
    },
    {
      id: 5,
      name: 'Express Freight Co.',
      contactPerson: 'Charlie Wilson',
      phone: '+1-555-0005',
      email: 'ops@expressfreight.com',
      apiEndpoint: 'https://api.expressfreight.com/v1',
      apiKey: 'ef_key_321654987',
      status: 'inactive',
      trucksCount: 10
    }
  ];
};

export const generateMockCameras = (truckCount: number): Camera[] => {
  const cameras: Camera[] = [];
  const positions = ['front', 'back', 'left', 'right'];
  
  for (let truckId = 1; truckId <= truckCount; truckId++) {
    positions.forEach((position, index) => {
      cameras.push({
        id: (truckId - 1) * 4 + index + 1,
        truckId,
        position,
        streamUrl: `rtsp://camera${truckId}-${position}.stream.com/live`,
        status: Math.random() > 0.05 ? 'online' : 'offline',
        lastUpdate: new Date()
      });
    });
  }
  
  return cameras;
};

export const generateMockAlerts = (count: number): Alert[] => {
  const alerts: Alert[] = [];
  const types = ['speed_violation', 'geofence_violation', 'camera_offline', 'fraud_detection'];
  const severities = ['low', 'medium', 'high', 'critical'];
  const titles = {
    speed_violation: 'Speed Violation',
    geofence_violation: 'Geofence Alert',
    camera_offline: 'Camera Offline',
    fraud_detection: 'Fraud Detection'
  };
  
  for (let i = 1; i <= count; i++) {
    const type = types[Math.floor(Math.random() * types.length)] as keyof typeof titles;
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const truckId = Math.floor(Math.random() * 100) + 1;
    
    alerts.push({
      id: i,
      truckId,
      driverId: truckId,
      type,
      severity,
      title: titles[type],
      description: `Alert from TRK-${String(truckId).padStart(3, '0')}`,
      timestamp: new Date(Date.now() - Math.random() * 86400000),
      acknowledged: Math.random() > 0.3,
      resolvedAt: Math.random() > 0.5 ? new Date() : null
    });
  }
  
  return alerts.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
};

export const generateMockGeofences = (): Geofence[] => {
  return [
    {
      id: 1,
      name: 'Downtown Area',
      type: 'circular',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      radius: 5000,
      isActive: true,
      alertOnEnter: true,
      alertOnExit: false
    },
    {
      id: 2,
      name: 'Industrial Zone',
      type: 'circular',
      coordinates: { lat: 40.7589, lng: -73.9851 },
      radius: 3000,
      isActive: true,
      alertOnEnter: false,
      alertOnExit: true
    },
    {
      id: 3,
      name: 'Restricted Area',
      type: 'circular',
      coordinates: { lat: 40.6892, lng: -74.0445 },
      radius: 2000,
      isActive: true,
      alertOnEnter: true,
      alertOnExit: true
    }
  ];
};
