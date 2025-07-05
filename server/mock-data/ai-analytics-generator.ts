// AI Incidents and Analytics Mock Data System
// Generates realistic AI incidents, fraud alerts, GPS tracking, and analytics data

import type {
  FraudAlert, InsertFraudAlert, GpsPoint, InsertGpsPoint,
  GeofenceEvent, InsertGeofenceEvent, Alert, InsertAlert,
  SystemHealth, InsertSystemHealth, ApiLog, InsertApiLog
} from '@shared/schema';

// Enhanced realistic data for AI analytics
const FRAUD_TYPES = [
  'route_deviation', 'unauthorized_stop', 'cargo_tampering', 
  'time_manipulation', 'fuel_theft', 'mileage_fraud', 
  'delivery_fraud', 'documentation_fraud'
];

const CITIES_WITH_ROUTES = [
  { 
    name: 'New York, NY', 
    lat: 40.7128, 
    lng: -74.0060,
    routes: [
      { name: 'I-95 North', points: [{ lat: 40.7128, lng: -74.0060 }, { lat: 40.8176, lng: -73.9782 }] },
      { name: 'I-95 South', points: [{ lat: 40.7128, lng: -74.0060 }, { lat: 40.6782, lng: -73.9442 }] }
    ]
  },
  { 
    name: 'Los Angeles, CA', 
    lat: 34.0522, 
    lng: -118.2437,
    routes: [
      { name: 'I-10 East', points: [{ lat: 34.0522, lng: -118.2437 }, { lat: 34.0195, lng: -117.8867 }] },
      { name: 'I-5 North', points: [{ lat: 34.0522, lng: -118.2437 }, { lat: 34.1381, lng: -118.3534 }] }
    ]
  },
  { 
    name: 'Chicago, IL', 
    lat: 41.8781, 
    lng: -87.6298,
    routes: [
      { name: 'I-90 West', points: [{ lat: 41.8781, lng: -87.6298 }, { lat: 41.8369, lng: -87.7847 }] },
      { name: 'I-94 East', points: [{ lat: 41.8781, lng: -87.6298 }, { lat: 41.8526, lng: -87.3051 }] }
    ]
  }
];

const SYSTEM_COMPONENTS = [
  'camera_system', 'gps_tracker', 'ai_processor', 'database', 
  'streaming_server', 'analytics_engine', 'fraud_detector', 'api_gateway'
];

const SYSTEM_METRICS = [
  'cpu_usage', 'memory_usage', 'disk_space', 'response_time',
  'throughput', 'error_rate', 'uptime', 'bandwidth_usage'
];

// Utility functions
const randomChoice = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];
const randomFloat = (min: number, max: number): number => Math.random() * (max - min) + min;
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const randomBool = (probability: number = 0.5): boolean => Math.random() < probability;

