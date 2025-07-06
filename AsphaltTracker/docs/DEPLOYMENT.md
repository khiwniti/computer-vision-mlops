# AsphaltTracker Enhanced Deployment Guide

## Overview

This guide covers deployment options for AsphaltTracker Enhanced, from development setup to production deployment with AI capabilities.

## Prerequisites

### System Requirements
- **CPU**: 8+ cores (16+ recommended for AI processing)
- **Memory**: 16GB RAM minimum (32GB+ recommended)
- **Storage**: 500GB+ SSD for video processing
- **GPU**: NVIDIA GPU with 8GB+ VRAM (for local AI processing)
- **Network**: High-bandwidth internet for NVIDIA API access

### Software Dependencies
- Docker 20.10+
- Docker Compose 2.0+
- Kubernetes 1.24+ (for production)
- Node.js 18+ (for development)
- PostgreSQL 15+
- Redis 7+

## Development Setup

### 1. Clone and Configure
```bash
git clone <repository-url>
cd AsphaltTracker
cp .env.example .env
```

### 2. Configure Environment Variables
```bash
# Core Application
NODE_ENV=development
PORT=5000
WS_PORT=5001
DATABASE_URL=postgresql://postgres:password@localhost:5432/asphalt_tracker
REDIS_URL=redis://localhost:6379

# NVIDIA AI Configuration
NVIDIA_API_KEY=your_nvidia_api_key_here
VLM_MODEL=nvidia/vila
LLM_MODEL=meta/llama-3.1-70b-instruct
EMBEDDING_MODEL=nvidia/llama-3_2-nv-embedqa-1b-v2
ASR_MODEL=nvidia/parakeet-ctc-0_6b-asr

# AI Features
FEATURE_REAL_TIME_PROCESSING=true
FEATURE_ADVANCED_ANALYTICS=true
AI_CONFIDENCE_THRESHOLD=0.75
```

### 3. Start Development Environment
```bash
# Install dependencies
npm install

# Start databases
docker-compose up -d postgres redis chroma neo4j influxdb

# Start development server
npm run dev
```

## Docker Deployment

### 1. Basic Docker Setup
```bash
# Build the image
docker build -t asphalt-tracker:latest .

# Run with basic configuration
docker run -d \
  --name asphalt-tracker \
  -p 5000:5000 \
  -p 5001:5001 \
  -e NODE_ENV=production \
  -e NVIDIA_API_KEY=your_key_here \
  asphalt-tracker:latest
```

### 2. Docker Compose with AI Services
```bash
# Start full stack with AI capabilities
docker-compose -f docker-compose.vss.yml up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f asphalt-tracker
```

### 3. Production Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  asphalt-tracker:
    image: asphalt-tracker:v2.0.0
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - NVIDIA_API_KEY=${NVIDIA_API_KEY}
    volumes:
      - video-storage:/app/uploads/videos
      - processed-data:/app/data/processed
    depends_on:
      - postgres
      - redis
      - prometheus
    networks:
      - asphalt-network
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
```

## Kubernetes Deployment

### 1. Create Namespace
```bash
kubectl create namespace asphalt-tracker
```

### 2. Configure Secrets
```bash
# Create secrets
kubectl create secret generic asphalt-tracker-secrets \
  --from-literal=database-url="postgresql://user:pass@postgres:5432/db" \
  --from-literal=redis-url="redis://redis:6379" \
  --from-literal=nvidia-api-key="your_nvidia_api_key" \
  --from-literal=jwt-secret="your_jwt_secret" \
  -n asphalt-tracker
```

### 3. Deploy Application
```bash
# Apply all manifests
kubectl apply -f k8s/ -n asphalt-tracker

# Check deployment status
kubectl get pods -n asphalt-tracker
kubectl get services -n asphalt-tracker

# View logs
kubectl logs -f deployment/asphalt-tracker -n asphalt-tracker
```

### 4. Configure Ingress
```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: asphalt-tracker-ingress
  namespace: asphalt-tracker
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-body-size: 500m
spec:
  tls:
  - hosts:
    - asphalttracker.yourdomain.com
    secretName: asphalt-tracker-tls
  rules:
  - host: asphalttracker.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: asphalt-tracker-service
            port:
              number: 80
```

## Cloud Deployment

### AWS EKS Deployment
```bash
# Create EKS cluster
eksctl create cluster \
  --name asphalt-tracker \
  --region us-west-2 \
  --nodegroup-name workers \
  --node-type m5.xlarge \
  --nodes 3 \
  --nodes-min 1 \
  --nodes-max 10 \
  --managed

# Configure kubectl
aws eks update-kubeconfig --region us-west-2 --name asphalt-tracker

# Deploy application
kubectl apply -f k8s/
```

### Google GKE Deployment
```bash
# Create GKE cluster
gcloud container clusters create asphalt-tracker \
  --zone us-central1-a \
  --machine-type n1-standard-4 \
  --num-nodes 3 \
  --enable-autoscaling \
  --min-nodes 1 \
  --max-nodes 10

