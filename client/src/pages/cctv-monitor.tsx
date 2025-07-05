import { useState, useEffect } from "react";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Video, VideoOff, Maximize2, Volume2, VolumeX, Settings, AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";
import { useWebSocket } from "@/lib/websocket";

interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  source: string;
}

export default function CCTVMonitor() {
  const [selectedTruck, setSelectedTruck] = useState("1");
  const [fullscreenCamera, setFullscreenCamera] = useState<string | null>(null);
  const [mutedCameras, setMutedCameras] = useState<Set<string>>(new Set());
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(true);
  
  const { lastMessage, isConnected } = useWebSocket("/ws");

  const { data: trucks, isLoading: trucksLoading } = useQuery({
    queryKey: ['/api/trucks'],
    refetchInterval: 30000,
  });

  const { data: cameras, isLoading: camerasLoading } = useQuery({
    queryKey: ['/api/trucks', selectedTruck, 'cameras'],
    enabled: !!selectedTruck,
    refetchInterval: 5000,
  });

  const isLoading = trucksLoading || camerasLoading;
  const cameraPositions = ['front', 'back', 'left', 'right'];

  // Add log entry function
  const addLog = (type: LogEntry['type'], message: string, source: string) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type,
      message,
      source
    };
    setLogs(prev => [newLog, ...prev.slice(0, 99)]); // Keep last 100 logs
  };

  // WebSocket message handler
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'camera_status_change':
          addLog(
            lastMessage.data.status === 'online' ? 'success' : 'error',
            `Camera ${lastMessage.data.position} ${lastMessage.data.status}`,
            `Truck ${lastMessage.data.truckId}`
          );
          break;
        case 'alert_created':
          addLog('warning', lastMessage.data.description, 'System Alert');
          break;
        case 'recording_started':
          addLog('info', `Recording started on ${lastMessage.data.position} camera`, `Truck ${lastMessage.data.truckId}`);
          break;
        case 'recording_stopped':
          addLog('info', `Recording stopped on ${lastMessage.data.position} camera`, `Truck ${lastMessage.data.truckId}`);
          break;
        default:
          addLog('info', `${lastMessage.type}: ${JSON.stringify(lastMessage.data)}`, 'WebSocket');
      }
    }
  }, [lastMessage]);

  // Connection status logging
  useEffect(() => {
    if (isConnected) {
      addLog('success', 'WebSocket connected to server', 'System');
    } else {
      addLog('error', 'WebSocket disconnected from server', 'System');
    }
  }, [isConnected]);

  // Camera status change logging
  useEffect(() => {
    if (cameras && Array.isArray(cameras) && selectedTruck) {
      cameras.forEach((camera: any) => {
        addLog(
          camera.status === 'online' ? 'success' : 'warning',
          `${camera.position} camera is ${camera.status}`,
          `Truck ${selectedTruck}`
        );
      });
    }
  }, [cameras, selectedTruck]);

  // Initial system log
  useEffect(() => {
    addLog('info', 'CCTV Monitor initialized', 'System');
  }, []);

  const toggleMute = (cameraId: string) => {
    const newMuted = new Set(mutedCameras);
    const wasMuted = newMuted.has(cameraId);
    if (wasMuted) {
      newMuted.delete(cameraId);
      addLog('info', `Unmuted camera ${cameraId}`, 'User Action');
    } else {
      newMuted.add(cameraId);
      addLog('info', `Muted camera ${cameraId}`, 'User Action');
    }
    setMutedCameras(newMuted);
  };

  const toggleFullscreen = (cameraId: string) => {
    const wasFullscreen = fullscreenCamera === cameraId;
    setFullscreenCamera(wasFullscreen ? null : cameraId);
    addLog('info',
      wasFullscreen ? `Exited fullscreen for ${cameraId}` : `Entered fullscreen for ${cameraId}`,
      'User Action'
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          title="CCTV Monitor" 
          subtitle="Live camera feeds from all trucks"
        />
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-10 w-48" />
            <div className="flex space-x-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-video rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const selectedTruckData = Array.isArray(trucks) ? trucks.find((truck: any) => truck.id.toString() === selectedTruck) : null;

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="CCTV Monitor" 
        subtitle="Live camera feeds from all trucks"
      />
      
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Select value={selectedTruck} onValueChange={setSelectedTruck}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select truck" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(trucks) && trucks.map((truck: any) => (
                  <SelectItem key={truck.id} value={truck.id.toString()}>
                    {truck.truckNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedTruckData && (
              <div className="flex items-center space-x-2">
                <Badge variant={selectedTruckData.status === 'online' ? 'default' : 'secondary'}>
                  {selectedTruckData.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {selectedTruckData.location}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Settings size={16} className="mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm">
              Record
            </Button>
          </div>
        </div>

        <div className={`grid gap-4 ${fullscreenCamera ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {cameraPositions.map((position) => {
            const camera = Array.isArray(cameras) ? cameras.find((c: any) => c.position === position) : null;
            const cameraId = `${selectedTruck}-${position}`;
            const isOnline = camera?.status === 'online';
            const isMuted = mutedCameras.has(cameraId);
            const isFullscreen = fullscreenCamera === cameraId;
            
            if (fullscreenCamera && !isFullscreen) {
              return null;
            }

            return (
              <Card key={position} className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {position.charAt(0).toUpperCase() + position.slice(1)} Camera
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-xs text-white">{isOnline ? 'LIVE' : 'OFFLINE'}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className={`relative overflow-hidden camera-feed ${isFullscreen ? 'h-[600px]' : 'aspect-video'}`}>
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      {isOnline ? (
                        <Video className="text-muted-foreground" size={isFullscreen ? 64 : 48} />
                      ) : (
                        <VideoOff className="text-muted-foreground" size={isFullscreen ? 64 : 48} />
                      )}
                    </div>
                    
                    {/* Camera overlay controls */}
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => toggleMute(cameraId)}
                          className="h-8 w-8 p-0"
                        >
                          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => toggleFullscreen(cameraId)}
                          className="h-8 w-8 p-0"
                        >
                          <Maximize2 size={16} />
                        </Button>
                      </div>
                      
                      <div className="bg-black/50 px-2 py-1 rounded text-xs text-white">
                        {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                    
                    {/* Recording indicator */}
                    {isOnline && (
                      <div className="absolute top-4 right-4 flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">REC</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Camera status panel */}
        <Card>
          <CardHeader>
            <CardTitle>Camera Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {cameraPositions.map((position) => {
                const camera = Array.isArray(cameras) ? cameras.find((c: any) => c.position === position) : null;
                const isOnline = camera?.status === 'online';
                
                return (
                  <div key={position} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-2">
                      {isOnline ? (
                        <Video className="text-green-500" size={16} />
                      ) : (
                        <VideoOff className="text-red-500" size={16} />
                      )}
                      <span className="text-sm font-medium">
                        {position.charAt(0).toUpperCase() + position.slice(1)}
                      </span>
                    </div>
                    <Badge variant={isOnline ? 'default' : 'secondary'}>
                      {isOnline ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Real-time Log Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Info size={20} />
                <span>Real-time System Logs</span>
                <Badge variant={isConnected ? 'default' : 'destructive'}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Badge>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLogs(!showLogs)}
                >
                  {showLogs ? 'Hide' : 'Show'} Logs
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLogs([])}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          {showLogs && (
            <CardContent>
              <ScrollArea className="h-64 w-full">
                <div className="space-y-2">
                  {logs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No logs yet...</p>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start space-x-2 p-2 rounded-lg bg-muted/50"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {log.type === 'success' && <CheckCircle size={16} className="text-green-500" />}
                          {log.type === 'error' && <XCircle size={16} className="text-red-500" />}
                          {log.type === 'warning' && <AlertTriangle size={16} className="text-yellow-500" />}
                          {log.type === 'info' && <Info size={16} className="text-blue-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">
                              {log.message}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {log.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Source: {log.source}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
