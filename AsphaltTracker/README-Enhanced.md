# AsphaltTracker Enhanced - AI-Powered Construction Monitoring

A next-generation construction site monitoring system powered by NVIDIA AI and advanced video analytics. Built for real-time safety monitoring, activity tracking, and intelligent construction management.

## 🚀 Features

### 🤖 AI-Powered Video Analytics
- **NVIDIA VSS Integration**: Advanced video analysis using NVIDIA VILA, Llama-3.1-70B, and specialized AI models
- **Real-time Object Detection**: Automatic detection of equipment, workers, materials, and safety violations
- **Activity Recognition**: AI-powered identification of construction activities (paving, rolling, inspection, etc.)
- **Safety Compliance Monitoring**: Automated PPE detection, proximity alerts, and safety zone monitoring
- **Semantic Video Search**: Natural language search through video content using AI embeddings

### 📹 Advanced Video Management
- **Multi-Camera Coordination**: Support for 400+ concurrent camera streams
- **Real-time Processing**: Live video analysis with sub-second latency
- **Smart Frame Extraction**: Intelligent keyframe selection for optimal AI processing
- **Video Transcription**: Audio-to-text conversion using NVIDIA ASR models
- **Quality Assessment**: AI-driven construction quality evaluation

### 🛡️ Safety & Compliance
- **Real-time Safety Alerts**: Instant notifications for safety violations
- **PPE Compliance Tracking**: Automated detection of safety equipment usage
- **Proximity Monitoring**: Equipment-worker distance tracking with alerts
- **Safety Zone Management**: Restricted area monitoring and violation detection
- **Incident Documentation**: Automated safety incident recording and reporting

### 📊 Analytics & Insights
- **Progress Tracking**: Real-time construction progress monitoring with AI analysis
- **Productivity Metrics**: Equipment utilization and workforce efficiency tracking
- **Predictive Analytics**: AI-powered insights for project optimization
- **Quality Scoring**: Automated quality assessment using computer vision
- **Performance Dashboards**: Comprehensive analytics with real-time updates

## 🏗️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for modern styling
- **Shadcn/ui** component library
- **Recharts** for advanced data visualization
- **WebSocket** for real-time updates

### Backend & AI
- **Node.js** with Express and TypeScript
- **NVIDIA VSS API** for AI video processing
- **NVIDIA VILA** for vision-language understanding
- **Llama-3.1-70B** for text generation and analysis
- **NVIDIA Embedding Models** for semantic search
- **NVIDIA ASR** for audio transcription
- **Restack.io** for AI workflow orchestration

### Databases & Storage
- **PostgreSQL** with Drizzle ORM for application data
- **ChromaDB** for vector embeddings and semantic search
- **Neo4j** for relationship tracking and graph analytics
- **InfluxDB** for time-series activity data
- **Redis** for caching and real-time data
- **Cloud Storage** (S3/GCS/Azure) for video and media files

### Infrastructure & Monitoring
- **Docker** containerization with multi-stage builds
- **Kubernetes** for production orchestration
- **Prometheus** for comprehensive monitoring
- **Grafana** for advanced dashboards and alerting

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- NVIDIA API Key (for AI features)
- PostgreSQL database
- Redis instance

### Environment Setup

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd AsphaltTracker
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start with Docker Compose:**
```bash
# Start all services including AI models
docker-compose -f docker-compose.vss.yml up -d

# Or start basic services only
docker-compose up -d
```

4. **Run development server:**
```bash
npm run dev
```

### Production Deployment

#### Using Docker
```bash
# Build production image
docker build -t asphalt-tracker:latest .

# Run with production configuration
docker run -d \
  --name asphalt-tracker \
  -p 5000:5000 \
  -p 5001:5001 \
  -e NODE_ENV=production \
  -e NVIDIA_API_KEY=your_key_here \
  asphalt-tracker:latest
```

#### Using Kubernetes
```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/monitoring.yaml
```

## 🔧 Configuration

### Environment Variables

#### Core Application
```bash
NODE_ENV=production
PORT=5000
WS_PORT=5001
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
```

#### NVIDIA AI Configuration
```bash
NVIDIA_API_KEY=your_nvidia_api_key
VLM_MODEL=nvidia/vila
LLM_MODEL=meta/llama-3.1-70b-instruct
EMBEDDING_MODEL=nvidia/llama-3_2-nv-embedqa-1b-v2
ASR_MODEL=nvidia/parakeet-ctc-0_6b-asr
```

#### AI Features
```bash
FEATURE_REAL_TIME_PROCESSING=true
FEATURE_ADVANCED_ANALYTICS=true
FEATURE_SAFETY_MONITORING=true
AI_CONFIDENCE_THRESHOLD=0.75
MAX_CONCURRENT_PROCESSING=10
```

#### Safety Thresholds
```bash
SAFETY_PPE_COMPLIANCE=0.95
SAFETY_PROXIMITY_DISTANCE=5
SAFETY_SPEED_LIMIT=25
```

## 📊 Monitoring & Observability

### Prometheus Metrics
- Application performance metrics
- AI model performance and accuracy
- Video processing latency and throughput
- Safety alert rates and response times
- Equipment utilization and efficiency

### Grafana Dashboards
- **AI Analytics Dashboard**: Model performance, processing metrics
- **Safety Monitoring Dashboard**: Compliance rates, incident tracking
- **Infrastructure Dashboard**: System health, resource usage
- **Activity Timeline**: Real-time construction activities

### Health Checks
```bash
# Application health
curl http://localhost:5000/health

# AI models health
curl http://localhost:5000/ai-health

# Database connectivity
curl http://localhost:5000/db-health
```

## 🔒 Security

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- API key management for external integrations
- Secure WebSocket connections

### Data Protection
- Encryption at rest and in transit
- Video data anonymization options
- GDPR compliance features
- Audit logging for all actions

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# AI model tests
npm run test:ai
```

### Load Testing
```bash
# Test video processing pipeline
npm run load-test:video

# Test real-time streaming
npm run load-test:streaming

# Test AI inference
npm run load-test:ai
```

## 📚 API Documentation

### REST API Endpoints
- `GET /api/videos` - List processed videos
- `POST /api/videos/upload` - Upload video for processing
- `GET /api/activities` - Get activity timeline
- `GET /api/safety/alerts` - Get safety alerts
- `POST /api/search/semantic` - Semantic video search

### WebSocket Events
- `activity_event` - Real-time activity detection
- `safety_alert` - Safety violation alerts
- `progress_update` - Construction progress updates
- `camera_status` - Camera connectivity status

### AI API Endpoints
- `POST /api/ai/analyze` - Analyze video with AI
- `POST /api/ai/search` - Semantic search
- `GET /api/ai/models/status` - AI model health
- `POST /api/ai/transcribe` - Audio transcription

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.asphalttracker.com](https://docs.asphalttracker.com)
- **Issues**: [GitHub Issues](https://github.com/your-org/asphalt-tracker/issues)
- **Discord**: [Community Discord](https://discord.gg/asphalt-tracker)
- **Email**: support@asphalttracker.com

## 🙏 Acknowledgments

- **NVIDIA** for providing advanced AI models and VSS technology
- **Restack.io** for workflow orchestration capabilities
- **Open Source Community** for the amazing tools and libraries

---

**Built with ❤️ for the construction industry**