# Get credentials
gcloud container clusters get-credentials asphalt-tracker --zone us-central1-a

# Deploy application
kubectl apply -f k8s/
```

### Azure AKS Deployment
```bash
# Create resource group
az group create --name asphalt-tracker-rg --location eastus

# Create AKS cluster
az aks create \
  --resource-group asphalt-tracker-rg \
  --name asphalt-tracker \
  --node-count 3 \
  --node-vm-size Standard_D4s_v3 \
  --enable-cluster-autoscaler \
  --min-count 1 \
  --max-count 10

# Get credentials
az aks get-credentials --resource-group asphalt-tracker-rg --name asphalt-tracker

# Deploy application
kubectl apply -f k8s/
```

## Monitoring Setup

### 1. Prometheus Configuration
```bash
# Deploy Prometheus
kubectl apply -f k8s/monitoring/prometheus.yaml

# Configure service monitors
kubectl apply -f k8s/monitoring/servicemonitors.yaml
```

### 2. Grafana Setup
```bash
# Deploy Grafana
kubectl apply -f k8s/monitoring/grafana.yaml

# Import dashboards
kubectl create configmap grafana-dashboards \
  --from-file=config/grafana/dashboards/ \
  -n monitoring
```

### 3. Alerting Configuration
```bash
# Configure Alertmanager
kubectl apply -f k8s/monitoring/alertmanager.yaml

# Set up notification channels
kubectl create secret generic alertmanager-config \
  --from-file=config/alertmanager/alertmanager.yml \
  -n monitoring
```

## SSL/TLS Configuration

### 1. Let's Encrypt with cert-manager
```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create cluster issuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@yourdomain.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

## Backup and Recovery

### 1. Database Backup
```bash
# PostgreSQL backup
kubectl exec -it postgres-0 -- pg_dump -U postgres asphalt_tracker > backup.sql

# Restore
kubectl exec -i postgres-0 -- psql -U postgres asphalt_tracker < backup.sql
```

### 2. Video Storage Backup
```bash
# Sync to cloud storage
aws s3 sync /app/uploads/videos s3://asphalt-tracker-backups/videos/

# Restore from backup
aws s3 sync s3://asphalt-tracker-backups/videos/ /app/uploads/videos
```

## Performance Optimization

### 1. Resource Allocation
```yaml
# Recommended resource limits
resources:
  requests:
    memory: "1Gi"
    cpu: "500m"
  limits:
    memory: "4Gi"
    cpu: "2000m"
```

### 2. Horizontal Pod Autoscaling
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: asphalt-tracker-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: asphalt-tracker
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## Troubleshooting

### Common Issues

#### 1. AI Model Connection Issues
```bash
# Check NVIDIA API connectivity
curl -H "Authorization: Bearer $NVIDIA_API_KEY" \
  https://api.nvidia.com/v1/models

# Verify environment variables
kubectl exec -it deployment/asphalt-tracker -- env | grep NVIDIA
```

#### 2. Database Connection Problems
```bash
# Test database connectivity
kubectl exec -it deployment/asphalt-tracker -- \
  node -e "console.log(process.env.DATABASE_URL)"

# Check PostgreSQL logs
kubectl logs -f statefulset/postgres
```

#### 3. Video Processing Issues
```bash
# Check video storage permissions
kubectl exec -it deployment/asphalt-tracker -- ls -la /app/uploads/videos

# Monitor processing queue
kubectl exec -it deployment/asphalt-tracker -- \
  redis-cli -h redis LLEN video_processing_queue
```

### Health Checks
```bash
# Application health
curl http://localhost:5000/health

# AI models health
curl http://localhost:5000/ai-health

# Database health
curl http://localhost:5000/db-health

# WebSocket health
wscat -c ws://localhost:5001
```

## Security Considerations

### 1. Network Security
- Use TLS/SSL for all communications
- Implement network policies in Kubernetes
- Restrict database access to application pods only

### 2. API Security
- Implement rate limiting
- Use API keys for external access
- Enable CORS protection

### 3. Data Security
- Encrypt video data at rest
- Implement data retention policies
- Use secrets management for sensitive data

## Scaling Guidelines

### Vertical Scaling
- Increase CPU/memory for AI processing workloads
- Use GPU nodes for local AI model inference
- Scale storage based on video retention requirements

### Horizontal Scaling
- Scale application pods based on request volume
- Use read replicas for database scaling
- Implement caching layers for frequently accessed data

## Maintenance

### Regular Tasks
- Update container images monthly
- Backup databases daily
- Monitor disk usage and clean old videos
- Update SSL certificates automatically
- Review and rotate API keys quarterly

### Updates and Upgrades
```bash
# Rolling update
kubectl set image deployment/asphalt-tracker \
  asphalt-tracker=asphalt-tracker:v2.1.0

# Rollback if needed
kubectl rollout undo deployment/asphalt-tracker
```
