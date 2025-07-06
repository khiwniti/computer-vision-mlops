// Comprehensive Analytics Dashboard Component
// Advanced reporting and analytics with predictive insights

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Target,
  DollarSign,
  Clock,
  Users,
  Truck,
  Shield,
  Brain,
  Lightbulb,
  Download,
  RefreshCw,
  Calendar,
  Filter
} from "lucide-react";

// Types for analytics
interface RiskPrediction {
  entityId: number;
  entityType: 'driver' | 'truck' | 'route' | 'operation';
  riskType: 'safety' | 'efficiency' | 'maintenance' | 'fraud' | 'compliance';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  confidence: number;
  timeframe: string;
  recommendations: string[];
  createdAt: Date;
}

interface TrendAnalysis {
  metric: string;
  entityId: number;
  entityType: 'driver' | 'truck' | 'fleet';
  trend: 'improving' | 'declining' | 'stable' | 'volatile';
  trendStrength: number;
  currentValue: number;
  predictedValue: number;
  changeRate: number;
  dataPoints: { date: Date; value: number }[];
}

interface OperationalInsight {
  type: 'efficiency' | 'cost_optimization' | 'route_optimization' | 'resource_allocation';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  potentialSavings?: number;
  implementation: 'immediate' | 'short_term' | 'long_term';
  actionItems: string[];
}

interface DashboardData {
  overview: {
    totalPredictions: number;
    criticalRisks: number;
    decliningTrends: number;
    actionableInsights: number;
  };
  riskDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  trendSummary: {
    improving: number;
    declining: number;
    stable: number;
    volatile: number;
  };
  fleetPerformance: {
    trend: string;
    currentValue: number;
    predictedValue: number;
    changeRate: number;
  } | null;
  topInsights: OperationalInsight[];
  criticalAlerts: RiskPrediction[];
  lastUpdate: Date;
}

