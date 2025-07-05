// Vendor Adapter Interface for Multi-Vendor CCTV Integration
// Provides unified interface for different CCTV vendor APIs

export interface CameraStream {
  id: string;
  truckId: string;
  position: 'front' | 'back' | 'left' | 'right' | 'driver_facing' | 'cargo';
  streamUrl: string;
  recordingUrl?: string;
  status: 'online' | 'offline' | 'error';
  resolution: string;
  frameRate: number;
  capabilities: string[];
  lastFrame?: Date;
}

export interface Recording {
  id: string;
  cameraId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // seconds
  fileUrl: string;
  fileSize: number; // bytes
  resolution: string;
  quality: 'high' | 'medium' | 'low';
}

export interface CameraEvent {
  id: string;
  cameraId: string;
  eventType: 'motion_detected' | 'video_loss' | 'camera_offline' | 'recording_started' | 'recording_stopped';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface VendorAuthConfig {
  username?: string;
  password?: string;
  apiKey?: string;
  token?: string;
  certificate?: string;
  customHeaders?: Record<string, string>;
}

export interface VendorEndpoints {
  baseUrl: string;
  auth: string;
  streams: string;
  recordings: string;
  cameras: string;
  events: string;
  health: string;
}

export interface VendorCapabilities {
  liveStreaming: boolean;
  recording: boolean;
  playback: boolean;
  ptzControl: boolean;
  motionDetection: boolean;
  audioSupport: boolean;
  nightVision: boolean;
  weatherResistant: boolean;
  mobilitySupport: boolean; // for vehicle-mounted cameras
}

export type EventCallback = (event: CameraEvent) => void;
export type StreamCallback = (stream: CameraStream) => void;

// Base interface that all vendor adapters must implement
export interface VendorAdapter {
  vendorType: string;
  vendorName: string;
  version: string;
  capabilities: VendorCapabilities;

  // Authentication
  authenticate(config: VendorAuthConfig): Promise<string>;
  isAuthenticated(): boolean;
  refreshToken(): Promise<string>;

  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<boolean>;

  // Camera management
  getCameras(truckId?: string): Promise<CameraStream[]>;
  getCameraById(cameraId: string): Promise<CameraStream | null>;
  getCameraStatus(cameraId: string): Promise<'online' | 'offline' | 'error'>;

  // Streaming
  getStreamUrl(cameraId: string, quality?: 'high' | 'medium' | 'low'): Promise<string>;
  startStreaming(cameraId: string): Promise<boolean>;
  stopStreaming(cameraId: string): Promise<boolean>;

  // Recording
  startRecording(cameraId: string): Promise<string>; // returns recording ID
  stopRecording(recordingId: string): Promise<boolean>;
  getRecordings(cameraId: string, startTime: Date, endTime: Date): Promise<Recording[]>;
  downloadRecording(recordingId: string): Promise<Buffer>;

  // Events
  subscribeToEvents(callback: EventCallback): Promise<void>;
  unsubscribeFromEvents(): Promise<void>;
  getEvents(cameraId: string, startTime: Date, endTime: Date): Promise<CameraEvent[]>;

  // Camera control (if supported)
  movePTZ?(cameraId: string, pan: number, tilt: number, zoom: number): Promise<boolean>;
  setPreset?(cameraId: string, presetId: string): Promise<boolean>;
  gotoPreset?(cameraId: string, presetId: string): Promise<boolean>;

  // Configuration
  updateCameraSettings?(cameraId: string, settings: Record<string, any>): Promise<boolean>;
  getCameraSettings?(cameraId: string): Promise<Record<string, any>>;

  // Utility methods
  validateConfig(config: VendorAuthConfig): boolean;
  getLastError(): string | null;
  getConnectionInfo(): Record<string, any>;
}

// Base class with common functionality
export abstract class BaseVendorAdapter implements VendorAdapter {
  abstract vendorType: string;
  abstract vendorName: string;
  abstract version: string;
  abstract capabilities: VendorCapabilities;

  protected authToken?: string;
  protected config?: VendorAuthConfig;
  protected endpoints?: VendorEndpoints;
  protected lastError?: string;
  protected connected: boolean = false;
  protected eventCallbacks: EventCallback[] = [];

  constructor(config: VendorAuthConfig, endpoints: VendorEndpoints) {
    this.config = config;
    this.endpoints = endpoints;
  }

  abstract authenticate(config: VendorAuthConfig): Promise<string>;
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract getCameras(truckId?: string): Promise<CameraStream[]>;
  abstract getCameraById(cameraId: string): Promise<CameraStream | null>;
  abstract getStreamUrl(cameraId: string, quality?: 'high' | 'medium' | 'low'): Promise<string>;

