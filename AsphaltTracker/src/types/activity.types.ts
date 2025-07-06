// Type definitions for activity tracking system

export interface ActivityTrackingInput {
  siteId: string;
  timeRange: {
    start: string;
    end: string;
  };
  cameras: string[];
  equipmentList: string[];
  projectPlan?: {
    totalArea: number;
    plannedDuration: number;
    qualityStandards: Record<string, any>;
  };
  plannedSchedule?: ProjectSchedule;
  qualityStandards?: Record<string, any>;
  inspectionData?: InspectionRecord[];
  notificationRecipients?: string[];
}

export interface ActivityTrackingResult {
  siteId: string;
  timeRange: {
    start: string;
    end: string;
  };
  equipmentActivities: EquipmentActivity[];
  workerActivities: WorkerActivity[];
  progressMetrics: ProgressMetrics;
  activityPatterns: ActivityPattern[];
  productivity: ProductivityInsights;
  schedule: ScheduleAnalysis;
  quality: QualityAssessment;
  timeline: ActivityTimeline[];
  recommendations: Recommendation[];
  notifications: Notification[];
  processedAt: string;
}

export interface EquipmentActivity {
  id: string;
  equipmentId: string;
  equipmentType: 'asphalt_paver' | 'road_roller' | 'dump_truck' | 'excavator' | 'bulldozer' | 'grader';
  activity: 'paving' | 'rolling' | 'hauling' | 'excavating' | 'grading' | 'idle' | 'maintenance';
  startTime: string;
  endTime: string;
  duration: number; // in seconds
  location: {
    x: number;
    y: number;
    area?: string;
  };
  operatorId?: string;
  efficiency: number; // 0-100
  fuelConsumption?: number;
  materialProcessed?: number;
  qualityMetrics?: {
    speed: number;
    consistency: number;
    coverage: number;
  };
  alerts: ActivityAlert[];
}

export interface WorkerActivity {
  id: string;
  workerId?: string;
  workerType: 'operator' | 'supervisor' | 'inspector' | 'laborer' | 'safety_officer';
  activity: 'equipment_operation' | 'quality_inspection' | 'material_handling' | 'safety_briefing' | 'maintenance_work' | 'supervision';
  startTime: string;
  endTime: string;
  duration: number;
  location: {
    x: number;
    y: number;
    area?: string;
  };
  safetyCompliance: {
    ppeCompliant: boolean;
    safetyZoneCompliant: boolean;
    proximityCompliant: boolean;
    violations: SafetyViolation[];
  };
  productivity: number; // 0-100
  interactions: {
    equipmentId?: string;
    otherWorkers?: string[];
    materials?: string[];
  };
  alerts: ActivityAlert[];
}

export interface ProgressMetrics {
  completionPercentage: number;
  areaCompleted: number; // square meters
  areaRemaining: number;
  pavingSpeed: number; // sq meters per hour
  materialUsage: {
    asphalt: number; // tons
    aggregate: number; // tons
    fuel: number; // liters
  };
  qualityScore: number; // 0-100
  efficiency: number; // 0-100
  productivity: number; // 0-100
  resourceUtilization: {
    equipment: number; // 0-100
    workforce: number; // 0-100
    materials: number; // 0-100
  };
  timeline: {
    planned: number;
    actual: number;
    variance: number; // percentage
  };
}

export interface ActivityPattern {
  id: string;
  type: 'equipment_utilization' | 'worker_productivity' | 'safety_incidents' | 'quality_issues' | 'schedule_deviations';
  pattern: string;
  frequency: number;
  impact: 'high' | 'medium' | 'low';
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number; // 0-1
  timeframe: {
    start: string;
    end: string;
  };
  affectedResources: string[];
  recommendations: string[];
}

export interface ProductivityInsights {
  overall: number; // 0-100
  equipment: {
    [equipmentType: string]: {
      utilization: number;
      efficiency: number;
      downtime: number;
      maintenance: number;
    };
  };
  workforce: {
    productivity: number;
    efficiency: number;
    safetyCompliance: number;
    skillLevel: number;
  };
  bottlenecks: {
    type: 'equipment' | 'workforce' | 'materials' | 'weather' | 'coordination';
    description: string;
    impact: number; // 0-100
    duration: number; // minutes
  }[];
  improvements: {
    area: string;
    potential: number; // percentage improvement
    effort: 'low' | 'medium' | 'high';
    priority: number; // 1-10
  }[];
}

