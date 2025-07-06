# AsphaltTracker Enhanced Testing Guide

## Overview

Comprehensive testing strategy for AsphaltTracker Enhanced, covering unit tests, integration tests, AI model validation, and end-to-end testing scenarios.

## Testing Strategy

### Test Pyramid
1. **Unit Tests** (70%) - Individual components and functions
2. **Integration Tests** (20%) - API endpoints and service interactions
3. **End-to-End Tests** (10%) - Complete user workflows
4. **AI Model Tests** - Model accuracy and performance validation

## Setup

### Prerequisites
```bash
# Install testing dependencies
npm install --save-dev jest supertest playwright @testing-library/react

# Install AI testing tools
pip install pytest tensorflow scikit-learn
```

### Test Environment Configuration
```bash
# .env.test
NODE_ENV=test
DATABASE_URL=postgresql://postgres:password@localhost:5433/asphalt_tracker_test
REDIS_URL=redis://localhost:6380
NVIDIA_API_KEY=test_key_mock
MOCK_AI_RESPONSES=true
```

## Unit Testing

### Frontend Component Tests
```javascript
// client/src/components/__tests__/AIAnalyticsDashboard.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { AIAnalyticsDashboard } from '../ai-analytics/AIAnalyticsDashboard';

describe('AIAnalyticsDashboard', () => {
  test('renders dashboard with real-time data', async () => {
    render(<AIAnalyticsDashboard />);
    
    expect(screen.getByText('AI Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Real-time construction monitoring')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Active Cameras')).toBeInTheDocument();
    });
  });

  test('displays safety alerts correctly', async () => {
    const mockAlerts = [
      {
        id: 'alert_1',
        type: 'ppe_violation',
        severity: 'high',
        description: 'Worker without hard hat'
      }
    ];

    render(<AIAnalyticsDashboard initialAlerts={mockAlerts} />);
    
    await waitFor(() => {
      expect(screen.getByText('Worker without hard hat')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
    });
  });
});
```

### Backend Service Tests
```javascript
// server/src/services/__tests__/videoProcessor.test.ts
import { EnhancedVideoProcessor } from '../vss-integration/video-processor';
import { mockNvidiaAPI } from '../__mocks__/nvidia-api';

describe('EnhancedVideoProcessor', () => {
  let processor: EnhancedVideoProcessor;

  beforeEach(() => {
    processor = new EnhancedVideoProcessor();
    mockNvidiaAPI.reset();
  });

  test('processes video with AI analysis', async () => {
    const mockVideo = {
      id: 'test_video_1',
      filename: 'construction_test.mp4',
      path: '/test/videos/construction_test.mp4'
    };

    mockNvidiaAPI.mockAnalysisResponse({
      objects: [
        { category: 'asphalt_paver', confidence: 0.94 },
        { category: 'construction_worker', confidence: 0.89 }
      ],
      activities: ['paving', 'quality_inspection'],
      safetyEvents: []
    });

    const result = await processor.processVideo(mockVideo);

    expect(result.status).toBe('completed');
    expect(result.analysis.objects).toHaveLength(2);
    expect(result.analysis.activities).toContain('paving');
    expect(mockNvidiaAPI.getCallCount()).toBe(1);
  });

  test('handles AI processing errors gracefully', async () => {
    const mockVideo = {
      id: 'test_video_2',
      filename: 'invalid_video.mp4',
      path: '/test/videos/invalid_video.mp4'
    };

    mockNvidiaAPI.mockError('API_UNAVAILABLE');

    const result = await processor.processVideo(mockVideo);

    expect(result.status).toBe('failed');
    expect(result.error).toContain('AI processing failed');
  });
});
```

