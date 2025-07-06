// GPS Tracking Workflow - Real-time location monitoring and geofencing
// Integrates with existing GPS tracking system

import { workflow, activity, proxyActivities } from "@restackio/ai";

// Import activities
const {
  updateLocation,
  checkGeofences,
  calculateRoute,
  detectSpeedViolations,
  sendGeofenceAlert,
  updateTrackingDashboard,
  storeLocationHistory
} = proxyActivities({
  scheduleToCloseTimeout: "30 seconds",
  scheduleToStartTimeout: "30 seconds", 
  startToCloseTimeout: "2 minutes"
});

// Workflow input types
export interface GpsTrackingInput {
  truckId: number;
  trackingDuration: number; // in minutes
  updateInterval: number; // in seconds
  geofenceChecking: boolean;
  speedLimit: number;
  routeOptimization: boolean;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  altitude?: number;
  speed: number;
  heading: number;
  accuracy: number;
  timestamp: Date;
  satelliteCount?: number;
}

export interface GeofenceViolation {
  type: "entry" | "exit" | "speed_limit" | "unauthorized_area";
  geofenceId: number;
  geofenceName: string;
  location: { lat: number; lng: number };
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
}

// Workflow result type
export interface GpsTrackingResult {
  truckId: number;
  status: "completed" | "terminated" | "error";
  totalUpdates: number;
  distanceTraveled: number; // in miles
  averageSpeed: number;
  geofenceViolations: GeofenceViolation[];
  speedViolations: number;
  trackingDuration: number;
  accuracy: number;
  summary: string;
}

/**
 * GPS Tracking Workflow
 * Continuously tracks truck location and monitors geofences
 */
