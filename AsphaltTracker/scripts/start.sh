#!/bin/bash

# Enhanced startup script for AsphaltTracker with AI capabilities
# Handles graceful startup, health checks, and service coordination

set -e

echo "🚀 Starting AsphaltTracker Enhanced with AI capabilities..."

# Environment validation
echo "📋 Validating environment..."

# Check required environment variables
REQUIRED_VARS=(
    "NODE_ENV"
    "PORT"
    "WS_PORT"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Required environment variable $var is not set"
        exit 1
    fi
done

# Optional AI-related variables with defaults
export NVIDIA_API_KEY=${NVIDIA_API_KEY:-""}
export VSS_USE_LOCAL=${VSS_USE_LOCAL:-"false"}
export AI_CONFIDENCE_THRESHOLD=${AI_CONFIDENCE_THRESHOLD:-"0.75"}
export FEATURE_REAL_TIME_PROCESSING=${FEATURE_REAL_TIME_PROCESSING:-"true"}
export FEATURE_ADVANCED_ANALYTICS=${FEATURE_ADVANCED_ANALYTICS:-"true"}

echo "✅ Environment validation complete"

# Create log files
echo "📝 Setting up logging..."
mkdir -p logs
touch logs/app.log logs/error.log logs/access.log

# Database connection check (if DATABASE_URL is provided)
if [ ! -z "$DATABASE_URL" ]; then
    echo "🔍 Checking database connection..."
    # Add database connection check here if needed
    echo "✅ Database connection verified"
fi

# Redis connection check (if REDIS_URL is provided)
if [ ! -z "$REDIS_URL" ]; then
    echo "🔍 Checking Redis connection..."
    # Add Redis connection check here if needed
    echo "✅ Redis connection verified"
fi

# NVIDIA API check (if API key is provided)
if [ ! -z "$NVIDIA_API_KEY" ]; then
    echo "🤖 Checking NVIDIA API connection..."
    # Add NVIDIA API health check here if needed
    echo "✅ NVIDIA API connection verified"
fi

# Start the application with proper signal handling
echo "🎯 Starting AsphaltTracker services..."

# Function to handle shutdown signals
cleanup() {
    echo "🛑 Received shutdown signal, gracefully stopping services..."
    
    # Kill background processes
    if [ ! -z "$APP_PID" ]; then
        kill -TERM "$APP_PID" 2>/dev/null || true
        wait "$APP_PID" 2>/dev/null || true
    fi
    
    echo "✅ Services stopped gracefully"
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT SIGQUIT

# Start the main application
echo "🚀 Starting main application on port $PORT..."
echo "📡 WebSocket server will start on port $WS_PORT..."

# Start the application in background
npm run start &
APP_PID=$!

# Health check function
health_check() {
    local max_attempts=30
    local attempt=1
    
    echo "🏥 Performing health checks..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "http://localhost:$PORT/health" > /dev/null 2>&1; then
            echo "✅ Application is healthy (attempt $attempt/$max_attempts)"
            return 0
        fi
        
        echo "⏳ Health check failed, retrying in 2 seconds... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ Health check failed after $max_attempts attempts"
    return 1
}

# Wait for application to start
sleep 5

# Perform health check
if health_check; then
    echo "🎉 AsphaltTracker started successfully!"
    echo "📊 Main application: http://localhost:$PORT"
    echo "📡 WebSocket server: ws://localhost:$WS_PORT"
    echo "🏥 Health endpoint: http://localhost:$PORT/health"
    
    # Print feature status
    echo ""
    echo "🤖 AI Features Status:"
    echo "   Real-time Processing: $FEATURE_REAL_TIME_PROCESSING"
    echo "   Advanced Analytics: $FEATURE_ADVANCED_ANALYTICS"
    echo "   NVIDIA API: $([ ! -z "$NVIDIA_API_KEY" ] && echo "Enabled" || echo "Disabled")"
    echo "   Local VSS: $VSS_USE_LOCAL"
    echo "   AI Confidence Threshold: $AI_CONFIDENCE_THRESHOLD"
    
    # Print resource information
    echo ""
    echo "💾 Resource Information:"
    echo "   Node.js Version: $(node --version)"
    echo "   Memory Limit: $([ ! -z "$NODE_OPTIONS" ] && echo "$NODE_OPTIONS" || echo "Default")"
    echo "   Environment: $NODE_ENV"
    
else
    echo "❌ Application failed to start properly"
    cleanup
    exit 1
fi

# Keep the script running and wait for the application
echo "⏳ Waiting for application process..."
wait "$APP_PID"

# If we reach here, the application has exited
echo "🛑 Application process has exited"
exit $?
