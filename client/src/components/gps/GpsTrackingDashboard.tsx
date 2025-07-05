// GPS Tracking and Geo-fencing Dashboard Component
// Real-time GPS monitoring with interactive map and geofence management

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  MapPin, 
  Navigation, 
  Truck, 
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Plus,
  Edit,
  Trash2,
  Play,
  Square,
  RotateCcw,
  Satellite,
  Radio,
  Target
} from "lucide-react";

// Types for GPS tracking
interface LiveGpsData {
  truckId: number;
  driverId?: number;
  latitude: number;
  longitude: number;
  altitude?: number;
  speed: number;
  heading: number;
  accuracy: number;
  timestamp: Date;
  satelliteCount?: number;
  hdop?: number;
}

interface Geofence {
  id: number;
  name: string;
  description?: string;
  type: 'circle' | 'polygon';
  coordinates: string;
  radius?: number;
  maxSpeed?: number;
  authorized: boolean;
  active: boolean;
  createdAt: Date;
}

interface GeofenceViolation {
  truckId: number;
  driverId?: number;
  geofenceId: number;
  geofenceName: string;
  violationType: 'entry' | 'exit' | 'speed_limit' | 'unauthorized_area';
  location: { lat: number; lng: number };
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

interface GpsMetrics {
  activeTrucks: number;
  totalGpsPoints: number;
  averageAccuracy: number;
  geofenceViolations: number;
  lastUpdate: Date;
  coverage: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
}

export default function GpsTrackingDashboard() {
  // State management
  const [positions, setPositions] = useState<LiveGpsData[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [violations, setViolations] = useState<GeofenceViolation[]>([]);
  const [metrics, setMetrics] = useState<GpsMetrics>({
    activeTrucks: 0,
    totalGpsPoints: 0,
    averageAccuracy: 0,
    geofenceViolations: 0,
    lastUpdate: new Date(),
    coverage: { excellent: 0, good: 0, fair: 0, poor: 0 }
  });
  
  const [selectedTruck, setSelectedTruck] = useState<LiveGpsData | null>(null);
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  
  // New geofence form state
  const [newGeofence, setNewGeofence] = useState({
    name: '',
    description: '',
    type: 'circle' as 'circle' | 'polygon',
    latitude: '',
    longitude: '',
    radius: '',
    maxSpeed: '',
    authorized: true
  });
  
  const refreshTimer = useRef<NodeJS.Timeout>();

  // API functions
  const fetchGpsStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/gps/status');
      const data = await response.json();
      if (data.success) {
        setMetrics({
          ...data.metrics,
          lastUpdate: new Date(data.metrics.lastUpdate)
        });
      }
    } catch (error) {
      console.error('Error fetching GPS status:', error);
    }
  }, []);

  const fetchPositions = useCallback(async () => {
    try {
      const response = await fetch('/api/gps/positions');
      const data = await response.json();
      if (data.success) {
        setPositions(data.positions.map((pos: any) => ({
          ...pos,
          timestamp: new Date(pos.timestamp)
        })));
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  }, []);

  const fetchGeofences = useCallback(async () => {
    try {
      const response = await fetch('/api/gps/geofences');
      const data = await response.json();
      if (data.success) {
        setGeofences(data.geofences.map((gf: any) => ({
          ...gf,
          createdAt: new Date(gf.createdAt)
        })));
      }
    } catch (error) {
      console.error('Error fetching geofences:', error);
    }
  }, []);

  const fetchViolations = useCallback(async () => {
    try {
      const response = await fetch('/api/gps/violations');
      const data = await response.json();
      if (data.success) {
        setViolations(data.violations.map((v: any) => ({
          ...v,
          timestamp: new Date(v.timestamp)
        })));
      }
    } catch (error) {
      console.error('Error fetching violations:', error);
    }
  }, []);

  const startSimulation = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/gps/simulation/start', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setIsSimulating(true);
      }
    } catch (error) {
      console.error('Error starting simulation:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopSimulation = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/gps/simulation/stop', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setIsSimulating(false);
      }
    } catch (error) {
      console.error('Error stopping simulation:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createGeofence = useCallback(async (geofenceData: any) => {
    try {
      const coordinates = JSON.stringify({
        lat: parseFloat(geofenceData.latitude),
        lng: parseFloat(geofenceData.longitude)
      });

      const payload = {
        name: geofenceData.name,
        description: geofenceData.description,
        type: geofenceData.type,
        coordinates,
        radius: geofenceData.radius ? parseInt(geofenceData.radius) : undefined,
        maxSpeed: geofenceData.maxSpeed ? parseInt(geofenceData.maxSpeed) : undefined,
        authorized: geofenceData.authorized,
        active: true
      };

      const response = await fetch('/api/gps/geofences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        await fetchGeofences();
        setNewGeofence({
          name: '',
          description: '',
          type: 'circle',
          latitude: '',
          longitude: '',
          radius: '',
          maxSpeed: '',
          authorized: true
        });
      }
    } catch (error) {
      console.error('Error creating geofence:', error);
    }
  }, [fetchGeofences]);

  const deleteGeofence = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/api/gps/geofences/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        await fetchGeofences();
      }
    } catch (error) {
      console.error('Error deleting geofence:', error);
    }
  }, [fetchGeofences]);

  // Auto-refresh logic
  useEffect(() => {
    const refresh = async () => {
      await Promise.all([
        fetchGpsStatus(),
        fetchPositions(),
        fetchGeofences(),
        fetchViolations()
      ]);
    };

    refresh(); // Initial load

    if (autoRefresh) {
      refreshTimer.current = setInterval(refresh, refreshInterval);
    }

    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchGpsStatus, fetchPositions, fetchGeofences, fetchViolations]);

  // Helper functions
  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy < 5) return 'bg-green-100 text-green-800';
    if (accuracy < 15) return 'bg-yellow-100 text-yellow-800';
    if (accuracy < 30) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCoordinates = (lat: number, lng: number): string => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">GPS Tracking & Geo-fencing</h1>
          <p className="text-muted-foreground">Real-time fleet monitoring and location management</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Radio className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            Auto Refresh
          </Button>
          <Button
            onClick={isSimulating ? stopSimulation : startSimulation}
            disabled={isLoading}
            variant={isSimulating ? "destructive" : "default"}
          >
            {isSimulating ? <Square className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isLoading ? 'Processing...' : isSimulating ? 'Stop Simulation' : 'Start Simulation'}
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Trucks</p>
                <p className="text-2xl font-bold">{metrics.activeTrucks}</p>
              </div>
              <Truck className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Accuracy</p>
                <p className="text-2xl font-bold">{metrics.averageAccuracy.toFixed(1)}m</p>
              </div>
              <Satellite className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Geofences</p>
                <p className="text-2xl font-bold">{geofences.filter(g => g.active).length}</p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Violations</p>
                <p className="text-2xl font-bold">{violations.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GPS Coverage */}
      <Card>
        <CardHeader>
          <CardTitle>GPS Signal Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.coverage.excellent}</div>
              <div className="text-sm text-muted-foreground">Excellent (&lt;5m)</div>
              <Progress value={(metrics.coverage.excellent / Math.max(1, metrics.activeTrucks)) * 100} className="mt-2 h-2" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{metrics.coverage.good}</div>
              <div className="text-sm text-muted-foreground">Good (5-15m)</div>
              <Progress value={(metrics.coverage.good / Math.max(1, metrics.activeTrucks)) * 100} className="mt-2 h-2" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{metrics.coverage.fair}</div>
              <div className="text-sm text-muted-foreground">Fair (15-30m)</div>
              <Progress value={(metrics.coverage.fair / Math.max(1, metrics.activeTrucks)) * 100} className="mt-2 h-2" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{metrics.coverage.poor}</div>
              <div className="text-sm text-muted-foreground">Poor (&gt;30m)</div>
              <Progress value={(metrics.coverage.poor / Math.max(1, metrics.activeTrucks)) * 100} className="mt-2 h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="tracking" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tracking">Live Tracking</TabsTrigger>
          <TabsTrigger value="geofences">Geofences</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Live Tracking Tab */}
        <TabsContent value="tracking" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Live Positions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  Live Truck Positions ({positions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {positions.map((position) => (
                      <Card 
                        key={position.truckId}
                        className={`cursor-pointer hover:shadow-md transition-shadow ${
                          selectedTruck?.truckId === position.truckId ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => setSelectedTruck(position)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4" />
                              <span className="font-medium">Truck {position.truckId}</span>
                            </div>
                            <Badge className={getAccuracyColor(position.accuracy)}>
                              ±{position.accuracy.toFixed(1)}m
                            </Badge>
                          </div>
                          
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Location:</span>
                              <span className="font-mono text-xs">
                                {formatCoordinates(position.latitude, position.longitude)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Speed:</span>
                              <span>{position.speed.toFixed(1)} mph</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Heading:</span>
                              <span>{position.heading.toFixed(0)}°</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Satellites:</span>
                              <span>{position.satelliteCount || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Last Update:</span>
                              <span>{timeAgo(position.timestamp)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Map View */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {selectedTruck ? `Truck ${selectedTruck.truckId} Details` : 'Map View'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTruck ? (
                  <div className="space-y-4">
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Interactive map would be displayed here</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Coordinates: {formatCoordinates(selectedTruck.latitude, selectedTruck.longitude)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Current Speed</p>
                        <p className="text-2xl font-bold">{selectedTruck.speed.toFixed(1)} mph</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Heading</p>
                        <p className="text-2xl font-bold">{selectedTruck.heading.toFixed(0)}°</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Altitude</p>
                        <p className="text-2xl font-bold">{selectedTruck.altitude?.toFixed(0) || 'N/A'} ft</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">HDOP</p>
                        <p className="text-2xl font-bold">{selectedTruck.hdop?.toFixed(1) || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[600px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 mx-auto mb-4" />
                      <p>Select a truck to view details</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Geofences Tab */}
        <TabsContent value="geofences" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Geofence Management</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Geofence
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Geofence</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Geofence name"
                    value={newGeofence.name}
                    onChange={(e) => setNewGeofence({ ...newGeofence, name: e.target.value })}
                  />
                  <Textarea
                    placeholder="Description (optional)"
                    value={newGeofence.description}
                    onChange={(e) => setNewGeofence({ ...newGeofence, description: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Latitude"
                      value={newGeofence.latitude}
                      onChange={(e) => setNewGeofence({ ...newGeofence, latitude: e.target.value })}
                    />
                    <Input
                      placeholder="Longitude"
                      value={newGeofence.longitude}
                      onChange={(e) => setNewGeofence({ ...newGeofence, longitude: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Radius (meters)"
                      value={newGeofence.radius}
                      onChange={(e) => setNewGeofence({ ...newGeofence, radius: e.target.value })}
                    />
                    <Input
                      placeholder="Max Speed (mph)"
                      value={newGeofence.maxSpeed}
                      onChange={(e) => setNewGeofence({ ...newGeofence, maxSpeed: e.target.value })}
                    />
                  </div>
                  <Button onClick={() => createGeofence(newGeofence)} className="w-full">
                    Create Geofence
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {geofences.map((geofence) => (
              <Card key={geofence.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{geofence.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={geofence.active ? "default" : "secondary"}>
                        {geofence.active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant={geofence.authorized ? "default" : "destructive"}>
                        {geofence.authorized ? 'Authorized' : 'Restricted'}
                      </Badge>
                    </div>
                  </div>
                  
                  {geofence.description && (
                    <p className="text-sm text-muted-foreground mb-3">{geofence.description}</p>
                  )}
                  
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="capitalize">{geofence.type}</span>
                    </div>
                    {geofence.radius && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Radius:</span>
                        <span>{geofence.radius}m</span>
                      </div>
                    )}
                    {geofence.maxSpeed && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Speed:</span>
                        <span>{geofence.maxSpeed} mph</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{geofence.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 mt-3">
                    <Button size="sm" variant="outline">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => deleteGeofence(geofence.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Violations Tab */}
        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Recent Geofence Violations ({violations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {violations.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {violations.map((violation, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4" />
                              <span className="font-medium">Truck {violation.truckId}</span>
                            </div>
                            <Badge className={getSeverityColor(violation.severity)}>
                              {violation.severity.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <p className="text-sm mb-2">{violation.description}</p>
                          
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex justify-between">
                              <span>Geofence:</span>
                              <span>{violation.geofenceName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Type:</span>
                              <span className="capitalize">{violation.violationType.replace('_', ' ')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Time:</span>
                              <span>{violation.timestamp.toLocaleString()}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                    <p>No violations detected</p>
                    <p className="text-sm">All trucks are operating within geofence boundaries</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Active Tracking</span>
                    <span className="text-2xl font-bold">{metrics.activeTrucks}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">GPS Points</span>
                    <span className="text-2xl font-bold">{metrics.totalGpsPoints}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Violations</span>
                    <span className="text-2xl font-bold">{metrics.geofenceViolations}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Last Update</span>
                    <span className="text-sm">
                      {metrics.lastUpdate instanceof Date ? 
                        metrics.lastUpdate.toLocaleTimeString() : 
                        'No data'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Coverage Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Excellent Coverage</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(metrics.coverage.excellent / Math.max(1, metrics.activeTrucks)) * 100} className="w-20 h-2" />
                      <span className="text-sm font-medium">{metrics.coverage.excellent}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Good Coverage</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(metrics.coverage.good / Math.max(1, metrics.activeTrucks)) * 100} className="w-20 h-2" />
                      <span className="text-sm font-medium">{metrics.coverage.good}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Fair Coverage</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(metrics.coverage.fair / Math.max(1, metrics.activeTrucks)) * 100} className="w-20 h-2" />
                      <span className="text-sm font-medium">{metrics.coverage.fair}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Poor Coverage</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(metrics.coverage.poor / Math.max(1, metrics.activeTrucks)) * 100} className="w-20 h-2" />
                      <span className="text-sm font-medium">{metrics.coverage.poor}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}