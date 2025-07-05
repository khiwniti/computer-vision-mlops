# 🚛 Mock System Guide - AsphaltTracker Testing Environment

## Overview

The AsphaltTracker Mock System provides a comprehensive testing environment that simulates **100 trucks with 400+ cameras** for testing all platform functions including AI monitoring, GPS tracking, fraud detection, streaming, and analytics.

## 🎯 Features

### Core Mock Data
- **100 Trucks** with realistic configurations
- **400+ Cameras** (4-6 per truck) with different positions
- **5 Vendor Companies** with different API types (Hikvision, Dahua, Axis, Custom)
- **100 Drivers** with performance histories
- **Comprehensive AI Data** including incidents, scores, and fraud alerts

### Real-time Simulation
- **Live GPS Tracking** with realistic route following
- **AI Incident Generation** (drowsiness, phone usage, safety violations)
- **Fraud Detection** (route deviation, unauthorized stops, cargo tampering)
- **Dynamic Status Changes** (trucks going online/offline/maintenance)
- **Streaming Integration** with camera failure/recovery simulation

### Analytics & Reporting
- **30 Days Historical Data** for trend analysis
- **Predictive Analytics** with risk assessment
- **KPI Scoring** with safety, efficiency, and compliance metrics
- **System Health Monitoring** with performance metrics
- **API Logs** for debugging and monitoring

## 🚀 Quick Start

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Quick Setup (Recommended for Testing)
```bash
# Populate database with minimal data for quick testing
npm run mock:populate

# Or use curl directly
curl -X POST http://localhost:5000/api/mock/populate/quick
```

### 3. Start Real-time Simulation
```bash
# Start simulation with default settings
npm run mock:simulate

# Or use curl with custom settings
curl -X POST http://localhost:5000/api/mock/simulation/start \
  -H "Content-Type: application/json" \
  -d '{
    "updateIntervalMs": 30000,
    "incidentProbability": 0.001,
    "fraudProbability": 0.0005,
    "gpsUpdateEnabled": true,
    "aiIncidentsEnabled": true,
    "fraudDetectionEnabled": true
  }'
```

### 4. Run Comprehensive Tests
```bash
# Test all mock system functionality
npm run test:mock
```

## 📊 API Endpoints

### System Management
```bash
# Get system status
GET /api/mock/status

# Get system information
GET /api/mock/info

# Health check
GET /api/mock/health

# Reset all data
DELETE /api/mock/reset
```

### Database Population
```bash
# Full population with all data types
POST /api/mock/populate
{
  "clearExisting": true,
  "includeAnalytics": true,
  "includeHistoricalData": true,
  "truckCount": 100,
  "daysOfHistory": 30,
  "startSimulation": false
}

# Quick population (minimal data)
POST /api/mock/populate/quick

# Preview generated data
GET /api/mock/generate/preview?truckCount=5&includeAnalytics=true
```

### Simulation Control
```bash
# Start simulation
POST /api/mock/simulation/start

# Stop simulation
POST /api/mock/simulation/stop

# Get simulation status
GET /api/mock/simulation/status

# Update simulation configuration
PUT /api/mock/simulation/config
{
  "updateIntervalMs": 10000,
  "incidentProbability": 0.01,
  "fraudProbability": 0.005
}
```

### Streaming Integration
```bash
# Start streaming integration
POST /api/mock/streaming/start

# Stop streaming integration
POST /api/mock/streaming/stop

# Get streaming status
GET /api/mock/streaming/status

# Get truck-specific streaming status
GET /api/mock/streaming/truck/1

# Simulate camera failure
POST /api/mock/streaming/simulate/camera-failure
{
  "truckId": 1,
  "position": "front"
}

# Simulate camera recovery
POST /api/mock/streaming/simulate/camera-recovery
{
  "truckId": 1,
  "position": "front"
}
```

### Testing
```bash
# Run comprehensive system test
POST /api/mock/test/all-systems
```

## 🎛️ Configuration Options

### Simulation Configuration
- **updateIntervalMs**: How often simulation updates (default: 30000ms)
- **incidentProbability**: Probability of AI incidents per update (default: 0.001)
- **fraudProbability**: Probability of fraud alerts per update (default: 0.0005)
- **statusChangeProbability**: Probability of truck status changes (default: 0.002)
- **gpsUpdateEnabled**: Enable GPS position updates (default: true)
- **aiIncidentsEnabled**: Enable AI incident generation (default: true)
- **fraudDetectionEnabled**: Enable fraud alert generation (default: true)

### Streaming Configuration
- **streamQuality**: low | medium | high (default: medium)
- **frameRate**: Frames per second (default: 30)
- **enableRecording**: Enable recording simulation (default: true)

## 📈 Data Types Generated

### Core Entities
- **Vendors**: 5 companies with different API types
- **Drivers**: 100 drivers with performance metrics
- **Trucks**: 100 trucks with GPS coordinates and status
- **Cameras**: 400+ cameras with streaming URLs
- **Geofences**: Geographic boundaries for monitoring

