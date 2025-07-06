import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, Video, MapPin, Gauge, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface TruckCardProps {
  truck: {
    id: number;
    truckNumber: string;
    status: string;
    location?: string;
    speed?: number;
    kpiScore?: number;
    lastUpdate?: Date;
  };
}

export default function TruckCard({ truck }: TruckCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500/20 text-green-500';
      case 'offline':
        return 'bg-red-500/20 text-red-500';
      case 'idle':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'maintenance':
        return 'bg-blue-500/20 text-blue-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getKpiColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-yellow-500';
    if (score >= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  const getStatusIcon = (status: string) => {
    return <div className={cn("w-2 h-2 rounded-full", status === 'online' ? 'bg-green-500' : status === 'offline' ? 'bg-red-500' : status === 'idle' ? 'bg-yellow-500' : 'bg-blue-500')} />;
  };

  return (
    <Card className="bg-muted border-border hover:border-border/60 transition-colors hover-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Truck className="text-primary-foreground" size={16} />
            </div>
            <div>
              <p className="font-semibold text-sm">{truck.truckNumber}</p>
              <p className="text-muted-foreground text-xs">Driver assigned</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {getStatusIcon(truck.status)}
            <span className={cn("text-xs capitalize", getStatusColor(truck.status).split(' ')[1])}>
              {truck.status}
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center">
              <MapPin size={12} className="mr-1" />
              Location
            </span>
            <span className="truncate max-w-[120px]" title={truck.location}>
              {truck.location || 'Unknown'}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center">
              <Gauge size={12} className="mr-1" />
              Speed
            </span>
            <span>{truck.speed || 0} mph</span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center">
              <TrendingUp size={12} className="mr-1" />
              KPI Score
            </span>
            <span className={getKpiColor(truck.kpiScore)}>
              {truck.kpiScore || 0}%
            </span>
          </div>
        </div>
        
        <div className="mt-3 flex items-center space-x-2">
          <Button size="sm" className="flex-1 h-8 text-xs">
            View Details
          </Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            <Video size={14} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
