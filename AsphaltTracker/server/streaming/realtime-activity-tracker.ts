// Real-time Activity Tracking Service for AsphaltTracker
// Monitors live camera feeds and tracks construction activities in real-time

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { EnhancedVideoProcessor } from '../vss-integration/video-processor.js';
import { vssConfig } from '../vss-integration/vss-config.js';

interface CameraStream {
  id: string;
  url: string;
  status: 'active' | 'inactive' | 'error';
  lastFrame?: Buffer;
  lastActivity?: Date;
  location: {
    x: number;
    y: number;
    area: string;
  };
}

interface ActivityEvent {
  id: string;
  type: 'equipment_detected' | 'worker_detected' | 'safety_violation' | 'progress_update' | 'quality_issue';
  timestamp: Date;
  cameraId: string;
  confidence: number;
  data: any;
  location: {
    x: number;
    y: number;
  };
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface SafetyAlert {
  id: string;
  type: 'ppe_violation' | 'proximity_alert' | 'restricted_area' | 'equipment_hazard';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  cameraId: string;
  timestamp: Date;
  location: {
    x: number;
    y: number;
  };
  involvedPersonnel: string[];
  involvedEquipment: string[];
  immediateAction: string;
}

export class RealTimeActivityTracker extends EventEmitter {
  private streams: Map<string, CameraStream> = new Map();
  private frameBuffer: Map<string, Buffer[]> = new Map();
  private activityHistory: Map<string, ActivityEvent[]> = new Map();
  private safetyAlerts: SafetyAlert[] = [];
  private videoProcessor: EnhancedVideoProcessor;
  private wsServer: WebSocket.Server;
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(port: number = 5001) {
    super();
    this.videoProcessor = new EnhancedVideoProcessor();
    this.initializeWebSocketServer(port);
    this.startRealTimeProcessing();
  }

  /**
   * Initialize WebSocket server for real-time communication
   */
  private initializeWebSocketServer(port: number): void {
    this.wsServer = new WebSocket.Server({ port });
    
    this.wsServer.on('connection', (ws: WebSocket) => {
      console.log('✅ Client connected to real-time activity tracker');
      
      // Send current status to new client
      ws.send(JSON.stringify({
        type: 'status',
        data: {
          activeStreams: this.streams.size,
          recentActivities: this.getRecentActivities(10),
          activeSafetyAlerts: this.safetyAlerts.filter(alert => 
            Date.now() - alert.timestamp.getTime() < 300000 // Last 5 minutes
          )
        }
      }));

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          this.handleWebSocketMessage(ws, data);
        } catch (error) {
          console.error('❌ Invalid WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log('📡 Client disconnected from real-time activity tracker');
      });
    });

    console.log(`🚀 Real-time activity tracker WebSocket server started on port ${port}`);
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(ws: WebSocket, data: any): void {
    switch (data.type) {
      case 'subscribe_camera':
        this.subscribeToCameraUpdates(ws, data.cameraId);
        break;
      case 'unsubscribe_camera':
        this.unsubscribeFromCameraUpdates(ws, data.cameraId);
        break;
      case 'get_camera_status':
        this.sendCameraStatus(ws, data.cameraId);
        break;
      case 'acknowledge_alert':
        this.acknowledgeAlert(data.alertId, data.userId);
        break;
      default:
        console.warn('⚠️ Unknown WebSocket message type:', data.type);
    }
  }

  /**
   * Add a camera stream for monitoring
   */
  public addCameraStream(cameraId: string, streamUrl: string, location: { x: number; y: number; area: string }): void {
    const stream: CameraStream = {
      id: cameraId,
      url: streamUrl,
      status: 'active',
      location,
      lastActivity: new Date()
    };

    this.streams.set(cameraId, stream);
    this.frameBuffer.set(cameraId, []);
    this.activityHistory.set(cameraId, []);

    console.log(`📹 Added camera stream: ${cameraId} at ${location.area}`);
    this.broadcastToClients({
      type: 'camera_added',
      data: { cameraId, location }
    });
  }

  /**
   * Remove a camera stream
   */
  public removeCameraStream(cameraId: string): void {
    this.streams.delete(cameraId);
    this.frameBuffer.delete(cameraId);
    this.activityHistory.delete(cameraId);

    console.log(`📹 Removed camera stream: ${cameraId}`);
    this.broadcastToClients({
      type: 'camera_removed',
      data: { cameraId }
    });
  }

  /**
   * Process incoming frame from camera
   */
  public processFrame(cameraId: string, frameBuffer: Buffer): void {
    const stream = this.streams.get(cameraId);
    if (!stream) {
      console.warn(`⚠️ Unknown camera stream: ${cameraId}`);
      return;
    }

    // Update stream status
    stream.lastFrame = frameBuffer;
    stream.lastActivity = new Date();
    stream.status = 'active';

    // Add frame to buffer
    const buffer = this.frameBuffer.get(cameraId) || [];
    buffer.push(frameBuffer);

    // Keep only recent frames (last 30 seconds at 30fps = 900 frames)
    if (buffer.length > 900) {
      buffer.shift();
    }

    this.frameBuffer.set(cameraId, buffer);
  }

