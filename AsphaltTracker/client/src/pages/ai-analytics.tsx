// Enhanced AI Analytics Page for AsphaltTracker
// Combines all AI-powered features in a comprehensive dashboard

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AIAnalyticsDashboard } from '@/components/ai-analytics/AIAnalyticsDashboard';
import { VideoSearchInterface } from '@/components/video-search/VideoSearchInterface';
import { ActivityTimeline } from '@/components/activity-timeline/ActivityTimeline';
import { 
  Brain, 
  Search, 
  Activity, 
  Camera, 
  Shield, 
  TrendingUp, 
  Zap,
  Eye,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export default function AIAnalytics() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Brain className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AI-Powered Analytics</h1>
            <p className="text-muted-foreground">
              Advanced construction monitoring powered by NVIDIA VSS and AI models
            </p>
          </div>
        </div>
        
        {/* AI Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">NVIDIA VILA</span>
                <Badge variant="secondary" className="text-xs">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Vision Language Model</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Llama-3.1-70B</span>
                <Badge variant="secondary" className="text-xs">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Language Model</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Embedding Model</span>
                <Badge variant="secondary" className="text-xs">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Semantic Search</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">ASR Model</span>
                <Badge variant="secondary" className="text-xs">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Speech Recognition</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <span>Video Search</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Activity Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>AI Insights</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <AIAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <VideoSearchInterface />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <ActivityTimeline />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>AI Performance Metrics</span>
                </CardTitle>
                <CardDescription>
                  Real-time performance of AI models and processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Object Detection Accuracy</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }} />
                      </div>
                      <span className="text-sm">94%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Activity Recognition</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '89%' }} />
                      </div>
                      <span className="text-sm">89%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Safety Detection</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: '96%' }} />
                      </div>
                      <span className="text-sm">96%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Processing Speed</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '87%' }} />
                      </div>
                      <span className="text-sm">87%</span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">99.2%</div>
                      <div className="text-xs text-muted-foreground">Uptime</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">1.2s</div>
                      <div className="text-xs text-muted-foreground">Avg Response</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Insights Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>AI Insights Summary</span>
                </CardTitle>
                <CardDescription>
                  Key insights generated by AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Safety Compliance</span>
                    </div>
                    <p className="text-sm text-green-700">
                      PPE compliance rate increased by 12% this week. All workers properly equipped in active zones.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Productivity Trend</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Paving operations 15% faster than planned schedule. Quality metrics remain above target.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Equipment Alert</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      Road roller #3 showing signs of reduced efficiency. Maintenance recommended within 48 hours.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Eye className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">Quality Insight</span>
                    </div>
                    <p className="text-sm text-purple-700">
                      Section A shows optimal compaction patterns. Temperature control excellent throughout process.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Model Usage Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="h-5 w-5" />
                  <span>Model Usage Statistics</span>
                </CardTitle>
                <CardDescription>
                  Usage statistics for AI models over the last 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">NVIDIA VILA</div>
                      <div className="text-sm text-muted-foreground">Video Analysis</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">2,847</div>
                      <div className="text-sm text-muted-foreground">requests</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Llama-3.1-70B</div>
                      <div className="text-sm text-muted-foreground">Text Generation</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">1,523</div>
                      <div className="text-sm text-muted-foreground">requests</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Embedding Model</div>
                      <div className="text-sm text-muted-foreground">Search Queries</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">892</div>
                      <div className="text-sm text-muted-foreground">requests</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">ASR Model</div>
                      <div className="text-sm text-muted-foreground">Audio Processing</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">456</div>
                      <div className="text-sm text-muted-foreground">requests</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cost and Resource Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Resource Usage</span>
                </CardTitle>
                <CardDescription>
                  AI processing resource consumption and costs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">$127.50</div>
                      <div className="text-sm text-muted-foreground">Today's Cost</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">$3,420</div>
                      <div className="text-sm text-muted-foreground">Monthly Budget</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>GPU Usage</span>
                      <span>67%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '67%' }} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Memory Usage</span>
                      <span>54%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '54%' }} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Network I/O</span>
                      <span>23%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '23%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
