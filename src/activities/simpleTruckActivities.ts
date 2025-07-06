// Simplified Truck Management Activities for Restack AI Framework
// Plain TypeScript functions as activities

// Simple activity functions that demonstrate Restack integration
export async function getTruckStatus(params: {
  truckId: number;
  includeLocation?: boolean;
  includeCameras?: boolean;
  includeDriver?: boolean;
}): Promise<{
  truckId: number;
  online: boolean;
  location: { latitude: number; longitude: number };
  speed: number;
  heading: number;
  kpiScore: number;
}> {
  const { truckId } = params;
  
  console.log(`🚛 Getting status for Truck ${truckId}`);
  
  // Return mock data for demonstration
  return {
    truckId,
    online: Math.random() > 0.1,
    location: {
      latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
      longitude: -74.0060 + (Math.random() - 0.5) * 0.1
    },
    speed: Math.random() * 70,
    heading: Math.random() * 360,
    kpiScore: 60 + Math.random() * 40
  };
}

export async function processGpsData(params: {
  truckId: number;
  location: { latitude: number; longitude: number };
  speed: number;
  heading: number;
  checkGeofences?: boolean;
  speedLimit?: number;
}): Promise<{
  violations: Array<{ type: string; severity: string; timestamp: Date }>;
  accuracy: number;
}> {
  const { truckId, speed, speedLimit = 65 } = params;
  
  console.log(`📍 Processing GPS data for Truck ${truckId}`);
  
  const violations = [];
  if (speed > speedLimit) {
    violations.push({
      type: 'speed_violation',
      severity: speed > speedLimit * 1.2 ? 'high' : 'medium',
      timestamp: new Date()
    });
  }

  return {
    violations,
    accuracy: 3 + Math.random() * 7
  };
}

export async function analyzeDriverBehavior(params: {
  truckId: number;
  driverId?: number;
  cameraFeeds: any[];
  analysisTypes: string[];
  confidence: number;
}): Promise<{
  incidents: Array<{ type: string; confidence: number; severity: string; timestamp: Date }>;
  overallScore: number;
}> {
  const { truckId, analysisTypes } = params;
  
  console.log(`🎥 Analyzing driver behavior for Truck ${truckId}`);
  
  const incidents = [];
  
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

  return {
    incidents,
    overallScore
  };
}

export async function calculateKpiScore(params: {
  truckId: number;
  driverId?: number;
  gpsData: any;
  behaviorAnalysis: any;
  incidents: any[];
  timeWindow: string;
}): Promise<{
  score: number;
  breakdown: Record<string, number>;
  grade: string;
}> {
  const { truckId, gpsData, behaviorAnalysis, incidents } = params;
  
  console.log(`📊 Calculating KPI score for Truck ${truckId}`);
  
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

export async function sendAlert(params: {
  truckId: number;
  driverId?: number;
  alertType: string;
  incidents?: any[];
  kpiScore?: number;
  urgency: string;
}): Promise<{
  sent: boolean;
  channels: string[];
  recipients: string[];
}> {
  const { truckId, urgency } = params;
  
  console.log(`🚨 Sending ${urgency} alert for Truck ${truckId}`);
  
  const channels = ['dashboard', 'email'];
  if (urgency === 'high') {
    channels.push('sms', 'push');
  }

  const recipients = ['fleet_manager'];
  
  return {
    sent: true,
    channels,
    recipients
  };
}

export async function updateDashboard(params: {
  truckId: number;
  status: any;
  kpiScore: number;
  incidents: number;
  lastUpdate: Date;
}): Promise<{
  updated: boolean;
  timestamp: Date;
}> {
  const { truckId } = params;
  
  console.log(`📱 Updating dashboard for Truck ${truckId}`);
  
  return {
    updated: true,
    timestamp: new Date()
  };
}