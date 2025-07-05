import { useEffect, useState } from "react";
import { Bell, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: alerts } = useQuery({
    queryKey: ['/api/alerts'],
    refetchInterval: 30000,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const unacknowledgedAlerts = alerts?.filter((alert: any) => !alert.acknowledged)?.length || 0;

  return (
    <header className="bg-card border-b border-border p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{title}</h2>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-green-500">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm">System Online</span>
          </div>
          <div className="flex items-center space-x-2 bg-muted px-3 py-2 rounded-lg">
            <Clock className="text-muted-foreground" size={16} />
            <span className="text-sm">{formatTime(currentTime)}</span>
          </div>
          <div className="relative">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="text-muted-foreground" size={18} />
              {unacknowledgedAlerts > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {unacknowledgedAlerts}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
