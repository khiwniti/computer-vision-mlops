import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Video, VideoOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CCTVGrid() {
  const [selectedTruck, setSelectedTruck] = useState("1");

  const { data: trucks, isLoading: trucksLoading } = useQuery({
    queryKey: ['/api/trucks'],
    refetchInterval: 30000,
  });

  const { data: cameras, isLoading: camerasLoading } = useQuery({
    queryKey: ['/api/trucks', selectedTruck, 'cameras'],
    enabled: !!selectedTruck,
    refetchInterval: 10000,
  });

  const isLoading = trucksLoading || camerasLoading;

  const cameraPositions = ['front', 'back', 'left', 'right'];

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>CCTV Monitor</CardTitle>
              <p className="text-muted-foreground text-sm">Live feeds from truck cameras</p>
            </div>
            <Skeleton className="w-32 h-10" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-video rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>CCTV Monitor</CardTitle>
            <p className="text-muted-foreground text-sm">Live feeds from truck cameras</p>
          </div>
          <Select value={selectedTruck} onValueChange={setSelectedTruck}>
            <SelectTrigger className="w-32">
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {cameraPositions.map((position) => {
            const camera = cameras?.find((c: any) => c.position === position);
            const isOnline = camera?.status === 'online';
            
            return (
              <div key={position} className="aspect-video bg-muted rounded-lg relative overflow-hidden camera-feed">
                <div className="absolute inset-0 flex items-center justify-center">
                  {isOnline ? (
                    <Video className="text-muted-foreground" size={48} />
                  ) : (
                    <VideoOff className="text-muted-foreground" size={48} />
                  )}
                </div>
                <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
                  {position.charAt(0).toUpperCase() + position.slice(1)} Camera
                </div>
                <div className="absolute top-2 right-2 flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-xs text-white">{isOnline ? 'LIVE' : 'OFFLINE'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
