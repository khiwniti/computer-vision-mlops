#!/bin/bash

# AsphaltTracker Enhanced Performance Monitoring Script
# Monitors system performance, AI processing, and application metrics

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="/var/log/asphalt-tracker"
METRICS_DIR="/var/lib/asphalt-tracker/metrics"
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=85
ALERT_THRESHOLD_DISK=90
ALERT_THRESHOLD_AI_LATENCY=5000  # milliseconds
PROMETHEUS_URL="http://localhost:9090"
GRAFANA_URL="http://localhost:3001"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Create directories if they don't exist
mkdir -p "$LOG_DIR" "$METRICS_DIR"

# Function to check system resources
check_system_resources() {
    log "Checking system resources..."
    
    # CPU usage
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    CPU_USAGE=${CPU_USAGE%.*}  # Remove decimal part
    
    # Memory usage
    MEMORY_INFO=$(free | grep Mem)
    TOTAL_MEM=$(echo $MEMORY_INFO | awk '{print $2}')
    USED_MEM=$(echo $MEMORY_INFO | awk '{print $3}')
    MEMORY_USAGE=$((USED_MEM * 100 / TOTAL_MEM))
    
    # Disk usage
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    # Load average
    LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    
    echo "CPU Usage: ${CPU_USAGE}%"
    echo "Memory Usage: ${MEMORY_USAGE}%"
    echo "Disk Usage: ${DISK_USAGE}%"
    echo "Load Average: ${LOAD_AVG}"
    
    # Check thresholds and alert
    if [ "$CPU_USAGE" -gt "$ALERT_THRESHOLD_CPU" ]; then
        warning "High CPU usage detected: ${CPU_USAGE}%"
        send_alert "cpu" "High CPU usage: ${CPU_USAGE}%"
    fi
    
    if [ "$MEMORY_USAGE" -gt "$ALERT_THRESHOLD_MEMORY" ]; then
        warning "High memory usage detected: ${MEMORY_USAGE}%"
        send_alert "memory" "High memory usage: ${MEMORY_USAGE}%"
    fi
    
    if [ "$DISK_USAGE" -gt "$ALERT_THRESHOLD_DISK" ]; then
        warning "High disk usage detected: ${DISK_USAGE}%"
        send_alert "disk" "High disk usage: ${DISK_USAGE}%"
    fi
    
    # Save metrics
    cat > "$METRICS_DIR/system_metrics.json" <<EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "cpu_usage": $CPU_USAGE,
    "memory_usage": $MEMORY_USAGE,
    "disk_usage": $DISK_USAGE,
    "load_average": $LOAD_AVG
}
EOF
}

# Function to check application health
check_application_health() {
    log "Checking application health..."
    
    # Check main application
    APP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health || echo "000")
    
    # Check WebSocket server
    WS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/health || echo "000")
    
    # Check database connectivity
    DB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/db-health || echo "000")
    
    # Check AI models
    AI_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/ai-health || echo "000")
    
    echo "Application Status: $APP_STATUS"
    echo "WebSocket Status: $WS_STATUS"
    echo "Database Status: $DB_STATUS"
    echo "AI Models Status: $AI_STATUS"
    
    # Alert on failures
    if [ "$APP_STATUS" != "200" ]; then
        error "Application health check failed: $APP_STATUS"
        send_alert "app" "Application health check failed"
    fi
    
    if [ "$AI_STATUS" != "200" ]; then
        error "AI models health check failed: $AI_STATUS"
        send_alert "ai" "AI models health check failed"
    fi
    
    # Save health metrics
    cat > "$METRICS_DIR/health_metrics.json" <<EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "application_status": "$APP_STATUS",
    "websocket_status": "$WS_STATUS",
    "database_status": "$DB_STATUS",
    "ai_status": "$AI_STATUS"
}
EOF
}