  isAuthenticated(): boolean {
    return !!this.authToken;
  }

  async refreshToken(): Promise<string> {
    if (!this.config) {
      throw new Error('No configuration available for token refresh');
    }
    return this.authenticate(this.config);
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.endpoints?.health) {
        return this.connected;
      }

      const response = await fetch(this.endpoints.health, {
        headers: this.getAuthHeaders(),
        timeout: 5000
      });

      return response.ok;
    } catch (error) {
      this.lastError = `Health check failed: ${error.message}`;
      return false;
    }
  }

  async getCameraStatus(cameraId: string): Promise<'online' | 'offline' | 'error'> {
    try {
      const camera = await this.getCameraById(cameraId);
      return camera?.status || 'error';
    } catch (error) {
      this.lastError = `Failed to get camera status: ${error.message}`;
      return 'error';
    }
  }

  async startStreaming(cameraId: string): Promise<boolean> {
    // Default implementation - may be overridden by specific vendors
    try {
      const streamUrl = await this.getStreamUrl(cameraId);
      return !!streamUrl;
    } catch (error) {
      this.lastError = `Failed to start streaming: ${error.message}`;
      return false;
    }
  }

  async stopStreaming(cameraId: string): Promise<boolean> {
    // Default implementation - streaming typically stops automatically
    return true;
  }

  async startRecording(cameraId: string): Promise<string> {
    throw new Error('Recording not implemented for this vendor');
  }

  async stopRecording(recordingId: string): Promise<boolean> {
    throw new Error('Recording not implemented for this vendor');
  }

  async getRecordings(cameraId: string, startTime: Date, endTime: Date): Promise<Recording[]> {
    throw new Error('Recording playback not implemented for this vendor');
  }

  async downloadRecording(recordingId: string): Promise<Buffer> {
    throw new Error('Recording download not implemented for this vendor');
  }

  async subscribeToEvents(callback: EventCallback): Promise<void> {
    this.eventCallbacks.push(callback);
  }

  async unsubscribeFromEvents(): Promise<void> {
    this.eventCallbacks = [];
  }

  async getEvents(cameraId: string, startTime: Date, endTime: Date): Promise<CameraEvent[]> {
    // Default implementation returns empty array
    return [];
  }

  validateConfig(config: VendorAuthConfig): boolean {
    // Basic validation - should be overridden by specific vendors
    return !!(config.username && config.password) || !!config.apiKey || !!config.token;
  }

  getLastError(): string | null {
    return this.lastError || null;
  }

  getConnectionInfo(): Record<string, any> {
    return {
      vendorType: this.vendorType,
      vendorName: this.vendorName,
      connected: this.connected,
      authenticated: this.isAuthenticated(),
      lastError: this.lastError,
      capabilities: this.capabilities
    };
  }

  protected getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    if (this.config?.customHeaders) {
      Object.assign(headers, this.config.customHeaders);
    }

    return headers;
  }

  protected async makeRequest(url: string, options: RequestInit = {}): Promise<any> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return await response.text();
    } catch (error) {
      this.lastError = `Request failed: ${error.message}`;
      throw error;
    }
  }

  protected emitEvent(event: CameraEvent): void {
    this.eventCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in event callback:', error);
      }
    });
  }

  protected generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Vendor-specific error types
export class VendorAuthenticationError extends Error {
  constructor(vendor: string, message: string) {
    super(`${vendor} Authentication Error: ${message}`);
    this.name = 'VendorAuthenticationError';
  }
}

export class VendorConnectionError extends Error {
  constructor(vendor: string, message: string) {
    super(`${vendor} Connection Error: ${message}`);
    this.name = 'VendorConnectionError';
  }
}

export class VendorAPIError extends Error {
  constructor(vendor: string, endpoint: string, message: string) {
    super(`${vendor} API Error (${endpoint}): ${message}`);
    this.name = 'VendorAPIError';
  }
}

// Utility functions
export function createVendorAdapter(
  vendorType: string,
  config: VendorAuthConfig,
  endpoints: VendorEndpoints
): VendorAdapter {
  switch (vendorType.toLowerCase()) {
    case 'hikvision':
      return new HikvisionAdapter(config, endpoints);
    case 'dahua':
      return new DahuaAdapter(config, endpoints);
    case 'axis':
      return new AxisAdapter(config, endpoints);
    case 'custom':
      return new CustomAdapter(config, endpoints);
    default:
      throw new Error(`Unsupported vendor type: ${vendorType}`);
  }
}