  /**
   * Start real-time processing loop
   */
  private startRealTimeProcessing(): void {
    const processingInterval = vssConfig.processing.realtime.processingDelay || 1000;
    
    this.processingInterval = setInterval(async () => {
      if (this.isProcessing) return;
      
      this.isProcessing = true;
      try {
        await this.processAllStreams();
      } catch (error) {
        console.error('❌ Real-time processing error:', error);
      } finally {
        this.isProcessing = false;
      }
    }, processingInterval);

    console.log(`🔄 Started real-time processing with ${processingInterval}ms interval`);
  }

  /**
   * Process all active camera streams
   */
  private async processAllStreams(): Promise<void> {
    const activeStreams = Array.from(this.streams.values()).filter(stream => 
      stream.status === 'active' && 
      Date.now() - (stream.lastActivity?.getTime() || 0) < 10000 // Active in last 10 seconds
    );

    for (const stream of activeStreams) {
      await this.processStreamActivity(stream);
    }
  }

  /**
   * Process activity for a single stream
   */
  private async processStreamActivity(stream: CameraStream): Promise<void> {
    const frameBuffer = this.frameBuffer.get(stream.id) || [];
    if (frameBuffer.length === 0) return;

    try {
      // Get recent frames for analysis
      const batchSize = vssConfig.processing.realtime.batchSize || 5;
      const recentFrames = frameBuffer.slice(-batchSize);

      // Perform real-time object detection
      const detections = await this.detectObjectsInFrames(stream.id, recentFrames);
      
      // Analyze activities
      const activities = await this.analyzeActivities(stream.id, detections);
      
      // Check for safety violations
      const safetyIssues = await this.checkSafetyCompliance(stream.id, detections, activities);
      
      // Update progress metrics
      const progressUpdate = await this.updateProgressMetrics(stream.id, activities);

      // Generate events
      this.generateActivityEvents(stream.id, activities, detections, safetyIssues, progressUpdate);

    } catch (error) {
      console.error(`❌ Stream processing error for ${stream.id}:`, error);
      stream.status = 'error';
    }
  }

  /**
   * Detect objects in frame batch
   */
  private async detectObjectsInFrames(cameraId: string, frames: Buffer[]): Promise<any[]> {
    // Simulate object detection (in production, use actual AI model)
    const detections = [];
    const categories = vssConfig.processing.analysis.objectDetection.categories;
    
    for (let i = 0; i < frames.length; i++) {
      const frameDetections = [];
      const numObjects = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < numObjects; j++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const confidence = 0.7 + Math.random() * 0.3;
        
        frameDetections.push({
          id: `${cameraId}_${Date.now()}_${j}`,
          category,
          confidence,
          bbox: {
            x: Math.random() * 0.8,
            y: Math.random() * 0.8,
            width: 0.1 + Math.random() * 0.2,
            height: 0.1 + Math.random() * 0.2
          },
          timestamp: Date.now()
        });
      }
      
      detections.push(...frameDetections);
    }
    
    return detections;
  }

  /**
   * Analyze activities from detections
   */
  private async analyzeActivities(cameraId: string, detections: any[]): Promise<any[]> {
    const activities = [];
    
    // Group detections by type and analyze patterns
    const equipmentDetections = detections.filter(d => 
      ['asphalt_paver', 'road_roller', 'dump_truck', 'excavator'].includes(d.category)
    );
    
    const workerDetections = detections.filter(d => d.category === 'construction_worker');
    
    // Determine activities based on equipment and worker presence
    if (equipmentDetections.length > 0 && workerDetections.length > 0) {
      activities.push({
        id: `activity_${cameraId}_${Date.now()}`,
        type: 'construction_operation',
        confidence: 0.8,
        equipment: equipmentDetections.map(d => d.category),
        workers: workerDetections.length,
        timestamp: Date.now()
      });
    }
    
    return activities;
  }

  /**
   * Check safety compliance
   */
  private async checkSafetyCompliance(cameraId: string, detections: any[], activities: any[]): Promise<SafetyAlert[]> {
    const alerts: SafetyAlert[] = [];
    
    // Check PPE compliance
    const workers = detections.filter(d => d.category === 'construction_worker');
    const safetyVests = detections.filter(d => d.category === 'safety_vest');
    const hardHats = detections.filter(d => d.category === 'hard_hat');
    
    if (workers.length > 0) {
      const ppeCompliance = Math.min(safetyVests.length, hardHats.length) / workers.length;
      
      if (ppeCompliance < vssConfig.processing.analysis.safetyCompliance.alertThresholds.ppeCompliance) {
        alerts.push({
          id: `alert_${cameraId}_${Date.now()}`,
          type: 'ppe_violation',
          severity: 'high',
          description: `PPE compliance below threshold: ${(ppeCompliance * 100).toFixed(1)}%`,
          cameraId,
          timestamp: new Date(),
          location: { x: 0.5, y: 0.5 }, // Center of frame
          involvedPersonnel: workers.map(w => w.id),
          involvedEquipment: [],
          immediateAction: 'Ensure all workers wear required PPE'
        });
      }
    }
    
    return alerts;
  }

