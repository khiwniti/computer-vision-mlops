# AsphaltTracker Enhanced API Documentation

## Overview

AsphaltTracker Enhanced provides a comprehensive REST API and WebSocket interface for AI-powered construction monitoring. The API supports video analytics, real-time activity tracking, safety monitoring, and semantic search capabilities.

## Base URL
```
Production: https://api.asphalttracker.com/v2
Development: http://localhost:5000/api/v2
```

## Authentication

All API requests require authentication using JWT tokens or API keys.

### JWT Authentication
```http
Authorization: Bearer <jwt_token>
```

### API Key Authentication
```http
X-API-Key: <api_key>
```

## Core Endpoints

### Video Management

#### Upload Video for AI Analysis
```http
POST /videos/upload
Content-Type: multipart/form-data

{
  "file": <video_file>,
  "metadata": {
    "cameraId": "CAM-001",
    "location": "Section A",
    "timestamp": "2024-01-15T09:30:00Z"
  }
}
```

**Response:**
```json
{
  "videoId": "vid_123456789",
  "status": "processing",
  "estimatedProcessingTime": 120,
  "processingStages": [
    "frame_extraction",
    "object_detection", 
    "activity_recognition",
    "safety_analysis",
    "transcription",
    "embedding_generation"
  ]
}
```

#### Get Video Analysis Results
```http
GET /videos/{videoId}/analysis
```

**Response:**
```json
{
  "videoId": "vid_123456789",
  "status": "completed",
  "analysis": {
    "summary": "AI-generated summary of construction activities",
    "objects": [
      {
        "id": "obj_001",
        "category": "asphalt_paver",
        "confidence": 0.94,
        "bbox": {"x": 0.2, "y": 0.3, "width": 0.4, "height": 0.3},
        "timestamp": 45.2
      }
    ],
    "activities": [
      {
        "type": "paving",
        "startTime": 30.0,
        "endTime": 180.5,
        "confidence": 0.89,
        "equipment": ["asphalt_paver", "road_roller"]
      }
    ],
    "safetyEvents": [
      {
        "type": "ppe_violation",
        "severity": "high",
        "timestamp": 67.3,
        "description": "Worker without hard hat detected"
      }
    ],
    "transcript": "Audio transcription of construction site sounds and conversations",
    "tags": ["paving", "safety_violation", "equipment_operation"],
    "aiModelsUsed": ["NVIDIA VILA", "Llama-3.1-70B", "ASR Model"],
    "processingTime": 89.4
  }
}
```

### Semantic Search

#### Search Videos by Natural Language
```http
POST /search/semantic
Content-Type: application/json

{
  "query": "workers without hard hats near operating equipment",
  "filters": {
    "dateRange": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-31T23:59:59Z"
    },
    "cameras": ["CAM-001", "CAM-002"],
    "confidenceThreshold": 0.8
  },
  "limit": 20
}
```

**Response:**
```json
{
  "results": [
    {
      "videoId": "vid_123456789",
      "relevanceScore": 0.94,
      "matchedSegments": [
        {
          "startTime": 45.2,
          "endTime": 67.8,
          "description": "Worker without hard hat near excavator",
          "confidence": 0.91
        }
      ],
      "metadata": {
        "filename": "safety_incident_cam001.mp4",
        "cameraId": "CAM-001",
        "timestamp": "2024-01-15T14:30:00Z",
        "location": "Section B"
      }
    }
  ],
  "totalResults": 15,
  "processingTime": 0.8
}
```

### Real-time Activity Tracking

#### Get Current Activities
```http
GET /activities/current
```

**Response:**
```json
{
  "activities": [
    {
      "id": "activity_001",
      "type": "paving",
      "cameraId": "CAM-001",
      "location": "Section A",
      "startTime": "2024-01-15T09:30:00Z",
      "equipment": ["asphalt_paver"],
      "personnel": 3,
      "confidence": 0.92,
      "status": "active"
    }
  ],
  "summary": {
    "totalActivities": 5,
    "activeEquipment": 8,
    "personnelCount": 15,
    "safetyScore": 94
  }
}
```

#### Get Activity Timeline
```http
GET /activities/timeline?start=2024-01-15T00:00:00Z&end=2024-01-15T23:59:59Z&cameras=CAM-001,CAM-002
```

### Safety Monitoring

#### Get Safety Alerts
```http
GET /safety/alerts?status=active&severity=high,critical
```

**Response:**
```json
{
  "alerts": [
    {
      "id": "alert_001",
      "type": "ppe_violation",
      "severity": "critical",
      "title": "Worker without hard hat",
      "description": "Worker detected without required PPE near operating equipment",
      "cameraId": "CAM-003",
      "location": "Section B",
      "timestamp": "2024-01-15T14:15:30Z",
      "confidence": 0.88,
      "status": "active",
      "involvedPersonnel": ["worker_001"],
      "involvedEquipment": ["excavator_002"],
      "immediateAction": "Stop work and ensure PPE compliance"
    }
  ],
  "summary": {
    "totalAlerts": 12,
    "criticalAlerts": 2,
    "highAlerts": 4,
    "resolvedToday": 8
  }
}
```