// Generate fraud alerts with realistic scenarios
export function generateFraudAlerts(truckCount: number = 100, alertsPerTruck: number = 3): InsertFraudAlert[] {
  const fraudAlerts: InsertFraudAlert[] = [];
  
  for (let truckId = 1; truckId <= truckCount; truckId++) {
    for (let i = 0; i < alertsPerTruck; i++) {
      const alertType = randomChoice(FRAUD_TYPES);
      const severity = randomChoice(['low', 'medium', 'high', 'critical']);
      const timestamp = new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000);
      const location = randomChoice(CITIES_WITH_ROUTES);
      
      // Generate realistic fraud scenarios
      let description = '';
      let estimatedLoss = 0;
      let detectedBy = '';
      
      switch (alertType) {
        case 'route_deviation':
          description = `Vehicle deviated from planned route by ${randomFloat(5, 25).toFixed(1)} miles`;
          estimatedLoss = randomFloat(200, 1500);
          detectedBy = 'gps';
          break;
        case 'unauthorized_stop':
          description = `Unauthorized stop detected for ${randomInt(30, 180)} minutes at unscheduled location`;
          estimatedLoss = randomFloat(100, 800);
          detectedBy = 'gps';
          break;
        case 'cargo_tampering':
          description = `Potential cargo tampering detected - door sensor activated during transit`;
          estimatedLoss = randomFloat(1000, 15000);
          detectedBy = 'sensor';
          break;
        case 'time_manipulation':
          description = `Suspicious timing patterns detected in delivery logs`;
          estimatedLoss = randomFloat(300, 2000);
          detectedBy = 'ai';
          break;
        case 'fuel_theft':
          description = `Unusual fuel consumption pattern suggests potential theft`;
          estimatedLoss = randomFloat(150, 600);
          detectedBy = 'sensor';
          break;
        case 'mileage_fraud':
          description = `Reported mileage doesn't match GPS tracking data`;
          estimatedLoss = randomFloat(200, 1200);
          detectedBy = 'ai';
          break;
        case 'delivery_fraud':
          description = `Delivery confirmation without proper GPS location verification`;
          estimatedLoss = randomFloat(500, 5000);
          detectedBy = 'ai';
          break;
        case 'documentation_fraud':
          description = `Inconsistencies detected in delivery documentation`;
          estimatedLoss = randomFloat(300, 2500);
          detectedBy = 'manual';
          break;
      }
      
      fraudAlerts.push({
        truckId,
        driverId: truckId,
        alertType,
        severity,
        description,
        evidenceUrls: [
          `https://evidence.fraud-system.com/truck${truckId}/${timestamp.getTime()}_video.mp4`,
          `https://evidence.fraud-system.com/truck${truckId}/${timestamp.getTime()}_gps.json`,
          `https://evidence.fraud-system.com/truck${truckId}/${timestamp.getTime()}_sensor.csv`
        ],
        detectedBy,
        location: {
          lat: location.lat + randomFloat(-0.1, 0.1),
          lng: location.lng + randomFloat(-0.1, 0.1),
          address: `${location.name} Area`
        },
        timestamp,
        duration: randomInt(15, 240),
        estimatedLoss,
        actualLoss: randomBool(0.6) ? estimatedLoss * randomFloat(0.5, 1.2) : null,
        status: randomChoice(['open', 'investigating', 'resolved', 'false_positive']),
        priority: severity === 'critical' ? 'urgent' : 
                 severity === 'high' ? 'high' :
                 severity === 'medium' ? 'medium' : 'low',
        investigationNotes: randomBool(0.4) ? `Investigation started on ${new Date().toLocaleDateString()}` : null,
        metadata: {
          confidence_score: randomFloat(0.7, 0.98),
          data_sources: [detectedBy, 'camera', 'gps'],
          risk_factors: [alertType, 'pattern_anomaly'],
          similar_incidents: randomInt(0, 5)
        },
        tags: [alertType, severity, detectedBy, location.name.split(',')[1].trim()]
      });
    }
  }
  
  return fraudAlerts;
}

// Generate realistic GPS tracking data
export function generateGpsPoints(truckCount: number = 100, pointsPerTruck: number = 100): InsertGpsPoint[] {
  const gpsPoints: InsertGpsPoint[] = [];
  
  for (let truckId = 1; truckId <= truckCount; truckId++) {
    const startLocation = randomChoice(CITIES_WITH_ROUTES);
    const route = randomChoice(startLocation.routes);
    
    for (let i = 0; i < pointsPerTruck; i++) {
      const timestamp = new Date(Date.now() - (pointsPerTruck - i) * 5 * 60 * 1000); // 5-minute intervals
      const progress = i / pointsPerTruck;
      
      // Interpolate along route
      const startPoint = route.points[0];
      const endPoint = route.points[route.points.length - 1];
      const lat = startPoint.lat + (endPoint.lat - startPoint.lat) * progress + randomFloat(-0.001, 0.001);
      const lng = startPoint.lng + (endPoint.lng - startPoint.lng) * progress + randomFloat(-0.001, 0.001);
      
      const speed = randomFloat(0, 75);
      const isMoving = speed > 5;
      
      gpsPoints.push({
        truckId,
        driverId: truckId,
        latitude: lat,
        longitude: lng,
        altitude: randomFloat(50, 1000),
        speed,
        heading: randomFloat(0, 360),
        accuracy: randomFloat(1, 5),
        timestamp,
        address: `${route.name}, Mile ${(progress * 100).toFixed(1)}`,
        isMoving,
        engineStatus: isMoving ? 'on' : randomChoice(['idle', 'off']),
        fuelLevel: Math.max(10, 100 - (progress * 30) + randomFloat(-5, 5)),
        odometerReading: randomFloat(50000, 200000) + (progress * 100)
      });
    }
  }
  
  return gpsPoints;
}

