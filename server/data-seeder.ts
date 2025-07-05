import { storage } from "./storage";
import { 
  insertTruckSchema, insertDriverSchema, insertVendorSchema, 
  insertCameraSchema, insertGeofenceSchema, insertAlertSchema 
} from "@shared/schema";

export async function seedData() {
  try {
    // Seed vendors first
    const vendors = [
      {
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

    for (const vendor of vendors) {
      await storage.createVendor(vendor);
    }

    // Seed drivers
    const driverNames = [
      'John Doe', 'Mike Johnson', 'Sarah Wilson', 'David Brown', 'Lisa Garcia',
      'Robert Martinez', 'Jennifer Davis', 'Michael Rodriguez', 'Ashley Miller',
      'Christopher Anderson', 'Amanda Taylor', 'Daniel Thomas', 'Michelle Jackson',
      'James White', 'Patricia Moore', 'William Martin', 'Barbara Lee', 'Richard Clark',
      'Susan Lewis', 'Joseph Walker', 'Karen Hall', 'Thomas Allen', 'Nancy Young',
      'Charles King', 'Betty Wright', 'Steven Lopez', 'Helen Hill', 'Paul Scott',
      'Donna Green', 'Mark Adams', 'Carol Nelson', 'George Baker', 'Ruth Carter',
      'Kenneth Mitchell', 'Sharon Perez', 'Joshua Roberts', 'Maria Turner', 'Kevin Phillips',
      'Linda Campbell', 'Brian Parker', 'Lisa Evans', 'Edward Edwards', 'Mary Collins',
      'Ronald Stewart', 'Sandra Sanchez', 'Anthony Morris', 'Donna Rogers', 'Matthew Reed',
      'Emily Cook', 'Andrew Morgan', 'Michelle Bell', 'Daniel Murphy', 'Kimberly Bailey',
      'Ryan Rivera', 'Laura Cooper', 'Nicholas Richardson', 'Amy Cox', 'Tyler Howard',
      'Jennifer Ward', 'Brandon Torres', 'Angela Peterson', 'Jacob Gray', 'Stephanie Ramirez',
      'Alexander James', 'Christina Watson', 'Jonathan Brooks', 'Samantha Kelly', 'Austin Sanders',
      'Rachel Price', 'Noah Bennett', 'Kayla Wood', 'Logan Barnes', 'Megan Ross',
      'Lucas Henderson', 'Alexis Coleman', 'Mason Jenkins', 'Hannah Perry', 'Ethan Powell',
      'Grace Long', 'Caleb Patterson', 'Victoria Hughes', 'Jack Flores', 'Jasmine Washington',
      'Owen Butler', 'Destiny Simmons', 'Eli Foster', 'Haley Gonzales', 'Aiden Bryant',
      'Mackenzie Alexander', 'Luke Russell', 'Paige Griffin', 'Isaiah Diaz', 'Brooke Hayes',
      'Gabriel Myers', 'Allison Ford', 'Carter Hamilton', 'Jenna Graham', 'Wyatt Sullivan',
      'Chloe Wallace', 'Julian Woods', 'Abigail Cole', 'Levi West', 'Sophia Jordan',
      'Hunter Owens', 'Olivia Reynolds', 'Connor Harper', 'Zoe Fisher', 'Landon Ellis'
    ];

    for (let i = 0; i < 100; i++) {
      const name = driverNames[i] || `Driver ${i + 1}`;
      await storage.createDriver({
        name,
        licenseNumber: `DL-${String(i + 1).padStart(6, '0')}`,
        phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        email: `${name.toLowerCase().replace(' ', '.')}@company.com`,
        vendorId: Math.floor(Math.random() * 5) + 1,
        status: Math.random() > 0.1 ? 'active' : 'inactive',
        kpiScore: Math.floor(Math.random() * 40) + 60,
        totalTrips: Math.floor(Math.random() * 500) + 50,
        safetyScore: Math.floor(Math.random() * 30) + 70
      });
    }

    // Seed trucks
    const statuses = ['online', 'offline', 'idle', 'maintenance'];
    const locations = [
      'Highway 45, Mile 23', 'Interstate 95, Exit 42', 'Route 66, Mile 154',
      'Highway 101, Mile 67', 'Interstate 40, Mile 89', 'Route 287, Mile 34',
      'Highway 75, Mile 156', 'Interstate 35, Mile 78', 'Route 1, Mile 123',
      'Highway 90, Mile 234', 'Interstate 10, Mile 345', 'Route 50, Mile 456'
    ];

    for (let i = 1; i <= 100; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const latitude = 40.7128 + (Math.random() - 0.5) * 0.5;
      const longitude = -74.0060 + (Math.random() - 0.5) * 0.5;
      
      await storage.createTruck({
        truckNumber: `TRK-${String(i).padStart(3, '0')}`,
        driverId: i,
        vendorId: Math.floor(Math.random() * 5) + 1,
        status,
        latitude,
        longitude,
        speed: status === 'online' ? Math.floor(Math.random() * 80) + 20 : 0,
        heading: Math.floor(Math.random() * 360),
        kpiScore: Math.floor(Math.random() * 40) + 60,
        location: locations[Math.floor(Math.random() * locations.length)]
      });
    }

    // Seed cameras for each truck
    const positions = ['front', 'back', 'left', 'right'];
    for (let truckId = 1; truckId <= 100; truckId++) {
      for (const position of positions) {
        await storage.createCamera({
          truckId,
          position,
          streamUrl: `rtsp://camera${truckId}-${position}.stream.com/live`,
          status: Math.random() > 0.05 ? 'online' : 'offline'
        });
      }
    }

    // Seed geofences
    const geofenceData = [
      {
        name: 'Downtown Area',
        type: 'circular',
        coordinates: { lat: 40.7128, lng: -74.0060 },
        radius: 5000,
        isActive: true,
        alertOnEnter: true,
        alertOnExit: false
      },
      {
        name: 'Industrial Zone',
        type: 'circular',
        coordinates: { lat: 40.7589, lng: -73.9851 },
        radius: 3000,
        isActive: true,
        alertOnEnter: false,
        alertOnExit: true
      },
      {
        name: 'Restricted Area',
        type: 'circular',
        coordinates: { lat: 40.6892, lng: -74.0445 },
        radius: 2000,
        isActive: true,
        alertOnEnter: true,
        alertOnExit: true
      },
      {
        name: 'Loading Dock Alpha',
        type: 'circular',
        coordinates: { lat: 40.7500, lng: -74.0200 },
        radius: 1500,
        isActive: true,
        alertOnEnter: false,
        alertOnExit: false
      },
      {
        name: 'Highway Rest Area',
        type: 'circular',
        coordinates: { lat: 40.7000, lng: -74.0800 },
        radius: 2500,
        isActive: false,
        alertOnEnter: false,
        alertOnExit: true
      }
    ];

    for (const geofence of geofenceData) {
      await storage.createGeofence(geofence);
    }

    // Seed alerts
    const alertTypes = ['speed_violation', 'geofence_violation', 'camera_offline', 'fraud_detection'];
    const severities = ['low', 'medium', 'high', 'critical'];
    const titles = {
      speed_violation: 'Speed Violation',
      geofence_violation: 'Geofence Alert',
      camera_offline: 'Camera Offline',
      fraud_detection: 'Fraud Detection'
    };

    for (let i = 1; i <= 25; i++) {
      const type = alertTypes[Math.floor(Math.random() * alertTypes.length)] as keyof typeof titles;
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const truckId = Math.floor(Math.random() * 100) + 1;
      
      await storage.createAlert({
        truckId,
        driverId: truckId,
        type,
        severity,
        title: titles[type],
        description: `Alert from TRK-${String(truckId).padStart(3, '0')} - ${type.replace('_', ' ')}`,
        acknowledged: Math.random() > 0.3,
        resolvedAt: Math.random() > 0.5 ? new Date() : null
      });
    }

    console.log('Data seeding completed successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}
