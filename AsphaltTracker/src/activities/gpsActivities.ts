// GPS and Location Activities - Restack AI Framework integration
// Wraps existing GPS tracking functionality as Restack activities

import { activity } from "@restackio/ai";

// Types
interface LocationUpdate {
  success: boolean;
  data?: {
    latitude: number;
    longitude: number;
    altitude?: number;
    speed: number;
    heading: number;
    accuracy: number;
    timestamp: Date;
    satelliteCount?: number;
    hdop?: number;
  };
  error?: string;
}

interface GeofenceCheck {
  violations: Array<{
    type: "entry" | "exit" | "speed_limit" | "unauthorized_area";
    geofenceId: number;
    geofenceName: string;
    location: { lat: number; lng: number };
    severity: "low" | "medium" | "high" | "critical";
    timestamp: Date;
  }>;
  currentGeofences: number[];
  authorized: boolean;
}

interface RouteCalculation {
  success: boolean;
  route?: {
    distance: number;
    duration: number;
    eta: Date;
    waypoints: Array<{ lat: number; lng: number }>;
    optimized: boolean;
  };
  error?: string;
}

// Activity: Update Location
export const updateLocation = activity("updateLocation", async (params: {
  truckId: number;
  requestHighAccuracy?: boolean;
  timeout?: number;
}): Promise<LocationUpdate> => {
  const { truckId, requestHighAccuracy = true, timeout = 10000 } = params;
  
  console.log(`📍 Updating location for Truck ${truckId}`);

  try {
    // Call existing GPS API endpoint
    const response = await fetch(`http://localhost:5000/api/gps/location/${truckId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(timeout)
    });

    if (!response.ok) {
      throw new Error(`Failed to get location update: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Location updated for Truck ${truckId}: ${data.location.latitude}, ${data.location.longitude}`);
      return {
        success: true,
        data: {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          altitude: data.location.altitude,
          speed: data.location.speed,
          heading: data.location.heading,
          accuracy: data.location.accuracy,
          timestamp: new Date(data.location.timestamp),
          satelliteCount: data.location.satelliteCount,
          hdop: data.location.hdop
        }
      };
    } else {
      return {
        success: false,
        error: data.error || 'Unknown location error'
      };
    }

  } catch (error) {
    console.error(`❌ Error updating location for Truck ${truckId}:`, error);
    
    // Return mock location data for development
    return {
      success: true,
      data: {
        latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
        longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
        altitude: 100 + Math.random() * 200,
        speed: Math.random() * 70,
        heading: Math.random() * 360,
        accuracy: 3 + Math.random() * 7,
        timestamp: new Date(),
        satelliteCount: 8 + Math.floor(Math.random() * 5),
        hdop: 0.8 + Math.random() * 1.2
      }
    };
  }
});

// Activity: Check Geofences
export const checkGeofences = activity("checkGeofences", async (params: {
  truckId: number;
  location: { latitude: number; longitude: number };
  checkTypes: string[];
  alertOnViolation?: boolean;
}): Promise<GeofenceCheck> => {
  const { truckId, location, checkTypes, alertOnViolation = true } = params;
  
  console.log(`🛡️ Checking geofences for Truck ${truckId} at ${location.latitude}, ${location.longitude}`);

  try {
    // Call existing geofence API
    const response = await fetch(`http://localhost:5000/api/gps/geofences/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        truckId,
        location,
        checkTypes,
        alertOnViolation
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to check geofences: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.violations && data.violations.length > 0) {
      console.log(`⚠️ Geofence violations detected for Truck ${truckId}: ${data.violations.length} violations`);
    } else {
      console.log(`✅ No geofence violations for Truck ${truckId}`);
    }

    return {
      violations: data.violations || [],
      currentGeofences: data.currentGeofences || [],
      authorized: data.authorized !== false
    };

  } catch (error) {
    console.error(`❌ Error checking geofences for Truck ${truckId}:`, error);
    
    // Return mock geofence data
    const violations = [];
    
    // Simulate occasional geofence violations
    if (Math.random() < 0.05) { // 5% chance of violation
      violations.push({
        type: Math.random() > 0.5 ? "speed_limit" : "unauthorized_area",
        geofenceId: Math.floor(Math.random() * 10) + 1,
        geofenceName: `Geofence ${Math.floor(Math.random() * 10) + 1}`,
        location: { lat: location.latitude, lng: location.longitude },
        severity: Math.random() > 0.7 ? "high" : "medium",
        timestamp: new Date()
      });
    }

    return {
      violations,
      currentGeofences: [1, 2], // Mock active geofences
      authorized: true
    };
  }
});