// Generate geofence events
export function generateGeofenceEvents(truckCount: number = 100, eventsPerTruck: number = 5): InsertGeofenceEvent[] {
  const events: InsertGeofenceEvent[] = [];
  
  for (let truckId = 1; truckId <= truckCount; truckId++) {
    for (let i = 0; i < eventsPerTruck; i++) {
      const eventType = randomChoice(['enter', 'exit', 'dwell']);
      const timestamp = new Date(Date.now() - randomInt(0, 7) * 24 * 60 * 60 * 1000);
      const location = randomChoice(CITIES_WITH_ROUTES);
      const authorized = randomBool(0.85);
      
      events.push({
        truckId,
        driverId: truckId,
        geofenceId: randomInt(1, 20),
        eventType,
        timestamp,
        location: {
          lat: location.lat + randomFloat(-0.05, 0.05),
          lng: location.lng + randomFloat(-0.05, 0.05)
        },
        speed: randomFloat(0, 60),
        duration: eventType === 'dwell' ? randomInt(5, 120) : null,
        authorized,
        alertGenerated: !authorized || randomBool(0.2),
        notes: !authorized ? `Unauthorized ${eventType} detected` : null
      });
    }
  }
  
  return events;
}

// Generate system alerts
export function generateSystemAlerts(count: number = 200): InsertAlert[] {
  const alerts: InsertAlert[] = [];
  const alertTypes = [
    'speed_violation', 'geofence_violation', 'camera_offline', 'fraud_detection',
    'system_error', 'maintenance_due', 'driver_fatigue', 'fuel_low',
    'temperature_alert', 'security_breach'
  ];
  
  for (let i = 1; i <= count; i++) {
    const type = randomChoice(alertTypes);
    const severity = randomChoice(['low', 'medium', 'high', 'critical']);
    const truckId = randomInt(1, 100);
    const timestamp = new Date(Date.now() - randomInt(0, 7) * 24 * 60 * 60 * 1000);
    
    let title = '';
    let description = '';
    
    switch (type) {
      case 'speed_violation':
        title = 'Speed Limit Exceeded';
        description = `Vehicle exceeded speed limit by ${randomInt(5, 25)} mph`;
        break;
      case 'geofence_violation':
        title = 'Geofence Boundary Crossed';
        description = 'Vehicle entered/exited restricted area without authorization';
        break;
      case 'camera_offline':
        title = 'Camera System Offline';
        description = `Camera ${randomChoice(['front', 'back', 'left', 'right'])} is not responding`;
        break;
      case 'fraud_detection':
        title = 'Potential Fraud Detected';
        description = 'Suspicious activity pattern identified by AI system';
        break;
      case 'system_error':
        title = 'System Error';
        description = 'Component malfunction detected in monitoring system';
        break;
      case 'maintenance_due':
        title = 'Maintenance Required';
        description = 'Scheduled maintenance window approaching';
        break;
      case 'driver_fatigue':
        title = 'Driver Fatigue Alert';
        description = 'Signs of driver fatigue detected by AI monitoring';
        break;
      case 'fuel_low':
        title = 'Low Fuel Warning';
        description = `Fuel level below ${randomInt(10, 25)}%`;
        break;
      case 'temperature_alert':
        title = 'Temperature Alert';
        description = 'Cargo temperature outside acceptable range';
        break;
      case 'security_breach':
        title = 'Security Breach';
        description = 'Unauthorized access attempt detected';
        break;
    }
    
    alerts.push({
      truckId,
      driverId: truckId,
      type,
      severity,
      title,
      description,
      timestamp,
      acknowledged: randomBool(0.6),
      resolvedAt: randomBool(0.4) ? new Date(timestamp.getTime() + randomInt(1, 24) * 60 * 60 * 1000) : null
    });
  }
  
  return alerts.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
}

