import { Card, CardContent } from "@/components/ui/card";
import { Truck, AlertTriangle, UserCheck, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: string;
  trendDirection: "up" | "down";
  color: "success" | "error" | "info" | "warning";
}

function KPICard({ title, value, icon: Icon, trend, trendDirection, color }: KPICardProps) {
  const colorClasses = {
    success: "text-green-500 bg-green-500/20",
    error: "text-red-500 bg-red-500/20",
    info: "text-blue-500 bg-blue-500/20",
    warning: "text-yellow-500 bg-yellow-500/20"
  };

  const trendColors = {
    success: "text-green-500",
    error: "text-red-500",
    info: "text-blue-500",
    warning: "text-yellow-500"
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{title}</p>
            <p className="text-2xl font-semibold">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className={`${colorClasses[color].split(' ')[0]}`} size={20} />
          </div>
        </div>
        <div className={`mt-4 flex items-center text-sm ${trendColors[color]}`}>
          <span className="mr-1">
            {trendDirection === "up" ? "↗" : "↘"}
          </span>
          <span>{trend}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function KPICards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-12" />
                </div>
                <Skeleton className="w-12 h-12 rounded-lg" />
              </div>
              <Skeleton className="mt-4 h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <KPICard
        title="Active Trucks"
        value={stats?.activeTrucks?.toString() || "0"}
        icon={Truck}
        trend="+2.3% from yesterday"
        trendDirection="up"
        color="success"
      />
      <KPICard
        title="Offline Trucks"
        value={stats?.offlineTrucks?.toString() || "0"}
        icon={AlertTriangle}
        trend="-1.2% from yesterday"
        trendDirection="down"
        color="error"
      />
      <KPICard
        title="Active Drivers"
        value={stats?.activeDrivers?.toString() || "0"}
        icon={UserCheck}
        trend="+0.8% from yesterday"
        trendDirection="up"
        color="info"
      />
      <KPICard
        title="Alerts Today"
        value={stats?.todayAlerts?.toString() || "0"}
        icon={Bell}
        trend="-15.4% from yesterday"
        trendDirection="down"
        color="warning"
      />
    </div>
  );
}