#### Acknowledge Safety Alert
```http
POST /safety/alerts/{alertId}/acknowledge
Content-Type: application/json

{
  "acknowledgedBy": "supervisor_001",
  "notes": "Worker has been provided with hard hat and briefed on safety requirements"
}
```

### AI Model Management

#### Get AI Model Status
```http
GET /ai/models/status
```

**Response:**
```json
{
  "models": {
    "vila": {
      "status": "active",
      "version": "nvidia/vila-1.5",
      "lastHealthCheck": "2024-01-15T15:30:00Z",
      "requestsToday": 2847,
      "averageLatency": 1.2,
      "accuracy": 0.94
    },
    "llama": {
      "status": "active", 
      "version": "meta/llama-3.1-70b-instruct",
      "lastHealthCheck": "2024-01-15T15:30:00Z",
      "requestsToday": 1523,
      "averageLatency": 2.1,
      "accuracy": 0.91
    },
    "embedding": {
      "status": "active",
      "version": "nvidia/llama-3_2-nv-embedqa-1b-v2", 
      "lastHealthCheck": "2024-01-15T15:30:00Z",
      "requestsToday": 892,
      "averageLatency": 0.8
    },
    "asr": {
      "status": "active",
      "version": "nvidia/parakeet-ctc-0_6b-asr",
      "lastHealthCheck": "2024-01-15T15:30:00Z",
      "requestsToday": 456,
      "averageLatency": 1.5,
      "accuracy": 0.89
    }
  },
  "systemHealth": {
    "overallStatus": "healthy",
    "gpuUtilization": 67,
    "memoryUsage": 54,
    "queueLength": 3
  }
}
```

### Progress Tracking

#### Get Construction Progress
```http
GET /progress/current?siteId=site_001
```

**Response:**
```json
{
  "siteId": "site_001",
  "progress": {
    "completionPercentage": 45.8,
    "areaCompleted": 2847.5,
    "areaRemaining": 3652.5,
    "pavingSpeed": 125.3,
    "qualityScore": 92,
    "efficiency": 87,
    "productivity": 94
  },
  "milestones": [
    {
      "name": "Section A Completion",
      "status": "completed",
      "completedAt": "2024-01-14T16:30:00Z",
      "plannedDate": "2024-01-15T12:00:00Z"
    }
  ],
  "forecast": {
    "estimatedCompletion": "2024-02-28T17:00:00Z",
    "confidence": 0.85,
    "risks": ["weather_delay", "material_shortage"]
  }
}
```

## WebSocket API

### Connection
```javascript
const ws = new WebSocket('ws://localhost:5001');
```

### Event Types

#### Real-time Activity Events
```json
{
  "type": "activity_event",
  "data": {
    "id": "activity_001",
    "type": "equipment_detected",
    "cameraId": "CAM-001",
    "timestamp": "2024-01-15T15:30:00Z",
    "confidence": 0.92,
    "location": {"x": 0.5, "y": 0.3}
  }
}
```

#### Safety Alerts
```json
{
  "type": "safety_alert", 
  "data": {
    "id": "alert_001",
    "type": "ppe_violation",
    "severity": "critical",
    "cameraId": "CAM-003",
    "timestamp": "2024-01-15T15:30:00Z",
    "description": "Worker without hard hat detected"
  }
}
```

#### Progress Updates
```json
{
  "type": "progress_update",
  "data": {
    "siteId": "site_001",
    "completionPercentage": 45.9,
    "timestamp": "2024-01-15T15:30:00Z",
    "productivity": 95
  }
}
```

#### Camera Status
```json
{
  "type": "camera_status",
  "data": {
    "cameraId": "CAM-001",
    "status": "active",
    "lastActivity": "2024-01-15T15:30:00Z",
    "frameRate": 30,
    "aiProcessing": true
  }
}
```

## Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request parameters are invalid",
    "details": {
      "field": "cameraId",
      "reason": "Camera ID is required"
    },
    "timestamp": "2024-01-15T15:30:00Z",
    "requestId": "req_123456789"
  }
}
```

### Common Error Codes
- `INVALID_REQUEST` (400) - Request parameters are invalid
- `UNAUTHORIZED` (401) - Authentication required
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `RATE_LIMITED` (429) - Too many requests
- `AI_MODEL_UNAVAILABLE` (503) - AI model temporarily unavailable
- `PROCESSING_FAILED` (500) - Video processing failed

## Rate Limits

- **Standard API**: 1000 requests per hour
- **AI Processing**: 100 videos per hour
- **WebSocket**: 10 connections per user
- **Search API**: 500 queries per hour

## SDKs and Libraries

### JavaScript/Node.js
```bash
npm install @asphalttracker/sdk
```

### Python
```bash
pip install asphalttracker-sdk
```

### cURL Examples
```bash
# Upload video
curl -X POST \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@construction_video.mp4" \
  -F "metadata={\"cameraId\":\"CAM-001\"}" \
  https://api.asphalttracker.com/v2/videos/upload

# Search videos
curl -X POST \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"safety violations"}' \
  https://api.asphalttracker.com/v2/search/semantic
```
