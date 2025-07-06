# AsphaltTracker Enterprise Logistics Platform - Deployment Guide

## 🚀 **Quick Start Deployment**

### **Prerequisites**
- Docker and Docker Compose installed
- At least 8GB RAM and 20GB disk space
- Ports 3000, 5000, 5001, 5233, 5432, 6379, 8000, 8086 available

### **Option 1: Complete Docker Deployment (Recommended)**

```bash
# Clone and navigate to AsphaltTracker
cd AsphaltTracker

# Start the complete platform with infrastructure
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f asphalt-tracker
```

### **Option 2: Local Development with Infrastructure**

```bash
# Start infrastructure services only
npm run infrastructure:start

# Start AsphaltTracker in development mode
npm run dev:all
```

### **Option 3: Production Build and Run**

```bash
# Install dependencies (avoid workspace conflicts)
npm install --no-workspaces

# Build the application
npm run build:all

# Start infrastructure
npm run infrastructure:start

# Start production application
npm run start:all
```

## 🏗️ **Architecture Overview**

### **Application Stack**
- **Frontend**: React with Vite (Port 5000)
- **Backend**: Node.js with Express (Port 5000)
- **WebSocket**: Real-time updates (Port 5001)
- **Restack Services**: AI workflows (Port 5233)

### **Infrastructure Stack**
- **PostgreSQL**: Primary database (Port 5432)
- **Redis**: Cache and sessions (Port 6379)
- **ChromaDB**: Vector database (Port 8000)
- **InfluxDB**: Time-series metrics (Port 8086)
- **Grafana**: Monitoring dashboard (Port 3000)

## 🔧 **Configuration**

### **Environment Variables**

Create a `.env` file in the AsphaltTracker directory:

```bash
# Application Configuration
NODE_ENV=production
PORT=5000
WS_PORT=5001
RESTACK_PORT=5233

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=asphalt_tracker
DB_USER=postgres
DB_PASSWORD=asphalt_tracker_2024

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=asphalt_redis_2024

# ChromaDB Configuration
CHROMA_HOST=localhost
CHROMA_PORT=8000

# InfluxDB Configuration
INFLUX_HOST=localhost
INFLUX_PORT=8086
INFLUX_ORG=asphalt-tracker
INFLUX_BUCKET=asphalt_metrics
INFLUX_TOKEN=asphalt_influx_token_2024

# Security (Change in production!)
JWT_SECRET=your-super-secret-jwt-key
ENCRYPTION_KEY=your-32-character-encryption-key

# NVIDIA API (Optional - for AI features)
NVIDIA_API_KEY=your-nvidia-api-key

# External APIs (Optional)
GOOGLE_MAPS_API_KEY=your-google-maps-key
WEATHER_API_KEY=your-weather-api-key
```

### **Docker Environment Variables**

For Docker deployment, update the `docker-compose.yml` environment section or create a `.env` file:

```bash
# Copy environment template
cp .env.infrastructure .env

# Edit with your values
nano .env
```

## 📊 **Service URLs**

After successful deployment, access these services:

### **Main Application**
- **Dashboard**: http://localhost:5000
- **Logistics Management**: http://localhost:5000/logistics
- **Fleet Dashboard**: http://localhost:5000/fleet
- **Analytics Portal**: http://localhost:5000/analytics
- **API Documentation**: http://localhost:5000/api/docs

### **Infrastructure Services**
- **Grafana Monitoring**: http://localhost:3000
- **Restack Dashboard**: http://localhost:5233
- **ChromaDB API**: http://localhost:8000
- **InfluxDB UI**: http://localhost:8086

### **Management Tools**
- **pgAdmin**: http://localhost:5050 (if using infrastructure setup)
- **Redis Commander**: http://localhost:8081 (if using infrastructure setup)

## 🔍 **Health Checks**

### **Application Health**
```bash
# Main application
curl http://localhost:5000/health

# API health
curl http://localhost:5000/api/health

# WebSocket health
curl http://localhost:5001/health
```

### **Infrastructure Health**
```bash
# PostgreSQL
docker exec asphalt-postgres pg_isready -U postgres

# Redis
docker exec asphalt-redis redis-cli ping

# ChromaDB
curl http://localhost:8000/api/v1/heartbeat

# InfluxDB
curl http://localhost:8086/health
```

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **1. npm install fails with "Invalid Version" error**
```bash
# Solution: Use --no-workspaces flag
npm install --no-workspaces
```

