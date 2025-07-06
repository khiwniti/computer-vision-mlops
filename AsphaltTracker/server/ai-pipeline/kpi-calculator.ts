// Driver KPI Scoring System
// Comprehensive scoring algorithm for driver performance evaluation

import { storage } from '../storage.js';
import type { 
  DriverScore, InsertDriverScore, Driver, Trip, AiIncident, 
  GpsPoint, GeofenceEvent, FraudAlert 
} from '@shared/schema';

export interface KPIWeights {
  safety: number;      // Default: 0.40 (40%)
  efficiency: number;  // Default: 0.35 (35%)
  compliance: number;  // Default: 0.25 (25%)
}

export interface SafetyMetrics {
  drowsinessEvents: number;
  phoneUsageEvents: number;
  seatbeltViolations: number;
  smokingEvents: number;
  harshBrakingEvents: number;
  harshAccelerationEvents: number;
  speedingViolations: number;
  accidentCount: number;
  nearMissCount: number;
  safetyTrainingCompliance: number; // 0-1
}

export interface EfficiencyMetrics {
  totalDistance: number;        // miles/km
  totalDuration: number;        // minutes
  fuelEfficiency: number;       // mpg or l/100km
  routeAdherence: number;       // percentage 0-100
  onTimeDeliveries: number;
  lateDeliveries: number;
  idleTime: number;            // minutes
  averageSpeed: number;        // mph/kmh
  economicDriving: number;     // 0-100 score
}

export interface ComplianceMetrics {
  documentationComplete: boolean;
  communicationScore: number;      // 0-100
  policyViolations: number;
  trainingCompleted: boolean;
  vehicleInspectionCompliance: number; // 0-100
  hoursOfServiceCompliance: number;    // 0-100
  geofenceViolations: number;
}

export interface KPICalculationResult {
  driverId: number;
  date: Date;
  period: 'daily' | 'weekly' | 'monthly';
  
  // Overall scores
  overallScore: number;
  safetyScore: number;
  efficiencyScore: number;
  complianceScore: number;
  
  // Detailed metrics
  safetyMetrics: SafetyMetrics;
  efficiencyMetrics: EfficiencyMetrics;
  complianceMetrics: ComplianceMetrics;
  
  // Performance indicators
  trend: 'improving' | 'declining' | 'stable';
  ranking: number; // Among all drivers
  recommendations: string[];
  
  // Risk assessment
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
}

export class KPICalculator {
  private weights: KPIWeights;
  
  constructor(weights: Partial<KPIWeights> = {}) {
    this.weights = {
      safety: 0.40,
      efficiency: 0.35,
      compliance: 0.25,
      ...weights
    };
  }

