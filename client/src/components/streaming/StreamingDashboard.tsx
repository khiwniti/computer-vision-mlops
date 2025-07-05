// Enhanced Live Streaming Dashboard Component
// Integrates with FFmpeg streaming server and real-time AI analysis

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Camera, 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Maximize2, 
  Settings,
  Activity,
  AlertTriangle,
  Truck,
  Eye,
  Radio,
  Server,
  Zap,
  Clock,
  TrendingUp,
  RefreshCw
} from "lucide-react";

// Types for streaming
interface StreamGroup {
  truckId: number;
  truckNumber: string;
  streams: StreamConfig[];
  status: 'all_running' | 'partial_running' | 'all_stopped' | 'error';
  activeStreams: number;
  totalStreams: number;
}

interface StreamConfig {
  id: string;
  name: string;
  sourceVideo: string;
  rtspPort: number;
  resolution: string;
  frameRate: number;
  bitrate: string;
  loop: boolean;
  cameraPosition: 'front' | 'back' | 'left' | 'right' | 'driver_facing' | 'cargo';
  truckId: number;
  enabled: boolean;
  status?: {
    id: string;
    status: 'starting' | 'running' | 'stopped' | 'error';
    startTime?: Date;
    lastUpdate: Date;
    viewerCount: number;
    bitrate?: number;
    frameRate?: number;
    uptime?: number;
    error?: string;
  };
  url?: string;
}

interface StreamingMetrics {
  totalStreams: number;
  runningStreams: number;
  stoppedStreams: number;
  errorStreams: number;
  totalBandwidth: number;
  averageFrameRate: number;
  uptime: number;
}

interface SystemStatus {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  lastUpdate: Date;
}