#### **2. Port conflicts**
```bash
# Check what's using the ports
netstat -an | findstr "5000 5001 5432 6379"

# Stop conflicting services or change ports in docker-compose.yml
```

#### **3. Docker build fails**
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

#### **4. Services won't start**
```bash
# Check logs
docker-compose logs -f

# Restart specific service
docker-compose restart asphalt-tracker
```

#### **5. Database connection issues**
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Test connection
docker exec asphalt-postgres psql -U postgres -d asphalt_tracker -c "SELECT 1;"
```

### **Performance Optimization**

#### **For Production Deployment**
```bash
# Increase Docker memory limits
# In docker-compose.yml, add to asphalt-tracker service:
deploy:
  resources:
    limits:
      memory: 4G
    reservations:
      memory: 2G
```

#### **Database Optimization**
```bash
# Connect to PostgreSQL and optimize
docker exec -it asphalt-postgres psql -U postgres -d asphalt_tracker

# Run optimization queries
VACUUM ANALYZE;
REINDEX DATABASE asphalt_tracker;
```

## 🔒 **Security Considerations**

### **Production Security Checklist**

1. **Change Default Passwords**
   - Update all passwords in `.env` file
   - Use strong, unique passwords for each service

2. **Enable SSL/TLS**
   - Configure reverse proxy (nginx/Apache)
   - Use Let's Encrypt for SSL certificates

3. **Network Security**
   - Use Docker networks for service isolation
   - Restrict external access to infrastructure ports

4. **API Security**
   - Implement API rate limiting
   - Use JWT tokens for authentication
   - Enable CORS properly

5. **Data Security**
   - Enable database encryption at rest
   - Use encrypted backups
   - Implement audit logging

## 📈 **Scaling**

### **Horizontal Scaling**
```bash
# Scale application instances
docker-compose up -d --scale asphalt-tracker=3

# Use load balancer (nginx example)
# Add nginx service to docker-compose.yml
```

### **Database Scaling**
```bash
# PostgreSQL read replicas
# Add read-only database instances
# Configure connection pooling
```

### **Redis Clustering**
```bash
# Redis cluster setup
# Multiple Redis instances with clustering
```

## 🔄 **Backup and Recovery**

### **Automated Backups**
```bash
# Database backup
docker exec asphalt-postgres pg_dump -U postgres asphalt_tracker > backup.sql

# Redis backup
docker exec asphalt-redis redis-cli BGSAVE

# Application data backup
docker run --rm -v asphalt_app_data:/data -v $(pwd):/backup alpine tar czf /backup/app_data.tar.gz /data
```

### **Restore Process**
```bash
# Restore database
docker exec -i asphalt-postgres psql -U postgres asphalt_tracker < backup.sql

# Restore Redis
docker cp backup.rdb asphalt-redis:/data/dump.rdb
docker-compose restart redis
```

## 📞 **Support**

### **Logs Location**
- **Application Logs**: `docker-compose logs asphalt-tracker`
- **Database Logs**: `docker-compose logs postgres`
- **Infrastructure Logs**: `docker-compose logs`

### **Monitoring**
- **Grafana Dashboard**: http://localhost:3000
- **Application Metrics**: http://localhost:5000/metrics
- **Health Status**: http://localhost:5000/health

### **Performance Monitoring**
```bash
# Container resource usage
docker stats

# Application performance
curl http://localhost:5000/api/performance

# Database performance
docker exec asphalt-postgres psql -U postgres -c "SELECT * FROM pg_stat_activity;"
```

## 🎯 **Next Steps**

1. **Configure Your Environment**: Update `.env` with your specific settings
2. **Set Up Monitoring**: Configure Grafana dashboards
3. **Load Sample Data**: Use the API to create test shipments and fleet data
4. **Configure Integrations**: Set up external APIs (Google Maps, weather, etc.)
5. **Customize Workflows**: Modify Restack workflows for your business needs

The AsphaltTracker Enterprise Logistics Platform is now ready for production deployment! 🚛✨