  /**
   * Calculate comprehensive KPI for a driver
   */
  async calculateDriverKPI(
    driverId: number, 
    startDate: Date, 
    endDate: Date,
    period: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<KPICalculationResult> {
    
    // Gather all relevant data
    const [
      incidents,
      trips,
      gpsPoints,
      geofenceEvents,
      fraudAlerts,
      driver
    ] = await Promise.all([
      this.getIncidentsInPeriod(driverId, startDate, endDate),
      this.getTripsInPeriod(driverId, startDate, endDate),
      this.getGpsDataInPeriod(driverId, startDate, endDate),
      this.getGeofenceEventsInPeriod(driverId, startDate, endDate),
      this.getFraudAlertsInPeriod(driverId, startDate, endDate),
      storage.getDriver(driverId)
    ]);

    if (!driver) {
      throw new Error(`Driver ${driverId} not found`);
    }

    // Calculate individual metric categories
    const safetyMetrics = this.calculateSafetyMetrics(incidents, trips, gpsPoints);
    const efficiencyMetrics = this.calculateEfficiencyMetrics(trips, gpsPoints);
    const complianceMetrics = this.calculateComplianceMetrics(
      incidents, geofenceEvents, fraudAlerts, driver
    );

    // Calculate scores
    const safetyScore = this.calculateSafetyScore(safetyMetrics);
    const efficiencyScore = this.calculateEfficiencyScore(efficiencyMetrics);
    const complianceScore = this.calculateComplianceScore(complianceMetrics);

    // Calculate overall score
    const overallScore = 
      safetyScore * this.weights.safety +
      efficiencyScore * this.weights.efficiency +
      complianceScore * this.weights.compliance;

    // Get historical data for trend analysis
    const trend = await this.calculateTrend(driverId, overallScore, period);
    const ranking = await this.calculateRanking(driverId, overallScore);
    const riskAssessment = this.assessRisk(safetyMetrics, complianceMetrics, fraudAlerts);
    const recommendations = this.generateRecommendations(
      safetyMetrics, efficiencyMetrics, complianceMetrics, riskAssessment.riskLevel
    );

    return {
      driverId,
      date: endDate,
      period,
      overallScore: Math.round(overallScore * 100) / 100,
      safetyScore: Math.round(safetyScore * 100) / 100,
      efficiencyScore: Math.round(efficiencyScore * 100) / 100,
      complianceScore: Math.round(complianceScore * 100) / 100,
      safetyMetrics,
      efficiencyMetrics,
      complianceMetrics,
      trend,
      ranking,
      recommendations,
      riskLevel: riskAssessment.riskLevel,
      riskFactors: riskAssessment.riskFactors
    };
  }

  /**
   * Calculate safety score (0-100)
   */
  private calculateSafetyScore(metrics: SafetyMetrics): number {
    let score = 100;

    // Deduct points for safety violations
    score -= metrics.drowsinessEvents * 15;           // -15 per drowsiness event
    score -= metrics.phoneUsageEvents * 20;          // -20 per phone usage
    score -= metrics.seatbeltViolations * 10;        // -10 per seatbelt violation
    score -= metrics.smokingEvents * 5;              // -5 per smoking event
    score -= metrics.harshBrakingEvents * 8;         // -8 per harsh braking
    score -= metrics.harshAccelerationEvents * 8;    // -8 per harsh acceleration
    score -= metrics.speedingViolations * 12;        // -12 per speeding violation
    score -= metrics.accidentCount * 50;             // -50 per accident
    score -= metrics.nearMissCount * 25;             // -25 per near miss

    // Add bonus for safety training compliance
    score += metrics.safetyTrainingCompliance * 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate efficiency score (0-100)
   */
  private calculateEfficiencyScore(metrics: EfficiencyMetrics): number {
    let score = 50; // Base score

    // Route adherence (0-25 points)
    score += (metrics.routeAdherence / 100) * 25;

    // On-time delivery performance (0-25 points)
    const totalDeliveries = metrics.onTimeDeliveries + metrics.lateDeliveries;
    if (totalDeliveries > 0) {
      const onTimeRate = metrics.onTimeDeliveries / totalDeliveries;
      score += onTimeRate * 25;
    }

    // Fuel efficiency (0-20 points)
    // Assume good fuel efficiency is 8+ mpg for trucks
    const fuelScore = Math.min(20, (metrics.fuelEfficiency / 8) * 20);
    score += fuelScore;

    // Economic driving (0-20 points)
    score += (metrics.economicDriving / 100) * 20;

    // Penalize excessive idle time
    const idleTimePenalty = Math.min(10, metrics.idleTime / 60); // 1 point per hour of idle
    score -= idleTimePenalty;

    // Speed optimization (0-10 points)
    // Optimal speed range for efficiency
    if (metrics.averageSpeed >= 55 && metrics.averageSpeed <= 65) {
      score += 10;
    } else if (metrics.averageSpeed >= 45 && metrics.averageSpeed <= 75) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate compliance score (0-100)
   */
  private calculateComplianceScore(metrics: ComplianceMetrics): number {
    let score = 100;

    // Documentation compliance
    if (!metrics.documentationComplete) score -= 20;

    // Communication score (0-20 points)
    score = score - 20 + (metrics.communicationScore / 100) * 20;

    // Policy violations
    score -= metrics.policyViolations * 15;

    // Training compliance
    if (!metrics.trainingCompleted) score -= 15;

    // Vehicle inspection compliance
    score = score - 15 + (metrics.vehicleInspectionCompliance / 100) * 15;

    // Hours of service compliance
    score = score - 15 + (metrics.hoursOfServiceCompliance / 100) * 15;

    // Geofence violations
    score -= metrics.geofenceViolations * 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate safety metrics from incidents and trips
   */
  private calculateSafetyMetrics(
    incidents: AiIncident[], 
    trips: Trip[], 
    gpsPoints: GpsPoint[]
  ): SafetyMetrics {
    const metrics: SafetyMetrics = {
      drowsinessEvents: incidents.filter(i => i.incidentType === 'drowsiness').length,
      phoneUsageEvents: incidents.filter(i => i.incidentType === 'phone_usage').length,
      seatbeltViolations: incidents.filter(i => i.incidentType === 'seatbelt').length,
      smokingEvents: incidents.filter(i => i.incidentType === 'smoking').length,
      harshBrakingEvents: incidents.filter(i => i.incidentType === 'harsh_braking').length,
      harshAccelerationEvents: incidents.filter(i => i.incidentType === 'harsh_acceleration').length,
      speedingViolations: incidents.filter(i => i.incidentType === 'speeding').length,
      accidentCount: 0, // Would come from external accident database
      nearMissCount: incidents.filter(i => i.incidentType === 'near_miss').length,
      safetyTrainingCompliance: 1.0 // Default to compliant, would come from training system
    };

    return metrics;
  }

  /**
   * Calculate efficiency metrics from trips and GPS data
   */
  private calculateEfficiencyMetrics(trips: Trip[], gpsPoints: GpsPoint[]): EfficiencyMetrics {
    const totalDistance = trips.reduce((sum, trip) => sum + (trip.distance || 0), 0);
    const totalDuration = trips.reduce((sum, trip) => sum + (trip.duration || 0), 0);
    
    // Calculate route adherence (simplified)
    const routeAdherence = Math.max(0, 100 - (Math.random() * 20)); // Mock calculation
    
    // Count deliveries
    const completedTrips = trips.filter(t => t.status === 'completed');
    const onTimeDeliveries = Math.floor(completedTrips.length * 0.85); // 85% on-time
    const lateDeliveries = completedTrips.length - onTimeDeliveries;

    // Calculate fuel efficiency (mock)
    const fuelEfficiency = 6 + Math.random() * 4; // 6-10 mpg for trucks

    // Calculate average speed
    const averageSpeed = totalDuration > 0 ? (totalDistance / totalDuration) * 60 : 0;

    return {
      totalDistance,
      totalDuration,
      fuelEfficiency,
      routeAdherence,
      onTimeDeliveries,
      lateDeliveries,
      idleTime: Math.random() * 120, // Mock idle time
      averageSpeed,
      economicDriving: 75 + Math.random() * 25 // Mock economic driving score
    };
  }

  /**
   * Calculate compliance metrics
   */
  private calculateComplianceMetrics(
    incidents: AiIncident[],
    geofenceEvents: GeofenceEvent[],
    fraudAlerts: FraudAlert[],
    driver: Driver
  ): ComplianceMetrics {
    return {
      documentationComplete: Math.random() > 0.1, // 90% compliance
      communicationScore: 80 + Math.random() * 20,
      policyViolations: incidents.filter(i => 
        ['phone_usage', 'smoking', 'seatbelt'].includes(i.incidentType)
      ).length,
      trainingCompleted: Math.random() > 0.05, // 95% compliance
      vehicleInspectionCompliance: 85 + Math.random() * 15,
      hoursOfServiceCompliance: 90 + Math.random() * 10,
      geofenceViolations: geofenceEvents.filter(e => !e.authorized).length
    };
  }

  /**
   * Calculate performance trend
   */
  private async calculateTrend(
    driverId: number, 
    currentScore: number, 
    period: string
  ): Promise<'improving' | 'declining' | 'stable'> {
    try {
      const historicalScores = await storage.getDriverScores(driverId, 30);
      
      if (historicalScores.length < 2) return 'stable';

      const recentScores = historicalScores
        .slice(0, 5)
        .map(s => s.overallScore)
        .filter(s => s !== null && s !== undefined) as number[];

      if (recentScores.length < 2) return 'stable';

      const avgRecent = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
      const difference = currentScore - avgRecent;

      if (difference > 5) return 'improving';
      if (difference < -5) return 'declining';
      return 'stable';
    } catch {
      return 'stable';
    }
  }

  /**
   * Calculate driver ranking among all drivers
   */
  private async calculateRanking(driverId: number, currentScore: number): Promise<number> {
    try {
      const allDrivers = await storage.getAllDrivers();
      const driverScores = await Promise.all(
        allDrivers.map(async (driver) => {
          const latestScore = await storage.getLatestDriverScore(driver.id);
          return {
            driverId: driver.id,
            score: latestScore?.overallScore || 0
          };
        })
      );

      driverScores.sort((a, b) => b.score - a.score);
      const ranking = driverScores.findIndex(d => d.driverId === driverId) + 1;
      
      return ranking;
    } catch {
      return 1;
    }
  }

  /**
   * Assess risk level based on metrics
   */
  private assessRisk(
    safetyMetrics: SafetyMetrics,
    complianceMetrics: ComplianceMetrics,
    fraudAlerts: FraudAlert[]
  ): { riskLevel: 'low' | 'medium' | 'high' | 'critical', riskFactors: string[] } {
    const riskFactors: string[] = [];
    let riskScore = 0;

    // Safety risk factors
    if (safetyMetrics.drowsinessEvents > 3) {
      riskFactors.push('Frequent drowsiness episodes');
      riskScore += 3;
    }
    if (safetyMetrics.phoneUsageEvents > 0) {
      riskFactors.push('Phone usage while driving');
      riskScore += 2;
    }
    if (safetyMetrics.accidentCount > 0) {
      riskFactors.push('Recent accidents');
      riskScore += 4;
    }
    if (safetyMetrics.speedingViolations > 5) {
      riskFactors.push('Excessive speeding violations');
      riskScore += 2;
    }

    // Compliance risk factors
    if (complianceMetrics.policyViolations > 3) {
      riskFactors.push('Multiple policy violations');
      riskScore += 2;
    }
    if (!complianceMetrics.trainingCompleted) {
      riskFactors.push('Incomplete safety training');
      riskScore += 1;
    }
    if (complianceMetrics.hoursOfServiceCompliance < 80) {
      riskFactors.push('Hours of service violations');
      riskScore += 2;
    }

    // Fraud risk factors
    if (fraudAlerts.length > 0) {
      riskFactors.push('Fraud alerts detected');
      riskScore += fraudAlerts.length;
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 8) riskLevel = 'critical';
    else if (riskScore >= 5) riskLevel = 'high';
    else if (riskScore >= 2) riskLevel = 'medium';
    else riskLevel = 'low';

    return { riskLevel, riskFactors };
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(
    safetyMetrics: SafetyMetrics,
    efficiencyMetrics: EfficiencyMetrics,
    complianceMetrics: ComplianceMetrics,
    riskLevel: string
  ): string[] {
    const recommendations: string[] = [];

    // Safety recommendations
    if (safetyMetrics.drowsinessEvents > 2) {
      recommendations.push('Consider fatigue management training and ensure adequate rest periods');
    }
    if (safetyMetrics.phoneUsageEvents > 0) {
      recommendations.push('Use hands-free communication devices and avoid phone use while driving');
    }
    if (safetyMetrics.harshBrakingEvents > 3) {
      recommendations.push('Practice smooth braking techniques and maintain safe following distances');
    }
    if (safetyMetrics.speedingViolations > 3) {
      recommendations.push('Focus on speed limit compliance and defensive driving techniques');
    }

    // Efficiency recommendations
    if (efficiencyMetrics.routeAdherence < 85) {
      recommendations.push('Review and follow optimized route plans more closely');
    }
    if (efficiencyMetrics.fuelEfficiency < 6) {
      recommendations.push('Attend eco-driving training to improve fuel efficiency');
    }
    if (efficiencyMetrics.onTimeDeliveries / (efficiencyMetrics.onTimeDeliveries + efficiencyMetrics.lateDeliveries) < 0.8) {
      recommendations.push('Improve time management and route planning skills');
    }

    // Compliance recommendations
    if (!complianceMetrics.documentationComplete) {
      recommendations.push('Complete all required documentation promptly and accurately');
    }
    if (!complianceMetrics.trainingCompleted) {
      recommendations.push('Complete outstanding safety and compliance training modules');
    }
    if (complianceMetrics.communicationScore < 70) {
      recommendations.push('Improve communication with dispatch and management');
    }

    // Risk-based recommendations
    if (riskLevel === 'high' || riskLevel === 'critical') {
      recommendations.push('Schedule immediate supervisor meeting to discuss safety concerns');
      recommendations.push('Consider additional safety training and monitoring');
    }

    return recommendations;
  }

  /**
   * Save calculated KPI to database
   */
  async saveKPI(kpiResult: KPICalculationResult): Promise<DriverScore> {
    const scoreData: InsertDriverScore = {
      driverId: kpiResult.driverId,
      date: kpiResult.date,
      overallScore: kpiResult.overallScore,
      safetyScore: kpiResult.safetyScore,
      efficiencyScore: kpiResult.efficiencyScore,
      complianceScore: kpiResult.complianceScore,
      drowsinessEvents: kpiResult.safetyMetrics.drowsinessEvents,
      phoneUsageEvents: kpiResult.safetyMetrics.phoneUsageEvents,
      seatbeltViolations: kpiResult.safetyMetrics.seatbeltViolations,
      smokingEvents: kpiResult.safetyMetrics.smokingEvents,
      harshBrakingEvents: kpiResult.safetyMetrics.harshBrakingEvents,
      harshAccelerationEvents: kpiResult.safetyMetrics.harshAccelerationEvents,
      speedingViolations: kpiResult.safetyMetrics.speedingViolations,
      totalDistance: kpiResult.efficiencyMetrics.totalDistance,
      totalDuration: kpiResult.efficiencyMetrics.totalDuration,
      fuelEfficiency: kpiResult.efficiencyMetrics.fuelEfficiency,
      routeAdherence: kpiResult.efficiencyMetrics.routeAdherence,
      onTimeDeliveries: kpiResult.efficiencyMetrics.onTimeDeliveries,
      lateDeliveries: kpiResult.efficiencyMetrics.lateDeliveries,
      documentationComplete: kpiResult.complianceMetrics.documentationComplete,
      communicationScore: kpiResult.complianceMetrics.communicationScore,
      policyViolations: kpiResult.complianceMetrics.policyViolations
    };

    return await storage.createDriverScore(scoreData);
  }

  // Helper methods for data retrieval
  private async getIncidentsInPeriod(driverId: number, startDate: Date, endDate: Date): Promise<AiIncident[]> {
    const allIncidents = await storage.getAiIncidentsByDriver(driverId, 1000);
    return allIncidents.filter(incident => 
      incident.timestamp >= startDate && incident.timestamp <= endDate
    );
  }

  private async getTripsInPeriod(driverId: number, startDate: Date, endDate: Date): Promise<Trip[]> {
    const allTrips = await storage.getTripsByDriver(driverId);
    return allTrips.filter(trip => 
      trip.startTime >= startDate && trip.startTime <= endDate
    );
  }

  private async getGpsDataInPeriod(driverId: number, startDate: Date, endDate: Date): Promise<GpsPoint[]> {
    // Get GPS data for trucks driven by this driver in the period
    const trips = await this.getTripsInPeriod(driverId, startDate, endDate);
    const truckIds = [...new Set(trips.map(trip => trip.truckId))];
    
    const allGpsData: GpsPoint[] = [];
    for (const truckId of truckIds) {
      const gpsPoints = await storage.getGpsPoints(truckId, 24 * 7); // Last week
      allGpsData.push(...gpsPoints.filter(point => 
        point.timestamp >= startDate && point.timestamp <= endDate && point.driverId === driverId
      ));
    }
    
    return allGpsData;
  }

  private async getGeofenceEventsInPeriod(driverId: number, startDate: Date, endDate: Date): Promise<GeofenceEvent[]> {
    const allEvents = await storage.getGeofenceEvents();
    return allEvents.filter(event => 
      event.driverId === driverId &&
      event.timestamp >= startDate && 
      event.timestamp <= endDate
    );
  }

  private async getFraudAlertsInPeriod(driverId: number, startDate: Date, endDate: Date): Promise<FraudAlert[]> {
    const allAlerts = await storage.getFraudAlerts();
    return allAlerts.filter(alert => 
      alert.driverId === driverId &&
      alert.timestamp >= startDate && 
      alert.timestamp <= endDate
    );
  }
}

// Global KPI Calculator instance
export const kpiCalculator = new KPICalculator();