### AI Workflow Tests
```javascript
// src/workflows/__tests__/videoProcessingWorkflow.test.ts
import { videoProcessingWorkflow } from '../videoProcessingWorkflow';
import { mockRestackContext } from '../__mocks__/restack';

describe('Video Processing Workflow', () => {
  test('executes complete video processing pipeline', async () => {
    const input = {
      videoId: 'test_video_1',
      filename: 'construction_site.mp4',
      metadata: {
        cameraId: 'CAM-001',
        location: 'Section A',
        timestamp: new Date().toISOString()
      }
    };

    const result = await videoProcessingWorkflow(input);

    expect(result.status).toBe('completed');
    expect(result.analysis).toBeDefined();
    expect(result.analysis.summary).toBeTruthy();
    expect(result.analysis.aiModelsUsed).toContain('NVIDIA VILA');
  });

  test('handles workflow failures with proper error handling', async () => {
    const input = {
      videoId: 'test_video_fail',
      filename: 'corrupted_video.mp4',
      metadata: {}
    };

    mockRestackContext.mockStepFailure('validateVideo');

    await expect(videoProcessingWorkflow(input)).rejects.toThrow();
  });
});
```

## Integration Testing

### API Endpoint Tests
```javascript
// server/src/__tests__/api.integration.test.ts
import request from 'supertest';
import { app } from '../app';
import { setupTestDatabase, cleanupTestDatabase } from '../test-utils/database';

describe('API Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('Video Upload API', () => {
    test('POST /api/v2/videos/upload', async () => {
      const response = await request(app)
        .post('/api/v2/videos/upload')
        .attach('file', 'test/fixtures/sample_video.mp4')
        .field('metadata', JSON.stringify({
          cameraId: 'CAM-001',
          location: 'Test Site'
        }))
        .expect(200);

      expect(response.body.videoId).toBeDefined();
      expect(response.body.status).toBe('processing');
    });

    test('handles invalid video format', async () => {
      const response = await request(app)
        .post('/api/v2/videos/upload')
        .attach('file', 'test/fixtures/invalid_file.txt')
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_FILE_FORMAT');
    });
  });

  describe('Semantic Search API', () => {
    test('POST /api/v2/search/semantic', async () => {
      const response = await request(app)
        .post('/api/v2/search/semantic')
        .send({
          query: 'workers wearing hard hats',
          filters: {
            confidenceThreshold: 0.8
          }
        })
        .expect(200);

      expect(response.body.results).toBeDefined();
      expect(Array.isArray(response.body.results)).toBe(true);
    });
  });

  describe('Real-time Activity API', () => {
    test('GET /api/v2/activities/current', async () => {
      const response = await request(app)
        .get('/api/v2/activities/current')
        .expect(200);

      expect(response.body.activities).toBeDefined();
      expect(response.body.summary).toBeDefined();
    });
  });
});
```

### Database Integration Tests
```javascript
// server/src/__tests__/database.integration.test.ts
import { db } from '../database/connection';
import { videos, activities, alerts } from '../database/schema';

describe('Database Integration', () => {
  test('stores video analysis results', async () => {
    const videoData = {
      id: 'test_video_1',
      filename: 'test.mp4',
      status: 'completed',
      analysis: {
        summary: 'Test analysis',
        objects: [],
        activities: [],
        confidence: 0.9
      }
    };

    const [inserted] = await db.insert(videos).values(videoData).returning();
    expect(inserted.id).toBe('test_video_1');

    const retrieved = await db.select().from(videos).where(eq(videos.id, 'test_video_1'));
    expect(retrieved[0].analysis.summary).toBe('Test analysis');
  });

  test('handles concurrent activity insertions', async () => {
    const activityPromises = Array.from({ length: 10 }, (_, i) => 
      db.insert(activities).values({
        id: `activity_${i}`,
        type: 'paving',
        cameraId: 'CAM-001',
        timestamp: new Date(),
        confidence: 0.8
      })
    );

    await Promise.all(activityPromises);

    const count = await db.select({ count: sql`count(*)` }).from(activities);
    expect(count[0].count).toBe('10');
  });
});
```

## AI Model Testing

