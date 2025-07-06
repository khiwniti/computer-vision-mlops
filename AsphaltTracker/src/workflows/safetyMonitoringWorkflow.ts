// Safety Monitoring Workflow
// Continuous safety compliance monitoring and violation detection

import { step, workflow } from "@restackio/ai";

export const safetyMonitoringWorkflow = workflow("safetyMonitoringWorkflow", async (input?: {
  cameraIds?: string[];
  urgentOnly?: boolean;
  safetyRules?: any;
}) => {
  console.log(`🛡️ Starting safety monitoring workflow`);

  try {
    // Step 1: Get current camera feeds for safety monitoring
    const cameraFeeds = await step("getCurrentCameraFeeds", {
      cameraIds: input?.cameraIds,
      priority: "safety",
      includeLatestFrames: true
    });

    if (!cameraFeeds || cameraFeeds.length === 0) {
      console.log("📭 No camera feeds available for safety monitoring");
      return {
        status: "no_camera_feeds",
        timestamp: new Date().toISOString()
      };
    }

    console.log(`👁️ Monitoring safety across ${cameraFeeds.length} cameras`);

    // Step 2: Load safety rules and compliance requirements
    const safetyRules = await step("loadSafetyRules", {
      includeCustomRules: true,
      location: "construction_site",
      regulations: ["OSHA", "local_safety_codes"]
    });

    // Step 3: Check PPE compliance
    const ppeCompliance = await step("checkPPECompliance", {
      cameraFeeds,
      requiredPPE: safetyRules.requiredPPE,
      confidenceThreshold: 0.8
    });

    // Step 4: Monitor proximity and safety zones
    const proximityChecks = await step("monitorProximityAndZones", {
      cameraFeeds,
      safetyZones: safetyRules.safetyZones,
      minimumDistances: safetyRules.minimumDistances,
      restrictedAreas: safetyRules.restrictedAreas
    });

    // Step 5: Detect unsafe behaviors
    const behaviorAnalysis = await step("detectUnsafeBehaviors", {
      cameraFeeds,
      behaviorPatterns: safetyRules.unsafeBehaviors,
      contextualAnalysis: true
    });

    // Step 6: Check equipment safety status
    const equipmentSafety = await step("checkEquipmentSafety", {
      cameraFeeds,
      equipmentSafetyChecks: safetyRules.equipmentSafety,
      operationalStatus: true
    });

    // Step 7: Analyze environmental safety conditions
    const environmentalSafety = await step("analyzeEnvironmentalSafety", {
      cameraFeeds,
      weatherConditions: true,
      lightingConditions: true,
      hazardousConditions: safetyRules.environmentalHazards
    });

    // Step 8: Generate safety alerts for violations
    const safetyAlerts = await step("generateSafetyAlerts", {
      ppeViolations: ppeCompliance.violations,
      proximityViolations: proximityChecks.violations,
      behaviorViolations: behaviorAnalysis.violations,
      equipmentViolations: equipmentSafety.violations,
      environmentalIssues: environmentalSafety.issues,
      urgentOnly: input?.urgentOnly || false
    });

    // Step 9: Calculate overall safety score
    const safetyScore = await step("calculateSafetyScore", {
      ppeCompliance: ppeCompliance.complianceRate,
      proximityCompliance: proximityChecks.complianceRate,
      behaviorCompliance: behaviorAnalysis.complianceRate,
      equipmentCompliance: equipmentSafety.complianceRate,
      environmentalSafety: environmentalSafety.safetyLevel,
      weights: safetyRules.scoringWeights
    });

    // Step 10: Process and route critical alerts
    const criticalAlerts = safetyAlerts.filter(alert => 
      alert.severity === 'critical' || alert.severity === 'high'
    );

    if (criticalAlerts.length > 0) {
      await step("processCriticalSafetyAlerts", {
        alerts: criticalAlerts,
        escalationRules: safetyRules.escalationRules,
        immediateNotification: true
      });
    }

    // Step 11: Update safety dashboard
    const safetyDashboard = {
      timestamp: new Date().toISOString(),
      overallSafetyScore: safetyScore.overall,
      summary: {
        totalViolations: safetyAlerts.length,
        criticalViolations: criticalAlerts.length,
        ppeComplianceRate: ppeCompliance.complianceRate,
        proximityComplianceRate: proximityChecks.complianceRate,
        equipmentComplianceRate: equipmentSafety.complianceRate,
        activeCameras: cameraFeeds.length
      },
      compliance: {
        ppe: ppeCompliance,
        proximity: proximityChecks,
        behavior: behaviorAnalysis,
        equipment: equipmentSafety,
        environmental: environmentalSafety
      },
      alerts: safetyAlerts.slice(0, 20), // Latest 20 alerts
      trends: await step("calculateSafetyTrends", {
        currentScore: safetyScore.overall,
        timeWindow: 60 // minutes
      })
    };

    await step("updateSafetyDashboard", safetyDashboard);

    // Step 12: Log safety events for compliance reporting
    await step("logSafetyEvents", {
      violations: safetyAlerts,
      complianceData: {
        ppeCompliance,
        proximityChecks,
        behaviorAnalysis,
        equipmentSafety
      },
      safetyScore: safetyScore.overall,
      timestamp: new Date().toISOString()
    });

    // Step 13: Generate safety recommendations
    const safetyRecommendations = await step("generateSafetyRecommendations", {
      violations: safetyAlerts,
      complianceRates: {
        ppe: ppeCompliance.complianceRate,
        proximity: proximityChecks.complianceRate,
        behavior: behaviorAnalysis.complianceRate,
        equipment: equipmentSafety.complianceRate
      },
      historicalData: true
    });

    // Step 14: Check for safety training needs
    const trainingNeeds = await step("assessSafetyTrainingNeeds", {
      violations: safetyAlerts,
      personnelInvolved: [
        ...ppeCompliance.violations.map(v => v.personId),
        ...behaviorAnalysis.violations.map(v => v.personId)
      ].filter(Boolean),
      trainingRecords: true
    });

    // Step 15: Update real-time safety metrics
    await step("updateRealtimeSafetyMetrics", {
      safetyScore: safetyScore.overall,
      activeViolations: criticalAlerts.length,
      complianceRates: {
        ppe: ppeCompliance.complianceRate,
        proximity: proximityChecks.complianceRate,
        equipment: equipmentSafety.complianceRate
      },
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Safety monitoring completed - Safety score: ${safetyScore.overall}%, ${safetyAlerts.length} alerts generated`);

    return {
      status: "completed",
      timestamp: new Date().toISOString(),
      summary: {
        safetyScore: safetyScore.overall,
        totalAlerts: safetyAlerts.length,
        criticalAlerts: criticalAlerts.length,
        complianceRate: (
          ppeCompliance.complianceRate +
          proximityChecks.complianceRate +
          behaviorAnalysis.complianceRate +
          equipmentSafety.complianceRate
        ) / 4
      },
      compliance: {
        ppe: Math.round(ppeCompliance.complianceRate * 100),
        proximity: Math.round(proximityChecks.complianceRate * 100),
        behavior: Math.round(behaviorAnalysis.complianceRate * 100),
        equipment: Math.round(equipmentSafety.complianceRate * 100)
      },
      alerts: {
        total: safetyAlerts.length,
        critical: criticalAlerts.length,
        high: safetyAlerts.filter(a => a.severity === 'high').length,
        medium: safetyAlerts.filter(a => a.severity === 'medium').length
      },
      recommendations: safetyRecommendations.length,
      trainingNeeds: trainingNeeds.length,
      cameras: cameraFeeds.length
    };

  } catch (error) {
    console.error(`❌ Safety monitoring workflow failed:`, error);

    // Generate critical error alert
    await step("generateCriticalErrorAlert", {
      type: "safety_monitoring_failure",
      error: error.message,
      severity: "critical",
      timestamp: new Date().toISOString(),
      impact: "Safety monitoring temporarily unavailable"
    });

    return {
      status: "failed",
      error: error.message,
      timestamp: new Date().toISOString(),
      impact: "safety_monitoring_unavailable"
    };
  }
});
