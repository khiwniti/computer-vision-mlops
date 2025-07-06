import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import LiveTracking from "@/pages/live-tracking";
import CCTVMonitor from "@/pages/cctv-monitor";
import Drivers from "@/pages/drivers";
import Vendors from "@/pages/vendors";
import Geofences from "@/pages/geofences";
import Analytics from "@/pages/analytics";
import Alerts from "@/pages/alerts";
import VideoAnalytics from "@/pages/video-analytics";
import LiveMonitoring from "@/pages/live-monitoring";
import GpsTracking from "@/pages/gps-tracking";
import AIAnalytics from "@/pages/ai-analytics";
import Sidebar from "@/components/layout/sidebar";

function Router() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/live-tracking" component={LiveTracking} />
          <Route path="/gps-tracking" component={GpsTracking} />
          <Route path="/cctv-monitor" component={CCTVMonitor} />
          <Route path="/drivers" component={Drivers} />
          <Route path="/vendors" component={Vendors} />
          <Route path="/geofences" component={Geofences} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/alerts" component={Alerts} />
          <Route path="/video-analytics" component={VideoAnalytics} />
          <Route path="/ai-analytics" component={AIAnalytics} />
          <Route path="/live-monitoring" component={LiveMonitoring} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
