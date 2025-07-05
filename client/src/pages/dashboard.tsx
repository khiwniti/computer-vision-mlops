import Header from "@/components/layout/header";
import KPICards from "@/components/dashboard/kpi-cards";
import LiveMap from "@/components/dashboard/live-map";
import CCTVGrid from "@/components/dashboard/cctv-grid";
import FleetGrid from "@/components/dashboard/fleet-grid";
import AlertsPanel from "@/components/dashboard/alerts-panel";
import { useWebSocket } from "@/lib/websocket";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  const { lastMessage } = useWebSocket("/ws");

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'alert_created') {
        toast({
          title: "New Alert",
          description: `${lastMessage.data.title}: ${lastMessage.data.description}`,
          variant: lastMessage.data.severity === 'critical' ? 'destructive' : 'default',
        });
      }
    }
  }, [lastMessage, toast]);

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Fleet Dashboard" 
        subtitle="Real-time monitoring of truck fleet"
      />
      
      <div className="p-6 space-y-6">
        <KPICards />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LiveMap />
          <CCTVGrid />
        </div>
        
        <FleetGrid />
        
        <AlertsPanel />
      </div>
    </div>
  );
}
