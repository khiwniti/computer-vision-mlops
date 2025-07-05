import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

declare global {
  interface Window {
    L: any;
  }
}

export default function LiveMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const { data: trucks, isLoading } = useQuery({
    queryKey: ['/api/trucks'],
    refetchInterval: 5000,
  });

  const { data: geofences } = useQuery({
    queryKey: ['/api/geofences'],
    refetchInterval: 30000,
  });

  useEffect(() => {
    // Load Leaflet dynamically
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
    if (!mapInstance.current || !trucks) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstance.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add truck markers
    trucks.forEach((truck: any) => {
      if (truck.latitude && truck.longitude) {
        const statusColors = {
          online: '#4CAF50',
          offline: '#F44336',
          idle: '#FF9800',
          maintenance: '#2196F3'
        };

        const marker = window.L.circleMarker([truck.latitude, truck.longitude], {
          radius: 8,
          fillColor: statusColors[truck.status as keyof typeof statusColors] || '#666',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(mapInstance.current);

        marker.bindPopup(`
          <div class="p-3 bg-gray-800 text-white rounded-lg">
            <h4 class="font-semibold">${truck.truckNumber}</h4>
            <p class="text-sm text-gray-400">Status: ${truck.status}</p>
            <p class="text-sm text-gray-400">Speed: ${truck.speed || 0} mph</p>
            <p class="text-sm text-gray-400">KPI: ${truck.kpiScore || 0}%</p>
          </div>
        `);

        markersRef.current.push(marker);
      }
    });
  }, [trucks]);

  useEffect(() => {
    if (!mapInstance.current || !geofences) return;

    // Add geofences
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
          </div>
        `);

        markersRef.current.push(circle);
      }
    });
  }, [geofences]);

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Live Truck Tracking</CardTitle>
          <p className="text-muted-foreground text-sm">Real-time GPS locations with geofences</p>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Live Truck Tracking</CardTitle>
        <p className="text-muted-foreground text-sm">Real-time GPS locations with geofences</p>
      </CardHeader>
      <CardContent>
        <div ref={mapRef} className="h-96 rounded-lg bg-muted" />
      </CardContent>
    </Card>
  );
}
