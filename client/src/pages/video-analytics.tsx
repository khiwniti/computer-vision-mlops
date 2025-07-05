import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Play, Search, FileVideo, Clock, AlertCircle, CheckCircle } from "lucide-react";

interface VideoAnalysis {
  id: string;
  filename: string;
  uploadTime: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  duration?: number;
  summary?: string;
  tags?: string[];
  progress?: number;
  thumbnail?: string;
}

export default function VideoAnalytics() {
  const [videos, setVideos] = useState<VideoAnalysis[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<VideoAnalysis | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFiles = (files: File[]) => {
    files.forEach(file => {
      if (file.type.startsWith('video/')) {
        const newVideo: VideoAnalysis = {
          id: Date.now().toString() + Math.random(),
          filename: file.name,
          uploadTime: new Date().toISOString(),
          status: 'uploading',
          progress: 0
        };
        
        setVideos(prev => [...prev, newVideo]);
        
        // Simulate upload and processing
        simulateVideoProcessing(newVideo.id);
      }
    });
  };

  const simulateVideoProcessing = (videoId: string) => {
    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setVideos(prev => prev.map(video => {
        if (video.id === videoId && video.status === 'uploading') {
          const newProgress = Math.min((video.progress || 0) + 10, 100);
          if (newProgress === 100) {
            clearInterval(uploadInterval);
            // Start processing
            setTimeout(() => {
              setVideos(prev => prev.map(v => 
                v.id === videoId ? { ...v, status: 'processing', progress: 0 } : v
              ));
              simulateProcessing(videoId);
            }, 500);
            return { ...video, progress: newProgress };
          }
          return { ...video, progress: newProgress };
        }
        return video;
      }));
    }, 200);
  };

  const simulateProcessing = (videoId: string) => {
    const processingInterval = setInterval(() => {
      setVideos(prev => prev.map(video => {
        if (video.id === videoId && video.status === 'processing') {
          const newProgress = Math.min((video.progress || 0) + 5, 100);
          if (newProgress === 100) {
            clearInterval(processingInterval);
            // Complete processing
            setTimeout(() => {
              setVideos(prev => prev.map(v => 
                v.id === videoId ? {
                  ...v,
                  status: 'completed',
                  duration: Math.floor(Math.random() * 300) + 60,
                  summary: `AI-generated summary for ${v.filename}: Construction site activity detected with equipment movement and worker presence. Safety protocols appear to be followed with proper PPE usage observed.`,
                  tags: ['construction', 'safety', 'equipment', 'workers', 'asphalt']
                } : v
              ));
            }, 500);
            return { ...video, progress: newProgress };
          }
          return { ...video, progress: newProgress };
        }
        return video;
      }));
    }, 300);
  };

  const getStatusIcon = (status: VideoAnalysis['status']) => {
    switch (status) {
      case 'uploading':
        return <Upload className="h-4 w-4 text-blue-500" />;
      case 'processing':
        return <Play className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: VideoAnalysis['status']) => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
    }
  };

  const filteredVideos = videos.filter(video =>
    video.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Video Analytics</h1>
        <Badge variant="secondary" className="text-sm">
          AI-Powered Video Analysis
        </Badge>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload & Process</TabsTrigger>
          <TabsTrigger value="library">Video Library</TabsTrigger>
          <TabsTrigger value="search">Search & Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileVideo className="h-5 w-5" />
                Upload Videos for Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg mb-2">Drag and drop videos here</p>
                <p className="text-sm text-gray-500 mb-4">or click to select files</p>
                <Input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={(e) => handleFiles(Array.from(e.target.files || []))}
                  className="hidden"
                  id="video-upload"
                />
                <Button
                  onClick={() => document.getElementById('video-upload')?.click()}
                  variant="outline"
                >
                  Select Videos
                </Button>
              </div>
            </CardContent>
          </Card>

          {videos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Processing Queue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {videos.slice(-3).map((video) => (
                    <div key={video.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        {getStatusIcon(video.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{video.filename}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(video.uploadTime).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(video.status)}>
                          {video.status}
                        </Badge>
                        {(video.status === 'uploading' || video.status === 'processing') && (
                          <div className="w-24">
                            <Progress value={video.progress || 0} className="h-2" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Video Library ({videos.filter(v => v.status === 'completed').length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.filter(v => v.status === 'completed').map((video) => (
                  <Card key={video.id} className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedVideo(video)}>
                    <CardContent className="p-4">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <FileVideo className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="font-medium truncate mb-2">{video.filename}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Clock className="h-3 w-3" />
                        {Math.floor((video.duration || 0) / 60)}:{String((video.duration || 0) % 60).padStart(2, '0')}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {video.tags?.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedVideo && (
            <Card>
              <CardHeader>
                <CardTitle>Video Analysis: {selectedVideo.filename}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileVideo className="h-16 w-16 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">AI Summary</h3>
                    <p className="text-sm text-gray-600">{selectedVideo.summary}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedVideo.tags?.map(tag => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Videos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Search by filename, tags, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredVideos.filter(v => v.status === 'completed').map((video) => (
                    <div key={video.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50">
                      <FileVideo className="h-8 w-8 text-gray-400" />
                      <div className="flex-1">
                        <h3 className="font-medium">{video.filename}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{video.summary}</p>
                        <div className="flex gap-1 mt-1">
                          {video.tags?.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {Math.floor((video.duration || 0) / 60)}:{String((video.duration || 0) % 60).padStart(2, '0')}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}