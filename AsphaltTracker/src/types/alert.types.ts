// Type definitions for alert management system

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AlertType = 'safety' | 'progress' | 'quality' | 'equipment' | 'system' | 'weather' | 'compliance';
export type NotificationChannel = 'email' | 'sms' | 'push' | 'phone_call' | 'dashboard' | 'mobile_app';
export type AlertStatus = 'new' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed' | 'escalated';

export interface AlertInput {
  alertId: string;
  type: AlertType;
  severity: AlertSeverity;
  siteId: string;
  title: string;
  description: string;
  data: AlertData;
  timestamp: string;
  source?: string;
  location?: {
    x: number;
    y: number;
    area?: string;
    cameraId?: string;
  };
  involvedResources?: {
    equipment?: string[];
    personnel?: string[];
    materials?: string[];
  };
}

export interface AlertResult {
  alertId: string;
  status: 'processed' | 'failed' | 'duplicate';
  classification?: string;
  severity: AlertSeverity;
  recipientCount: number;
  notificationsSent: number;
  notificationsFailed: number;
  followUpScheduled: boolean;
  processingTime: number;
  processedAt: string;
  error?: string;
  escalationLevel?: number;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface AlertData {
  // Safety-specific data
  safetyViolation?: {
    type: 'ppe_missing' | 'unsafe_proximity' | 'speed_violation' | 'restricted_area';
    involvedPersonnel: string[];
    involvedEquipment: string[];
    riskLevel: number; // 1-10
    immediateAction: string;
  };

  // Progress-specific data
  progressIssue?: {
    type: 'schedule_delay' | 'quality_issue' | 'resource_shortage' | 'weather_impact';
    delayAmount: number; // hours
    affectedActivities: string[];
    impact: 'low' | 'medium' | 'high' | 'critical';
    mitigationOptions: string[];
  };

  // Equipment-specific data
  equipmentIssue?: {
    equipmentId: string;
    equipmentType: string;
    issueType: 'breakdown' | 'maintenance_due' | 'performance_degradation' | 'safety_concern';
    severity: AlertSeverity;
    estimatedDowntime: number; // hours
    repairCost?: number;
    replacementNeeded: boolean;
  };

  // Quality-specific data
  qualityIssue?: {
    type: 'surface_defect' | 'thickness_variance' | 'density_issue' | 'temperature_problem';
    location: {
      x: number;
      y: number;
      area: string;
    };
    measurements: Record<string, number>;
    tolerance: Record<string, number>;
    remediation: string[];
    reworkRequired: boolean;
  };

  // System-specific data
  systemIssue?: {
    component: 'camera' | 'sensor' | 'network' | 'ai_model' | 'database';
    errorCode: string;
    errorMessage: string;
    affectedSystems: string[];
    serviceImpact: 'none' | 'partial' | 'full';
    autoRecovery: boolean;
  };

  // Weather-specific data
  weatherAlert?: {
    type: 'rain' | 'wind' | 'temperature' | 'visibility' | 'storm';
    currentConditions: Record<string, number>;
    forecast: {
      duration: number; // hours
      intensity: 'light' | 'moderate' | 'heavy' | 'severe';
    };
    workImpact: 'none' | 'limited' | 'suspended';
    recommendations: string[];
  };

  // Additional context
  context?: {
    relatedAlerts: string[];
    historicalOccurrences: number;
    lastOccurrence?: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    seasonalPattern: boolean;
  };
}

export interface EscalationRule {
  id: string;
  alertType: AlertType;
  severity: AlertSeverity;
  siteId?: string;
  conditions: {
    timeToAcknowledge: number; // minutes
    timeToResolve: number; // minutes
    businessHours: boolean;
    weekendsIncluded: boolean;
  };
  levels: EscalationLevel[];
  overrides: {
    holidays: boolean;
    emergencyContacts: string[];
    executiveEscalation: boolean;
  };
}

export interface EscalationLevel {
  level: number;
  name: string;
  recipients: string[];
  channels: NotificationChannel[];
  timeoutMinutes: number;
  requiresAcknowledgment: boolean;
  autoEscalate: boolean;
  actions: {
    type: 'notification' | 'workflow' | 'external_call' | 'system_action';
    config: Record<string, any>;
  }[];
}

export interface NotificationRecipient {
  id: string;
  name: string;
  role: string;
  contactInfo: {
    email?: string;
    phone?: string;
    pushToken?: string;
  };
  preferences: {
    channels: NotificationChannel[];
    quietHours: {
      start: string; // HH:MM
      end: string; // HH:MM
    };
    alertTypes: AlertType[];
    severityThreshold: AlertSeverity;
  };
  availability: {
    schedule: {
      [day: string]: {
        start: string;
        end: string;
        available: boolean;
      };
    };
    timeZone: string;
    onCall: boolean;
    backup?: string; // backup recipient ID
  };
}

export interface AlertMessage {
  subject: string;
  body: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  format: 'text' | 'html' | 'markdown';
  attachments?: {
    type: 'image' | 'video' | 'document' | 'report';
    url: string;
    name: string;
  }[];
  actions?: {
    label: string;
    type: 'acknowledge' | 'resolve' | 'escalate' | 'view' | 'custom';
    url?: string;
    method?: 'GET' | 'POST' | 'PUT';
    payload?: Record<string, any>;
  }[];
  metadata: {
    alertId: string;
    siteId: string;
    timestamp: string;
    expiresAt?: string;
    trackingId: string;
  };
}

export interface NotificationResult {
  channel: NotificationChannel;
  recipient: string;
  status: 'sent' | 'failed' | 'pending' | 'delivered' | 'read';
  timestamp: string;
  messageId?: string;
  error?: string;
  deliveryTime?: number; // milliseconds
  readTime?: string;
  acknowledgedTime?: string;
}

export interface AlertAuditLog {
  id: string;
  alertId: string;
  action: 'created' | 'acknowledged' | 'escalated' | 'resolved' | 'closed' | 'updated';
  performedBy: string;
  timestamp: string;
  details: {
    previousState?: AlertStatus;
    newState?: AlertStatus;
    changes?: Record<string, any>;
    reason?: string;
    notes?: string;
  };
  systemGenerated: boolean;
}

export interface AlertMetrics {
  timeframe: {
    start: string;
    end: string;
  };
  totals: {
    created: number;
    resolved: number;
    escalated: number;
    false_positives: number;
  };
  byType: Record<AlertType, {
    count: number;
    averageResolutionTime: number; // minutes
    escalationRate: number; // percentage
  }>;
  bySeverity: Record<AlertSeverity, {
    count: number;
    averageResolutionTime: number;
    escalationRate: number;
  }>;
  bySite: Record<string, {
    count: number;
    topTypes: AlertType[];
    averageResolutionTime: number;
  }>;
  performance: {
    averageAcknowledgmentTime: number; // minutes
    averageResolutionTime: number; // minutes
    slaCompliance: number; // percentage
    escalationRate: number; // percentage
    falsePositiveRate: number; // percentage
  };
  trends: {
    daily: { date: string; count: number }[];
    hourly: { hour: number; count: number }[];
    patterns: {
      type: string;
      description: string;
      confidence: number;
    }[];
  };
}

export interface AlertConfiguration {
  siteId: string;
  enabled: boolean;
  thresholds: {
    safety: {
      ppeCompliance: number; // percentage
      proximityDistance: number; // meters
      speedLimit: number; // km/h
      restrictedAreaViolation: boolean;
    };
    progress: {
      scheduleVariance: number; // percentage
      qualityScore: number; // minimum score
      productivityDrop: number; // percentage
      resourceUtilization: number; // minimum percentage
    };
    equipment: {
      utilizationThreshold: number; // percentage
      maintenanceOverdue: number; // days
      performanceDegradation: number; // percentage
      fuelConsumption: number; // liters per hour
    };
    system: {
      cameraOffline: number; // minutes
      networkLatency: number; // milliseconds
      aiModelAccuracy: number; // minimum percentage
      storageCapacity: number; // percentage full
    };
  };
  suppressionRules: {
    duplicateWindow: number; // minutes
    similarityThreshold: number; // 0-1
    maxAlertsPerHour: number;
    quietHours: {
      enabled: boolean;
      start: string; // HH:MM
      end: string; // HH:MM
      exceptions: AlertType[];
    };
  };
  integrations: {
    email: {
      enabled: boolean;
      smtpConfig: Record<string, any>;
      templates: Record<AlertType, string>;
    };
    sms: {
      enabled: boolean;
      provider: string;
      config: Record<string, any>;
    };
    webhook: {
      enabled: boolean;
      endpoints: {
        url: string;
        method: string;
        headers: Record<string, string>;
        alertTypes: AlertType[];
      }[];
    };
    slack: {
      enabled: boolean;
      webhookUrl: string;
      channels: Record<AlertType, string>;
    };
  };
}
