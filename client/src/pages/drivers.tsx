import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, User, TrendingUp, Truck, Phone, Mail } from "lucide-react";
import { useState } from "react";

export default function Drivers() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: drivers, isLoading } = useQuery({
    queryKey: ['/api/drivers'],
    refetchInterval: 30000,
  });

  const filteredDrivers = drivers?.filter((driver: any) => 
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getKpiColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-yellow-500';
    if (score >= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-500';
      case 'inactive':
        return 'bg-red-500/20 text-red-500';
      case 'suspended':
        return 'bg-yellow-500/20 text-yellow-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          title="Drivers" 
          subtitle="Manage and monitor driver performance"
        />
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeDrivers = drivers?.filter((driver: any) => driver.status === 'active').length || 0;
  const totalDrivers = drivers?.length || 0;
  const avgKpiScore = drivers?.reduce((sum: number, driver: any) => sum + (driver.kpiScore || 0), 0) / totalDrivers || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Drivers" 
        subtitle="Manage and monitor driver performance"
      />
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <User className="text-primary" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Total Drivers</p>
                  <p className="text-2xl font-bold">{totalDrivers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <User className="text-green-500" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Active Drivers</p>
                  <p className="text-2xl font-bold text-green-500">{activeDrivers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="text-blue-500" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Avg KPI Score</p>
                  <p className="text-2xl font-bold text-blue-500">{avgKpiScore.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Truck className="text-orange-500" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Total Trips</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {drivers?.reduce((sum: number, driver: any) => sum + (driver.totalTrips || 0), 0) || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center">
          <div className="relative w-64">
            <Input
              type="text"
              placeholder="Search drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          </div>
          
          <Button>
            <Plus size={16} className="mr-2" />
            Add Driver
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrivers.map((driver: any) => (
            <Card key={driver.id} className="bg-card border-border hover:border-border/60 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <User className="text-primary-foreground" size={20} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{driver.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{driver.licenseNumber}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(driver.status)}>
                    {driver.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">KPI Score</p>
                    <p className={`text-lg font-semibold ${getKpiColor(driver.kpiScore)}`}>
                      {driver.kpiScore || 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Safety Score</p>
                    <p className={`text-lg font-semibold ${getKpiColor(driver.safetyScore)}`}>
                      {driver.safetyScore || 0}%
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Total Trips</p>
                  <p className="text-lg font-semibold">{driver.totalTrips || 0}</p>
                </div>
                
                <div className="space-y-2">
                  {driver.phone && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone size={14} className="text-muted-foreground" />
                      <span>{driver.phone}</span>
                    </div>
                  )}
                  {driver.email && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail size={14} className="text-muted-foreground" />
                      <span className="truncate">{driver.email}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2 pt-2">
                  <Button size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredDrivers.length === 0 && (
          <div className="text-center py-12">
            <User size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No drivers found</p>
          </div>
        )}
      </div>
    </div>
  );
}