export default function AnalyticsDashboard() {
  // State management
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [predictions, setPredictions] = useState<RiskPrediction[]>([]);
  const [trends, setTrends] = useState<TrendAnalysis[]>([]);
  const [insights, setInsights] = useState<OperationalInsight[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30_days');
  const [selectedEntityType, setSelectedEntityType] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const refreshTimer = useRef<NodeJS.Timeout>();

  // API functions
  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch('/api/analytics/dashboard');
      const data = await response.json();
      if (data.success) {
        setDashboardData({
          ...data.dashboard,
          lastUpdate: new Date(data.dashboard.lastUpdate)
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, []);

  const fetchPredictions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedEntityType !== 'all') {
        params.append('entityType', selectedEntityType);
      }
      
      const response = await fetch(`/api/analytics/predictions?${params}`);
      const data = await response.json();
      if (data.success) {
        setPredictions(data.predictions.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt)
        })));
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  }, [selectedEntityType]);

  const fetchTrends = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedEntityType !== 'all') {
        params.append('entityType', selectedEntityType);
      }
      
      const response = await fetch(`/api/analytics/trends?${params}`);
      const data = await response.json();
      if (data.success) {
        setTrends(data.trends.map((t: any) => ({
          ...t,
          dataPoints: t.dataPoints.map((dp: any) => ({
            ...dp,
            date: new Date(dp.date)
          }))
        })));
      }
    } catch (error) {
      console.error('Error fetching trends:', error);
    }
  }, [selectedEntityType]);

  const fetchInsights = useCallback(async () => {
    try {
      const response = await fetch('/api/analytics/insights');
      const data = await response.json();
      if (data.success) {
        setInsights(data.insights);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  }, []);

  const generateNewInsights = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/analytics/insights/generate', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        await fetchInsights();
      }
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchInsights]);

  const analyzeTrends = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/analytics/trends/analyze', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        await fetchTrends();
      }
    } catch (error) {
      console.error('Error analyzing trends:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchTrends]);

  // Auto-refresh logic
  useEffect(() => {
    const refresh = async () => {
      await Promise.all([
        fetchDashboardData(),
        fetchPredictions(),
        fetchTrends(),
        fetchInsights()
      ]);
    };

    refresh(); // Initial load

    if (autoRefresh) {
      refreshTimer.current = setInterval(refresh, 30000); // 30 seconds
    }

    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    };
  }, [autoRefresh, fetchDashboardData, fetchPredictions, fetchTrends, fetchInsights]);

  // Helper functions
  const getRiskLevelColor = (level: string): string => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable': return <Activity className="h-4 w-4 text-blue-500" />;
      case 'volatile': return <BarChart3 className="h-4 w-4 text-yellow-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (!dashboardData) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading analytics dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive reporting and predictive insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              <SelectItem value="driver">Drivers</SelectItem>
              <SelectItem value="truck">Trucks</SelectItem>
              <SelectItem value="fleet">Fleet</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Predictions</p>
                <p className="text-2xl font-bold">{dashboardData.overview.totalPredictions}</p>
              </div>
              <Brain className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Risks</p>
                <p className="text-2xl font-bold text-red-600">{dashboardData.overview.criticalRisks}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Declining Trends</p>
                <p className="text-2xl font-bold text-orange-600">{dashboardData.overview.decliningTrends}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Actionable Insights</p>
                <p className="text-2xl font-bold text-blue-600">{dashboardData.overview.actionableInsights}</p>
              </div>
              <Lightbulb className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Risk Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Critical</span>
                <div className="flex items-center gap-2">
                  <Progress value={(dashboardData.riskDistribution.critical / Math.max(1, dashboardData.overview.totalPredictions)) * 100} className="w-24 h-2" />
                  <Badge className="bg-red-100 text-red-800">{dashboardData.riskDistribution.critical}</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">High</span>
                <div className="flex items-center gap-2">
                  <Progress value={(dashboardData.riskDistribution.high / Math.max(1, dashboardData.overview.totalPredictions)) * 100} className="w-24 h-2" />
                  <Badge className="bg-orange-100 text-orange-800">{dashboardData.riskDistribution.high}</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Medium</span>
                <div className="flex items-center gap-2">
                  <Progress value={(dashboardData.riskDistribution.medium / Math.max(1, dashboardData.overview.totalPredictions)) * 100} className="w-24 h-2" />
                  <Badge className="bg-yellow-100 text-yellow-800">{dashboardData.riskDistribution.medium}</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Low</span>
                <div className="flex items-center gap-2">
                  <Progress value={(dashboardData.riskDistribution.low / Math.max(1, dashboardData.overview.totalPredictions)) * 100} className="w-24 h-2" />
                  <Badge className="bg-green-100 text-green-800">{dashboardData.riskDistribution.low}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Improving</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <Badge className="bg-green-100 text-green-800">{dashboardData.trendSummary.improving}</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Declining</span>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <Badge className="bg-red-100 text-red-800">{dashboardData.trendSummary.declining}</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Stable</span>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <Badge className="bg-blue-100 text-blue-800">{dashboardData.trendSummary.stable}</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Volatile</span>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-yellow-500" />
                  <Badge className="bg-yellow-100 text-yellow-800">{dashboardData.trendSummary.volatile}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Performance */}
      {dashboardData.fleetPerformance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Fleet Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Current Score</p>
                <p className="text-2xl font-bold">{dashboardData.fleetPerformance.currentValue.toFixed(1)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Predicted Score</p>
                <p className="text-2xl font-bold">{dashboardData.fleetPerformance.predictedValue.toFixed(1)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Change Rate</p>
                <div className="flex items-center justify-center gap-1">
                  {getTrendIcon(dashboardData.fleetPerformance.trend)}
                  <p className="text-2xl font-bold">
                    {dashboardData.fleetPerformance.changeRate > 0 ? '+' : ''}
                    {dashboardData.fleetPerformance.changeRate.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Trend</p>
                <Badge className={dashboardData.fleetPerformance.trend === 'improving' ? 'bg-green-100 text-green-800' : 
                               dashboardData.fleetPerformance.trend === 'declining' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                  {dashboardData.fleetPerformance.trend.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Operational Insights</h2>
            <Button onClick={generateNewInsights} disabled={isLoading}>
              <Brain className="h-4 w-4 mr-2" />
              {isLoading ? 'Analyzing...' : 'Generate Insights'}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {insights.map((insight, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{insight.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge className={getImpactColor(insight.impact)}>
                        {insight.impact.toUpperCase()}
                      </Badge>
                      {insight.potentialSavings && (
                        <Badge variant="outline" className="text-green-600">
                          {formatCurrency(insight.potentialSavings)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Implementation:</span>
                      <Badge variant="secondary" className="capitalize">
                        {insight.implementation.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-1">Action Items:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {insight.actionItems.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 mt-0.5 text-green-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <h2 className="text-xl font-semibold">Risk Predictions</h2>
          
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {predictions.map((prediction, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">
                          {prediction.entityType} {prediction.entityId}
                        </span>
                        <Badge variant="secondary" className="capitalize">
                          {prediction.riskType}
                        </Badge>
                      </div>
                      <Badge className={getRiskLevelColor(prediction.riskLevel)}>
                        {prediction.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Probability:</span>
                        <span>{(prediction.probability * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Confidence:</span>
                        <span>{(prediction.confidence * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    {prediction.recommendations.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">Recommendations:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {prediction.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Target className="h-3 w-3 mt-0.5 text-blue-500" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Performance Trends</h2>
            <Button onClick={analyzeTrends} disabled={isLoading}>
              <LineChart className="h-4 w-4 mr-2" />
              {isLoading ? 'Analyzing...' : 'Analyze Trends'}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {trends.map((trend, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {getTrendIcon(trend.trend)}
                      <span className="font-medium capitalize">
                        {trend.entityType} {trend.entityId} - {trend.metric.replace('_', ' ')}
                      </span>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {trend.trend}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current:</span>
                      <span className="font-medium">{trend.currentValue.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Predicted:</span>
                      <span className="font-medium">{trend.predictedValue.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Change Rate:</span>
                      <span className={`font-medium ${trend.changeRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trend.changeRate > 0 ? '+' : ''}{trend.changeRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Strength:</span>
                      <Progress value={trend.trendStrength * 100} className="w-16 h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <h2 className="text-xl font-semibold">Analytical Reports</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <h3 className="font-medium mb-2">Performance Report</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Comprehensive analysis of driver and fleet performance metrics
                </p>
                <Button size="sm" variant="outline">Generate Report</Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <h3 className="font-medium mb-2">Safety Analysis</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Detailed safety incidents and risk assessment overview
                </p>
                <Button size="sm" variant="outline">Generate Report</Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <h3 className="font-medium mb-2">Cost Analysis</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Financial impact analysis and cost optimization opportunities
                </p>
                <Button size="sm" variant="outline">Generate Report</Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <Truck className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <h3 className="font-medium mb-2">Fleet Utilization</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Vehicle utilization rates and optimization recommendations
                </p>
                <Button size="sm" variant="outline">Generate Report</Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                <h3 className="font-medium mb-2">Efficiency Metrics</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Delivery efficiency and route optimization analysis
                </p>
                <Button size="sm" variant="outline">Generate Report</Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-teal-500" />
                <h3 className="font-medium mb-2">Driver Analytics</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Individual driver performance and training recommendations
                </p>
                <Button size="sm" variant="outline">Generate Report</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}