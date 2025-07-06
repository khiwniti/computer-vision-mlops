// Vendor Manager for Multi-Vendor CCTV Integration
// Manages multiple vendor adapters and provides unified access to all cameras

import { VendorAdapter, CameraStream, CameraEvent, createVendorAdapter, VendorAuthConfig, VendorEndpoints } from './vendor-adapter.js';
import { storage } from '../storage.js';
import type { Vendor, Camera, InsertApiLog, InsertSystemHealth } from '@shared/schema';

export interface VendorManagerConfig {
  healthCheckInterval: number; // milliseconds
  reconnectAttempts: number;
  reconnectDelay: number; // milliseconds
  eventBufferSize: number;
  maxConcurrentConnections: number;
}

export interface VendorConnection {
  vendor: Vendor;
  adapter: VendorAdapter;
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  lastHealthCheck: Date;
  consecutiveFailures: number;
  cameras: CameraStream[];
  lastError?: string;
}

export interface CameraMonitoringData {
  camera: Camera;
  stream?: CameraStream;
  vendor: Vendor;
  status: 'online' | 'offline' | 'error';
  lastFrame?: Date;
  metadata?: Record<string, any>;
}

export class VendorManager {
  private connections = new Map<number, VendorConnection>();
  private config: VendorManagerConfig;
  private healthCheckTimer?: NodeJS.Timeout;
  private eventBuffer: CameraEvent[] = [];
  private eventCallbacks: ((event: CameraEvent) => void)[] = [];

  constructor(config: Partial<VendorManagerConfig> = {}) {
    this.config = {
      healthCheckInterval: 30000, // 30 seconds
      reconnectAttempts: 3,
      reconnectDelay: 5000, // 5 seconds
      eventBufferSize: 1000,
      maxConcurrentConnections: 10,
      ...config
    };
  }

  /**
   * Initialize vendor manager and connect to all active vendors
   */
  async initialize(): Promise<void> {
    try {
      const vendors = await storage.getAllVendors();
      const activeVendors = vendors.filter(v => v.status === 'active');

      console.log(`Initializing VendorManager with ${activeVendors.length} active vendors`);

      // Connect to all active vendors
      await Promise.all(
        activeVendors.map(vendor => this.connectVendor(vendor))
      );

      // Start health check timer
      this.startHealthCheckTimer();

      console.log('VendorManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize VendorManager:', error);
      throw error;
    }
  }

  /**
   * Connect to a specific vendor
   */
  async connectVendor(vendor: Vendor): Promise<boolean> {
    try {
      console.log(`Connecting to vendor: ${vendor.name} (${vendor.apiType})`);

      // Create vendor adapter
      const authConfig: VendorAuthConfig = {
        ...vendor.authConfig as any,
        apiKey: vendor.apiKey || undefined
      };

      const endpoints: VendorEndpoints = vendor.endpoints as any;

      const adapter = createVendorAdapter(vendor.apiType, authConfig, endpoints);

      // Subscribe to events
      adapter.subscribeToEvents((event) => {
        this.handleVendorEvent(vendor.id, event);
      });

      // Authenticate and connect
      await adapter.authenticate(authConfig);
      await adapter.connect();

      // Get cameras
      const cameras = await adapter.getCameras();

      // Store connection
      const connection: VendorConnection = {
        vendor,
        adapter,
        status: 'connected',
        lastHealthCheck: new Date(),
        consecutiveFailures: 0,
        cameras
      };

      this.connections.set(vendor.id, connection);

      // Update vendor status in database
      await storage.updateVendor(vendor.id, {
        connectionStatus: 'connected',
        lastHealthCheck: new Date()
      });

      // Log successful connection
      await this.logApiCall(vendor.id, 'connect', 200, 0);

      console.log(`Successfully connected to ${vendor.name}. Found ${cameras.length} cameras.`);
      return true;

    } catch (error) {
      console.error(`Failed to connect to vendor ${vendor.name}:`, error);

      // Store failed connection
      const connection: VendorConnection = {
        vendor,
        adapter: null as any,
        status: 'error',
        lastHealthCheck: new Date(),
        consecutiveFailures: 1,
        cameras: [],
        lastError: error.message
      };

      this.connections.set(vendor.id, connection);

      // Update vendor status in database
      await storage.updateVendor(vendor.id, {
        connectionStatus: 'error',
        lastHealthCheck: new Date()
      });

      // Log failed connection
      await this.logApiCall(vendor.id, 'connect', 500, 0, error.message);

      return false;
    }
  }

