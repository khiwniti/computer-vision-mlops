import { useEffect, useRef, useState } from "react";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Shield, MapPin, Settings, Edit3, Trash2 } from "lucide-react";

declare global {
  interface Window {
    L: any;
  }
}

export default function Geofences() {
  const [searchTerm, setSearchTerm] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const geofenceLayersRef = useRef<any[]>([]);

  const { data: geofences, isLoading } = useQuery({
    queryKey: ['/api/geofences'],
    refetchInterval: 30000,
  });

  const filteredGeofences = geofences?.filter((geofence: any) => 
    geofence.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  useEffect(() => {
    const loadLeaflet = async () => {
      if (!window.L) {
        const leafletScript = document.createElement('script');
        leafletScript.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
        leafletScript.onload = initializeMap;
        document.head.appendChild(leafletScript);

        const leafletCSS = document.createElement('link');
        leafletCSS.rel = 'stylesheet';
        leafletCSS.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
        document.head.appendChild(leafletCSS);
      } else {
        initializeMap();
      }
    };

    const initializeMap = () => {
      if (!mapRef.current || mapInstance.current) return;

      mapInstance.current = window.L.map(mapRef.current).setView([40.7128, -74.0060], 10);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance.current);
    };

    loadLeaflet();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !geofences) return;

    // Clear existing geofence layers
    geofenceLayersRef.current.forEach(layer => {
      mapInstance.current.removeLayer(layer);
    });
    geofenceLayersRef.current = [];

    // Add geofence layers
    geofences.forEach((geofence: any) => {
      if (geofence.type === 'circular' && geofence.coordinates) {
        const circle = window.L.circle(
          [geofence.coordinates.lat, geofence.coordinates.lng],
          {
            color: geofence.isActive ? '#FF9800' : '#666',
            fillColor: geofence.isActive ? '#FF9800' : '#666',
            fillOpacity: 0.1,
            radius: geofence.radius || 1000,
            weight: 2
          }
        ).addTo(mapInstance.current);

        circle.bindPopup(`
          <div class="p-3 bg-gray-800 text-white rounded-lg">
            <h4 class="font-semibold">${geofence.name}</h4>
            <p class="text-sm text-gray-400">Type: ${geofence.type}</p>
            <p class="text-sm text-gray-400">Radius: ${geofence.radius}m</p>
            <p class="text-sm text-gray-400">Status: ${geofence.isActive ? 'Active' : 'Inactive'}</p>
            <p class="text-sm text-gray-400">Alert on Enter: ${geofence.alertOnEnter ? 'Yes' : 'No'}</p>
            <p class="text-sm text-gray-400">Alert on Exit: ${geofence.alertOnExit ? 'Yes' : 'No'}</p>
          </div>
        `);

        geofenceLayersRef.current.push(circle);
      }
    });
  }, [geofences]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          title="Geofences" 
          subtitle="Manage geographical boundaries and alerts"
        />
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-[600px] rounded-lg" />
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeGeofences = geofences?.filter((geofence: any) => geofence.isActive).length || 0;
  const totalGeofences = geofences?.length || 0;
  const alertEnabledGeofences = geofences?.filter((geofence: any) => geofence.alertOnEnter || geofence.alertOnExit).length || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Geofences" 
        subtitle="Manage geographical boundaries and alerts"
      />
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="text-primary" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Total Geofences</p>
                  <p className="text-2xl font-bold">{totalGeofences}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="text-green-500" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Active Geofences</p>
                  <p className="text-2xl font-bold text-green-500">{activeGeofences}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MapPin className="text-blue-500" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Alert Enabled</p>
                  <p className="text-2xl font-bold text-blue-500">{alertEnabledGeofences}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Settings className="text-orange-500" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Violations Today</p>
                  <p className="text-2xl font-bold text-orange-500">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center">
          <div className="relative w-64">
            <Input
              type="text"
              placeholder="Search geofences..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          </div>
          
          <Button>
            <Plus size={16} className="mr-2" />
            Create Geofence
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Geofence Map</CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={mapRef} className="h-[600px] rounded-lg" />
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Geofence List</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                {filteredGeofences.map((geofence: any) => (
                  <div key={geofence.id} className="p-4 bg-muted rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{geofence.name}</h4>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={geofence.isActive} 
                          className="data-[state=checked]:bg-green-500"
                        />
                        <Badge variant={geofence.isActive ? 'default' : 'secondary'}>
                          {geofence.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="capitalize">{geofence.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Radius:</span>
                        <span>{geofence.radius}m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Alert on Enter:</span>
                        <span>{geofence.alertOnEnter ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Alert on Exit:</span>
                        <span>{geofence.alertOnExit ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit3 size={14} className="mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 text-red-500 hover:text-red-600">
                        <Trash2 size={14} className="mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                
                {filteredGeofences.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No geofences found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
