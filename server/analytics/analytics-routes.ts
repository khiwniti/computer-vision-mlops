// Predictive Analytics API Routes
// REST API endpoints for predictive analytics and risk assessment

import express from 'express';
import { predictiveAnalytics } from './predictive-analytics';
import type { RiskPrediction, TrendAnalysis, OperationalInsight } from './predictive-analytics';

const router = express.Router();

/**
 * GET /api/analytics/predictions
 * Get all active risk predictions
 */
router.get('/predictions', async (req, res) => {
  try {
    const entityType = req.query.entityType as string;
    const entityId = req.query.entityId ? parseInt(req.query.entityId as string) : undefined;
    const riskType = req.query.riskType as string;

    let predictions = predictiveAnalytics.getAllPredictions();

    // Apply filters
    if (entityType) {
      predictions = predictions.filter(p => p.entityType === entityType);
    }
    if (entityId) {
      predictions = predictions.filter(p => p.entityId === entityId);
    }
    if (riskType) {
      predictions = predictions.filter(p => p.riskType === riskType);
    }

    res.json({
      success: true,
      predictions,
      count: predictions.length,
      filters: { entityType, entityId, riskType }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/analytics/predictions/driver/:driverId
 * Generate risk predictions for a specific driver
 */
router.post('/predictions/driver/:driverId', async (req, res) => {
  try {
    const driverId = parseInt(req.params.driverId);
    const timeframe = req.body.timeframe || '1_week';

    const predictions = await predictiveAnalytics.generateDriverRiskPrediction(driverId, timeframe);

    res.json({
      success: true,
      predictions,
      driverId,
      timeframe
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/maintenance/:truckId
 * Get maintenance predictions for a truck
 */
router.get('/maintenance/:truckId', async (req, res) => {
  try {
    const truckId = parseInt(req.params.truckId);
    
    const predictions = await predictiveAnalytics.generateMaintenancePredictions(truckId);

    res.json({
      success: true,
      predictions,
      count: predictions.length,
      truckId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/trends
 * Get trend analysis data
 */
router.get('/trends', async (req, res) => {
  try {
    const entityType = req.query.entityType as string;
    const entityId = req.query.entityId ? parseInt(req.query.entityId as string) : undefined;
    const metric = req.query.metric as string;

    let trends = predictiveAnalytics.getAllTrends();

    // Apply filters
    if (entityType) {
      trends = trends.filter(t => t.entityType === entityType);
    }
    if (entityId) {
      trends = trends.filter(t => t.entityId === entityId);
    }
    if (metric) {
      trends = trends.filter(t => t.metric === metric);
    }

    res.json({
      success: true,
      trends,
      count: trends.length,
      filters: { entityType, entityId, metric }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/analytics/trends/analyze
 * Trigger trend analysis for all entities
 */
router.post('/trends/analyze', async (req, res) => {
  try {
    const trends = await predictiveAnalytics.analyzeTrends();

    res.json({
      success: true,
      trends,
      count: trends.length,
      message: 'Trend analysis completed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/insights
 * Get operational insights
 */
router.get('/insights', async (req, res) => {
  try {
    const type = req.query.type as string;
    const impact = req.query.impact as string;

    let insights = predictiveAnalytics.getAllInsights();

    // Apply filters
    if (type) {
      insights = insights.filter(i => i.type === type);
    }
    if (impact) {
      insights = insights.filter(i => i.impact === impact);
    }

    res.json({
      success: true,
      insights,
      count: insights.length,
      filters: { type, impact }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/analytics/insights/generate
 * Generate new operational insights
 */
router.post('/insights/generate', async (req, res) => {
  try {
    const insights = await predictiveAnalytics.generateOperationalInsights();

    res.json({
      success: true,
      insights,
      count: insights.length,
      message: 'Operational insights generated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/risk-summary
 * Get risk summary across all entities
 */
router.get('/risk-summary', async (req, res) => {
  try {
    const predictions = predictiveAnalytics.getAllPredictions();
    
    const summary = {
      total: predictions.length,
      byRiskLevel: {
        critical: predictions.filter(p => p.riskLevel === 'critical').length,
        high: predictions.filter(p => p.riskLevel === 'high').length,
        medium: predictions.filter(p => p.riskLevel === 'medium').length,
        low: predictions.filter(p => p.riskLevel === 'low').length
      },
      byRiskType: {
        safety: predictions.filter(p => p.riskType === 'safety').length,
        efficiency: predictions.filter(p => p.riskType === 'efficiency').length,
        maintenance: predictions.filter(p => p.riskType === 'maintenance').length,
        fraud: predictions.filter(p => p.riskType === 'fraud').length,
        compliance: predictions.filter(p => p.riskType === 'compliance').length
      },
      byEntityType: {
        driver: predictions.filter(p => p.entityType === 'driver').length,
        truck: predictions.filter(p => p.entityType === 'truck').length,
        route: predictions.filter(p => p.entityType === 'route').length,
        operation: predictions.filter(p => p.entityType === 'operation').length
      },
      averageConfidence: predictions.length > 0 
        ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length 
        : 0
    };

    res.json({
      success: true,
      summary,
      lastUpdate: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/dashboard
 * Get analytics dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const predictions = predictiveAnalytics.getAllPredictions();
    const trends = predictiveAnalytics.getAllTrends();
    const insights = predictiveAnalytics.getAllInsights();

    // High-priority items
    const criticalPredictions = predictions.filter(p => p.riskLevel === 'critical');
    const decliningTrends = trends.filter(t => t.trend === 'declining');
    const highImpactInsights = insights.filter(i => i.impact === 'high');

    // Performance metrics
    const driverTrends = trends.filter(t => t.entityType === 'driver');
    const fleetTrend = trends.find(t => t.entityType === 'fleet');

    const dashboard = {
      overview: {
        totalPredictions: predictions.length,
        criticalRisks: criticalPredictions.length,
        decliningTrends: decliningTrends.length,
        actionableInsights: highImpactInsights.length
      },
      riskDistribution: {
        critical: predictions.filter(p => p.riskLevel === 'critical').length,
        high: predictions.filter(p => p.riskLevel === 'high').length,
        medium: predictions.filter(p => p.riskLevel === 'medium').length,
        low: predictions.filter(p => p.riskLevel === 'low').length
      },
      trendSummary: {
        improving: driverTrends.filter(t => t.trend === 'improving').length,
        declining: driverTrends.filter(t => t.trend === 'declining').length,
        stable: driverTrends.filter(t => t.trend === 'stable').length,
        volatile: driverTrends.filter(t => t.trend === 'volatile').length
      },
      fleetPerformance: fleetTrend ? {
        trend: fleetTrend.trend,
        currentValue: fleetTrend.currentValue,
        predictedValue: fleetTrend.predictedValue,
        changeRate: fleetTrend.changeRate
      } : null,
      topInsights: insights.slice(0, 5),
      criticalAlerts: criticalPredictions.slice(0, 10),
      lastUpdate: new Date()
    };

    res.json({
      success: true,
      dashboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/driver/:driverId/risk-profile
 * Get comprehensive risk profile for a driver
 */
router.get('/driver/:driverId/risk-profile', async (req, res) => {
  try {
    const driverId = parseInt(req.params.driverId);
    
    const predictions = predictiveAnalytics.getAllPredictions()
      .filter(p => p.entityType === 'driver' && p.entityId === driverId);
    
    const trends = predictiveAnalytics.getAllTrends()
      .filter(t => t.entityType === 'driver' && t.entityId === driverId);

    const riskProfile = {
      driverId,
      overallRiskLevel: predictions.length > 0 
        ? predictions.reduce((max, p) => {
            const levels = { low: 1, medium: 2, high: 3, critical: 4 };
            return levels[p.riskLevel] > levels[max] ? p.riskLevel : max;
          }, 'low')
        : 'low',
      predictions,
      trends,
      recommendations: predictions.flatMap(p => p.recommendations).filter((r, i, arr) => arr.indexOf(r) === i),
      riskFactors: predictions.flatMap(p => p.riskFactors),
      confidenceScore: predictions.length > 0 
        ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length 
        : 0
    };

    res.json({
      success: true,
      riskProfile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/fleet/performance
 * Get fleet-wide performance analytics
 */
router.get('/fleet/performance', async (req, res) => {
  try {
    const period = req.query.period as string || '30_days';
    
    const trends = predictiveAnalytics.getAllTrends();
    const predictions = predictiveAnalytics.getAllPredictions();
    
    const fleetMetrics = {
      performance: {
        overallTrend: trends.find(t => t.entityType === 'fleet')?.trend || 'stable',
        driverPerformance: {
          improving: trends.filter(t => t.entityType === 'driver' && t.trend === 'improving').length,
          declining: trends.filter(t => t.entityType === 'driver' && t.trend === 'declining').length,
          stable: trends.filter(t => t.entityType === 'driver' && t.trend === 'stable').length
        }
      },
      risks: {
        highRiskDrivers: predictions.filter(p => 
          p.entityType === 'driver' && (p.riskLevel === 'high' || p.riskLevel === 'critical')
        ).length,
        safetyRisks: predictions.filter(p => p.riskType === 'safety').length,
        efficiencyRisks: predictions.filter(p => p.riskType === 'efficiency').length,
        complianceRisks: predictions.filter(p => p.riskType === 'compliance').length
      },
      insights: predictiveAnalytics.getAllInsights(),
      period
    };

    res.json({
      success: true,
      fleetMetrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/analytics/cleanup
 * Clean up expired predictions and data
 */
router.post('/cleanup', async (req, res) => {
  try {
    predictiveAnalytics.cleanupExpiredPredictions();
    
    res.json({
      success: true,
      message: 'Cleanup completed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/health
 * Health check for analytics system
 */
router.get('/health', async (req, res) => {
  try {
    const predictions = predictiveAnalytics.getAllPredictions();
    const trends = predictiveAnalytics.getAllTrends();
    const insights = predictiveAnalytics.getAllInsights();
    
    const isHealthy = predictions.length >= 0 && trends.length >= 0 && insights.length >= 0;
    
    res.status(isHealthy ? 200 : 503).json({
      success: true,
      healthy: isHealthy,
      status: {
        predictions: predictions.length,
        trends: trends.length,
        insights: insights.length,
        lastUpdate: new Date()
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      healthy: false,
      error: error.message,
      timestamp: new Date()
    });
  }
});

export default router;