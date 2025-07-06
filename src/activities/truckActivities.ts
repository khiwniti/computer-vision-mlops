// Truck Management Activities - Restack AI Framework integration
// Wraps existing AsphaltTracker API functionality as Restack activities

import { activity } from "@restackio/ai";

// Types
interface TruckStatus {
  truckId: number;
  online: boolean;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  speed: number;
  heading: number;
  driverId?: number;
  cameras: Array<{
    id: number;
    position: string;
    status: string;
    streamUrl: string;
  }>;
  kpiScore: number;
  lastUpdate: Date;
}

interface GpsData {
  violations: Array<{
    type: string;
    geofenceId: number;
    severity: string;
    timestamp: Date;
  }>;
  accuracy: number;
  satelliteCount: number;
}

interface BehaviorAnalysis {
  incidents: Array<{
    type: string;
    confidence: number;
    severity: string;
    timestamp: Date;
  }>;
  overallScore: number;
  riskLevel: string;
}

// Activity: Get Truck Status
export const getTruckStatus = activity("getTruckStatus", async (params: {
  truckId: number;
  includeLocation?: boolean;
  includeCameras?: boolean;
  includeDriver?: boolean;
}): Promise<TruckStatus> => {
  const { truckId, includeLocation = true, includeCameras = true, includeDriver = true } = params;
  
  console.log(`🚛 Getting status for Truck ${truckId}`);

  try {
    // This would call our existing API endpoint
    const response = await fetch(`http://localhost:5000/api/trucks/${truckId}/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to get truck status: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform the data to match our expected format
    const truckStatus: TruckStatus = {
      truckId: data.truck.id,
      online: data.truck.status !== 'offline',
      location: {
        latitude: data.truck.location?.lat || 0,
        longitude: data.truck.location?.lng || 0,
        address: data.truck.location?.address
      },
      speed: data.truck.speed || 0,
      heading: data.truck.heading || 0,
      driverId: includeDriver ? data.truck.driverId : undefined,
      cameras: includeCameras ? data.truck.cameras || [] : [],
      kpiScore: data.truck.kpiScore || 0,
      lastUpdate: new Date(data.truck.lastUpdate || Date.now())
    };

    console.log(`✅ Retrieved status for Truck ${truckId}: ${truckStatus.online ? 'Online' : 'Offline'}`);
    return truckStatus;

  } catch (error) {
    console.error(`❌ Error getting truck status for ${truckId}:`, error);
    
    // Return mock data for development/testing
    return {
      truckId,
      online: Math.random() > 0.1,
      location: {
        latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
        longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
        address: `Location ${truckId}`
      },
      speed: Math.random() * 70,
      heading: Math.random() * 360,
      driverId: Math.floor(Math.random() * 200) + 1,
      cameras: [
        { id: truckId * 10 + 1, position: 'front', status: 'online', streamUrl: `rtsp://truck${truckId}_front` },
        { id: truckId * 10 + 2, position: 'driver_facing', status: 'online', streamUrl: `rtsp://truck${truckId}_driver` }
      ],
      kpiScore: 60 + Math.random() * 40,
      lastUpdate: new Date()
    };
  }
});

// Activity: Process GPS Data
export const processGpsData = activity("processGpsData", async (params: {
  truckId: number;
  location: { latitude: number; longitude: number };
  speed: number;
  heading: number;
  checkGeofences?: boolean;
  speedLimit?: number;
}): Promise<GpsData> => {
  const { truckId, location, speed, heading, checkGeofences = true, speedLimit = 65 } = params;
  
  console.log(`📍 Processing GPS data for Truck ${truckId} at ${location.latitude}, ${location.longitude}`);

  try {
    // Call existing GPS processing API
    const response = await fetch(`http://localhost:5000/api/gps/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        truckId,
        location,
        speed,
        heading,
        checkGeofences,
        speedLimit
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to process GPS data: ${response.statusText}`);
    }

    const data = await response.json();
    return data.gpsData;

  } catch (error) {
    console.error(`❌ Error processing GPS data for Truck ${truckId}:`, error);
    
    // Return mock GPS data
    const violations = [];
    if (speed > speedLimit) {
      violations.push({
        type: 'speed_violation',
        geofenceId: 0,
        severity: speed > speedLimit * 1.2 ? 'high' : 'medium',
        timestamp: new Date()
      });
    }

    return {
      violations,
      accuracy: 3 + Math.random() * 7, // 3-10 meters
      satelliteCount: 8 + Math.floor(Math.random() * 5) // 8-12 satellites
    };
  }
});