  /**
   * Disconnect from a specific vendor
   */
  async disconnectVendor(vendorId: number): Promise<void> {
    const connection = this.connections.get(vendorId);
    if (!connection) return;

    try {
      if (connection.adapter) {
        await connection.adapter.disconnect();
        await connection.adapter.unsubscribeFromEvents();
      }

      connection.status = 'disconnected';
      
      // Update vendor status in database
      await storage.updateVendor(vendorId, {
        connectionStatus: 'disconnected'
      });

      console.log(`Disconnected from vendor: ${connection.vendor.name}`);
    } catch (error) {
      console.error(`Error disconnecting from vendor ${connection.vendor.name}:`, error);
    }
  }

  /**
   * Disconnect from all vendors
   */
  async disconnectAll(): Promise<void> {
    console.log('Disconnecting from all vendors...');

    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    await Promise.all(
      Array.from(this.connections.keys()).map(vendorId => 
        this.disconnectVendor(vendorId)
      )
    );

    this.connections.clear();
    console.log('Disconnected from all vendors');
  }

  /**
   * Get all cameras from all connected vendors
   */
  async getAllCameras(): Promise<CameraMonitoringData[]> {
    const allCameras: CameraMonitoringData[] = [];

    for (const connection of this.connections.values()) {
      if (connection.status !== 'connected' || !connection.adapter) continue;

      try {
        const streams = await connection.adapter.getCameras();
        
        for (const stream of streams) {
          // Get camera from database
          const cameras = await storage.getCamerasByTruck(parseInt(stream.truckId));
          const camera = cameras.find(c => c.vendorCameraId === stream.id);
          
          if (camera) {
            allCameras.push({
              camera,
              stream,
              vendor: connection.vendor,
              status: stream.status as any,
              lastFrame: stream.lastFrame,
              metadata: { frameRate: stream.frameRate, resolution: stream.resolution }
            });
          }
        }
      } catch (error) {
        console.error(`Failed to get cameras from ${connection.vendor.name}:`, error);
        await this.logApiCall(connection.vendor.id, 'getCameras', 500, 0, error.message);
      }
    }

    return allCameras;
  }

  /**
   * Get cameras for a specific truck
   */
  async getTruckCameras(truckId: number): Promise<CameraMonitoringData[]> {
    const allCameras = await this.getAllCameras();
    return allCameras.filter(camera => camera.camera.truckId === truckId);
  }

  /**
   * Get stream URL for a specific camera
   */
  async getCameraStreamUrl(cameraId: number, quality: 'high' | 'medium' | 'low' = 'high'): Promise<string | null> {
    try {
      const camera = await storage.getCamera(cameraId);
      if (!camera) return null;

      const connection = this.connections.get(camera.vendorId);
      if (!connection || connection.status !== 'connected' || !connection.adapter) {
        return null;
      }

      const streamUrl = await connection.adapter.getStreamUrl(camera.vendorCameraId || camera.id.toString(), quality);
      
      // Log successful request
      await this.logApiCall(camera.vendorId, 'getStreamUrl', 200, 50);
      
      return streamUrl;
    } catch (error) {
      console.error(`Failed to get stream URL for camera ${cameraId}:`, error);
      return null;
    }
  }

  /**
   * Check health of all vendor connections
   */
  async checkAllVendorsHealth(): Promise<void> {
    const healthChecks = Array.from(this.connections.entries()).map(
      ([vendorId, connection]) => this.checkVendorHealth(vendorId, connection)
    );

    await Promise.all(healthChecks);
  }

