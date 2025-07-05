import { useState } from "react";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Video, VideoOff, Maximize2, Volume2, VolumeX, Settings } from "lucide-react";

export default function CCTVMonitor() {
  const [selectedTruck, setSelectedTruck] = useState("1");
  const [fullscreenCamera, setFullscreenCamera] = useState<string | null>(null);
  const [mutedCameras, setMutedCameras] = useState<Set<string>>(new Set());

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

  const toggleMute = (cameraId: string) => {
    const newMuted = new Set(mutedCameras);
    if (newMuted.has(cameraId)) {
      newMuted.delete(cameraId);
    } else {
      newMuted.add(cameraId);
    }
    setMutedCameras(newMuted);
  };

  const toggleFullscreen = (cameraId: string) => {
    setFullscreenCamera(fullscreenCamera === cameraId ? null : cameraId);
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

  const selectedTruckData = trucks?.find((truck: any) => truck.id.toString() === selectedTruck);

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
                {trucks?.map((truck: any) => (
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
            const camera = cameras?.find((c: any) => c.position === position);
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
                const camera = cameras?.find((c: any) => c.position === position);
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
      </div>
    </div>
  );
}
