// Real-time Activity Timeline Component
// Displays chronological view of construction activities with AI insights

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Users, 
  Truck, 
  Shield, 
  TrendingUp,
  Camera,
  Zap,
  Play,
  Pause
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  timestamp: Date;
  type: 'activity' | 'safety' | 'progress' | 'equipment' | 'milestone';
  category: string;
  title: string;
  description: string;
  location: string;
  cameraId: string;
  confidence: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'active' | 'completed' | 'alert' | 'resolved';
  metadata?: {
    equipment?: string[];
    personnel?: number;
    duration?: number;
    progress?: number;
    qualityScore?: number;
  };
}

interface TimelineFilters {
  types: string[];
  cameras: string[];
  timeRange: '1h' | '4h' | '8h' | '24h' | 'all';
  autoScroll: boolean;
}

export const ActivityTimeline: React.FC = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filters, setFilters] = useState<TimelineFilters>({
    types: ['activity', 'safety', 'progress', 'equipment'],
    cameras: [],
    timeRange: '4h',
    autoScroll: true
  });
  const [isLive, setIsLive] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Mock real-time events
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const newEvent = generateMockEvent();
      setEvents(prev => [newEvent, ...prev.slice(0, 99)]); // Keep last 100 events
      
      // Auto-scroll to top if enabled
      if (filters.autoScroll && scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = 0;
      }
    }, 3000 + Math.random() * 7000); // Random interval 3-10 seconds

    return () => clearInterval(interval);
  }, [isLive, filters.autoScroll]);

  const generateMockEvent = (): TimelineEvent => {
    const eventTypes = [
      {
        type: 'activity' as const,
        categories: ['paving', 'rolling', 'material_delivery', 'quality_inspection'],
        titles: [
          'Asphalt paving operation started',
          'Road roller compaction in progress',
          'Material delivery completed',
          'Quality inspection performed'
        ]
      },
      {
        type: 'safety' as const,
        categories: ['ppe_check', 'safety_briefing', 'hazard_identified'],
        titles: [
          'PPE compliance check completed',
          'Safety briefing conducted',
          'Potential hazard identified'
        ]
      },
      {
        type: 'equipment' as const,
        categories: ['maintenance', 'status_change', 'utilization'],
        titles: [
          'Equipment maintenance scheduled',
          'Equipment status updated',
          'High utilization detected'
        ]
      },
      {
        type: 'progress' as const,
        categories: ['milestone', 'completion', 'delay'],
        titles: [
          'Section milestone reached',
          'Area completion updated',
          'Schedule adjustment needed'
        ]
      }
    ];

    const selectedType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const category = selectedType.categories[Math.floor(Math.random() * selectedType.categories.length)];
    const title = selectedType.titles[Math.floor(Math.random() * selectedType.titles.length)];
    
    const cameras = ['CAM-001', 'CAM-002', 'CAM-003', 'CAM-004'];
    const locations = ['Section A', 'Section B', 'Material Area', 'Equipment Zone'];

    return {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type: selectedType.type,
      category,
      title,
      description: `AI detected ${category.replace('_', ' ')} activity with high confidence. Automated analysis completed.`,
      location: locations[Math.floor(Math.random() * locations.length)],
      cameraId: cameras[Math.floor(Math.random() * cameras.length)],
      confidence: 0.7 + Math.random() * 0.3,
      severity: selectedType.type === 'safety' ? (['low', 'medium', 'high'] as const)[Math.floor(Math.random() * 3)] : undefined,
      status: (['active', 'completed', 'alert'] as const)[Math.floor(Math.random() * 3)],
      metadata: {
        equipment: ['Asphalt Paver', 'Road Roller'][Math.floor(Math.random() * 2)] ? ['Asphalt Paver'] : undefined,
        personnel: Math.floor(Math.random() * 8) + 2,
        duration: Math.floor(Math.random() * 120) + 30,
        progress: Math.floor(Math.random() * 100),
        qualityScore: Math.floor(Math.random() * 20) + 80
      }
    };
  };

  const getEventIcon = (type: string, status?: string) => {
    switch (type) {
      case 'activity':
        return <Activity className="h-4 w-4" />;
      case 'safety':
        return status === 'alert' ? <AlertTriangle className="h-4 w-4" /> : <Shield className="h-4 w-4" />;
      case 'progress':
        return <TrendingUp className="h-4 w-4" />;
      case 'equipment':
        return <Truck className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string, severity?: string, status?: string) => {
    if (severity === 'critical' || status === 'alert') return 'text-red-500 bg-red-50 border-red-200';
    if (severity === 'high') return 'text-orange-500 bg-orange-50 border-orange-200';
    if (type === 'safety') return 'text-yellow-500 bg-yellow-50 border-yellow-200';
    if (type === 'progress') return 'text-green-500 bg-green-50 border-green-200';
    if (type === 'equipment') return 'text-blue-500 bg-blue-50 border-blue-200';
    return 'text-gray-500 bg-gray-50 border-gray-200';
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'alert':
        return <Badge variant="destructive">Alert</Badge>;
      case 'resolved':
        return <Badge variant="outline">Resolved</Badge>;
      default:
        return null;
    }
  };

  const filteredEvents = events.filter(event => {
    if (!filters.types.includes(event.type)) return false;
    if (filters.cameras.length > 0 && !filters.cameras.includes(event.cameraId)) return false;
    
    // Time range filter
    const now = new Date();
    const eventTime = new Date(event.timestamp);
    const timeDiff = now.getTime() - eventTime.getTime();
    
    switch (filters.timeRange) {
      case '1h':
        return timeDiff <= 3600000;
      case '4h':
        return timeDiff <= 14400000;
      case '8h':
        return timeDiff <= 28800000;
      case '24h':
        return timeDiff <= 86400000;
      default:
        return true;
    }
  });

  const formatTimeAgo = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Activity Timeline</h2>
          <p className="text-muted-foreground">Real-time construction activities powered by AI</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={isLive ? "default" : "outline"}
            size="sm"
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
            {isLive ? 'Live' : 'Paused'}
          </Button>
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium">Event Types:</span>
            {['activity', 'safety', 'progress', 'equipment'].map((type) => (
              <Button
                key={type}
                variant={filters.types.includes(type) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilters(prev => ({
                    ...prev,
                    types: prev.types.includes(type)
                      ? prev.types.filter(t => t !== type)
                      : [...prev.types, type]
                  }));
                }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Time Range:</span>
              {['1h', '4h', '8h', '24h', 'all'].map((range) => (
                <Button
                  key={range}
                  variant={filters.timeRange === range ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, timeRange: range as any }))}
                >
                  {range}
                </Button>
              ))}
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoScroll"
                checked={filters.autoScroll}
                onChange={(e) => setFilters(prev => ({ ...prev, autoScroll: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="autoScroll" className="text-sm">Auto-scroll</label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Live Activity Feed</span>
            <Badge variant="outline">{filteredEvents.length} events</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96" ref={scrollAreaRef}>
            <div className="space-y-4">
              {filteredEvents.map((event, index) => (
                <div key={event.id} className="relative">
                  {/* Timeline connector */}
                  {index < filteredEvents.length - 1 && (
                    <div className="absolute left-6 top-12 w-px h-8 bg-border" />
                  )}
                  
                  <div className="flex space-x-4">
                    {/* Event icon */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${getEventColor(event.type, event.severity, event.status)}`}>
                      {getEventIcon(event.type, event.status)}
                    </div>
                    
                    {/* Event content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-sm">{event.title}</h3>
                            {getStatusBadge(event.status)}
                            <Badge variant="outline" className="text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              {(event.confidence * 100).toFixed(0)}%
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {event.description}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatTimeAgo(event.timestamp)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{event.location}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Camera className="h-3 w-3" />
                              <span>{event.cameraId}</span>
                            </div>
                            {event.metadata?.personnel && (
                              <div className="flex items-center space-x-1">
                                <Users className="h-3 w-3" />
                                <span>{event.metadata.personnel} workers</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Additional metadata */}
                          {event.metadata && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {event.metadata.equipment?.map((eq) => (
                                <Badge key={eq} variant="secondary" className="text-xs">
                                  {eq}
                                </Badge>
                              ))}
                              {event.metadata.qualityScore && (
                                <Badge variant="outline" className="text-xs">
                                  Quality: {event.metadata.qualityScore}%
                                </Badge>
                              )}
                              {event.metadata.progress && (
                                <Badge variant="outline" className="text-xs">
                                  Progress: {event.metadata.progress}%
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right text-xs text-muted-foreground">
                          {event.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredEvents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No events match the current filters</p>
                  <p className="text-sm">Adjust your filters or wait for new activities</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
