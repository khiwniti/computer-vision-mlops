# AsphaltTracker Embedded Infrastructure

This document describes the embedded database and Redis infrastructure integrated into the AsphaltTracker Restack.io blueprint.

## 🏗️ Infrastructure Overview

AsphaltTracker includes a complete embedded infrastructure stack:

- **PostgreSQL**: Primary database for application data
- **Redis**: High-performance cache and session storage
- **ChromaDB**: Vector database for AI embeddings and semantic search
- **InfluxDB**: Time-series database for metrics and monitoring
- **Grafana**: Infrastructure monitoring and dashboards
- **pgAdmin**: PostgreSQL database management
- **Redis Commander**: Redis cache management

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

**Windows (PowerShell):**
```bash
npm run infrastructure:setup
```

**Windows (Batch):**
```bash
npm run infrastructure:setup:windows
```

### Option 2: Manual Docker Compose

```bash
# Start all infrastructure services
npm run infrastructure:start

# Check service status
npm run infrastructure:status

# View logs
npm run infrastructure:logs

# Stop services
npm run infrastructure:stop
```

### Option 3: Individual Commands

```bash
# Start infrastructure
docker-compose -f docker-compose.infrastructure.yml up -d

# Stop infrastructure
docker-compose -f docker-compose.infrastructure.yml down

# Restart services
docker-compose -f docker-compose.infrastructure.yml restart
```

## 📊 Service Details

### PostgreSQL Database
- **Port**: 5432
- **Database**: asphalt_tracker
- **Username**: postgres
- **Password**: asphalt_tracker_2024 (configurable)
- **Management**: http://localhost:5050 (pgAdmin)

### Redis Cache
- **Port**: 6379
- **Password**: asphalt_redis_2024 (configurable)
- **Max Memory**: 1GB
- **Management**: http://localhost:8081 (Redis Commander)

### ChromaDB Vector Database
- **Port**: 8000
- **API**: http://localhost:8000/api/v1
- **Collections**: video_embeddings, activity_embeddings, safety_embeddings
- **Embedding Model**: nvidia/llama-3_2-nv-embedqa-1b-v2

### InfluxDB Time Series Database
- **Port**: 8086
- **Organization**: asphalt-tracker
- **Bucket**: asphalt_metrics
- **Username**: admin
- **Password**: asphalt_influx_2024 (configurable)

### Grafana Monitoring
- **Port**: 3000
- **Username**: admin
- **Password**: asphalt_grafana_2024 (configurable)
- **Dashboards**: Pre-configured for infrastructure monitoring

## 🔧 Configuration

### Environment Variables

Copy `.env.infrastructure` to `.env` and customize:

```bash
# Database
DB_PASSWORD=your_secure_password

# Redis
REDIS_PASSWORD=your_redis_password

# InfluxDB
INFLUX_PASSWORD=your_influx_password
INFLUX_TOKEN=your_influx_token

# Management Tools
GRAFANA_PASSWORD=your_grafana_password
PGADMIN_PASSWORD=your_pgadmin_password
```

### Restack Integration

The infrastructure is automatically integrated into Restack workflows:

```typescript
// Services with infrastructure dependencies
services: {
  videoProcessing: {
    dependencies: ["database", "redis", "vectorDatabase", "timeSeriesDatabase"],
    dataStores: {
      primary: "database",
      cache: "redis",
      embeddings: "vectorDatabase", 
      metrics: "timeSeriesDatabase"
    }
  }
}
```

## 🔄 Restack Functions

### Infrastructure Functions

- `initializeDatabase`: Setup PostgreSQL with schema and seed data
- `initializeRedis`: Configure Redis cache with keyspaces
- `initializeVectorDatabase`: Setup ChromaDB collections
- `initializeTimeSeriesDatabase`: Configure InfluxDB retention policies
- `healthCheckInfrastructure`: Monitor all services health
- `backupInfrastructure`: Create backups of all data

### Infrastructure Workflows

- `infrastructureInitializationWorkflow`: Complete infrastructure setup
- `infrastructureMaintenanceWorkflow`: Automated maintenance and optimization

### Scheduled Tasks

- **Infrastructure Maintenance**: Daily at 2:00 AM
- **Health Checks**: Every 30 seconds
- **Backups**: Daily with 7-day retention

## 📈 Monitoring & Management

### Health Monitoring

```bash
# Check all services
curl http://localhost:5000/api/infrastructure/health

# Individual service checks
curl http://localhost:8000/api/v1/heartbeat  # ChromaDB
curl http://localhost:8086/health            # InfluxDB
```

### Backup Management

```bash
# Manual backup
curl -X POST http://localhost:5000/api/infrastructure/backup

# Restore from backup
curl -X POST http://localhost:5000/api/infrastructure/restore \
  -H "Content-Type: application/json" \
  -d '{"backupId": "backup_20250106"}'
```

### Performance Monitoring

Access Grafana dashboards at http://localhost:3000:
- Infrastructure Overview
- Database Performance
- Redis Cache Metrics
- Vector Database Statistics
- Time Series Data Trends

## 🔒 Security

### Default Passwords

**⚠️ Change these in production:**
- PostgreSQL: `asphalt_tracker_2024`
- Redis: `asphalt_redis_2024`
- InfluxDB: `asphalt_influx_2024`
- Grafana: `asphalt_grafana_2024`
- pgAdmin: `asphalt_pgadmin_2024`

### Network Security

- All services run on isolated Docker network
- Passwords are configurable via environment variables
- SSL/TLS can be enabled for production deployments

## 🛠️ Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check Docker is running
docker --version

# Check port conflicts
netstat -an | findstr "5432 6379 8000 8086"

# View service logs
npm run infrastructure:logs
```

**Database connection issues:**
```bash
# Test PostgreSQL connection
docker exec asphalt-postgres pg_isready -U postgres

# Test Redis connection
docker exec asphalt-redis redis-cli ping
```

**Performance issues:**
```bash
# Check resource usage
docker stats

# Optimize database
docker exec asphalt-postgres psql -U postgres -d asphalt_tracker -c "VACUUM ANALYZE;"
```

### Reset Infrastructure

```bash
# Stop and remove all data
docker-compose -f docker-compose.infrastructure.yml down -v

# Restart fresh
npm run infrastructure:start
```

## 📚 Integration Examples

### Database Usage in Workflows

```typescript
import { step } from "@restackio/ai";

export async function saveVideoAnalysis(data: VideoAnalysis) {
  return await step({
    name: "saveToDatabase",
    input: {
      table: "video_analyses",
      data: data
    }
  });
}
```

### Redis Caching

```typescript
export async function getCachedResult(key: string) {
  return await step({
    name: "getFromCache",
    input: {
      key: `asphalt:${key}`,
      ttl: 3600
    }
  });
}
```

### Vector Search

```typescript
export async function searchSimilarVideos(embedding: number[]) {
  return await step({
    name: "vectorSearch",
    input: {
      collection: "video_embeddings",
      query: embedding,
      limit: 10
    }
  });
}
```

## 🎯 Next Steps

1. **Start Infrastructure**: Run `npm run infrastructure:setup`
2. **Verify Services**: Check all services are healthy
3. **Start AsphaltTracker**: Run `npm run start:all`
4. **Monitor Performance**: Access Grafana at http://localhost:3000
5. **Customize Configuration**: Update `.env` file as needed

The embedded infrastructure provides a complete, production-ready foundation for AsphaltTracker's AI-powered construction monitoring platform! 🚀