### Model Accuracy Tests
```python
# tests/ai/test_model_accuracy.py
import pytest
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score
from src.ai.models import ObjectDetectionModel, ActivityRecognitionModel

class TestModelAccuracy:
    def setup_method(self):
        self.object_model = ObjectDetectionModel()
        self.activity_model = ActivityRecognitionModel()
        self.test_data = self.load_test_dataset()

    def test_object_detection_accuracy(self):
        """Test object detection model accuracy on validation set"""
        predictions = []
        ground_truth = []
        
        for sample in self.test_data['object_detection']:
            pred = self.object_model.predict(sample['image'])
            predictions.append(pred['category'])
            ground_truth.append(sample['label'])
        
        accuracy = accuracy_score(ground_truth, predictions)
        precision = precision_score(ground_truth, predictions, average='weighted')
        recall = recall_score(ground_truth, predictions, average='weighted')
        
        assert accuracy >= 0.85, f"Object detection accuracy {accuracy} below threshold"
        assert precision >= 0.80, f"Object detection precision {precision} below threshold"
        assert recall >= 0.80, f"Object detection recall {recall} below threshold"

    def test_activity_recognition_accuracy(self):
        """Test activity recognition model accuracy"""
        predictions = []
        ground_truth = []
        
        for sample in self.test_data['activity_recognition']:
            pred = self.activity_model.predict(sample['sequence'])
            predictions.append(pred['activity'])
            ground_truth.append(sample['label'])
        
        accuracy = accuracy_score(ground_truth, predictions)
        assert accuracy >= 0.80, f"Activity recognition accuracy {accuracy} below threshold"

    def test_safety_detection_sensitivity(self):
        """Test safety violation detection sensitivity"""
        safety_samples = self.test_data['safety_violations']
        detected_violations = 0
        
        for sample in safety_samples:
            result = self.object_model.detect_safety_violations(sample['image'])
            if result['violations']:
                detected_violations += 1
        
        sensitivity = detected_violations / len(safety_samples)
        assert sensitivity >= 0.95, f"Safety detection sensitivity {sensitivity} below threshold"
```

### Performance Tests
```python
# tests/ai/test_model_performance.py
import time
import pytest
from src.ai.models import VideoProcessor

class TestModelPerformance:
    def setup_method(self):
        self.processor = VideoProcessor()

    def test_video_processing_latency(self):
        """Test video processing latency requirements"""
        test_video = self.load_test_video('sample_30s.mp4')
        
        start_time = time.time()
        result = self.processor.process_video(test_video)
        processing_time = time.time() - start_time
        
        # Should process 30s video in under 60s
        assert processing_time < 60, f"Processing took {processing_time}s, exceeds 60s limit"
        assert result['status'] == 'completed'

    def test_concurrent_processing(self):
        """Test concurrent video processing capability"""
        import concurrent.futures
        
        test_videos = [self.load_test_video(f'test_{i}.mp4') for i in range(5)]
        
        start_time = time.time()
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(self.processor.process_video, video) 
                      for video in test_videos]
            results = [future.result() for future in futures]
        
        total_time = time.time() - start_time
        
        # Concurrent processing should be faster than sequential
        assert total_time < 180, f"Concurrent processing took {total_time}s"
        assert all(r['status'] == 'completed' for r in results)
```

## End-to-End Testing

