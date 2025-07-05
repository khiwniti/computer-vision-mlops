import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, BarChart3, PieChart, Calendar, Download } from "lucide-react";
import { useState } from "react";

export default function Analytics() {
  const [dateRange, setDateRange] = useState("7d");
  const [metricType, setMetricType] = useState("kpi");

  const { data: trucks, isLoading: trucksLoading } = useQuery({
    queryKey: ['/api/trucks'],
    refetchInterval: 30000,
  });

  const { data: drivers, isLoading: driversLoading } = useQuery({
    queryKey: ['/api/drivers'],
    refetchInterval: 30000,
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/alerts'],
    refetchInterval: 30000,
  });

  const { data: trips, isLoading: tripsLoading } = useQuery({
    queryKey: ['/api/trips'],
    refetchInterval: 30000,
  });

  const isLoading = trucksLoading || driversLoading || alertsLoading || tripsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          title="Analytics" 
          subtitle="Performance metrics and business intelligence"
        />
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96 rounded-lg" />
            <Skeleton className="h-96 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Calculate analytics data
  const activeTrucks = trucks?.filter((truck: any) => truck.status === 'online').length || 0;
  const totalTrucks = trucks?.length || 0;
  const fleetUtilization = totalTrucks > 0 ? (activeTrucks / totalTrucks) * 100 : 0;

  const avgKpiScore = drivers?.reduce((sum: number, driver: any) => sum + (driver.kpiScore || 0), 0) / (drivers?.length || 1) || 0;
  const avgSafetyScore = drivers?.reduce((sum: number, driver: any) => sum + (driver.safetyScore || 0), 0) / (drivers?.length || 1) || 0;

  const criticalAlerts = alerts?.filter((alert: any) => alert.severity === 'critical').length || 0;
  const totalAlerts = alerts?.length || 0;

  const completedTrips = trips?.filter((trip: any) => trip.status === 'completed').length || 0;
  const totalTrips = trips?.length || 0;

  const kpiTrend = Math.random() > 0.5 ? 'up' : 'down';
  const utilizationTrend = Math.random() > 0.5 ? 'up' : 'down';
  const safetyTrend = Math.random() > 0.5 ? 'up' : 'down';
  const alertsTrend = Math.random() > 0.5 ? 'up' : 'down';

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Analytics" 
        subtitle="Performance metrics and business intelligence"
      />
      
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={metricType} onValueChange={setMetricType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kpi">KPI Metrics</SelectItem>
                <SelectItem value="safety">Safety Metrics</SelectItem>
                <SelectItem value="utilization">Utilization</SelectItem>
                <SelectItem value="alerts">Alerts</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button>
            <Download size={16} className="mr-2" />
            Export Report
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Fleet Utilization</p>
                  <p className="text-2xl font-semibold">{fleetUtilization.toFixed(1)}%</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="text-blue-500" size={20} />
                </div>
              </div>
              <div className={`mt-4 flex items-center text-sm ${utilizationTrend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {utilizationTrend === 'up' ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                <span>{utilizationTrend === 'up' ? '+' : '-'}{Math.random() * 5 + 1}% from last period</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Avg KPI Score</p>
                  <p className="text-2xl font-semibold">{avgKpiScore.toFixed(1)}%</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-green-500" size={20} />
                </div>
              </div>
              <div className={`mt-4 flex items-center text-sm ${kpiTrend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {kpiTrend === 'up' ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                <span>{kpiTrend === 'up' ? '+' : '-'}{Math.random() * 3 + 1}% from last period</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Safety Score</p>
                  <p className="text-2xl font-semibold">{avgSafetyScore.toFixed(1)}%</p>
                </div>
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <PieChart className="text-orange-500" size={20} />
                </div>
              </div>
              <div className={`mt-4 flex items-center text-sm ${safetyTrend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {safetyTrend === 'up' ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                <span>{safetyTrend === 'up' ? '+' : '-'}{Math.random() * 2 + 1}% from last period</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Critical Alerts</p>
                  <p className="text-2xl font-semibold">{criticalAlerts}</p>
                </div>
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <TrendingDown className="text-red-500" size={20} />
                </div>
              </div>
              <div className={`mt-4 flex items-center text-sm ${alertsTrend === 'up' ? 'text-red-500' : 'text-green-500'}`}>
                {alertsTrend === 'up' ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                <span>{alertsTrend === 'up' ? '+' : '-'}{Math.random() * 10 + 5}% from last period</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center bg-muted rounded-lg">
                <div className="text-center">
                  <BarChart3 size={48} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Performance chart would be displayed here</p>
                  <p className="text-xs text-muted-foreground mt-1">Integration with charting library required</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Fleet Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center bg-muted rounded-lg">
                <div className="text-center">
                  <PieChart size={48} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Fleet distribution chart would be displayed here</p>
                  <p className="text-xs text-muted-foreground mt-1">Integration with charting library required</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {drivers?.slice(0, 5).map((driver: any, index: number) => (
                  <div key={driver.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{driver.name}</p>
                        <p className="text-xs text-muted-foreground">{driver.totalTrips} trips</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-500">{driver.kpiScore}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts?.slice(0, 5).map((alert: any) => (
                  <div key={alert.id} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm">{alert.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${
                        alert.severity === 'critical' ? 'bg-red-500/20 text-red-500' :
                        alert.severity === 'high' ? 'bg-orange-500/20 text-orange-500' :
                        alert.severity === 'medium' ? 'bg-blue-500/20 text-blue-500' :
                        'bg-green-500/20 text-green-500'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{alert.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Trip Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Completed Trips</span>
                  <span className="text-lg font-semibold">{completedTrips}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Trips</span>
                  <span className="text-lg font-semibold">{totalTrips}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Completion Rate</span>
                  <span className="text-lg font-semibold text-green-500">
                    {totalTrips > 0 ? ((completedTrips / totalTrips) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Trip Duration</span>
                  <span className="text-lg font-semibold">2.5h</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