export default function StreamingDashboard() {
  // State management
  const [streamGroups, setStreamGroups] = useState<StreamGroup[]>([]);
  const [metrics, setMetrics] = useState<StreamingMetrics>({
    totalStreams: 0,
    runningStreams: 0,
    stoppedStreams: 0,
    errorStreams: 0,
    totalBandwidth: 0,
    averageFrameRate: 0,
    uptime: 0
  });
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    status: 'healthy',
    uptime: 0,
    lastUpdate: new Date()
  });
  const [selectedGroup, setSelectedGroup] = useState<StreamGroup | null>(null);
  const [selectedStream, setSelectedStream] = useState<StreamConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  
  const refreshTimer = useRef<NodeJS.Timeout>();

  // API functions
  const fetchStreamGroups = useCallback(async () => {
    try {
      const response = await fetch('/api/streams/groups');
      const data = await response.json();
      if (data.success) {
        setStreamGroups(data.groups);
      }
    } catch (error) {
      console.error('Error fetching stream groups:', error);
    }
  }, []);

  const fetchSystemStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/streams/status');
      const data = await response.json();
      if (data.success) {
        setMetrics(data.streams.map((stream: any) => ({
          ...stream,
          status: {
            ...stream.status,
            lastUpdate: new Date(stream.status.lastUpdate)
          }
        })));
        setSystemStatus({
          ...data.system,
          lastUpdate: new Date(data.system.lastUpdate)
        });
      }
    } catch (error) {
      console.error('Error fetching system status:', error);
    }
  }, []);

  const initializeStreams = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/streams/initialize', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        await fetchStreamGroups();
        await fetchSystemStatus();
      }
    } catch (error) {
      console.error('Error initializing streams:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchStreamGroups, fetchSystemStatus]);

  const controlTruckStreams = useCallback(async (truckId: number, action: 'start' | 'stop' | 'restart') => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/streams/groups/${truckId}/${action}`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        await fetchStreamGroups();
        await fetchSystemStatus();
      }
    } catch (error) {
      console.error(`Error ${action}ing truck streams:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchStreamGroups, fetchSystemStatus]);

  const controlCameraStream = useCallback(async (truckId: number, position: string, action: 'start' | 'stop') => {
    try {
      const response = await fetch(`/api/streams/groups/${truckId}/cameras/${position}/${action}`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        await fetchStreamGroups();
      }
    } catch (error) {
      console.error(`Error ${action}ing camera stream:`, error);
    }
  }, [fetchStreamGroups]);

  // Auto-refresh logic
  useEffect(() => {
    const refresh = async () => {
      await Promise.all([fetchStreamGroups(), fetchSystemStatus()]);
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
  }, [autoRefresh, refreshInterval, fetchStreamGroups, fetchSystemStatus]);

  // Helper functions
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'running': case 'all_running': case 'healthy': return 'bg-green-100 text-green-800';
      case 'partial_running': case 'degraded': return 'bg-yellow-100 text-yellow-800';
      case 'stopped': case 'all_stopped': return 'bg-gray-100 text-gray-800';
      case 'error': case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': case 'all_running': return <Play className="h-4 w-4 text-green-500" />;
      case 'partial_running': return <Activity className="h-4 w-4 text-yellow-500" />;
      case 'stopped': case 'all_stopped': return <Square className="h-4 w-4 text-gray-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatUptime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Live Streaming Dashboard</h1>
          <p className="text-muted-foreground">Real-time CCTV streaming and AI monitoring system</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Button onClick={initializeStreams} disabled={isLoading}>
            <Server className="h-4 w-4 mr-2" />
            {isLoading ? 'Initializing...' : 'Initialize Streams'}
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(systemStatus.status)}
                  <Badge className={getStatusColor(systemStatus.status)}>
                    {systemStatus.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <Server className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Streams</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold">{metrics.runningStreams}</span>
                  <span className="text-sm text-muted-foreground">/ {metrics.totalStreams}</span>
                </div>
                <Progress 
                  value={(metrics.runningStreams / Math.max(1, metrics.totalStreams)) * 100} 
                  className="mt-2 h-2"
                />
              </div>
              <Radio className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bandwidth</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold">{(metrics.totalBandwidth / 1000).toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">Mbps</span>
                </div>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Frame Rate</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold">{metrics.averageFrameRate.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">FPS</span>
                </div>
              </div>
              <Zap className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="trucks" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trucks">Truck Streams</TabsTrigger>
          <TabsTrigger value="monitor">Live Monitor</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Truck Streams Tab */}
        <TabsContent value="trucks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Truck Groups List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Truck Stream Groups ({streamGroups.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {streamGroups.map((group) => (
                      <Card 
                        key={group.truckId} 
                        className={`cursor-pointer hover:shadow-md transition-shadow ${
                          selectedGroup?.truckId === group.truckId ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => setSelectedGroup(group)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4" />
                              <span className="font-medium">{group.truckNumber}</span>
                            </div>
                            <Badge className={getStatusColor(group.status)}>
                              {group.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                            <span>{group.activeStreams} / {group.totalStreams} cameras</span>
                            <Progress 
                              value={(group.activeStreams / Math.max(1, group.totalStreams)) * 100} 
                              className="w-20 h-2"
                            />
                          </div>

                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                controlTruckStreams(group.truckId, 'start');
                              }}
                              disabled={group.status === 'all_running'}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                controlTruckStreams(group.truckId, 'stop');
                              }}
                              disabled={group.status === 'all_stopped'}
                            >
                              <Square className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                controlTruckStreams(group.truckId, 'restart');
                              }}
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Selected Truck Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  {selectedGroup ? `${selectedGroup.truckNumber} Cameras` : 'Select a Truck'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedGroup ? (
                  <ScrollArea className="h-[600px]">
                    <div className="grid grid-cols-1 gap-3">
                      {selectedGroup.streams.map((stream) => (
                        <Card key={stream.id} className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Camera className="h-4 w-4" />
                              <span className="font-medium capitalize">
                                {stream.cameraPosition.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {stream.status && getStatusIcon(stream.status.status)}
                              <Badge className={stream.status ? getStatusColor(stream.status.status) : 'bg-gray-100 text-gray-800'}>
                                {stream.status?.status.toUpperCase() || 'UNKNOWN'}
                              </Badge>
                            </div>
                          </div>

                          <div className="text-sm space-y-1 mb-3">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Resolution:</span>
                              <span>{stream.resolution}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Frame Rate:</span>
                              <span>{stream.status?.frameRate || stream.frameRate} FPS</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Bitrate:</span>
                              <span>{stream.status?.bitrate || stream.bitrate}</span>
                            </div>
                            {stream.url && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">URL:</span>
                                <span className="font-mono text-xs truncate">{stream.url}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => controlCameraStream(stream.truckId, stream.cameraPosition, 'start')}
                              disabled={stream.status?.status === 'running'}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => controlCameraStream(stream.truckId, stream.cameraPosition, 'stop')}
                              disabled={stream.status?.status === 'stopped'}
                            >
                              <Square className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedStream(stream)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-[600px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Truck className="h-12 w-12 mx-auto mb-4" />
                      <p>Select a truck to view camera details</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Live Monitor Tab */}
        <TabsContent value="monitor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Stream Monitor</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedStream ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">
                      {selectedGroup?.truckNumber} - {selectedStream.cameraPosition.replace('_', ' ').toUpperCase()}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge className={selectedStream.status ? getStatusColor(selectedStream.status.status) : 'bg-gray-100 text-gray-800'}>
                        {selectedStream.status?.status.toUpperCase() || 'UNKNOWN'}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                    {selectedStream.url ? (
                      <div className="text-center text-white">
                        <Camera className="h-12 w-12 mx-auto mb-4" />
                        <p>RTSP Stream: {selectedStream.url}</p>
                        <p className="text-sm text-gray-300 mt-2">
                          Use VLC or compatible player to view stream
                        </p>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400">
                        <Camera className="h-12 w-12 mx-auto mb-4" />
                        <p>Stream not available</p>
                      </div>
                    )}
                  </div>

                  {selectedStream.status && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Uptime</p>
                        <p className="font-medium">
                          {selectedStream.status.uptime ? formatUptime(selectedStream.status.uptime) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Viewers</p>
                        <p className="font-medium">{selectedStream.status.viewerCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Update</p>
                        <p className="font-medium">
                          {selectedStream.status.lastUpdate instanceof Date ? 
                            selectedStream.status.lastUpdate.toLocaleTimeString() : 
                            'No data'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Quality</p>
                        <p className="font-medium">
                          {selectedStream.status.frameRate?.toFixed(1)} FPS
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Eye className="h-12 w-12 mx-auto mb-4" />
                    <p>Select a camera stream to monitor</p>
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
                <CardTitle>Stream Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Streams</span>
                    <span className="text-2xl font-bold">{metrics.totalStreams}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Running</span>
                    <span className="text-2xl font-bold text-green-600">{metrics.runningStreams}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Stopped</span>
                    <span className="text-2xl font-bold text-gray-600">{metrics.stoppedStreams}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Errors</span>
                    <span className="text-2xl font-bold text-red-600">{metrics.errorStreams}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">System Uptime</span>
                    <span className="text-lg font-bold">{formatUptime(systemStatus.uptime)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Last Update</span>
                    <span className="text-lg font-bold">
                      {systemStatus.lastUpdate instanceof Date ? 
                        systemStatus.lastUpdate.toLocaleTimeString() : 
                        'No data'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Health Status</span>
                    <Badge className={getStatusColor(systemStatus.status)}>
                      {systemStatus.status.toUpperCase()}
                    </Badge>
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