  /**
   * Check health of a specific vendor connection
   */
  private async checkVendorHealth(vendorId: number, connection: VendorConnection): Promise<void> {
    try {
      if (!connection.adapter) return;

      const isHealthy = await connection.adapter.healthCheck();
      const now = new Date();

      if (isHealthy) {
        connection.status = 'connected';
        connection.consecutiveFailures = 0;
        connection.lastHealthCheck = now;

        // Update database
        await storage.updateVendor(vendorId, {
          connectionStatus: 'connected',
          lastHealthCheck: now
        });

        // Log health metric
        await this.logSystemHealth('vendor_connection', 'healthy', vendorId.toString(), 1);

      } else {
        connection.consecutiveFailures++;
        connection.lastError = connection.adapter.getLastError() || 'Health check failed';
        
        if (connection.consecutiveFailures >= this.config.reconnectAttempts) {
          connection.status = 'error';
          
          // Update database
          await storage.updateVendor(vendorId, {
            connectionStatus: 'error',
            lastHealthCheck: now
          });

          // Log health metric
          await this.logSystemHealth('vendor_connection', 'critical', vendorId.toString(), 0);

          console.error(`Vendor ${connection.vendor.name} marked as error after ${connection.consecutiveFailures} failed health checks`);
        } else {
          // Log health metric
          await this.logSystemHealth('vendor_connection', 'warning', vendorId.toString(), 0.5);
        }
      }

      // Log API call
      await this.logApiCall(vendorId, 'healthCheck', isHealthy ? 200 : 500, 20);

    } catch (error) {
      console.error(`Health check failed for vendor ${connection.vendor.name}:`, error);
      connection.consecutiveFailures++;
      connection.lastError = error.message;

      // Log failed health check
      await this.logApiCall(vendorId, 'healthCheck', 500, 20, error.message);
      await this.logSystemHealth('vendor_connection', 'critical', vendorId.toString(), 0);
    }
  }

  /**
   * Handle events from vendor adapters
   */
  private handleVendorEvent(vendorId: number, event: CameraEvent): void {
    // Add vendor information to event
    const enrichedEvent = {
      ...event,
      vendorId,
      receivedAt: new Date()
    };

    // Add to event buffer
    this.eventBuffer.push(enrichedEvent);
    if (this.eventBuffer.length > this.config.eventBufferSize) {
      this.eventBuffer.shift();
    }

    // Emit to callbacks
    this.eventCallbacks.forEach(callback => {
      try {
        callback(enrichedEvent);
      } catch (error) {
        console.error('Error in vendor event callback:', error);
      }
    });

    // Handle specific event types
    this.processVendorEvent(vendorId, enrichedEvent);
  }

  /**
   * Process vendor events and take appropriate actions
   */
  private async processVendorEvent(vendorId: number, event: CameraEvent): Promise<void> {
    try {
      switch (event.eventType) {
        case 'camera_offline':
          // Update camera status in database
          const camera = await storage.getCameraByVendorId(vendorId, event.cameraId);
          if (camera) {
            await storage.updateCamera(camera.id, { status: 'offline', lastUpdate: new Date() });
          }
          break;

        case 'motion_detected':
          // Could trigger AI analysis or recording
          console.log(`Motion detected on camera ${event.cameraId}`);
          break;

        case 'recording_started':
        case 'recording_stopped':
          // Update recording status
          console.log(`Recording ${event.eventType} on camera ${event.cameraId}`);
          break;
      }
    } catch (error) {
      console.error('Error processing vendor event:', error);
    }
  }

  /**
   * Subscribe to vendor events
   */
  subscribeToEvents(callback: (event: CameraEvent) => void): void {
    this.eventCallbacks.push(callback);
  }

  /**
   * Get vendor connection status
   */
  getVendorStatus(vendorId: number): VendorConnection | null {
    return this.connections.get(vendorId) || null;
  }

  /**
   * Get all vendor statuses
   */
  getAllVendorStatuses(): VendorConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Start health check timer
   */
  private startHealthCheckTimer(): void {
    this.healthCheckTimer = setInterval(() => {
      this.checkAllVendorsHealth().catch(error => {
        console.error('Error in scheduled health check:', error);
      });
    }, this.config.healthCheckInterval);
  }

  /**
   * Log API call to database
   */
  private async logApiCall(
    vendorId: number,
    endpoint: string,
    statusCode: number,
    responseTime: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      const logData: InsertApiLog = {
        vendorId,
        endpoint,
        method: 'GET',
        statusCode,
        responseTime,
        successful: statusCode >= 200 && statusCode < 300,
        errorMessage
      };

      await storage.createApiLog(logData);
    } catch (error) {
      console.error('Failed to log API call:', error);
    }
  }

  /**
   * Log system health metric
   */
  private async logSystemHealth(
    component: string,
    status: 'healthy' | 'warning' | 'critical',
    metric: string,
    value: number
  ): Promise<void> {
    try {
      const healthData: InsertSystemHealth = {
        component,
        status,
        metric,
        value
      };

      await storage.createSystemHealth(healthData);
    } catch (error) {
      console.error('Failed to log system health:', error);
    }
  }
}

// Global vendor manager instance
export const vendorManager = new VendorManager();