export async function gpsTrackingWorkflow(
  input: GpsTrackingInput
): Promise<GpsTrackingResult> {
  const { 
    truckId, 
    trackingDuration, 
    updateInterval, 
    geofenceChecking, 
    speedLimit, 
    routeOptimization 
  } = input;
  
  let totalUpdates = 0;
  let distanceTraveled = 0;
  let speedReadings: number[] = [];
  let speedViolations = 0;
  let geofenceViolations: GeofenceViolation[] = [];
  let accuracyReadings: number[] = [];
  let lastLocation: LocationData | null = null;

  const startTime = Date.now();
  const endTime = startTime + (trackingDuration * 60 * 1000);

  console.log(`📍 Starting GPS tracking workflow for Truck ${truckId}`);

  try {
    // Continuous GPS tracking loop
    while (Date.now() < endTime) {
      // Get current location update
      const currentLocation = await updateLocation({
        truckId,
        requestHighAccuracy: true,
        timeout: 10000
      });

      if (!currentLocation.success) {
        console.log(`⚠️ Failed to get GPS update for Truck ${truckId}, retrying...`);
        await workflow.sleep(`${updateInterval} seconds`);
        continue;
      }

      const locationData: LocationData = currentLocation.data;
      totalUpdates++;
      speedReadings.push(locationData.speed);
      if (locationData.accuracy) {
        accuracyReadings.push(locationData.accuracy);
      }

      // Calculate distance traveled if we have a previous location
      if (lastLocation) {
        const distance = calculateDistance(lastLocation, locationData);
        distanceTraveled += distance;
      }

      // Check for speed violations
      if (locationData.speed > speedLimit) {
        speedViolations++;
        
        const speedAlert = await detectSpeedViolations({
          truckId,
          currentSpeed: locationData.speed,
          speedLimit,
          location: locationData,
          severity: locationData.speed > speedLimit * 1.2 ? "high" : "medium"
        });
        
        if (speedAlert.alertRequired) {
          await sendGeofenceAlert({
            truckId,
            alertType: "speed_violation",
            location: locationData,
            details: `Speed: ${locationData.speed} mph (Limit: ${speedLimit} mph)`,
            severity: speedAlert.severity
          });
        }
      }

      // Check geofences if enabled
      if (geofenceChecking) {
        const geofenceCheck = await checkGeofences({
          truckId,
          location: locationData,
          checkTypes: ["entry", "exit", "unauthorized_area"],
          alertOnViolation: true
        });

        if (geofenceCheck.violations.length > 0) {
          geofenceViolations.push(...geofenceCheck.violations);
          
          // Send alerts for geofence violations
          for (const violation of geofenceCheck.violations) {
            await sendGeofenceAlert({
              truckId,
              alertType: "geofence_violation",
              location: locationData,
              geofenceId: violation.geofenceId,
              details: `${violation.type} violation at ${violation.geofenceName}`,
              severity: violation.severity
            });
          }
        }
      }

      // Route optimization (if enabled and truck is moving)
      if (routeOptimization && locationData.speed > 5) {
        await calculateRoute({
          truckId,
          currentLocation: locationData,
          optimizeFor: "time_and_fuel",
          avoidTraffic: true,
          updateEta: true
        });
      }

      // Store location in history
      await storeLocationHistory({
        truckId,
        location: locationData,
        violations: geofenceCheck?.violations || [],
        metadata: {
          accuracy: locationData.accuracy,
          satelliteCount: locationData.satelliteCount,
          speedViolation: locationData.speed > speedLimit
        }
      });

      // Update real-time tracking dashboard
      await updateTrackingDashboard({
        truckId,
        location: locationData,
        status: {
          tracking: "active",
          accuracy: locationData.accuracy,
          lastUpdate: new Date(),
          violations: geofenceViolations.length,
          speedViolations
        }
      });

      lastLocation = locationData;

      // Wait for next update cycle
      await workflow.sleep(`${updateInterval} seconds`);
    }

    const averageSpeed = speedReadings.length > 0 
      ? speedReadings.reduce((sum, speed) => sum + speed, 0) / speedReadings.length 
      : 0;

    const averageAccuracy = accuracyReadings.length > 0
      ? accuracyReadings.reduce((sum, acc) => sum + acc, 0) / accuracyReadings.length
      : 0;

    const result: GpsTrackingResult = {
      truckId,
      status: "completed",
      totalUpdates,
      distanceTraveled,
      averageSpeed,
      geofenceViolations,
      speedViolations,
      trackingDuration,
      accuracy: averageAccuracy,
      summary: `GPS tracking completed for Truck ${truckId}. ${distanceTraveled.toFixed(1)} miles, ${geofenceViolations.length} geofence violations, ${speedViolations} speed violations`
    };

    console.log(`✅ GPS tracking workflow completed for Truck ${truckId}:`, result.summary);
    return result;

  } catch (error) {
    console.error(`❌ Error in GPS tracking workflow for Truck ${truckId}:`, error);
    
    return {
      truckId,
      status: "error",
      totalUpdates,
      distanceTraveled,
      averageSpeed: speedReadings.length > 0 ? speedReadings.reduce((a, b) => a + b) / speedReadings.length : 0,
      geofenceViolations,
      speedViolations,
      trackingDuration,
      accuracy: accuracyReadings.length > 0 ? accuracyReadings.reduce((a, b) => a + b) / accuracyReadings.length : 0,
      summary: `GPS tracking failed for Truck ${truckId}: ${error.message}`
    };
  }
}

/**
 * Fleet GPS Tracking Workflow
 * Tracks multiple trucks concurrently
 */
export async function fleetGpsTrackingWorkflow(inputs: {
  truckIds: number[];
  trackingDuration: number;
  updateInterval: number;
  geofenceChecking: boolean;
  speedLimit: number;
}): Promise<GpsTrackingResult[]> {
  const { truckIds, trackingDuration, updateInterval, geofenceChecking, speedLimit } = inputs;
  
  console.log(`📍 Starting fleet GPS tracking for ${truckIds.length} trucks`);

  // Start GPS tracking workflows for all trucks concurrently
  const trackingPromises = truckIds.map(truckId =>
    workflow.executeChild(gpsTrackingWorkflow, {
      truckId,
      trackingDuration,
      updateInterval,
      geofenceChecking,
      speedLimit,
      routeOptimization: true
    })
  );

  // Wait for all tracking workflows to complete
  const results = await Promise.all(trackingPromises);
  
  console.log(`✅ Fleet GPS tracking completed for ${truckIds.length} trucks`);
  return results;
}

/**
 * Calculate distance between two GPS points using Haversine formula
 */
function calculateDistance(point1: LocationData, point2: LocationData): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);
  const lat1 = toRadians(point1.latitude);
  const lat2 = toRadians(point2.latitude);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c; // Distance in miles
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}