import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield, Camera, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const alertIcons = {
  speed_violation: AlertTriangle,
  geofence_violation: Shield,
  camera_offline: Camera,
  fraud_detection: AlertTriangle,
};

const alertColors = {
  critical: "text-red-500 bg-red-500/20",
  high: "text-orange-500 bg-orange-500/20",
  medium: "text-blue-500 bg-blue-500/20",
  low: "text-green-500 bg-green-500/20",
};

export default function AlertsPanel() {
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['/api/alerts'],
    refetchInterval: 10000,
  });

  const formatRelativeTime = (date: string | Date) => {
    const now = new Date();
    const alertTime = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
          <p className="text-muted-foreground text-sm">Latest security and operational alerts</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentAlerts = alerts?.slice(0, 5) || [];

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Recent Alerts</CardTitle>
        <p className="text-muted-foreground text-sm">Latest security and operational alerts</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentAlerts.map((alert: any) => {
            const IconComponent = alertIcons[alert.type as keyof typeof alertIcons] || AlertTriangle;
            const colorClass = alertColors[alert.severity as keyof typeof alertColors] || alertColors.medium;
            
            return (
              <div
                key={alert.id}
                className={cn(
                  "flex items-center space-x-4 p-4 bg-muted rounded-lg border-l-4",
                  `alert-${alert.severity}`
                )}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                  <IconComponent size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{alert.title}</h4>
                  <p className="text-muted-foreground text-xs">{alert.description}</p>
                  <div className="flex items-center mt-1 text-xs text-muted-foreground">
                    <Clock size={12} className="mr-1" />
                    {formatRelativeTime(alert.timestamp)}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  View Details
                </Button>
              </div>
            );
          })}
          {recentAlerts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle size={48} className="mx-auto mb-2 opacity-50" />
              <p>No recent alerts</p>
            </div>
          )}
        </div>
        <div className="mt-6 text-center">
          <Button variant="ghost" className="text-primary hover:text-primary/80">
            View All Alerts
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
