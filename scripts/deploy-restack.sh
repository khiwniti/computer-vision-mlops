#!/bin/bash

# Restack.io Deployment Script for AsphaltTracker
# This script validates and deploys the AsphaltTracker application to Restack.io

set -e

echo "🚀 Starting Restack.io deployment for AsphaltTracker..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CONFIG_FILE="restack-asphalt-tracker.yaml"
PROJECT_NAME="asphalt-tracker"

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if restack CLI is installed
check_restack_cli() {
    log_info "Checking Restack CLI installation..."
    
    if ! command -v restack &> /dev/null; then
        log_error "Restack CLI is not installed. Please install it first:"
        echo "  curl -fsSL https://get.restack.io | sh"
        exit 1
    fi
    
    log_success "Restack CLI is installed"
    restack version
}

# Check if user is logged in
check_auth() {
    log_info "Checking authentication..."
    
    if ! restack auth status &> /dev/null; then
        log_warning "You are not logged in to Restack"
        log_info "Please log in with: restack auth login"
        exit 1
    fi
    
    log_success "Authenticated with Restack"
}

# Validate configuration file
validate_config() {
    log_info "Validating Restack configuration..."
    
    if [ ! -f "$CONFIG_FILE" ]; then
        log_error "Configuration file $CONFIG_FILE not found"
        exit 1
    fi
    
    if ! restack validate "$CONFIG_FILE"; then
        log_error "Configuration validation failed"
        exit 1
    fi
    
    log_success "Configuration is valid"
}

# Build application
build_app() {
    log_info "Building AsphaltTracker application..."
    
    # Install dependencies
    if [ -f "yarn.lock" ]; then
        yarn install --frozen-lockfile
    elif [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    # Build the application
    npm run build
    
    log_success "Application built successfully"
}

# Deploy to Restack
deploy() {
    log_info "Deploying to Restack.io..."
    
    # Deploy with the configuration file
    if restack deploy "$CONFIG_FILE" --wait; then
        log_success "Deployment completed successfully"
        
        # Get deployment information
        log_info "Getting deployment status..."
        restack status "$PROJECT_NAME"
        
        # Show URLs
        log_info "Application URLs:"
        restack apps list "$PROJECT_NAME"
        
    else
        log_error "Deployment failed"
        exit 1
    fi
}

# Check deployment health
check_health() {
    log_info "Checking application health..."
    
    # Wait a bit for services to start
    sleep 30
    
    # Get the application URL
    APP_URL=$(restack apps list "$PROJECT_NAME" --output json | grep -o 'https://[^"]*' | head -1)
    
    if [ -n "$APP_URL" ]; then
        log_info "Testing health endpoint: $APP_URL/health"
        
        if curl -f "$APP_URL/health" > /dev/null 2>&1; then
            log_success "Application is healthy and responding"
        else
            log_warning "Application health check failed - may still be starting up"
        fi
    else
        log_warning "Could not determine application URL"
    fi
}

# Show logs
show_logs() {
    log_info "Recent application logs:"
    restack logs "$PROJECT_NAME" --tail 50
}

# Main deployment process
main() {
    echo "🎯 AsphaltTracker Restack.io Deployment"
    echo "======================================="
    
    check_restack_cli
    check_auth
    validate_config
    build_app
    deploy
    check_health
    
    echo ""
    log_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "  • Monitor logs: restack logs $PROJECT_NAME"
    echo "  • Check status: restack status $PROJECT_NAME"
    echo "  • Scale app: restack scale $PROJECT_NAME --instances 2"
    echo "  • View metrics: restack metrics $PROJECT_NAME"
    echo ""
    
    # Optionally show logs
    read -p "Would you like to see recent logs? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        show_logs
    fi
}

# Handle script arguments
case "${1:-}" in
    --logs-only)
        show_logs
        ;;
    --status-only)
        restack status "$PROJECT_NAME"
        ;;
    --health-only)
        check_health
        ;;
    --validate-only)
        validate_config
        log_success "Configuration is valid - ready for deployment"
        ;;
    *)
        main
        ;;
esac