# Function to check AI performance
check_ai_performance() {
    log "Checking AI performance..."
    
    # Get AI metrics from application
    AI_METRICS=$(curl -s http://localhost:5000/ai-metrics || echo "{}")
    
    if [ "$AI_METRICS" != "{}" ]; then
        # Extract key metrics
        VILA_LATENCY=$(echo "$AI_METRICS" | jq -r '.models.vila.averageLatency // 0' 2>/dev/null || echo "0")
        LLAMA_LATENCY=$(echo "$AI_METRICS" | jq -r '.models.llama.averageLatency // 0' 2>/dev/null || echo "0")
        PROCESSING_QUEUE=$(echo "$AI_METRICS" | jq -r '.systemHealth.queueLength // 0' 2>/dev/null || echo "0")
        GPU_UTILIZATION=$(echo "$AI_METRICS" | jq -r '.systemHealth.gpuUtilization // 0' 2>/dev/null || echo "0")
        
        echo "VILA Latency: ${VILA_LATENCY}ms"
        echo "Llama Latency: ${LLAMA_LATENCY}ms"
        echo "Processing Queue: $PROCESSING_QUEUE"
        echo "GPU Utilization: ${GPU_UTILIZATION}%"
        
        # Check AI latency thresholds
        VILA_LATENCY_INT=${VILA_LATENCY%.*}
        if [ "$VILA_LATENCY_INT" -gt "$ALERT_THRESHOLD_AI_LATENCY" ]; then
            warning "High AI latency detected: ${VILA_LATENCY}ms"
            send_alert "ai_latency" "High AI latency: ${VILA_LATENCY}ms"
        fi
        
        # Save AI metrics
        echo "$AI_METRICS" > "$METRICS_DIR/ai_metrics.json"
    else
        warning "Could not retrieve AI metrics"
    fi
}

# Function to check video processing performance
check_video_processing() {
    log "Checking video processing performance..."
    
    # Get video processing metrics
    VIDEO_METRICS=$(curl -s http://localhost:5000/video-metrics || echo "{}")
    
    if [ "$VIDEO_METRICS" != "{}" ]; then
        PROCESSING_QUEUE=$(echo "$VIDEO_METRICS" | jq -r '.processingQueue // 0' 2>/dev/null || echo "0")
        COMPLETED_TODAY=$(echo "$VIDEO_METRICS" | jq -r '.completedToday // 0' 2>/dev/null || echo "0")
        FAILED_TODAY=$(echo "$VIDEO_METRICS" | jq -r '.failedToday // 0' 2>/dev/null || echo "0")
        AVG_PROCESSING_TIME=$(echo "$VIDEO_METRICS" | jq -r '.averageProcessingTime // 0' 2>/dev/null || echo "0")
        
        echo "Processing Queue: $PROCESSING_QUEUE"
        echo "Completed Today: $COMPLETED_TODAY"
        echo "Failed Today: $FAILED_TODAY"
        echo "Average Processing Time: ${AVG_PROCESSING_TIME}s"
        
        # Check for high failure rate
        if [ "$COMPLETED_TODAY" -gt 0 ]; then
            FAILURE_RATE=$((FAILED_TODAY * 100 / (COMPLETED_TODAY + FAILED_TODAY)))
            if [ "$FAILURE_RATE" -gt 10 ]; then
                warning "High video processing failure rate: ${FAILURE_RATE}%"
                send_alert "video_processing" "High failure rate: ${FAILURE_RATE}%"
            fi
        fi
        
        # Save video metrics
        echo "$VIDEO_METRICS" > "$METRICS_DIR/video_metrics.json"
    else
        warning "Could not retrieve video processing metrics"
    fi
}

# Function to check database performance
check_database_performance() {
    log "Checking database performance..."
    
    # PostgreSQL connection check
    if command -v psql >/dev/null 2>&1; then
        # Check active connections
        ACTIVE_CONNECTIONS=$(psql -h localhost -U postgres -d asphalt_tracker -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | xargs || echo "0")
        
        # Check slow queries
        SLOW_QUERIES=$(psql -h localhost -U postgres -d asphalt_tracker -t -c "SELECT count(*) FROM pg_stat_statements WHERE mean_time > 1000;" 2>/dev/null | xargs || echo "0")
        
        # Check database size
        DB_SIZE=$(psql -h localhost -U postgres -d asphalt_tracker -t -c "SELECT pg_size_pretty(pg_database_size('asphalt_tracker'));" 2>/dev/null | xargs || echo "Unknown")
        
        echo "Active Connections: $ACTIVE_CONNECTIONS"
        echo "Slow Queries: $SLOW_QUERIES"
        echo "Database Size: $DB_SIZE"
        
        # Save database metrics
        cat > "$METRICS_DIR/database_metrics.json" <<EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "active_connections": $ACTIVE_CONNECTIONS,
    "slow_queries": $SLOW_QUERIES,
    "database_size": "$DB_SIZE"
}
EOF
    else
        warning "PostgreSQL client not available for database checks"
    fi
    
    # Redis check
    if command -v redis-cli >/dev/null 2>&1; then
        REDIS_MEMORY=$(redis-cli info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r' || echo "Unknown")
        REDIS_CONNECTIONS=$(redis-cli info clients | grep connected_clients | cut -d: -f2 | tr -d '\r' || echo "0")
        
        echo "Redis Memory Usage: $REDIS_MEMORY"
        echo "Redis Connections: $REDIS_CONNECTIONS"
    else
        warning "Redis client not available for Redis checks"
    fi
}

# Function to send alerts
send_alert() {
    local alert_type="$1"
    local message="$2"
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    
    # Log alert
    echo "[$timestamp] ALERT [$alert_type]: $message" >> "$LOG_DIR/alerts.log"
    
    # Send to webhook if configured
    if [ ! -z "$WEBHOOK_URL" ]; then
        curl -s -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"type\":\"$alert_type\",\"message\":\"$message\",\"timestamp\":\"$timestamp\"}" \
            >/dev/null 2>&1 || true
    fi
    
    # Send to Slack if configured
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"🚨 AsphaltTracker Alert: $message\"}" \
            >/dev/null 2>&1 || true
    fi
}

# Function to generate performance report
generate_report() {
    log "Generating performance report..."
    
    local report_file="$METRICS_DIR/performance_report_$(date +%Y%m%d_%H%M%S).json"
    
    cat > "$report_file" <<EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "system_metrics": $(cat "$METRICS_DIR/system_metrics.json" 2>/dev/null || echo "{}"),
    "health_metrics": $(cat "$METRICS_DIR/health_metrics.json" 2>/dev/null || echo "{}"),
    "ai_metrics": $(cat "$METRICS_DIR/ai_metrics.json" 2>/dev/null || echo "{}"),
    "video_metrics": $(cat "$METRICS_DIR/video_metrics.json" 2>/dev/null || echo "{}"),
    "database_metrics": $(cat "$METRICS_DIR/database_metrics.json" 2>/dev/null || echo "{}")
}
EOF
    
    success "Performance report generated: $report_file"
}

# Function to cleanup old metrics
cleanup_old_metrics() {
    log "Cleaning up old metrics..."
    
    # Remove metrics older than 7 days
    find "$METRICS_DIR" -name "*.json" -mtime +7 -delete 2>/dev/null || true
    find "$LOG_DIR" -name "*.log" -mtime +30 -delete 2>/dev/null || true
    
    success "Old metrics cleaned up"
}

# Main execution
main() {
    log "Starting AsphaltTracker performance monitoring..."
    
    # Check if running as root (for some system metrics)
    if [ "$EUID" -eq 0 ]; then
        warning "Running as root - some checks may have elevated privileges"
    fi
    
    # Perform all checks
    check_system_resources
    echo ""
    check_application_health
    echo ""
    check_ai_performance
    echo ""
    check_video_processing
    echo ""
    check_database_performance
    echo ""
    
    # Generate report
    generate_report
    
    # Cleanup old data
    cleanup_old_metrics
    
    success "Performance monitoring completed"
}

# Handle command line arguments
case "${1:-}" in
    "system")
        check_system_resources
        ;;
    "health")
        check_application_health
        ;;
    "ai")
        check_ai_performance
        ;;
    "video")
        check_video_processing
        ;;
    "database")
        check_database_performance
        ;;
    "report")
        generate_report
        ;;
    "cleanup")
        cleanup_old_metrics
        ;;
    *)
        main
        ;;
esac