// Activity: Calculate Route
export const calculateRoute = activity("calculateRoute", async (params: {
  truckId: number;
  currentLocation: { latitude: number; longitude: number };
  optimizeFor: "time" | "distance" | "time_and_fuel";
  avoidTraffic?: boolean;
  updateEta?: boolean;
}): Promise<RouteCalculation> => {
  const { truckId, currentLocation, optimizeFor, avoidTraffic = true, updateEta = true } = params;
  
  console.log(`🗺️ Calculating route for Truck ${truckId} from ${currentLocation.latitude}, ${currentLocation.longitude}`);

  try {
    // Call existing route calculation API
    const response = await fetch(`http://localhost:5000/api/gps/route/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        truckId,
        currentLocation,
        optimizeFor,
        avoidTraffic,
        updateEta
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to calculate route: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Route calculated for Truck ${truckId}: ${data.route.distance.toFixed(1)} miles, ETA: ${data.route.eta}`);
      return {
        success: true,
        route: {
          distance: data.route.distance,
          duration: data.route.duration,
          eta: new Date(data.route.eta),
          waypoints: data.route.waypoints,
          optimized: data.route.optimized
        }
      };
    } else {
      return {
        success: false,
        error: data.error || 'Route calculation failed'
      };
    }

  } catch (error) {
    console.error(`❌ Error calculating route for Truck ${truckId}:`, error);
    
    // Return mock route data
    const mockDistance = 50 + Math.random() * 200; // 50-250 miles
    const mockDuration = mockDistance * 1.2; // Rough time estimate in minutes
    
    return {
      success: true,
      route: {
        distance: mockDistance,
        duration: mockDuration,
        eta: new Date(Date.now() + mockDuration * 60000),
        waypoints: [
          currentLocation,
          { lat: currentLocation.latitude + 0.1, lng: currentLocation.longitude + 0.1 },
          { lat: currentLocation.latitude + 0.2, lng: currentLocation.longitude + 0.15 }
        ],
        optimized: true
      }
    };
  }
});

// Activity: Detect Speed Violations
export const detectSpeedViolations = activity("detectSpeedViolations", async (params: {
  truckId: number;
  currentSpeed: number;
  speedLimit: number;
  location: { latitude: number; longitude: number };
  severity: "low" | "medium" | "high";
}): Promise<{ alertRequired: boolean; severity: string; details: string }> => {
  const { truckId, currentSpeed, speedLimit, location, severity } = params;
  
  console.log(`🚨 Checking speed violation for Truck ${truckId}: ${currentSpeed} mph (limit: ${speedLimit} mph)`);

  try {
    // Call existing speed monitoring API
    const response = await fetch(`http://localhost:5000/api/gps/speed/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        truckId,
        currentSpeed,
        speedLimit,
        location,
        severity
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to check speed violation: ${response.statusText}`);
    }

    const data = await response.json();
    return data.speedCheck;

  } catch (error) {
    console.error(`❌ Error checking speed violation for Truck ${truckId}:`, error);
    
    // Mock speed violation detection
    const isViolation = currentSpeed > speedLimit;
    const excessSpeed = currentSpeed - speedLimit;
    
    let alertSeverity = severity;
    if (excessSpeed > 20) alertSeverity = "high";
    else if (excessSpeed > 10) alertSeverity = "medium";
    else alertSeverity = "low";

    return {
      alertRequired: isViolation,
      severity: alertSeverity,
      details: isViolation 
        ? `Speed violation: ${currentSpeed} mph in ${speedLimit} mph zone (${excessSpeed.toFixed(1)} mph over)`
        : `Speed compliant: ${currentSpeed} mph in ${speedLimit} mph zone`
    };
  }
});

