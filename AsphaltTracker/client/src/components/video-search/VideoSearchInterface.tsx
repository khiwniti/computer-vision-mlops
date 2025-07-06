// Video Search Interface with NVIDIA VSS Integration
// Semantic video search powered by AI embeddings and natural language queries

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Clock, 
  Play, 
  Download, 
  Share, 
  Tag,
  Zap,
  Eye,
  AlertTriangle
} from 'lucide-react';

interface VideoResult {
  id: string;
  filename: string;
  thumbnail: string;
  duration: number;
  timestamp: Date;
  cameraId: string;
  location: string;
  summary: string;
  tags: string[];
  confidence: number;
  activities: string[];
  safetyEvents: string[];
  progressMetrics: {
    completionPercentage: number;
    qualityScore: number;
  };
}

interface SearchFilters {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  cameras: string[];
  activities: string[];
  safetyEvents: string[];
  confidenceThreshold: number;
  sortBy: 'relevance' | 'date' | 'duration' | 'quality';
}

export const VideoSearchInterface: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VideoResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    dateRange: { start: null, end: null },
    cameras: [],
    activities: [],
    safetyEvents: [],
    confidenceThreshold: 0.7,
    sortBy: 'relevance'
  });
  const [selectedVideo, setSelectedVideo] = useState<VideoResult | null>(null);

  // Mock data for demonstration
  const mockResults: VideoResult[] = [
    {
      id: '1',
      filename: 'paving_operation_morning.mp4',
      thumbnail: '/api/thumbnails/1.jpg',
      duration: 1800, // 30 minutes
      timestamp: new Date('2024-01-15T09:30:00'),
      cameraId: 'CAM-001',
      location: 'Section A - Main Road',
      summary: 'Asphalt paving operation with road roller compaction. Workers wearing proper PPE. Quality inspection performed.',
      tags: ['paving', 'road_roller', 'quality_inspection', 'ppe_compliant'],
      confidence: 0.92,
      activities: ['paving', 'rolling', 'quality_inspection'],
      safetyEvents: [],
      progressMetrics: {
        completionPercentage: 25.5,
        qualityScore: 94
      }
    },
    {
      id: '2',
      filename: 'safety_violation_detected.mp4',
      thumbnail: '/api/thumbnails/2.jpg',
      duration: 300, // 5 minutes
      timestamp: new Date('2024-01-15T14:15:00'),
      cameraId: 'CAM-003',
      location: 'Section B - Work Zone',
      summary: 'Safety violation detected: Worker without hard hat near operating equipment. Immediate intervention required.',
      tags: ['safety_violation', 'ppe_missing', 'equipment_operation'],
      confidence: 0.88,
      activities: ['equipment_operation'],
      safetyEvents: ['ppe_violation', 'proximity_alert'],
      progressMetrics: {
        completionPercentage: 45.2,
        qualityScore: 78
      }
    },
    {
      id: '3',
      filename: 'material_delivery_sequence.mp4',
      thumbnail: '/api/thumbnails/3.jpg',
      duration: 900, // 15 minutes
      timestamp: new Date('2024-01-15T11:00:00'),
      cameraId: 'CAM-002',
      location: 'Material Storage Area',
      summary: 'Dump truck material delivery and unloading sequence. Proper coordination between truck driver and ground crew.',
      tags: ['material_delivery', 'dump_truck', 'coordination'],
      confidence: 0.85,
      activities: ['material_delivery', 'equipment_setup'],
      safetyEvents: [],
      progressMetrics: {
        completionPercentage: 35.8,
        qualityScore: 91
      }
    }
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Simulate API call to NVIDIA VSS search endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Filter mock results based on search query
      const filteredResults = mockResults.filter(result => 
        result.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        result.activities.some(activity => activity.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getSafetyBadgeColor = (events: string[]) => {
    if (events.length === 0) return 'default';
    if (events.some(e => e.includes('violation'))) return 'destructive';
    return 'secondary';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">AI Video Search</h1>
        <p className="text-muted-foreground">Search construction videos using natural language powered by NVIDIA VSS</p>
      </div>

      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Semantic Video Search</span>
          </CardTitle>
          <CardDescription>
            Search for specific activities, safety events, or equipment using natural language
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="e.g., 'workers without hard hats', 'asphalt paving operations', 'safety violations'"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Searching...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                </div>
              )}
            </Button>
          </div>

          {/* Quick Search Suggestions */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Quick searches:</span>
            {[
              'safety violations',
              'paving operations',
              'equipment maintenance',
              'quality inspections',
              'material delivery'
            ].map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery(suggestion);
                  handleSearch();
                }}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date Range */}
            <div>
              <label className="text-sm font-medium">Date Range</label>
              <div className="space-y-2 mt-2">
                <Input type="date" placeholder="Start date" />
                <Input type="date" placeholder="End date" />
              </div>
            </div>

            {/* Camera Selection */}
            <div>
              <label className="text-sm font-medium">Cameras</label>
              <Select>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select cameras" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cameras</SelectItem>
                  <SelectItem value="cam-001">CAM-001 (Section A)</SelectItem>
                  <SelectItem value="cam-002">CAM-002 (Material Area)</SelectItem>
                  <SelectItem value="cam-003">CAM-003 (Section B)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Activity Types */}
            <div>
              <label className="text-sm font-medium">Activities</label>
              <Select>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select activities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="paving">Paving</SelectItem>
                  <SelectItem value="rolling">Rolling</SelectItem>
                  <SelectItem value="delivery">Material Delivery</SelectItem>
                  <SelectItem value="inspection">Quality Inspection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Confidence Threshold */}
            <div>
              <label className="text-sm font-medium">
                Confidence Threshold: {(filters.confidenceThreshold * 100).toFixed(0)}%
              </label>
              <Slider
                value={[filters.confidenceThreshold]}
                onValueChange={(value) => setFilters(prev => ({ ...prev, confidenceThreshold: value[0] }))}
                max={1}
                min={0.5}
                step={0.05}
                className="mt-2"
              />
            </div>

            {/* Sort Options */}
            <div>
              <label className="text-sm font-medium">Sort By</label>
              <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value as any }))}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                  <SelectItem value="quality">Quality Score</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        <div className="lg:col-span-3 space-y-4">
          {searchResults.length > 0 && (
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Search Results ({searchResults.length})
              </h2>
              <div className="text-sm text-muted-foreground">
                Powered by NVIDIA VSS
              </div>
            </div>
          )}

          {searchResults.map((result) => (
            <Card key={result.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex space-x-4">
                  {/* Video Thumbnail */}
                  <div className="relative w-32 h-20 bg-gray-200 rounded-lg flex-shrink-0">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="h-8 w-8 text-gray-500" />
                    </div>
                    <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                      {formatDuration(result.duration)}
                    </div>
                  </div>

                  {/* Video Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-lg">{result.filename}</h3>
                      <div className="flex items-center space-x-1">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">{(result.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {result.summary}
                    </p>

                    {/* Metadata */}
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{result.timestamp.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{result.timestamp.toLocaleTimeString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{result.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span>{result.cameraId}</span>
                      </div>
                    </div>

                    {/* Tags and Badges */}
                    <div className="flex flex-wrap gap-2">
                      {result.activities.map((activity) => (
                        <Badge key={activity} variant="secondary">
                          {activity.replace('_', ' ')}
                        </Badge>
                      ))}
                      {result.safetyEvents.length > 0 && (
                        <Badge variant={getSafetyBadgeColor(result.safetyEvents) as any}>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {result.safetyEvents.length} Safety Event{result.safetyEvents.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                      <Badge variant="outline">
                        Quality: {result.progressMetrics.qualityScore}%
                      </Badge>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-2">
                      <Button size="sm" variant="default">
                        <Play className="h-3 w-3 mr-1" />
                        Play
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share className="h-3 w-3 mr-1" />
                        Share
                      </Button>
                      <Button size="sm" variant="outline">
                        <Tag className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {searchResults.length === 0 && searchQuery && !isSearching && (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search query or filters to find relevant videos.
                </p>
              </CardContent>
            </Card>
          )}

          {!searchQuery && (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Start Your Search</h3>
                <p className="text-muted-foreground">
                  Enter a search query to find construction videos using AI-powered semantic search.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
