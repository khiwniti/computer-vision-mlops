import { useState } from "react";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, AlertTriangle, Shield, Camera, Clock, CheckCircle, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const alertIcons = {
  speed_violation: AlertTriangle,
  geofence_violation: Shield,
  camera_offline: Camera,
  fraud_detection: AlertTriangle,
};

const alertColors = {
  critical: "bg-red-500/20 text-red-500 border-red-500",
  high: "bg-orange-500/20 text-orange-500 border-orange-500",
  medium: "bg-blue-500/20 text-blue-500 border-blue-500",
  low: "bg-green-500/20 text-green-500 border-green-500",
};

export default function Alerts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['/api/alerts'],
    refetchInterval: 10000,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (alertId: number) => apiRequest('PATCH', `/api/alerts/${alertId}`, { acknowledged: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      toast({ title: "Alert acknowledged", description: "The alert has been marked as acknowledged." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to acknowledge alert.", variant: "destructive" });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (alertId: number) => apiRequest('PATCH', `/api/alerts/${alertId}`, { resolvedAt: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      toast({ title: "Alert dismissed", description: "The alert has been resolved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to dismiss alert.", variant: "destructive" });
    },
  });

  const filteredAlerts = alerts?.filter((alert: any) => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "acknowledged" && alert.acknowledged) ||
                         (statusFilter === "unacknowledged" && !alert.acknowledged) ||
                         (statusFilter === "resolved" && alert.resolvedAt) ||
                         (statusFilter === "active" && !alert.resolvedAt);
    return matchesSearch && matchesSeverity && matchesStatus;
  }) || [];

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
      <div className="min-h-screen bg-background">
        <Header 
          title="Alerts" 
          subtitle="Monitor and manage security and operational alerts"
        />
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const criticalAlerts = alerts?.filter((alert: any) => alert.severity === 'critical' && !alert.resolvedAt).length || 0;
  const highAlerts = alerts?.filter((alert: any) => alert.severity === 'high' && !alert.resolvedAt).length || 0;
  const unacknowledgedAlerts = alerts?.filter((alert: any) => !alert.acknowledged && !alert.resolvedAt).length || 0;
  const resolvedAlerts = alerts?.filter((alert: any) => alert.resolvedAt).length || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Alerts" 
        subtitle="Monitor and manage security and operational alerts"
      />
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="text-red-500" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Critical Alerts</p>
                  <p className="text-2xl font-bold text-red-500">{criticalAlerts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="text-orange-500" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">High Priority</p>
                  <p className="text-2xl font-bold text-orange-500">{highAlerts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="text-blue-500" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Unacknowledged</p>
                  <p className="text-2xl font-bold text-blue-500">{unacknowledgedAlerts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-green-500" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <p className="text-2xl font-bold text-green-500">{resolvedAlerts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="relative w-64">
              <Input
                type="text"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            </div>
            
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline">
            <Filter size={16} className="mr-2" />
            Advanced Filters
          </Button>
        </div>

        <div className="space-y-4">
          {filteredAlerts.map((alert: any) => {
            const IconComponent = alertIcons[alert.type as keyof typeof alertIcons] || AlertTriangle;
            const colorClass = alertColors[alert.severity as keyof typeof alertColors] || alertColors.medium;
            
            return (
              <Card key={alert.id} className={`border-l-4 ${colorClass} bg-card`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClass}`}>
                        <IconComponent size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold">{alert.title}</h3>
                          <Badge variant={alert.severity === 'critical' ? 'destructive' : 'outline'}>
                            {alert.severity}
                          </Badge>
                          {alert.acknowledged && (
                            <Badge variant="outline" className="text-green-500">
                              Acknowledged
                            </Badge>
                          )}
                          {alert.resolvedAt && (
                            <Badge variant="outline" className="text-blue-500">
                              Resolved
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-muted-foreground mb-3">{alert.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Clock size={14} />
                            <span>{formatRelativeTime(alert.timestamp)}</span>
                          </div>
                          {alert.truckId && (
                            <div className="flex items-center space-x-1">
                              <span>Truck: TRK-{String(alert.truckId).padStart(3, '0')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {!alert.acknowledged && !alert.resolvedAt && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => acknowledgeMutation.mutate(alert.id)}
                          disabled={acknowledgeMutation.isPending}
                        >
                          <CheckCircle size={16} className="mr-1" />
                          Acknowledge
                        </Button>
                      )}
                      {!alert.resolvedAt && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => dismissMutation.mutate(alert.id)}
                          disabled={dismissMutation.isPending}
                        >
                          <X size={16} className="mr-1" />
                          Dismiss
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {filteredAlerts.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No alerts found matching your criteria</p>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <Button variant="outline">
            Load More Alerts
          </Button>
        </div>
      </div>
    </div>
  );
}
