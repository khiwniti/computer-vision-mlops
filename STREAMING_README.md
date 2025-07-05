# Real-Time CCTV Streaming API

This module provides a comprehensive streaming API for simulating real-time CCTV feeds using actual driving video data from Kaggle. It enables testing of our AI computer vision pipeline with realistic footage in a controlled environment.

## Features

- **FFmpeg-based Streaming Server**: Multi-stream RTSP/RTMP server supporting 400+ concurrent feeds
- **Kaggle Dataset Integration**: Download and process driving videos for realistic simulation
- **AI Pipeline Integration**: Real-time frame extraction and analysis
- **Stream Management**: Start, stop, restart, and monitor individual or grouped streams
- **Load Balancing**: Automatic scaling based on system resources
- **Health Monitoring**: Real-time stream health and performance metrics

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Video Dataset │───▶│  FFmpeg Server  │───▶│ Frame Extractor │
│   Processor     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▲                        │
                                │                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Stream Manager  │───▶│  Streaming API  │    │  AI Analyzer    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Quick Start

### 1. Download Video Dataset

```bash
# Download and process Kaggle driving videos
npm run dataset:download

# Or manually with curl
curl -L -o data/videos/temp/driving-videos.zip \
  https://www.kaggle.com/api/v1/datasets/download/robikscube/driving-video-with-object-tracking
```

### 2. Start the Server

```bash
# Start the development server
npm run dev
```

### 3. Initialize Streams

```bash
# Initialize streams for all trucks
npm run streaming:init

# Or manually
curl -X POST http://localhost:5000/api/streams/initialize
```

### 4. Monitor Streams

```bash
# Check system health
npm run streaming:health

# Get detailed status
npm run streaming:status

# Run full test suite
npm run test:streaming
```

## API Endpoints

### System Management

- **GET** `/api/streams/health` - Health check
- **GET** `/api/streams/status` - System status and metrics
- **POST** `/api/streams/initialize` - Initialize all truck streams

### Stream Groups (Truck-based)

- **GET** `/api/streams/groups` - List all stream groups
- **GET** `/api/streams/groups/:truckId` - Get specific truck streams
- **POST** `/api/streams/groups/:truckId/start` - Start all truck streams
- **POST** `/api/streams/groups/:truckId/stop` - Stop all truck streams
- **POST** `/api/streams/groups/:truckId/restart` - Restart all truck streams

### Individual Camera Control

- **POST** `/api/streams/groups/:truckId/cameras/:position/start` - Start specific camera
- **POST** `/api/streams/groups/:truckId/cameras/:position/stop` - Stop specific camera

### Dataset Management

- **GET** `/api/streams/dataset/videos` - List available videos
- **GET** `/api/streams/dataset/stats` - Dataset statistics
- **POST** `/api/streams/dataset/download` - Download Kaggle dataset
- **POST** `/api/streams/dataset/upload` - Upload video files
- **GET** `/api/streams/dataset/jobs` - List processing jobs
- **GET** `/api/streams/dataset/jobs/:jobId` - Get job status

### Custom Streams

- **POST** `/api/streams/custom` - Create custom stream
- **DELETE** `/api/streams/:streamId` - Stop and remove stream
- **GET** `/api/streams/urls` - Get all active stream URLs

## Configuration

### Stream Configuration

```typescript
interface StreamConfig {
  id: string;
  name: string;
  sourceVideo: string;        // Video file in dataset
  rtspPort: number;          // RTSP port (8554+)
  resolution: '1920x1080' | '1280x720' | '640x480';
  frameRate: number;         // FPS
  bitrate: string;           // e.g., '2000k'
  loop: boolean;             // Loop video
  cameraPosition: 'front' | 'back' | 'left' | 'right' | 'driver_facing' | 'cargo';
  truckId: number;
  enabled: boolean;
}
```

### Frame Extraction Configuration

```typescript
interface FrameExtractionConfig {
  streamId: string;
  rtspUrl: string;
  extractionRate: number;    // Frames per second to extract
  resolution: string;        // Processing resolution
  enableAI: boolean;         // Enable AI analysis
  cameraId: number;
  truckId: number;
  driverId?: number;
}
```

## Usage Examples

### Create Custom Stream

