// Enhanced AI Analytics Dashboard for AsphaltTracker
// Real-time AI-powered construction monitoring and analytics

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  Camera, 
  TrendingUp, 
  Users, 
  Truck, 
  Shield, 
  BarChart3,
  Eye,
  Clock,
  MapPin,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface ActivityEvent {
  id: string;
  type: string;
  timestamp: Date;
  cameraId: string;
  confidence: number;
  location: { x: number; y: number };
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface SafetyAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  cameraId: string;
  resolved: boolean;
}

interface ProgressMetrics {
  completionPercentage: number;
  areaCompleted: number;
  pavingSpeed: number;
  qualityScore: number;
  efficiency: number;
  productivity: number;
}

interface CameraStatus {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  location: string;
  lastActivity: Date;
  frameRate: number;
  aiProcessing: boolean;
}

export const AIAnalyticsDashboard: React.FC = () => {
  const [realtimeData, setRealtimeData] = useState({
    activities: [] as ActivityEvent[],
    alerts: [] as SafetyAlert[],
    progress: {
      completionPercentage: 0,
      areaCompleted: 0,
      pavingSpeed: 0,
      qualityScore: 0,
      efficiency: 0,
      productivity: 0
    } as ProgressMetrics,
    cameras: [] as CameraStatus[]
  });

  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [isConnected, setIsConnected] = useState(false);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:5001`);
    
    ws.onopen = () => {
      setIsConnected(true);
      console.log('✅ Connected to real-time analytics');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleRealtimeUpdate(data);
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('📡 Disconnected from real-time analytics');
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleRealtimeUpdate = (data: any) => {
    switch (data.type) {
      case 'activity_event':
        setRealtimeData(prev => ({
          ...prev,
          activities: [data.data, ...prev.activities.slice(0, 99)] // Keep last 100
        }));
        break;
      case 'safety_alert':
        setRealtimeData(prev => ({
          ...prev,
          alerts: [data.data, ...prev.alerts.slice(0, 49)] // Keep last 50
        }));
        break;
      case 'progress_update':
        setRealtimeData(prev => ({
          ...prev,
          progress: { ...prev.progress, ...data.data }
        }));
        break;
      case 'camera_status':
        setRealtimeData(prev => ({
          ...prev,
          cameras: prev.cameras.map(cam => 
            cam.id === data.data.cameraId 
              ? { ...cam, ...data.data }
              : cam
          )
        }));
        break;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Mock data for charts
  const activityTrendData = [
    { time: '09:00', paving: 12, rolling: 8, inspection: 3 },
    { time: '10:00', paving: 15, rolling: 12, inspection: 5 },
    { time: '11:00', paving: 18, rolling: 15, inspection: 4 },
    { time: '12:00', paving: 10, rolling: 8, inspection: 2 },
    { time: '13:00', paving: 20, rolling: 18, inspection: 6 },
    { time: '14:00', paving: 22, rolling: 20, inspection: 7 },
  ];

  const equipmentUtilizationData = [
    { name: 'Asphalt Paver', value: 85, color: '#8884d8' },
    { name: 'Road Roller', value: 92, color: '#82ca9d' },
    { name: 'Dump Truck', value: 78, color: '#ffc658' },
    { name: 'Excavator', value: 65, color: '#ff7300' },
  ];

  const safetyMetricsData = [
    { category: 'PPE Compliance', score: 94 },
    { category: 'Safety Zones', score: 88 },
    { category: 'Equipment Safety', score: 96 },
    { category: 'Proximity Alerts', score: 91 },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Analytics Dashboard</h1>
          <p className="text-muted-foreground">Real-time construction monitoring with NVIDIA AI</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cameras</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realtimeData.cameras.filter(c => c.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">
              {realtimeData.cameras.length} total cameras
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realtimeData.progress.completionPercentage.toFixed(1)}%</div>
            <Progress value={realtimeData.progress.completionPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Safety Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realtimeData.progress.qualityScore.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              {realtimeData.alerts.filter(a => !a.resolved).length} active alerts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realtimeData.progress.efficiency.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              Productivity: {realtimeData.progress.productivity.toFixed(0)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="cameras">Cameras</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Activity Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Trends</CardTitle>
                <CardDescription>Real-time construction activities detected by AI</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={activityTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="paving" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="rolling" stroke="#82ca9d" strokeWidth={2} />
                    <Line type="monotone" dataKey="inspection" stroke="#ffc658" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Equipment Utilization */}
            <Card>
              <CardHeader>
                <CardTitle>Equipment Utilization</CardTitle>
                <CardDescription>AI-tracked equipment usage efficiency</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={equipmentUtilizationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Safety Alerts</CardTitle>
              <CardDescription>AI-detected safety violations and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {realtimeData.alerts.slice(0, 5).map((alert) => (
                  <Alert key={alert.id} className="border-l-4 border-l-red-500">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="flex items-center justify-between">
                      <span>{alert.type.replace('_', ' ').toUpperCase()}</span>
                      <Badge variant={getSeverityColor(alert.severity) as any}>
                        {alert.severity}
                      </Badge>
                    </AlertTitle>
                    <AlertDescription>
                      {alert.description}
                      <div className="text-xs text-muted-foreground mt-1">
                        Camera: {alert.cameraId} • {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Activities</CardTitle>
              <CardDescription>Live feed of AI-detected construction activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {realtimeData.activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Activity className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">{activity.type.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          Camera: {activity.cameraId} • Confidence: {(activity.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{new Date(activity.timestamp).toLocaleTimeString()}</p>
                      <Badge variant="outline">{activity.severity || 'normal'}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safety" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Safety Metrics</CardTitle>
                <CardDescription>AI-powered safety compliance monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {safetyMetricsData.map((metric) => (
                    <div key={metric.category} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{metric.category}</span>
                        <span className="text-sm">{metric.score}%</span>
                      </div>
                      <Progress value={metric.score} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Safety Alerts</CardTitle>
                <CardDescription>Unresolved safety violations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {realtimeData.alerts.filter(a => !a.resolved).map((alert) => (
                    <div key={alert.id} className="p-3 border rounded-lg border-red-200 bg-red-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="font-medium">{alert.type}</span>
                        </div>
                        <Badge variant={getSeverityColor(alert.severity) as any}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">Camera: {alert.cameraId}</span>
                        <Button size="sm" variant="outline">Acknowledge</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Completion Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">
                    {realtimeData.progress.completionPercentage.toFixed(1)}%
                  </div>
                  <Progress value={realtimeData.progress.completionPercentage} className="mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {realtimeData.progress.areaCompleted.toFixed(0)} m² completed
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Paving Speed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">
                    {realtimeData.progress.pavingSpeed.toFixed(1)}
                  </div>
                  <p className="text-sm text-muted-foreground">m²/hour</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">
                    {realtimeData.progress.qualityScore.toFixed(0)}
                  </div>
                  <Progress value={realtimeData.progress.qualityScore} className="mb-4" />
                  <p className="text-sm text-muted-foreground">AI Quality Assessment</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cameras" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Camera Status</CardTitle>
              <CardDescription>Real-time status of all monitoring cameras</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {realtimeData.cameras.map((camera) => (
                  <div key={camera.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{camera.name}</h3>
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(camera.status)}`} />
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{camera.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span>{camera.frameRate} FPS</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(camera.lastActivity).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Badge variant={camera.aiProcessing ? "default" : "secondary"}>
                        {camera.aiProcessing ? "AI Active" : "AI Inactive"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