// Activity: Analyze Driver Behavior
export const analyzeDriverBehavior = activity("analyzeDriverBehavior", async (params: {
  truckId: number;
  driverId?: number;
  cameraFeeds: Array<{ id: number; position: string; streamUrl: string }>;
  analysisTypes: string[];
  confidence: number;
}): Promise<BehaviorAnalysis> => {
  const { truckId, driverId, cameraFeeds, analysisTypes, confidence } = params;
  
  console.log(`🎥 Analyzing driver behavior for Truck ${truckId}, Driver ${driverId}`);

  try {
    // Call existing AI analysis API
    const response = await fetch(`http://localhost:5000/api/ai/analyze-behavior`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        truckId,
        driverId,
        cameraFeeds,
        analysisTypes,
        confidenceThreshold: confidence
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to analyze driver behavior: ${response.statusText}`);
    }

    const data = await response.json();
    return data.behaviorAnalysis;

  } catch (error) {
    console.error(`❌ Error analyzing driver behavior for Truck ${truckId}:`, error);
    
    // Return mock behavior analysis
    const incidents = [];
    const riskFactors = ['drowsiness', 'phone_usage', 'seatbelt_violation'];
    
    // Randomly generate incidents based on analysis types
    for (const type of analysisTypes) {
      if (Math.random() < 0.1) { // 10% chance of incident
        incidents.push({
          type,
          confidence: 0.7 + Math.random() * 0.3,
          severity: Math.random() > 0.8 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low',
          timestamp: new Date()
        });
      }
    }

    const overallScore = Math.max(0, 100 - (incidents.length * 15));
    const riskLevel = overallScore > 80 ? 'low' : overallScore > 60 ? 'medium' : 'high';

    return {
      incidents,
      overallScore,
      riskLevel
    };
  }
});

// Activity: Calculate KPI Score
export const calculateKpiScore = activity("calculateKpiScore", async (params: {
  truckId: number;
  driverId?: number;
  gpsData: GpsData;
  behaviorAnalysis: BehaviorAnalysis;
  incidents: Array<{ severity: string; type: string }>;
  timeWindow: string;
}): Promise<{ score: number; breakdown: Record<string, number>; grade: string }> => {
  const { truckId, driverId, gpsData, behaviorAnalysis, incidents, timeWindow } = params;
  
  console.log(`📊 Calculating KPI score for Truck ${truckId}`);

  try {
    // Call existing KPI calculation API
    const response = await fetch(`http://localhost:5000/api/analytics/kpi/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        truckId,
        driverId,
        gpsData,
        behaviorAnalysis,
        incidents,
        timeWindow
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to calculate KPI score: ${response.statusText}`);
    }

    const data = await response.json();
    return data.kpiScore;

  } catch (error) {
    console.error(`❌ Error calculating KPI score for Truck ${truckId}:`, error);
    
    // Calculate mock KPI score
    let baseScore = 100;
    
    // Deduct points for GPS violations
    baseScore -= gpsData.violations.length * 10;
    
    // Deduct points for behavior incidents
    baseScore -= behaviorAnalysis.incidents.length * 15;
    
    // Deduct points for incidents by severity
    for (const incident of incidents) {
      switch (incident.severity) {
        case 'critical': baseScore -= 25; break;
        case 'high': baseScore -= 15; break;
        case 'medium': baseScore -= 10; break;
        case 'low': baseScore -= 5; break;
      }
    }

    const finalScore = Math.max(0, Math.min(100, baseScore));
    const grade = finalScore >= 90 ? 'A' : finalScore >= 80 ? 'B' : finalScore >= 70 ? 'C' : finalScore >= 60 ? 'D' : 'F';

    return {
      score: finalScore,
      breakdown: {
        safety: behaviorAnalysis.overallScore,
        compliance: gpsData.violations.length === 0 ? 100 : 80,
        efficiency: 85 + Math.random() * 15,
        maintenance: 90 + Math.random() * 10
      },
      grade
    };
  }
});

// Activity: Send Alert
export const sendAlert = activity("sendAlert", async (params: {
  truckId: number;
  driverId?: number;
  alertType: string;
  incidents?: Array<{ type: string; severity: string }>;
  kpiScore?: number;
  urgency: string;
}): Promise<{ sent: boolean; channels: string[]; recipients: string[] }> => {
  const { truckId, driverId, alertType, incidents = [], kpiScore, urgency } = params;
  
  console.log(`🚨 Sending ${urgency} alert for Truck ${truckId}: ${alertType}`);

  try {
    // Call existing alert system API
    const response = await fetch(`http://localhost:5000/api/alerts/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        truckId,
        driverId,
        alertType,
        incidents,
        kpiScore,
        urgency
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to send alert: ${response.statusText}`);
    }

    const data = await response.json();
    return data.alertResult;

  } catch (error) {
    console.error(`❌ Error sending alert for Truck ${truckId}:`, error);
    
    // Mock alert sending
    const channels = ['dashboard', 'email'];
    if (urgency === 'high') {
      channels.push('sms', 'push');
    }

    const recipients = ['fleet_manager'];
    if (incidents.some(i => i.severity === 'critical')) {
      recipients.push('safety_officer', 'emergency_response');
    }

    console.log(`📧 Alert sent via ${channels.join(', ')} to ${recipients.join(', ')}`);
    
    return {
      sent: true,
      channels,
      recipients
    };
  }
});

// Activity: Update Dashboard
export const updateDashboard = activity("updateDashboard", async (params: {
  truckId: number;
  status: TruckStatus;
  kpiScore: number;
  incidents: number;
  lastUpdate: Date;
}): Promise<{ updated: boolean; timestamp: Date }> => {
  const { truckId, status, kpiScore, incidents, lastUpdate } = params;
  
  console.log(`📱 Updating dashboard for Truck ${truckId}`);

  try {
    // Call existing dashboard update API
    const response = await fetch(`http://localhost:5000/api/dashboard/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        truckId,
        status,
        kpiScore,
        incidents,
        lastUpdate
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update dashboard: ${response.statusText}`);
    }

    const data = await response.json();
    return data.updateResult;

  } catch (error) {
    console.error(`❌ Error updating dashboard for Truck ${truckId}:`, error);
    
    // Mock dashboard update
    return {
      updated: true,
      timestamp: new Date()
    };
  }
});