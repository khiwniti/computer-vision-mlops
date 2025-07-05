# AsphaltTracker + VSS Integration

This document describes the integration of NVIDIA's Video Search and Summarization (VSS) AI Blueprint with AsphaltTracker for enhanced construction site video analytics.

## Overview

The integration combines AsphaltTracker's construction fleet management capabilities with NVIDIA VSS's AI-powered video analysis to provide:

- **Automated Video Analysis**: AI-powered analysis of construction site videos
- **Object Detection**: Detection of construction vehicles, workers, safety equipment
- **Safety Compliance**: Automated PPE detection and safety zone monitoring
- **Progress Tracking**: Paving progress monitoring and coverage measurement
- **Intelligent Search**: Natural language search through video content
- **Real-time Alerts**: AI-generated alerts for safety violations or incidents

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AsphaltTracker│    │   VSS Engine    │    │  AI Models      │
│   Dashboard     │────│                 │────│  - VILA (VLM)   │
│                 │    │  - Processing   │    │  - Llama (LLM)  │
│  - Video Upload │    │  - Analysis     │    │  - Embedding    │
│  - Analytics    │    │  - Indexing     │    │  - Reranker     │
│  - Search       │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
              ┌─────────────────────────────────┐
              │        Data Storage             │
              │  - Vector Database (ChromaDB)   │
              │  - Graph Database (Neo4j)      │
              │  - Video Storage               │
              │  - Processing Results          │
              └─────────────────────────────────┘
```

## Features

### 1. Video Upload and Processing
- Drag-and-drop video upload interface
- Automatic video processing pipeline
- Real-time progress tracking
- Support for multiple video formats

### 2. AI-Powered Analysis
- **Vision Language Model (VILA)**: Generates detailed scene descriptions
- **Large Language Model (Llama)**: Creates comprehensive summaries
- **Object Detection**: Identifies construction-specific objects:
  - Construction vehicles (pavers, rollers, trucks)
  - Workers and safety equipment
  - Road markings and infrastructure
  - Safety cones and barriers

### 3. Safety Compliance Monitoring
- PPE detection and compliance checking
- Safety zone monitoring
- Proximity alert detection
- Automated safety reporting

### 4. Progress Tracking
- Paving progress measurement
- Coverage area calculation
- Timeline tracking
- Performance metrics

### 5. Intelligent Search
- Natural language video search
- Content-based retrieval
- Tag-based filtering
- Semantic search capabilities

## Installation

### Prerequisites
- Docker and Docker Compose
- NVIDIA Docker runtime
- NVIDIA GPU (see hardware requirements)
- Node.js 18+ (for development)

### Hardware Requirements

| Deployment Type | Minimum GPUs | Recommended |
|---|---|---|
| Full Local | 8x H100/A100 | 8x H200/B200 |
| Reduced Compute | 4x H100/A100 | 6x L40S |
| Single GPU | 1x H100/A100 | 1x H200/B200 |
| Remote Models | 1x GPU (8GB+) | Any modern GPU |

### Quick Start

1. **Clone and Setup**
   ```bash
   cd AsphaltTracker
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Deploy with VSS (Docker)**
   ```bash
   # For full local deployment
   docker-compose -f docker-compose.vss.yml up -d
   
   # For development
   npm run dev
   ```

4. **Configure Models**
   - Update `.env` with model endpoints
   - Configure NVIDIA API keys for remote models
   - Set up storage paths

### Configuration

#### Environment Variables
```bash
# VSS Configuration
VSS_ENGINE_HOST=localhost
VSS_ENGINE_PORT=8000
VSS_API_KEY=your-api-key

# Model Endpoints
VLM_ENDPOINT=http://localhost:8001
LLM_ENDPOINT=http://localhost:8002
EMBEDDING_ENDPOINT=http://localhost:8003
RERANKER_ENDPOINT=http://localhost:8004

# Storage
VIDEO_STORAGE_PATH=./uploads/videos
PROCESSED_STORAGE_PATH=./data/processed

# API Keys (for remote deployment)
NVIDIA_API_KEY=your-nvidia-api-key
```

#### Custom Configuration
Edit `server/vss-integration/vss-config.js` to customize:
- Object detection categories
- Safety compliance rules
- Processing parameters
- Storage settings

## Usage

### 1. Upload Videos
1. Navigate to "Video Analytics" in the dashboard
2. Drag and drop video files or click to select
3. Monitor processing progress in real-time

### 2. View Analysis Results
1. Check the "Video Library" tab for processed videos
2. Click on any video to view detailed analysis
3. Review AI-generated summaries and tags

### 3. Search Videos
1. Use the "Search & Insights" tab
2. Enter natural language queries like:
   - "Show me videos with safety violations"
   - "Find paving operations from last week"
   - "Videos with worker activity"

### 4. Monitor Progress
1. View analytics summary in the dashboard
2. Track processing metrics
3. Monitor safety compliance scores

## API Endpoints

### Video Management
- `POST /api/video/upload` - Upload video for processing
- `GET /api/video/status/:id` - Get processing status
- `GET /api/video/library` - List processed videos
- `GET /api/video/details/:id` - Get detailed analysis

### Search and Analytics
- `POST /api/video/search` - Search videos with natural language
- `GET /api/video/analytics/summary` - Get analytics summary
- `DELETE /api/video/:id` - Delete video and analysis

## Development

### Adding Custom Object Detection
1. Edit `vss-config.js` to add new object categories
2. Update the CV pipeline in `video-processor.js`
3. Modify the analysis logic for new object types

### Extending Safety Rules
1. Update the `safetyCompliance` configuration
2. Add new safety checks in the processing pipeline
3. Customize alert thresholds

### Custom Model Integration
1. Add new model endpoints to configuration
2. Update the processing pipeline
3. Modify the analysis workflow

## Monitoring

### System Health
- Prometheus metrics at `http://localhost:9090`
- Grafana dashboards at `http://localhost:3000`
- Processing queue monitoring

### Performance Metrics
- Video processing times
- Model inference latencies
- Storage usage
- API response times

## Troubleshooting

### Common Issues

1. **GPU Memory Issues**
   - Reduce batch sizes in model configuration
   - Use model quantization
   - Deploy models on separate GPUs

2. **Processing Failures**
   - Check video format compatibility
   - Verify model endpoints are accessible
   - Review error logs in containers

3. **Slow Processing**
   - Optimize frame extraction settings
   - Adjust chunk sizes
   - Use GPU acceleration

### Logs and Debugging
```bash
# View application logs
docker-compose logs asphalt-tracker

# View VSS engine logs
docker-compose logs vss-engine

# Check model status
curl http://localhost:8001/health
```

## Production Deployment

### Scaling Recommendations
1. **Load Balancing**: Use multiple VSS engine instances
2. **Storage**: Implement distributed storage (S3, GCS)
3. **Database**: Use managed vector/graph databases
4. **Monitoring**: Set up comprehensive alerting

### Security Considerations
1. Enable authentication for VSS endpoints
2. Use HTTPS for all communications
3. Implement proper access controls
4. Regular security updates

## Support

For issues related to:
- **AsphaltTracker**: Create an issue in this repository
- **NVIDIA VSS**: Check [NVIDIA VSS Documentation](https://docs.nvidia.com/vss/latest/)
- **Model Deployment**: Refer to [NVIDIA NIM Documentation](https://docs.nvidia.com/nim/)

## License

This integration combines:
- AsphaltTracker: MIT License
- NVIDIA VSS: NVIDIA Software License Agreement
- AI Models: Various licenses (see individual model documentation)