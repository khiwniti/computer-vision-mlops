import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Truck, 
  MapPin, 
  Video, 
  Users, 
  Building, 
  Shield, 
  TrendingUp, 
  AlertTriangle,
  Brain,
  Navigation
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: TrendingUp },
  { name: "Live Monitoring", href: "/live-monitoring", icon: Video },
  { name: "GPS Tracking", href: "/gps-tracking", icon: Navigation },
  { name: "Live Tracking", href: "/live-tracking", icon: MapPin },
  { name: "CCTV Monitor", href: "/cctv-monitor", icon: Video },
  { name: "Video Analytics", href: "/video-analytics", icon: Brain },
  { name: "Drivers", href: "/drivers", icon: Users },
  { name: "Vendors", href: "/vendors", icon: Building },
  { name: "Geofences", href: "/geofences", icon: Shield },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
  { name: "Alerts", href: "/alerts", icon: AlertTriangle },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <nav className="w-64 bg-card border-r border-border flex-shrink-0">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Truck className="text-primary-foreground" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Asphalt Logistics</h1>
            <p className="text-muted-foreground text-sm">Management Platform</p>
          </div>
        </div>
        
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon size={18} />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