### Operational Data
- **Shipments**: Delivery assignments with multiple trucks
- **Trips**: Individual truck journeys with KPIs
- **GPS Points**: Real-time location tracking data
- **Geofence Events**: Boundary crossing notifications

### AI & Analytics
- **AI Incidents**: Driver behavior violations
- **Driver Scores**: Daily performance metrics
- **Fraud Alerts**: Suspicious activity detection
- **System Health**: Performance monitoring data
- **API Logs**: Vendor API interaction logs

## 🧪 Testing Scenarios

### Basic Functionality Test
```bash
# 1. Populate database
curl -X POST http://localhost:5000/api/mock/populate/quick

# 2. Verify data
curl http://localhost:5000/api/trucks | jq 'length'
curl http://localhost:5000/api/drivers | jq 'length'

# 3. Check analytics
curl http://localhost:5000/api/analytics/dashboard | jq '.dashboard.overview'
```

### Real-time Simulation Test
```bash
# 1. Start simulation
curl -X POST http://localhost:5000/api/mock/simulation/start

# 2. Wait and check for new data
sleep 30
curl http://localhost:5000/api/mock/simulation/status

# 3. Stop simulation
curl -X POST http://localhost:5000/api/mock/simulation/stop
```

### Streaming Integration Test
```bash
# 1. Start streaming
curl -X POST http://localhost:5000/api/mock/streaming/start

# 2. Check streaming status
curl http://localhost:5000/api/mock/streaming/status

# 3. Simulate camera failure
curl -X POST http://localhost:5000/api/mock/streaming/simulate/camera-failure \
  -H "Content-Type: application/json" \
  -d '{"truckId": 1, "position": "front"}'

# 4. Check truck streaming status
curl http://localhost:5000/api/mock/streaming/truck/1
```

## 🔧 npm Scripts

```bash
# Mock system commands
npm run mock:populate    # Quick database population
npm run mock:simulate    # Start simulation
npm run mock:status      # Check system status
npm run mock:info        # Get system information
npm run test:mock        # Run comprehensive tests

# Development commands
npm run dev              # Start development server
npm run build            # Build for production
npm run check            # TypeScript type checking

# Streaming commands
npm run streaming:health # Check streaming server health
npm run streaming:status # Get streaming status
npm run streaming:init   # Initialize streaming server

# Data commands
npm run dataset:download # Download Kaggle dataset
```

## 📱 Dashboard Integration

Once the mock system is running, you can access:

### Main Dashboard
- **URL**: http://localhost:3000
- **Live Monitoring**: Real-time truck and camera status
- **Analytics Dashboard**: Comprehensive reporting and insights
- **GPS Tracking**: Real-time location monitoring

### Key Dashboard Features
- **Fleet Overview**: 100 trucks with status indicators
- **Live Camera Feeds**: 400+ camera stream status
- **AI Incidents**: Real-time behavior analysis alerts
- **Fraud Detection**: Suspicious activity monitoring
- **Performance Analytics**: KPI trends and predictions
- **System Health**: Component status monitoring

## 🎯 Use Cases

### Development Testing
- Test UI components with realistic data
- Verify API endpoints with comprehensive datasets
- Debug real-time features with live simulation

### Performance Testing
- Load test with 400 concurrent camera streams
- Stress test analytics with 30 days of historical data
- Validate system performance under realistic conditions

### Feature Validation
- Test AI incident detection workflows
- Validate fraud detection algorithms
- Verify GPS tracking and geo-fencing
- Test predictive analytics accuracy

### Demo Preparation
- Generate impressive datasets for demonstrations
- Simulate realistic operational scenarios
- Show live monitoring capabilities

## 🐛 Troubleshooting

### Common Issues

#### Server Not Responding
```bash
# Check if server is running
curl http://localhost:5000/api/mock/health

# If not running, start the server
npm run dev
```

#### Database Population Fails
```bash
# Reset and try again
curl -X DELETE http://localhost:5000/api/mock/reset
curl -X POST http://localhost:5000/api/mock/populate/quick
```

#### Simulation Not Generating Data
```bash
# Check simulation status
curl http://localhost:5000/api/mock/simulation/status

# Restart simulation with higher probabilities
curl -X POST http://localhost:5000/api/mock/simulation/start \
  -H "Content-Type: application/json" \
  -d '{"incidentProbability": 0.1, "fraudProbability": 0.05}'
```

### Debug Commands
```bash
# Get detailed system status
curl http://localhost:5000/api/mock/status | jq .

# Check error logs in the console where you ran `npm run dev`

# Verify database has data
curl http://localhost:5000/api/trucks | jq 'length'
curl http://localhost:5000/api/drivers | jq 'length'
```

## 🎉 Success Indicators

When the mock system is working correctly, you should see:

✅ **Database**: 50-100 trucks, drivers, and 200-400 cameras
✅ **Simulation**: Real-time GPS updates and status changes
✅ **AI Data**: Incidents and driver scores being generated
✅ **Analytics**: Dashboard showing trends and predictions
✅ **Streaming**: Camera feeds with realistic status updates
✅ **APIs**: All endpoints responding with realistic data

---

**Ready to test your logistics platform with realistic data! 🚛📊**