  /**
   * Update progress metrics
   */
  private async updateProgressMetrics(cameraId: string, activities: any[]): Promise<any> {
    // Calculate progress based on activities
    const constructionActivities = activities.filter(a => a.type === 'construction_operation');
    
    return {
      cameraId,
      timestamp: Date.now(),
      activeOperations: constructionActivities.length,
      productivity: constructionActivities.length > 0 ? 0.8 : 0.2,
      efficiency: Math.random() * 0.3 + 0.7 // Simulate efficiency
    };
  }

  /**
   * Generate and emit activity events
   */
  private generateActivityEvents(
    cameraId: string, 
    activities: any[], 
    detections: any[], 
    safetyIssues: SafetyAlert[], 
    progressUpdate: any
  ): void {
    // Generate activity events
    activities.forEach(activity => {
      const event: ActivityEvent = {
        id: activity.id,
        type: 'equipment_detected',
        timestamp: new Date(),
        cameraId,
        confidence: activity.confidence,
        data: activity,
        location: { x: 0.5, y: 0.5 }
      };
      
      this.addActivityEvent(cameraId, event);
    });

    // Handle safety alerts
    safetyIssues.forEach(alert => {
      this.safetyAlerts.push(alert);
      this.broadcastToClients({
        type: 'safety_alert',
        data: alert
      });
    });

    // Broadcast progress update
    this.broadcastToClients({
      type: 'progress_update',
      data: progressUpdate
    });
  }

  /**
   * Add activity event to history
   */
  private addActivityEvent(cameraId: string, event: ActivityEvent): void {
    const history = this.activityHistory.get(cameraId) || [];
    history.push(event);
    
    // Keep only recent events (last 1000)
    if (history.length > 1000) {
      history.shift();
    }
    
    this.activityHistory.set(cameraId, history);
    
    // Broadcast to clients
    this.broadcastToClients({
      type: 'activity_event',
      data: event
    });
  }

  /**
   * Get recent activities across all cameras
   */
  private getRecentActivities(limit: number = 50): ActivityEvent[] {
    const allActivities: ActivityEvent[] = [];
    
    this.activityHistory.forEach(history => {
      allActivities.push(...history);
    });
    
    return allActivities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Broadcast message to all connected clients
   */
  private broadcastToClients(message: any): void {
    const messageStr = JSON.stringify(message);
    
    this.wsServer.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  /**
   * Subscribe client to camera updates
   */
  private subscribeToCameraUpdates(ws: WebSocket, cameraId: string): void {
    // Add camera subscription logic
    ws.send(JSON.stringify({
      type: 'subscribed',
      data: { cameraId }
    }));
  }

  /**
   * Unsubscribe client from camera updates
   */
  private unsubscribeFromCameraUpdates(ws: WebSocket, cameraId: string): void {
    // Add camera unsubscription logic
    ws.send(JSON.stringify({
      type: 'unsubscribed',
      data: { cameraId }
    }));
  }

  /**
   * Send camera status to client
   */
  private sendCameraStatus(ws: WebSocket, cameraId: string): void {
    const stream = this.streams.get(cameraId);
    const recentActivities = this.activityHistory.get(cameraId) || [];
    
    ws.send(JSON.stringify({
      type: 'camera_status',
      data: {
        cameraId,
        status: stream?.status || 'unknown',
        lastActivity: stream?.lastActivity,
        recentActivities: recentActivities.slice(-10),
        location: stream?.location
      }
    }));
  }

  /**
   * Acknowledge a safety alert
   */
  private acknowledgeAlert(alertId: string, userId: string): void {
    const alertIndex = this.safetyAlerts.findIndex(alert => alert.id === alertId);
    if (alertIndex !== -1) {
      this.safetyAlerts.splice(alertIndex, 1);
      
      this.broadcastToClients({
        type: 'alert_acknowledged',
        data: { alertId, acknowledgedBy: userId, timestamp: new Date() }
      });
    }
  }

  /**
   * Get system status
   */
  public getStatus(): any {
    return {
      activeStreams: this.streams.size,
      totalActivities: Array.from(this.activityHistory.values()).reduce((sum, history) => sum + history.length, 0),
      activeSafetyAlerts: this.safetyAlerts.length,
      connectedClients: this.wsServer.clients.size,
      isProcessing: this.isProcessing,
      uptime: process.uptime()
    };
  }

  /**
   * Stop the real-time tracker
   */
  public stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    this.wsServer.close();
    console.log('🛑 Real-time activity tracker stopped');
  }
}