```bash
curl -X POST http://localhost:5000/api/streams/custom \
  -H "Content-Type: application/json" \
  -d '{
    "id": "truck_1_front",
    "name": "Truck 1 Front Camera",
    "sourceVideo": "driving_sample_1.mp4",
    "rtspPort": 8554,
    "resolution": "1280x720",
    "frameRate": 25,
    "bitrate": "2000k",
    "loop": true,
    "cameraPosition": "front",
    "truckId": 1,
    "enabled": true
  }'
```

### Monitor System Status

```bash
curl http://localhost:5000/api/streams/status | jq '{
  system: .system.status,
  streams: .streams.runningStreams,
  total: .streams.totalStreams,
  bandwidth: .streams.totalBandwidth
}'
```

### View Stream with VLC

```bash
# View RTSP stream in VLC
vlc rtsp://localhost:8554/truck_1_front

# Or use ffplay
ffplay rtsp://localhost:8554/truck_1_front
```

## AI Integration

The streaming system automatically integrates with the AI analysis pipeline:

1. **Frame Extraction**: Real-time frame extraction from RTSP streams
2. **AI Processing**: Frames are sent to the AI analyzer for driver behavior analysis
3. **Real-time Results**: AI results are available through WebSocket connections
4. **Performance Monitoring**: Frame processing rates and AI performance metrics

### AI Pipeline Flow

```
RTSP Stream → Frame Extractor → AI Analyzer → KPI Calculator → WebSocket → Dashboard
```

## Performance Tuning

### System Limits

- **Max Concurrent Streams**: 400 (configurable)
- **Frame Extraction Rate**: 2 FPS per stream (for AI processing)
- **Queue Size**: 30 frames per stream
- **Auto-scaling**: Enabled based on system load

### Optimization Tips

1. **Resolution**: Use 640x480 for AI processing to reduce load
2. **Bitrate**: 2000k provides good quality/performance balance
3. **Frame Rate**: 25 FPS for streams, 2 FPS for AI extraction
4. **Load Balancing**: Enable auto-scaling for production

## Monitoring and Debugging

### Health Monitoring

```bash
# System health
curl http://localhost:5000/api/streams/health

# Detailed metrics
curl http://localhost:5000/api/streams/status | jq .streams

# Individual stream status
curl http://localhost:5000/api/streams/groups/1
```

### Logs

- **FFmpeg Logs**: Stream encoding/transmission logs
- **Frame Extractor Logs**: Frame processing logs
- **AI Pipeline Logs**: Computer vision analysis logs
- **Stream Manager Logs**: High-level coordination logs

### Common Issues

1. **Stream Won't Start**: Check video file exists and FFmpeg is installed
2. **High CPU Usage**: Reduce concurrent streams or frame extraction rate
3. **Memory Issues**: Adjust frame queue sizes
4. **Network Issues**: Check RTSP port availability

## Development

### Project Structure

```
server/
├── streaming/
│   ├── ffmpeg-server.ts          # Core FFmpeg streaming
│   ├── stream-manager.ts         # Multi-stream coordination
│   ├── video-dataset-processor.ts # Video processing
│   └── frame-extractor.ts        # Real-time frame extraction
├── streaming-api/
│   └── stream-routes.ts          # REST API endpoints
└── ai-pipeline/
    ├── ai-analyzer.ts            # AI computer vision
    └── kpi-calculator.ts         # Driver KPI scoring
```

### Adding New Features

1. **New Stream Sources**: Extend `VideoDatasetProcessor`
2. **Custom AI Models**: Modify `AIAnalysisEngine`
3. **Additional Metrics**: Update `StreamManager`
4. **New Endpoints**: Add to `stream-routes.ts`

## Dependencies

### Required

- **FFmpeg**: Video processing and streaming
- **Node.js**: Runtime environment
- **Express**: Web server
- **Multer**: File upload handling

### Optional

- **Kaggle CLI**: For dataset download
- **VLC/ffplay**: For stream viewing
- **jq**: For JSON parsing in scripts

## License

MIT License - See LICENSE file for details.

## Support

For issues and questions:

1. Check the [troubleshooting section](#common-issues)
2. Review the API documentation
3. Run the test suite: `npm run test:streaming`
4. Check system health: `npm run streaming:health`