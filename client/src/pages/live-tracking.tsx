import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useRef } from "react";
import { MapPin, Navigation, Clock, Truck } from "lucide-react";

export default function LiveTracking() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const { data: trucks, isLoading } = useQuery({
    queryKey: ['/api/trucks'],
    refetchInterval: 3000,
  });

  const { data: geofences } = useQuery({
    queryKey: ['/api/geofences'],
    refetchInterval: 30000,
  });

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

      mapInstance.current = window.L.map(mapRef.current).setView([40.7128, -74.0060], 9);

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
    if (!mapInstance.current || !trucks) return;

    markersRef.current.forEach(marker => {
      mapInstance.current.removeLayer(marker);
    });
    markersRef.current = [];

    trucks.forEach((truck: any) => {
      if (truck.latitude && truck.longitude) {
        const statusColors = {
          online: '#4CAF50',
          offline: '#F44336',
          idle: '#FF9800',
          maintenance: '#2196F3'
        };

        const marker = window.L.circleMarker([truck.latitude, truck.longitude], {
          radius: 10,
          fillColor: statusColors[truck.status as keyof typeof statusColors] || '#666',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(mapInstance.current);

        marker.bindPopup(`
          <div class="p-4 bg-gray-800 text-white rounded-lg min-w-[200px]">
            <h4 class="font-semibold text-lg">${truck.truckNumber}</h4>
            <div class="mt-2 space-y-1">
              <p class="text-sm"><span class="text-gray-400">Status:</span> ${truck.status}</p>
              <p class="text-sm"><span class="text-gray-400">Speed:</span> ${truck.speed || 0} mph</p>
              <p class="text-sm"><span class="text-gray-400">KPI Score:</span> ${truck.kpiScore || 0}%</p>
              <p class="text-sm"><span class="text-gray-400">Location:</span> ${truck.location || 'Unknown'}</p>
              <p class="text-sm"><span class="text-gray-400">Last Update:</span> ${new Date(truck.lastUpdate).toLocaleTimeString()}</p>
            </div>
          </div>
        `);

        markersRef.current.push(marker);
      }
    });
  }, [trucks]);

  useEffect(() => {
    if (!mapInstance.current || !geofences) return;

    geofences.forEach((geofence: any) => {
      if (geofence.type === 'circular' && geofence.coordinates) {
        const circle = window.L.circle(
          [geofence.coordinates.lat, geofence.coordinates.lng],
          {
            color: '#FF9800',
            fillColor: '#FF9800',
            fillOpacity: 0.1,
            radius: geofence.radius || 1000
          }
        ).addTo(mapInstance.current);

        circle.bindPopup(`
          <div class="p-3 bg-gray-800 text-white rounded-lg">
            <h4 class="font-semibold">${geofence.name}</h4>
            <p class="text-sm text-gray-400">Type: ${geofence.type}</p>
            <p class="text-sm text-gray-400">Radius: ${geofence.radius}m</p>
            <p class="text-sm text-gray-400">Active: ${geofence.isActive ? 'Yes' : 'No'}</p>
          </div>
        `);

        markersRef.current.push(circle);
      }
    });
  }, [geofences]);

  const activeTrucks = trucks?.filter((truck: any) => truck.status === 'online') || [];
  const totalTrucks = trucks?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Live Tracking" 
        subtitle="Real-time GPS tracking of all trucks"
      />
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Truck className="text-primary" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Total Trucks</p>
                  <p className="text-2xl font-bold">{totalTrucks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MapPin className="text-green-500" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Active Trucks</p>
                  <p className="text-2xl font-bold text-green-500">{activeTrucks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Navigation className="text-blue-500" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Geofences</p>
                  <p className="text-2xl font-bold text-blue-500">{geofences?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="text-orange-500" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Last Update</p>
                  <p className="text-sm font-medium">
                    {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Live Map</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[600px] w-full rounded-lg" />
                ) : (
                  <div ref={mapRef} className="h-[600px] rounded-lg" />
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Trucks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {activeTrucks.map((truck: any) => (
                    <div key={truck.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{truck.truckNumber}</p>
                        <p className="text-xs text-muted-foreground">{truck.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{truck.speed || 0} mph</p>
                        <Badge variant="outline" className="text-xs">
                          {truck.kpiScore || 0}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Map Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" size="sm">
                  Center All Trucks
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  Show Geofences
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  Toggle Trails
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
