// Safety Agent
// AI-powered safety monitoring and compliance checking

import { Agent, step } from "@restackio/ai";

export class SafetyAgent extends Agent {
  name = "safetyAgent";
  
  constructor() {
    super();
  }

  @step()
  async monitorSafety(input: {
    cameraFeeds: Array<{
      cameraId: string;
      location: string;
      currentFrame: string; // base64 encoded frame
    }>;
    safetyRules: any;
  }) {
    console.log(`🛡️ Safety Agent: Monitoring safety across ${input.cameraFeeds.length} cameras`);
    
    try {
      // Step 1: Detect PPE compliance
      const ppeCompliance = await this.checkPPECompliance(input.cameraFeeds);
      
      // Step 2: Monitor proximity and safety zones
      const proximityChecks = await this.monitorProximityAndZones(input.cameraFeeds, input.safetyRules);
      
      // Step 3: Detect unsafe behaviors
      const behaviorAnalysis = await this.detectUnsafeBehaviors(input.cameraFeeds);
      
      // Step 4: Check equipment safety
      const equipmentSafety = await this.checkEquipmentSafety(input.cameraFeeds);
      
      // Step 5: Generate safety alerts
      const alerts = await this.generateSafetyAlerts({
        ppeCompliance,
        proximityChecks,
        behaviorAnalysis,
        equipmentSafety
      });

      // Step 6: Calculate safety score
      const safetyScore = await this.calculateSafetyScore({
        ppeCompliance,
        proximityChecks,
        behaviorAnalysis,
        equipmentSafety
      });

      const result = {
        timestamp: new Date().toISOString(),
        status: "completed",
        summary: {
          overallSafetyScore: safetyScore.overall,
          totalViolations: alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length,
          ppeComplianceRate: ppeCompliance.complianceRate,
          activeAlerts: alerts.filter(a => a.status === 'active').length
        },
        compliance: {
          ppe: ppeCompliance,
          proximity: proximityChecks,
          behavior: behaviorAnalysis,
          equipment: equipmentSafety
        },
        alerts,
        safetyScore
      };

      console.log(`✅ Safety Agent: Monitoring completed - Safety score: ${safetyScore.overall}%`);
      return result;

    } catch (error) {
      console.error(`❌ Safety Agent: Error during safety monitoring:`, error);
      return {
        timestamp: new Date().toISOString(),
        status: "failed",
        error: error.message
      };
    }
  }

  @step()
  async checkPPECompliance(cameraFeeds: any[]) {
    console.log(`👷 Checking PPE compliance across cameras`);
    
    // Mock PPE detection - replace with actual AI model inference
    const ppeDetections = [
      {
        cameraId: "CAM-001",
        personnel: [
          {
            id: "person_001",
            ppe: {
              hardHat: { detected: true, confidence: 0.95 },
              safetyVest: { detected: true, confidence: 0.89 },
              safetyBoots: { detected: true, confidence: 0.87 },
              gloves: { detected: false, confidence: 0.0 }
            },
            compliance: 0.75,
            violations: ["missing_gloves"]
          }
        ]
      },
      {
        cameraId: "CAM-002", 
        personnel: [
          {
            id: "person_002",
            ppe: {
              hardHat: { detected: false, confidence: 0.0 },
              safetyVest: { detected: true, confidence: 0.92 },
              safetyBoots: { detected: true, confidence: 0.88 },
              gloves: { detected: true, confidence: 0.85 }
            },
            compliance: 0.75,
            violations: ["missing_hard_hat"]
          }
        ]
      }
    ];

    const totalPersonnel = ppeDetections.reduce((sum, cam) => sum + cam.personnel.length, 0);
    const compliantPersonnel = ppeDetections.reduce((sum, cam) => 
      sum + cam.personnel.filter(p => p.compliance >= 0.8).length, 0);

    return {
      complianceRate: totalPersonnel > 0 ? compliantPersonnel / totalPersonnel : 1.0,
      detections: ppeDetections,
      violations: ppeDetections.flatMap(cam => 
        cam.personnel.flatMap(p => 
          p.violations.map(v => ({
            cameraId: cam.cameraId,
            personId: p.id,
            violation: v,
            severity: v.includes('hard_hat') ? 'critical' : 'medium'
          }))
        )
      )
    };
  }

  @step()
  async monitorProximityAndZones(cameraFeeds: any[], safetyRules: any) {
    console.log(`📏 Monitoring proximity and safety zones`);
    
    // Mock proximity monitoring - replace with actual spatial analysis
    const proximityChecks = [
      {
        cameraId: "CAM-001",
        checks: [
          {
            type: "equipment_personnel_proximity",
            equipment: "asphalt_paver",
            personnel: "person_001",
            distance: 3.2, // meters
            minimumDistance: 5.0,
            violation: true,
            severity: "high"
          }
        ]
      },
      {
        cameraId: "CAM-003",
        checks: [
          {
            type: "restricted_zone_entry",
            zone: "active_paving_area",
            personnel: "person_003",
            authorized: false,
            violation: true,
            severity: "critical"
          }
        ]
      }
    ];

    const totalChecks = proximityChecks.reduce((sum, cam) => sum + cam.checks.length, 0);
    const violations = proximityChecks.reduce((sum, cam) => 
      sum + cam.checks.filter(c => c.violation).length, 0);

    return {
      complianceRate: totalChecks > 0 ? (totalChecks - violations) / totalChecks : 1.0,
      checks: proximityChecks,
      violations: proximityChecks.flatMap(cam =>
        cam.checks.filter(c => c.violation).map(c => ({
          cameraId: cam.cameraId,
          type: c.type,
          severity: c.severity,
          details: c
        }))
      )
    };
  }