export interface ScheduleAnalysis {
  onSchedule: boolean;
  variance: number; // percentage ahead/behind
  criticalPath: {
    activities: string[];
    totalDuration: number;
    delays: {
      activity: string;
      delay: number; // hours
      reason: string;
    }[];
  };
  milestones: {
    name: string;
    planned: string;
    actual?: string;
    status: 'completed' | 'on_track' | 'at_risk' | 'delayed';
  }[];
  forecast: {
    completionDate: string;
    confidence: number; // 0-100
    risks: string[];
  };
}

export interface QualityAssessment {
  overallScore: number; // 0-100
  metrics: {
    surfaceQuality: number;
    thickness: number;
    density: number;
    smoothness: number;
    temperature: number;
  };
  inspections: {
    passed: number;
    failed: number;
    pending: number;
  };
  defects: {
    type: string;
    severity: 'minor' | 'major' | 'critical';
    location: {
      x: number;
      y: number;
    };
    description: string;
    remediation: string;
  }[];
  compliance: {
    standards: string[];
    conformance: number; // 0-100
    deviations: string[];
  };
}

export interface ActivityTimeline {
  timestamp: string;
  activities: {
    equipment: EquipmentActivity[];
    workers: WorkerActivity[];
  };
  metrics: {
    productivity: number;
    safety: number;
    quality: number;
    progress: number;
  };
  events: {
    type: 'start' | 'stop' | 'alert' | 'milestone' | 'inspection';
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
  }[];
}

export interface Recommendation {
  id: string;
  type: 'productivity' | 'safety' | 'quality' | 'schedule' | 'cost';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: {
    area: string;
    improvement: number; // percentage
    effort: 'low' | 'medium' | 'high';
    cost: 'low' | 'medium' | 'high';
  };
  implementation: {
    steps: string[];
    timeline: string;
    resources: string[];
  };
  metrics: {
    before: number;
    after: number;
    roi: number; // return on investment
  };
}

export interface Notification {
  id: string;
  type: 'alert' | 'update' | 'reminder' | 'report';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  message: string;
  timestamp: string;
  siteId: string;
  recipients: string[];
  channels: ('email' | 'sms' | 'push' | 'dashboard')[];
  read: boolean;
  acknowledged: boolean;
  actions?: {
    label: string;
    action: string;
    url?: string;
  }[];
}

export interface ActivityAlert {
  id: string;
  type: 'safety' | 'efficiency' | 'quality' | 'maintenance' | 'schedule';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  timestamp: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  actions: string[];
}

export interface SafetyViolation {
  type: 'ppe_missing' | 'unsafe_proximity' | 'speed_violation' | 'restricted_area' | 'equipment_misuse';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  timestamp: string;
  location: {
    x: number;
    y: number;
  };
  involvedPersonnel: string[];
  involvedEquipment: string[];
  correctionRequired: string;
  reportedBy: string;
}

export interface ProjectSchedule {
  phases: {
    name: string;
    startDate: string;
    endDate: string;
    activities: {
      name: string;
      duration: number;
      dependencies: string[];
      resources: string[];
    }[];
  }[];
  milestones: {
    name: string;
    date: string;
    critical: boolean;
  }[];
  constraints: {
    type: 'weather' | 'materials' | 'equipment' | 'permits';
    description: string;
    impact: string;
  }[];
}

export interface InspectionRecord {
  id: string;
  type: 'quality' | 'safety' | 'progress' | 'compliance';
  timestamp: string;
  inspector: string;
  location: {
    x: number;
    y: number;
    area: string;
  };
  results: {
    passed: boolean;
    score: number;
    notes: string;
    photos: string[];
  };
  followUp: {
    required: boolean;
    actions: string[];
    deadline?: string;
  };
}
