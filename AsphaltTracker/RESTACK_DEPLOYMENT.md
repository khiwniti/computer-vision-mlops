# AsphaltTracker - Restack.io Deployment Guide

## 🚀 Deploying to Restack.io Cloud Platform

This guide walks you through deploying the AsphaltTracker logistics management application to Restack.io.

## 📋 Prerequisites

### 1. Restack CLI Installation
```bash
# Install Restack CLI
curl -fsSL https://get.restack.io | sh

# Verify installation
restack version
```

### 2. Account Setup
```bash
# Login to Restack
restack auth login

# Verify authentication
restack auth status
```

## 🛠️ Configuration Files

The following files have been created for Restack compatibility:

### Core Files
- `Dockerfile` - Multi-stage container build
- `.dockerignore` - Optimized container context
- `restack-asphalt-tracker.yaml` - Restack service configuration
- `.env.example` - Environment variables template
- `scripts/deploy-restack.sh` - Automated deployment script

### Application Updates
- ✅ Health check endpoints (`/health`, `/api/health`)
- ✅ Environment variable support for PORT, HOST, DATABASE_URL
- ✅ Logging improvements with emojis and status indicators
- ✅ Restack-compatible build and start scripts

## 🚀 Quick Deployment

### Option 1: Automated Script (Recommended)
```bash
# Navigate to AsphaltTracker directory
cd AsphaltTracker

# Run deployment script
./scripts/deploy-restack.sh
```

### Option 2: Manual Deployment
```bash
# 1. Validate configuration
restack validate restack-asphalt-tracker.yaml

# 2. Deploy to Restack
restack deploy restack-asphalt-tracker.yaml --wait

# 3. Check status
restack status asphalt-tracker
```

## 📊 Deployment Configuration

### Service Architecture
```yaml
services:
  - asphalt-tracker (Web App)
    - Port: 5000
    - Health: /health
    - Auto-scaling: 1-3 instances
    - Resources: 1 CPU, 2GB RAM

databases:
  - postgres-main (PostgreSQL 15 + PostGIS)
    - Storage: 50GB SSD
    - Backup: Daily
  - redis-cache (Redis 7)
    - Storage: 5GB SSD
    - Memory: 1GB

storage:
  - app-storage (S3-compatible)
    - Buckets: uploads, videos, backups
    - Size: 100GB
```

### Environment Variables
Automatically provided by Restack:
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection  
- `STORAGE_URL` - S3-compatible storage
- `SESSION_SECRET` - Secure session key
- `JWT_SECRET` - JWT signing key

## 🔍 Monitoring & Management

### Check Application Status
```bash
# Overall stack status
restack status asphalt-tracker

# Service health
curl https://asphalt-tracker.restack.app/health

# Application logs
restack logs asphalt-tracker --follow
```

### Scaling
```bash
# Scale web service
restack scale asphalt-tracker --service asphalt-tracker --instances 3

# View current scaling
restack apps list asphalt-tracker
```

### Database Management
```bash
# Database status
restack databases list asphalt-tracker

# Run migrations (if needed)
restack exec asphalt-tracker -- npm run db:migrate

# Database backup
restack backup create asphalt-tracker
```

## 🔗 Access URLs

After deployment, your application will be available at:
- **Main App**: `https://asphalt-tracker.restack.app`
- **Health Check**: `https://asphalt-tracker.restack.app/health`
- **API Health**: `https://asphalt-tracker.restack.app/api/health`

## 🛡️ Security Features

### Automated Security
- ✅ SSL/TLS certificates (automatic)
- ✅ VPC networking with private subnets
- ✅ Security groups with minimal access
- ✅ Secrets management for sensitive data
- ✅ Encrypted storage and backups

### Access Control
- Database access restricted to VPC
- Redis access restricted to VPC  
- Public access only to web services on ports 80/443

## 📈 Performance & Scaling

### Auto-scaling Rules
- **Scale Up**: CPU > 70% or Memory > 80%
- **Scale Down**: CPU < 30% for 10 minutes
- **Min Instances**: 1
- **Max Instances**: 3

### Resource Limits
- **CPU**: 1000m (1 core)
- **Memory**: 2Gi (2GB RAM)
- **Storage**: 100GB (expandable)

## 🔧 Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check build logs
restack logs asphalt-tracker --build

# Rebuild manually
restack build asphalt-tracker --no-cache
```

#### 2. Health Check Failures
```bash
# Check if service is running
restack status asphalt-tracker

# Check application logs
restack logs asphalt-tracker --tail 100

# Test health endpoint directly
restack exec asphalt-tracker -- curl http://localhost:5000/health
```

#### 3. Database Connection Issues
```bash
# Check database status
restack databases status asphalt-tracker

# Test database connection
restack exec asphalt-tracker -- npm run db:check
```

#### 4. Performance Issues
```bash
# Check resource usage
restack metrics asphalt-tracker

# Scale up if needed
restack scale asphalt-tracker --instances 2
```

### Support Commands
```bash
# Get deployment info
restack describe asphalt-tracker

# Download logs
restack logs asphalt-tracker --download

# Connect to container
restack exec asphalt-tracker -- /bin/sh

# Environment variables
restack env list asphalt-tracker
```

## 📊 Cost Optimization

### Scheduled Scaling (Business Hours)
```yaml
cost_optimization:
  scheduled_scaling:
    - name: business_hours
      schedule: "0 8 * * 1-5"  # Scale up Mon-Fri 8 AM
      factor: 1.5
    - name: after_hours  
      schedule: "0 18 * * 1-5"  # Scale down Mon-Fri 6 PM
      factor: 0.5
```

### Storage Lifecycle
- Temporary files deleted after 1 day
- Backup retention: 30 days
- Auto-cleanup of old data

## 🔄 CI/CD Integration

### GitHub Actions (Example)
```yaml
name: Deploy to Restack
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Restack
        run: |
          curl -fsSL https://get.restack.io | sh
          restack auth login --token ${{ secrets.RESTACK_TOKEN }}
          restack deploy restack-asphalt-tracker.yaml
```

## 📚 Additional Resources

- [Restack Documentation](https://docs.restack.io)
- [AsphaltTracker Features](./README.md)
- [API Documentation](./API_DOCS.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

## 🎯 Next Steps

1. **Deploy Application**: Use the deployment script
2. **Set up Monitoring**: Configure alerts and dashboards
3. **Configure Domain**: Point your custom domain to the Restack URL
4. **Set up CI/CD**: Automate deployments from your repository
5. **Scale as Needed**: Monitor usage and adjust resources

---

**Need Help?** 
- Check the [Restack Community](https://community.restack.io)
- Review [Application Logs](#monitoring--management)
- Contact support via the Restack dashboard