// Generate system health metrics
export function generateSystemHealth(daysBack: number = 7): InsertSystemHealth[] {
  const healthData: InsertSystemHealth[] = [];
  
  for (let day = 0; day < daysBack; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const timestamp = new Date(Date.now() - (day * 24 + hour) * 60 * 60 * 1000);
      
      SYSTEM_COMPONENTS.forEach(component => {
        SYSTEM_METRICS.forEach(metric => {
          let value = 0;
          let threshold = 0;
          let status = 'healthy';
          
          switch (metric) {
            case 'cpu_usage':
              value = randomFloat(10, 95);
              threshold = 80;
              status = value > 90 ? 'critical' : value > 80 ? 'warning' : 'healthy';
              break;
            case 'memory_usage':
              value = randomFloat(20, 90);
              threshold = 85;
              status = value > 85 ? 'critical' : value > 75 ? 'warning' : 'healthy';
              break;
            case 'disk_space':
              value = randomFloat(30, 95);
              threshold = 90;
              status = value > 90 ? 'critical' : value > 80 ? 'warning' : 'healthy';
              break;
            case 'response_time':
              value = randomFloat(50, 2000);
              threshold = 1000;
              status = value > 1500 ? 'critical' : value > 1000 ? 'warning' : 'healthy';
              break;
            case 'throughput':
              value = randomFloat(100, 10000);
              threshold = 1000;
              status = value < 500 ? 'warning' : value < 200 ? 'critical' : 'healthy';
              break;
            case 'error_rate':
              value = randomFloat(0, 10);
              threshold = 5;
              status = value > 8 ? 'critical' : value > 5 ? 'warning' : 'healthy';
              break;
            case 'uptime':
              value = randomFloat(95, 100);
              threshold = 99;
              status = value < 95 ? 'critical' : value < 99 ? 'warning' : 'healthy';
              break;
            case 'bandwidth_usage':
              value = randomFloat(10, 100);
              threshold = 80;
              status = value > 90 ? 'critical' : value > 80 ? 'warning' : 'healthy';
              break;
          }
          
          healthData.push({
            component,
            status,
            metric,
            value,
            threshold,
            message: status !== 'healthy' ? `${component} ${metric} ${status}` : null,
            timestamp
          });
        });
      });
    }
  }
  
  return healthData;
}

// Generate API logs
export function generateApiLogs(vendorCount: number = 5, logsPerVendor: number = 1000): InsertApiLog[] {
  const apiLogs: InsertApiLog[] = [];
  const endpoints = ['/streams', '/cameras', '/recordings', '/events', '/health', '/status'];
  const methods = ['GET', 'POST', 'PUT', 'DELETE'];
  
  for (let vendorId = 1; vendorId <= vendorCount; vendorId++) {
    for (let i = 0; i < logsPerVendor; i++) {
      const endpoint = randomChoice(endpoints);
      const method = randomChoice(methods);
      const timestamp = new Date(Date.now() - randomInt(0, 7) * 24 * 60 * 60 * 1000);
      const successful = randomBool(0.92);
      const statusCode = successful ? 
        randomChoice([200, 201, 204]) : 
        randomChoice([400, 401, 404, 500, 503]);
      
      apiLogs.push({
        vendorId,
        endpoint,
        method,
        statusCode,
        responseTime: randomInt(50, 2000),
        requestSize: randomInt(100, 5000),
        responseSize: randomInt(500, 50000),
        errorMessage: !successful ? `HTTP ${statusCode} error on ${endpoint}` : null,
        timestamp,
        successful
      });
    }
  }
  
  return apiLogs.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
}

// Main analytics generator function
export function generateAllAnalyticsData() {
  return {
    fraudAlerts: generateFraudAlerts(100, 3),
    gpsPoints: generateGpsPoints(100, 100),
    geofenceEvents: generateGeofenceEvents(100, 5),
    systemAlerts: generateSystemAlerts(200),
    systemHealth: generateSystemHealth(7),
    apiLogs: generateApiLogs(5, 1000)
  };
}

export default {
  generateFraudAlerts,
  generateGpsPoints,
  generateGeofenceEvents,
  generateSystemAlerts,
  generateSystemHealth,
  generateApiLogs,
  generateAllAnalyticsData
};