### Playwright E2E Tests
```javascript
// tests/e2e/video-analytics.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Video Analytics Workflow', () => {
  test('complete video upload and analysis workflow', async ({ page }) => {
    // Navigate to application
    await page.goto('/');
    
    // Login
    await page.fill('[data-testid=email]', 'test@example.com');
    await page.fill('[data-testid=password]', 'password');
    await page.click('[data-testid=login-button]');
    
    // Navigate to video analytics
    await page.click('text=Video Analytics');
    await expect(page).toHaveURL('/video-analytics');
    
    // Upload video
    await page.setInputFiles('[data-testid=video-upload]', 'test/fixtures/construction_sample.mp4');
    await page.click('[data-testid=upload-button]');
    
    // Wait for processing to complete
    await expect(page.locator('[data-testid=processing-status]')).toHaveText('Processing...', { timeout: 5000 });
    await expect(page.locator('[data-testid=processing-status]')).toHaveText('Completed', { timeout: 120000 });
    
    // Verify analysis results
    await expect(page.locator('[data-testid=analysis-summary]')).toBeVisible();
    await expect(page.locator('[data-testid=detected-objects]')).toContainText('asphalt_paver');
    await expect(page.locator('[data-testid=activities-list]')).toContainText('paving');
  });

  test('semantic search functionality', async ({ page }) => {
    await page.goto('/ai-analytics');
    
    // Navigate to search tab
    await page.click('text=Video Search');
    
    // Perform search
    await page.fill('[data-testid=search-input]', 'workers without hard hats');
    await page.click('[data-testid=search-button]');
    
    // Verify search results
    await expect(page.locator('[data-testid=search-results]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid=result-item]').first()).toBeVisible();
  });

  test('real-time activity monitoring', async ({ page }) => {
    await page.goto('/ai-analytics');
    
    // Check real-time connection status
    await expect(page.locator('[data-testid=connection-status]')).toHaveText('Connected');
    
    // Verify activity timeline updates
    const initialActivityCount = await page.locator('[data-testid=activity-item]').count();
    
    // Wait for new activities (simulated)
    await page.waitForTimeout(5000);
    
    const updatedActivityCount = await page.locator('[data-testid=activity-item]').count();
    expect(updatedActivityCount).toBeGreaterThanOrEqual(initialActivityCount);
  });
});
```

## Load Testing

### API Load Tests
```javascript
// tests/load/api-load.test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
  },
};

export default function () {
  // Test video upload endpoint
  let uploadResponse = http.post('http://localhost:5000/api/v2/videos/upload', {
    file: http.file(open('test/fixtures/sample_video.mp4', 'b'), 'sample_video.mp4'),
  });
  
  check(uploadResponse, {
    'upload status is 200': (r) => r.status === 200,
    'upload response time < 5s': (r) => r.timings.duration < 5000,
  });

  // Test search endpoint
  let searchResponse = http.post('http://localhost:5000/api/v2/search/semantic', 
    JSON.stringify({
      query: 'construction activities',
      limit: 10
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(searchResponse, {
    'search status is 200': (r) => r.status === 200,
    'search response time < 1s': (r) => r.timings.duration < 1000,
  });

  sleep(1);
}
```

## Test Data Management

### Test Fixtures
```javascript
// test/fixtures/index.js
export const mockVideoAnalysis = {
  summary: 'Construction site with paving operations',
  objects: [
    { category: 'asphalt_paver', confidence: 0.94, bbox: { x: 0.2, y: 0.3, width: 0.4, height: 0.3 } },
    { category: 'construction_worker', confidence: 0.89, bbox: { x: 0.6, y: 0.4, width: 0.2, height: 0.4 } }
  ],
  activities: ['paving', 'quality_inspection'],
  safetyEvents: [],
  aiModelsUsed: ['NVIDIA VILA', 'Llama-3.1-70B'],
  processingTime: 45.2,
  confidence: 0.91
};

export const mockSafetyAlert = {
  id: 'alert_001',
  type: 'ppe_violation',
  severity: 'high',
  description: 'Worker without hard hat detected near operating equipment',
  cameraId: 'CAM-003',
  timestamp: new Date().toISOString(),
  location: { x: 0.5, y: 0.6 },
  confidence: 0.88
};
```

## Running Tests

### Development Testing
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage

# Run AI model tests
npm run test:ai

# Watch mode for development
npm run test:watch
```

### CI/CD Pipeline Testing
```bash
# Run tests in CI environment
npm run test:ci

# Generate test reports
npm run test:report

# Run security tests
npm run test:security

# Performance testing
npm run test:performance
```

### Test Coverage Requirements
- **Unit Tests**: 80% minimum coverage
- **Integration Tests**: 70% minimum coverage
- **AI Model Accuracy**: 85% minimum for object detection, 80% for activity recognition
- **Safety Detection**: 95% minimum sensitivity for critical violations

## Continuous Testing

### Automated Test Execution
- Unit tests run on every commit
- Integration tests run on pull requests
- E2E tests run on staging deployments
- Performance tests run weekly
- AI model validation runs monthly

### Test Monitoring
- Track test execution times
- Monitor test failure rates
- Alert on performance degradation
- Generate test coverage reports