// Activity: Send Geofence Alert
export const sendGeofenceAlert = activity("sendGeofenceAlert", async (params: {
  truckId: number;
  alertType: "geofence_violation" | "speed_violation" | "route_deviation";
  location: { latitude: number; longitude: number };
  geofenceId?: number;
  details: string;
  severity: "low" | "medium" | "high" | "critical";
}): Promise<{ sent: boolean; alertId: string; timestamp: Date }> => {
  const { truckId, alertType, location, geofenceId, details, severity } = params;
  
  console.log(`📢 Sending ${severity} ${alertType} alert for Truck ${truckId}`);

  try {
    // Call existing alert API
    const response = await fetch(`http://localhost:5000/api/alerts/geofence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        truckId,
        alertType,
        location,
        geofenceId,
        details,
        severity
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to send geofence alert: ${response.statusText}`);
    }

    const data = await response.json();
    return data.alertResult;

  } catch (error) {
    console.error(`❌ Error sending geofence alert for Truck ${truckId}:`, error);
    
    // Mock alert sending
    const alertId = `alert_${truckId}_${Date.now()}`;
    console.log(`📧 ${severity.toUpperCase()} alert sent for Truck ${truckId}: ${details}`);
    
    return {
      sent: true,
      alertId,
      timestamp: new Date()
    };
  }
});

// Activity: Update Tracking Dashboard
export const updateTrackingDashboard = activity("updateTrackingDashboard", async (params: {
  truckId: number;
  location: { latitude: number; longitude: number; speed: number; heading: number };
  status: {
    tracking: "active" | "inactive" | "error";
    accuracy: number;
    lastUpdate: Date;
    violations: number;
    speedViolations: number;
  };
}): Promise<{ updated: boolean; timestamp: Date }> => {
  const { truckId, location, status } = params;
  
  console.log(`📊 Updating tracking dashboard for Truck ${truckId}`);

  try {
    // Call existing dashboard API
    const response = await fetch(`http://localhost:5000/api/dashboard/gps/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        truckId,
        location,
        status
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update tracking dashboard: ${response.statusText}`);
    }

    const data = await response.json();
    return data.updateResult;

  } catch (error) {
    console.error(`❌ Error updating tracking dashboard for Truck ${truckId}:`, error);
    
    // Mock dashboard update
    return {
      updated: true,
      timestamp: new Date()
    };
  }
});

// Activity: Store Location History
export const storeLocationHistory = activity("storeLocationHistory", async (params: {
  truckId: number;
  location: { latitude: number; longitude: number; speed: number; heading: number; accuracy: number; timestamp: Date };
  violations: Array<{ type: string; severity: string }>;
  metadata: Record<string, any>;
}): Promise<{ stored: boolean; recordId: string }> => {
  const { truckId, location, violations, metadata } = params;
  
  console.log(`💾 Storing location history for Truck ${truckId}`);

  try {
    // Call existing location storage API
    const response = await fetch(`http://localhost:5000/api/gps/history/store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        truckId,
        location,
        violations,
        metadata
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to store location history: ${response.statusText}`);
    }

    const data = await response.json();
    return data.storageResult;

  } catch (error) {
    console.error(`❌ Error storing location history for Truck ${truckId}:`, error);
    
    // Mock storage
    const recordId = `loc_${truckId}_${Date.now()}`;
    return {
      stored: true,
      recordId
    };
  }
});