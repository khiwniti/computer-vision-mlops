import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StreamingDashboard from "@/components/streaming/StreamingDashboard";
import { 
  AlertTriangle, 
  Camera, 
  Truck, 
  User, 
  MapPin, 
  Activity, 
  Zap,
  Clock,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Maximize2,
  Grid3X3,
  List,
  Filter,
  Search,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Radio
} from "lucide-react";

// Types for live monitoring
interface LiveCamera {
  id: number;
  truckId: number;
  position: 'front' | 'back' | 'left' | 'right' | 'driver_facing' | 'cargo';
  status: 'online' | 'offline' | 'error';
  streamUrl: string;
  lastFrame: Date;
  resolution: string;
  frameRate: number;
  vendorId: number;
  aiEnabled: boolean;
}

interface LiveTruck {
  id: number;
  truckNumber: string;
  driverId?: number;
  driverName?: string;
  status: 'online' | 'offline' | 'idle' | 'maintenance';
  location: { lat: number; lng: number; address?: string };
  speed: number;
  heading: number;
  lastUpdate: Date;
  kpiScore: number;
  cameras: LiveCamera[];
  activeIncidents: number;
  criticalAlerts: number;
}

interface LiveIncident {
  id: number;
  truckId: number;
  truckNumber: string;
  driverId?: number;
  driverName?: string;
  cameraId: number;
  cameraPosition: string;
  incidentType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  timestamp: Date;
  status: 'new' | 'acknowledged' | 'resolved';
  imageUrl?: string;
  videoUrl?: string;
}

interface MonitoringStats {
  totalTrucks: number;
  activeTrucks: number;
  onlineCameras: number;
  totalCameras: number;
  liveIncidents: number;
  criticalIncidents: number;
  averageKpiScore: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

export default function LiveMonitoring() {
  // State management
  const [trucks, setTrucks] = useState<LiveTruck[]>([]);
  const [incidents, setIncidents] = useState<LiveIncident[]>([]);
  const [stats, setStats] = useState<MonitoringStats>({
    totalTrucks: 0,
    activeTrucks: 0,
    onlineCameras: 0,
    totalCameras: 0,
    liveIncidents: 0,
    criticalIncidents: 0,
    averageKpiScore: 0,
    systemHealth: 'healthy'
  });

  // UI state
  const [selectedTruck, setSelectedTruck] = useState<LiveTruck | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLive, setIsLive] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<LiveIncident | null>(null);
  const [cameraLayout, setCameraLayout] = useState<'2x2' | '3x3' | '4x4'>('2x2');