  @step()
  async detectUnsafeBehaviors(cameraFeeds: any[]) {
    console.log(`⚠️ Detecting unsafe behaviors`);
    
    // Mock behavior analysis - replace with actual behavior recognition AI
    const behaviorDetections = [
      {
        cameraId: "CAM-002",
        behaviors: [
          {
            type: "running_near_equipment",
            personId: "person_002",
            confidence: 0.87,
            severity: "medium",
            timestamp: new Date().toISOString()
          }
        ]
      }
    ];

    return {
      detections: behaviorDetections,
      violations: behaviorDetections.flatMap(cam =>
        cam.behaviors.map(b => ({
          cameraId: cam.cameraId,
          type: b.type,
          personId: b.personId,
          severity: b.severity,
          confidence: b.confidence
        }))
      )
    };
  }

  @step()
  async checkEquipmentSafety(cameraFeeds: any[]) {
    console.log(`🚜 Checking equipment safety status`);
    
    // Mock equipment safety checks - replace with actual equipment monitoring
    const equipmentChecks = [
      {
        cameraId: "CAM-001",
        equipment: [
          {
            id: "asphalt_paver_001",
            type: "asphalt_paver",
            safetyChecks: {
              operatorPresent: true,
              warningLights: true,
              backupAlarm: true,
              emergencyStop: true
            },
            compliance: 1.0,
            violations: []
          }
        ]
      },
      {
        cameraId: "CAM-003",
        equipment: [
          {
            id: "road_roller_001", 
            type: "road_roller",
            safetyChecks: {
              operatorPresent: true,
              warningLights: false,
              backupAlarm: true,
              emergencyStop: true
            },
            compliance: 0.75,
            violations: ["warning_lights_off"]
          }
        ]
      }
    ];

    const totalEquipment = equipmentChecks.reduce((sum, cam) => sum + cam.equipment.length, 0);
    const compliantEquipment = equipmentChecks.reduce((sum, cam) =>
      sum + cam.equipment.filter(e => e.compliance >= 0.8).length, 0);

    return {
      complianceRate: totalEquipment > 0 ? compliantEquipment / totalEquipment : 1.0,
      checks: equipmentChecks,
      violations: equipmentChecks.flatMap(cam =>
        cam.equipment.flatMap(e =>
          e.violations.map(v => ({
            cameraId: cam.cameraId,
            equipmentId: e.id,
            equipmentType: e.type,
            violation: v,
            severity: "medium"
          }))
        )
      )
    };
  }

  @step()
  async generateSafetyAlerts(safetyData: any) {
    console.log(`🚨 Generating safety alerts`);
    
    const alerts = [];

    // PPE violations
    safetyData.ppeCompliance.violations.forEach((violation: any) => {
      alerts.push({
        id: `ppe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: "ppe_violation",
        severity: violation.severity,
        title: `PPE Violation: ${violation.violation.replace('_', ' ')}`,
        description: `Worker detected without required PPE: ${violation.violation}`,
        cameraId: violation.cameraId,
        personId: violation.personId,
        timestamp: new Date().toISOString(),
        status: "active",
        actionRequired: "Ensure worker has proper PPE before continuing work"
      });
    });

    // Proximity violations
    safetyData.proximityChecks.violations.forEach((violation: any) => {
      alerts.push({
        id: `prox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: "proximity_violation",
        severity: violation.severity,
        title: `Proximity Violation: ${violation.type.replace('_', ' ')}`,
        description: `Safety distance violation detected`,
        cameraId: violation.cameraId,
        timestamp: new Date().toISOString(),
        status: "active",
        actionRequired: "Maintain safe distance from equipment and restricted areas"
      });
    });

    return alerts;
  }

  @step()
  async calculateSafetyScore(safetyData: any) {
    console.log(`📊 Calculating overall safety score`);
    
    const weights = {
      ppe: 0.3,
      proximity: 0.3,
      behavior: 0.2,
      equipment: 0.2
    };

    const scores = {
      ppe: safetyData.ppeCompliance.complianceRate * 100,
      proximity: safetyData.proximityChecks.complianceRate * 100,
      behavior: Math.max(0, 100 - (safetyData.behaviorAnalysis.violations.length * 10)),
      equipment: safetyData.equipmentSafety.complianceRate * 100
    };

    const overall = Object.keys(weights).reduce((sum, key) => 
      sum + (scores[key] * weights[key]), 0);

    return {
      overall: Math.round(overall),
      breakdown: scores,
      weights,
      grade: overall >= 90 ? 'A' : overall >= 80 ? 'B' : overall >= 70 ? 'C' : 'D'
    };
  }
}