// Placeholder imports for specific implementations
class HikvisionAdapter extends BaseVendorAdapter {
  vendorType = 'hikvision';
  vendorName = 'Hikvision';
  version = '1.0.0';
  capabilities: VendorCapabilities = {
    liveStreaming: true,
    recording: true,
    playback: true,
    ptzControl: true,
    motionDetection: true,
    audioSupport: true,
    nightVision: true,
    weatherResistant: true,
    mobilitySupport: true
  };

  async authenticate(config: VendorAuthConfig): Promise<string> {
    // Hikvision authentication implementation
    throw new Error('Hikvision adapter not yet implemented');
  }

  async connect(): Promise<void> {
    throw new Error('Hikvision adapter not yet implemented');
  }

  async disconnect(): Promise<void> {
    throw new Error('Hikvision adapter not yet implemented');
  }

  async getCameras(): Promise<CameraStream[]> {
    throw new Error('Hikvision adapter not yet implemented');
  }

  async getCameraById(): Promise<CameraStream | null> {
    throw new Error('Hikvision adapter not yet implemented');
  }

  async getStreamUrl(): Promise<string> {
    throw new Error('Hikvision adapter not yet implemented');
  }
}

class DahuaAdapter extends BaseVendorAdapter {
  vendorType = 'dahua';
  vendorName = 'Dahua';
  version = '1.0.0';
  capabilities: VendorCapabilities = {
    liveStreaming: true,
    recording: true,
    playback: true,
    ptzControl: true,
    motionDetection: true,
    audioSupport: true,
    nightVision: true,
    weatherResistant: true,
    mobilitySupport: true
  };

  async authenticate(config: VendorAuthConfig): Promise<string> {
    throw new Error('Dahua adapter not yet implemented');
  }

  async connect(): Promise<void> {
    throw new Error('Dahua adapter not yet implemented');
  }

  async disconnect(): Promise<void> {
    throw new Error('Dahua adapter not yet implemented');
  }

  async getCameras(): Promise<CameraStream[]> {
    throw new Error('Dahua adapter not yet implemented');
  }

  async getCameraById(): Promise<CameraStream | null> {
    throw new Error('Dahua adapter not yet implemented');
  }

  async getStreamUrl(): Promise<string> {
    throw new Error('Dahua adapter not yet implemented');
  }
}

class AxisAdapter extends BaseVendorAdapter {
  vendorType = 'axis';
  vendorName = 'Axis Communications';
  version = '1.0.0';
  capabilities: VendorCapabilities = {
    liveStreaming: true,
    recording: true,
    playback: true,
    ptzControl: true,
    motionDetection: true,
    audioSupport: true,
    nightVision: true,
    weatherResistant: true,
    mobilitySupport: true
  };

  async authenticate(config: VendorAuthConfig): Promise<string> {
    throw new Error('Axis adapter not yet implemented');
  }

  async connect(): Promise<void> {
    throw new Error('Axis adapter not yet implemented');
  }

  async disconnect(): Promise<void> {
    throw new Error('Axis adapter not yet implemented');
  }

  async getCameras(): Promise<CameraStream[]> {
    throw new Error('Axis adapter not yet implemented');
  }

  async getCameraById(): Promise<CameraStream | null> {
    throw new Error('Axis adapter not yet implemented');
  }

  async getStreamUrl(): Promise<string> {
    throw new Error('Axis adapter not yet implemented');
  }
}

class CustomAdapter extends BaseVendorAdapter {
  vendorType = 'custom';
  vendorName = 'Custom Implementation';
  version = '1.0.0';
  capabilities: VendorCapabilities = {
    liveStreaming: true,
    recording: false,
    playback: false,
    ptzControl: false,
    motionDetection: false,
    audioSupport: false,
    nightVision: false,
    weatherResistant: false,
    mobilitySupport: true
  };

  async authenticate(config: VendorAuthConfig): Promise<string> {
    throw new Error('Custom adapter not yet implemented');
  }

  async connect(): Promise<void> {
    throw new Error('Custom adapter not yet implemented');
  }

  async disconnect(): Promise<void> {
    throw new Error('Custom adapter not yet implemented');
  }

  async getCameras(): Promise<CameraStream[]> {
    throw new Error('Custom adapter not yet implemented');
  }

  async getCameraById(): Promise<CameraStream | null> {
    throw new Error('Custom adapter not yet implemented');
  }

  async getStreamUrl(): Promise<string> {
    throw new Error('Custom adapter not yet implemented');
  }
}