  // Mock data generation for demonstration
  const generateMockData = useCallback(() => {
    // Generate trucks with cameras
    const mockTrucks: LiveTruck[] = Array.from({ length: 100 }, (_, i) => {
      const truckId = i + 1;
      const isOnline = Math.random() > 0.1; // 90% online
      const driverId = isOnline ? Math.floor(Math.random() * 200) + 1 : undefined;
      
      // Generate 4 cameras per truck
      const cameras: LiveCamera[] = ['front', 'back', 'left', 'right'].map((position, idx) => ({
        id: truckId * 10 + idx,
        truckId,
        position: position as any,
        status: isOnline && Math.random() > 0.05 ? 'online' : Math.random() > 0.5 ? 'offline' : 'error',
        streamUrl: `rtsp://example.com/truck${truckId}_${position}`,
        lastFrame: new Date(),
        resolution: '1080p',
        frameRate: 30,
        vendorId: Math.floor(Math.random() * 3) + 1,
        aiEnabled: true
      }));

      return {
        id: truckId,
        truckNumber: `T${String(truckId).padStart(3, '0')}`,
        driverId,
        driverName: driverId ? `Driver ${driverId}` : undefined,
        status: isOnline ? (Math.random() > 0.7 ? 'idle' : 'online') : 'offline',
        location: {
          lat: 40.7128 + (Math.random() - 0.5) * 0.1,
          lng: -74.0060 + (Math.random() - 0.5) * 0.1,
          address: `Location ${truckId}`
        },
        speed: isOnline ? Math.random() * 70 : 0,
        heading: Math.random() * 360,
        lastUpdate: new Date(),
        kpiScore: 60 + Math.random() * 40,
        cameras,
        activeIncidents: Math.floor(Math.random() * 3),
        criticalAlerts: Math.random() > 0.9 ? 1 : 0
      };
    });

    // Generate recent incidents
    const mockIncidents: LiveIncident[] = Array.from({ length: 50 }, (_, i) => {
      const truck = mockTrucks[Math.floor(Math.random() * mockTrucks.length)];
      const camera = truck.cameras[Math.floor(Math.random() * truck.cameras.length)];
      const incidentTypes = ['drowsiness', 'phone_usage', 'seatbelt_violation', 'harsh_braking', 'smoking'];
      const incidentType = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];
      
      return {
        id: i + 1,
        truckId: truck.id,
        truckNumber: truck.truckNumber,
        driverId: truck.driverId,
        driverName: truck.driverName,
        cameraId: camera.id,
        cameraPosition: camera.position,
        incidentType,
        severity: Math.random() > 0.8 ? 'critical' : Math.random() > 0.6 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        confidence: 0.7 + Math.random() * 0.3,
        description: `${incidentType.replace('_', ' ')} detected`,
        timestamp: new Date(Date.now() - Math.random() * 3600000), // Last hour
        status: Math.random() > 0.7 ? 'acknowledged' : 'new',
        imageUrl: `/api/incidents/${i}/image`,
        videoUrl: `/api/incidents/${i}/video`
      };
    });

    setTrucks(mockTrucks);
    setIncidents(mockIncidents);

    // Calculate stats
    const onlineCameras = mockTrucks.reduce((sum, truck) => 
      sum + truck.cameras.filter(c => c.status === 'online').length, 0
    );
    const totalCameras = mockTrucks.length * 4;
    const activeTrucks = mockTrucks.filter(t => t.status !== 'offline').length;
    const criticalIncidents = mockIncidents.filter(i => i.severity === 'critical').length;
    const avgKpi = mockTrucks.reduce((sum, truck) => sum + truck.kpiScore, 0) / mockTrucks.length;

    setStats({
      totalTrucks: mockTrucks.length,
      activeTrucks,
      onlineCameras,
      totalCameras,
      liveIncidents: mockIncidents.length,
      criticalIncidents,
      averageKpiScore: avgKpi,
      systemHealth: criticalIncidents > 5 ? 'critical' : criticalIncidents > 2 ? 'warning' : 'healthy'
    });
  }, []);

  // Initialize and auto-refresh data
  useEffect(() => {
    generateMockData();
    
    const interval = setInterval(() => {
      if (isLive) {
        generateMockData();
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [generateMockData, isLive]);

  // Filter and search logic
  const filteredTrucks = useMemo(() => {
    let filtered = trucks;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(truck => truck.status === filterStatus);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(truck =>
        truck.truckNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        truck.driverName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [trucks, filterStatus, searchQuery]);

  const recentIncidents = useMemo(() => {
    return incidents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20);
  }, [incidents]);

  const criticalIncidents = useMemo(() => {
    return incidents.filter(i => i.severity === 'critical' && i.status === 'new');
  }, [incidents]);

  // Event handlers
  const handleTruckSelect = (truck: LiveTruck) => {
    setSelectedTruck(truck);
  };

  const handleIncidentAcknowledge = (incidentId: number) => {
    setIncidents(prev => prev.map(incident =>
      incident.id === incidentId ? { ...incident, status: 'acknowledged' } : incident
    ));
  };

  const getCameraLayoutCols = () => {
    switch (cameraLayout) {
      case '2x2': return 'grid-cols-2';
      case '3x3': return 'grid-cols-3';
      case '4x4': return 'grid-cols-4';
      default: return 'grid-cols-2';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Live Monitoring</h1>
          <p className="text-muted-foreground">Real-time surveillance of 400+ cameras across 100 trucks</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge 
            variant={stats.systemHealth === 'healthy' ? 'default' : stats.systemHealth === 'warning' ? 'secondary' : 'destructive'}
          >
            System: {stats.systemHealth}
          </Badge>
          <Button 
            variant={isLive ? "default" : "outline"} 
            onClick={() => setIsLive(!isLive)}
            className="flex items-center gap-2"
          >
            {isLive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isLive ? 'Live' : 'Paused'}
          </Button>
          <Button variant="outline" onClick={generateMockData}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Trucks</p>
                <p className="text-2xl font-bold">{stats.totalTrucks}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Trucks</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeTrucks}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Online Cameras</p>
                <p className="text-2xl font-bold text-green-600">{stats.onlineCameras}/{stats.totalCameras}</p>
              </div>
              <Camera className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Live Incidents</p>
                <p className="text-2xl font-bold text-orange-600">{stats.liveIncidents}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Alerts</p>
                <p className="text-2xl font-bold text-red-600">{stats.criticalIncidents}</p>
              </div>
              <Zap className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg KPI Score</p>
                <p className="text-2xl font-bold">{stats.averageKpiScore.toFixed(1)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Camera Uptime</p>
                <p className="text-2xl font-bold">{((stats.onlineCameras / stats.totalCameras) * 100).toFixed(1)}%</p>
              </div>
              <Eye className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last Update</p>
                <p className="text-sm font-medium">{new Date().toLocaleTimeString()}</p>
              </div>
              <Clock className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="fleet-view" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="fleet-view">Fleet Overview</TabsTrigger>
          <TabsTrigger value="streaming">Live Streaming</TabsTrigger>
          <TabsTrigger value="camera-matrix">Camera Matrix</TabsTrigger>
          <TabsTrigger value="incidents">Live Incidents</TabsTrigger>
          <TabsTrigger value="truck-detail">Truck Detail</TabsTrigger>
        </TabsList>

        {/* Fleet Overview */}
        <TabsContent value="fleet-view" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search trucks or drivers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="idle">Idle</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[600px]">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTrucks.map((truck) => (
                  <Card 
                    key={truck.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTruck?.id === truck.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => handleTruckSelect(truck)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{truck.truckNumber}</CardTitle>
                          <p className="text-sm text-muted-foreground">{truck.driverName}</p>
                        </div>
                        <Badge 
                          variant={
                            truck.status === 'online' ? 'default' : 
                            truck.status === 'idle' ? 'secondary' : 'destructive'
                          }
                        >
                          {truck.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>KPI Score:</span>
                          <span className="font-medium">{truck.kpiScore.toFixed(1)}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span>Speed:</span>
                          <span>{truck.speed.toFixed(0)} mph</span>
                        </div>

                        <div className="grid grid-cols-4 gap-1">
                          {truck.cameras.map((camera) => (
                            <div
                              key={camera.id}
                              className={`h-8 rounded text-xs flex items-center justify-center ${
                                camera.status === 'online' ? 'bg-green-100 text-green-800' :
                                camera.status === 'offline' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                              }`}
                            >
                              {camera.position.charAt(0).toUpperCase()}
                            </div>
                          ))}
                        </div>

                        {truck.activeIncidents > 0 && (
                          <div className="flex items-center gap-2 text-sm text-orange-600">
                            <AlertTriangle className="h-4 w-4" />
                            {truck.activeIncidents} active incident{truck.activeIncidents > 1 ? 's' : ''}
                          </div>
                        )}

                        {truck.criticalAlerts > 0 && (
                          <div className="flex items-center gap-2 text-sm text-red-600">
                            <Zap className="h-4 w-4" />
                            {truck.criticalAlerts} critical alert{truck.criticalAlerts > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTrucks.map((truck) => (
                  <Card 
                    key={truck.id} 
                    className={`cursor-pointer transition-all hover:shadow-sm ${
                      selectedTruck?.id === truck.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => handleTruckSelect(truck)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <h3 className="font-medium">{truck.truckNumber}</h3>
                            <p className="text-sm text-muted-foreground">{truck.driverName}</p>
                          </div>
                          
                          <Badge 
                            variant={
                              truck.status === 'online' ? 'default' : 
                              truck.status === 'idle' ? 'secondary' : 'destructive'
                            }
                          >
                            {truck.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="text-muted-foreground">KPI Score</p>
                            <p className="font-medium">{truck.kpiScore.toFixed(1)}</p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-muted-foreground">Speed</p>
                            <p className="font-medium">{truck.speed.toFixed(0)} mph</p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-muted-foreground">Cameras</p>
                            <p className="font-medium">
                              {truck.cameras.filter(c => c.status === 'online').length}/4
                            </p>
                          </div>

                          {(truck.activeIncidents > 0 || truck.criticalAlerts > 0) && (
                            <div className="flex items-center gap-2">
                              {truck.criticalAlerts > 0 && (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <Zap className="h-3 w-3" />
                                  {truck.criticalAlerts}
                                </Badge>
                              )}
                              {truck.activeIncidents > 0 && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  {truck.activeIncidents}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Live Streaming Dashboard */}
        <TabsContent value="streaming" className="space-y-4">
          <StreamingDashboard />
        </TabsContent>

        {/* Camera Matrix */}
        <TabsContent value="camera-matrix" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Camera Matrix View</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm">Layout:</span>
              <Select value={cameraLayout} onValueChange={(value: any) => setCameraLayout(value)}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2x2">2×2</SelectItem>
                  <SelectItem value="3x3">3×3</SelectItem>
                  <SelectItem value="4x4">4×4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ScrollArea className="h-[600px]">
            <div className={`grid ${getCameraLayoutCols()} gap-4`}>
              {filteredTrucks.slice(0, parseInt(cameraLayout.charAt(0)) ** 2).map((truck) => (
                <Card key={truck.id} className="aspect-video">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-sm">{truck.truckNumber}</CardTitle>
                        <p className="text-xs text-muted-foreground">{truck.driverName}</p>
                      </div>
                      <Badge 
                        variant={truck.status === 'online' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {truck.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="aspect-video bg-black rounded flex items-center justify-center relative">
                      {truck.status === 'online' ? (
                        <div className="text-white text-center">
                          <Camera className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-xs">Live Feed</p>
                          <p className="text-xs text-gray-300">Driver Camera</p>
                        </div>
                      ) : (
                        <div className="text-gray-500 text-center">
                          <EyeOff className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-xs">Offline</p>
                        </div>
                      )}
                      
                      {/* AI Overlay Indicators */}
                      {truck.status === 'online' && (
                        <div className="absolute top-2 right-2 flex flex-col gap-1">
                          <Badge variant="secondary" className="text-xs">AI</Badge>
                          {truck.activeIncidents > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {truck.activeIncidents}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Live Incidents */}
        <TabsContent value="incidents" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Live Incidents</h2>
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {criticalIncidents.length} Critical
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Critical Incidents */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Critical Incidents</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {criticalIncidents.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No critical incidents</p>
                  ) : (
                    <div className="space-y-3">
                      {criticalIncidents.map((incident) => (
                        <Card key={incident.id} className="border-red-200">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium">{incident.truckNumber}</h4>
                                <p className="text-sm text-muted-foreground">{incident.driverName}</p>
                              </div>
                              <Badge variant="destructive">{incident.severity}</Badge>
                            </div>
                            <p className="text-sm mb-2">{incident.description}</p>
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                              <span>{incident.cameraPosition} camera</span>
                              <span>{incident.timestamp.toLocaleTimeString()}</span>
                            </div>
                            <Button 
                              size="sm" 
                              className="w-full mt-2"
                              onClick={() => handleIncidentAcknowledge(incident.id)}
                            >
                              Acknowledge
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Recent Incidents */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Incidents</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {recentIncidents.map((incident) => (
                      <Card 
                        key={incident.id} 
                        className={`cursor-pointer transition-all hover:shadow-sm ${
                          incident.status === 'acknowledged' ? 'opacity-60' : ''
                        }`}
                        onClick={() => setSelectedIncident(incident)}
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-sm">{incident.truckNumber}</h4>
                              <p className="text-xs text-muted-foreground">{incident.driverName}</p>
                            </div>
                            <Badge 
                              variant={
                                incident.severity === 'critical' ? 'destructive' :
                                incident.severity === 'high' ? 'destructive' :
                                incident.severity === 'medium' ? 'secondary' : 'outline'
                              }
                              className="text-xs"
                            >
                              {incident.severity}
                            </Badge>
                          </div>
                          <p className="text-xs mb-2">{incident.description}</p>
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>{incident.cameraPosition}</span>
                            <span>{incident.timestamp.toLocaleTimeString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Truck Detail */}
        <TabsContent value="truck-detail">
          {selectedTruck ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedTruck.truckNumber}</h2>
                  <p className="text-muted-foreground">Driver: {selectedTruck.driverName}</p>
                </div>
                <Badge 
                  variant={
                    selectedTruck.status === 'online' ? 'default' : 
                    selectedTruck.status === 'idle' ? 'secondary' : 'destructive'
                  }
                >
                  {selectedTruck.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {selectedTruck.cameras.map((camera) => (
                  <Card key={camera.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm capitalize">
                        {camera.position.replace('_', ' ')} Camera
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video bg-black rounded flex items-center justify-center mb-3">
                        {camera.status === 'online' ? (
                          <div className="text-white text-center">
                            <Camera className="h-6 w-6 mx-auto mb-1" />
                            <p className="text-xs">Live</p>
                          </div>
                        ) : (
                          <div className="text-gray-500 text-center">
                            <EyeOff className="h-6 w-6 mx-auto mb-1" />
                            <p className="text-xs">Offline</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <Badge 
                            variant={camera.status === 'online' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {camera.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Resolution:</span>
                          <span>{camera.resolution}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>FPS:</span>
                          <span>{camera.frameRate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>AI:</span>
                          <span>{camera.aiEnabled ? 'Enabled' : 'Disabled'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Truck metrics and recent incidents for selected truck */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>KPI Score:</span>
                        <span className="font-medium">{selectedTruck.kpiScore.toFixed(1)}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current Speed:</span>
                        <span>{selectedTruck.speed.toFixed(0)} mph</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Heading:</span>
                        <span>{selectedTruck.heading.toFixed(0)}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Location:</span>
                        <span className="text-sm">{selectedTruck.location.address}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Update:</span>
                        <span className="text-sm">
                          {selectedTruck.lastUpdate instanceof Date ? 
                            selectedTruck.lastUpdate.toLocaleTimeString() : 
                            'No data'
                          }
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Incidents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px]">
                      {incidents
                        .filter(incident => incident.truckId === selectedTruck.id)
                        .slice(0, 5)
                        .map((incident) => (
                          <div key={incident.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                            <div>
                              <p className="text-sm font-medium">{incident.incidentType.replace('_', ' ')}</p>
                              <p className="text-xs text-muted-foreground">{incident.timestamp.toLocaleTimeString()}</p>
                            </div>
                            <Badge 
                              variant={
                                incident.severity === 'critical' ? 'destructive' :
                                incident.severity === 'high' ? 'destructive' :
                                'secondary'
                              }
                              className="text-xs"
                            >
                              {incident.severity}
                            </Badge>
                          </div>
                        ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center">
                <Truck className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No Truck Selected</h3>
                <p className="text-muted-foreground">Select a truck from the Fleet Overview to view details</p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}