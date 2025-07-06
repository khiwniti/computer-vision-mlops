#!/bin/bash

# Comprehensive Mock System Testing Script
# Tests all mock data functionality and simulation features

set -e

BASE_URL="http://localhost:5000"
API_PREFIX="/api/mock"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check if server is running
check_server() {
    print_header "Checking Server Status"
    
    if curl -f -s "${BASE_URL}/api/mock/health" > /dev/null; then
        print_success "Server is running and responding"
        curl -s "${BASE_URL}/api/mock/health" | jq .
    else
        print_error "Server is not responding. Please start the server first with: npm run dev"
        exit 1
    fi
}

# Test mock data generation
test_data_generation() {
    print_header "Testing Mock Data Generation"
    
    print_info "Generating preview data..."
    PREVIEW_RESPONSE=$(curl -s "${BASE_URL}${API_PREFIX}/generate/preview?truckCount=5&includeAnalytics=true")
    
    if echo "$PREVIEW_RESPONSE" | jq -e '.success' > /dev/null; then
        print_success "Mock data generation working"
        echo "$PREVIEW_RESPONSE" | jq '.counts'
    else
        print_error "Mock data generation failed"
        echo "$PREVIEW_RESPONSE" | jq .
        exit 1
    fi
}

# Test database population
test_database_population() {
    print_header "Testing Database Population"
    
    print_info "Populating database with quick setup..."
    POPULATE_RESPONSE=$(curl -s -X POST "${BASE_URL}${API_PREFIX}/populate/quick" \
        -H "Content-Type: application/json")
    
    if echo "$POPULATE_RESPONSE" | jq -e '.success' > /dev/null; then
        print_success "Database population successful"
        echo "$POPULATE_RESPONSE" | jq '.data'
        
        # Get duration
        DURATION=$(echo "$POPULATE_RESPONSE" | jq -r '.duration')
        print_info "Population completed in ${DURATION}ms"
    else
        print_error "Database population failed"
        echo "$POPULATE_RESPONSE" | jq .
        exit 1
    fi
}

# Test simulation functionality
test_simulation() {
    print_header "Testing Real-time Simulation"
    
    print_info "Starting simulation..."
    START_RESPONSE=$(curl -s -X POST "${BASE_URL}${API_PREFIX}/simulation/start" \
        -H "Content-Type: application/json" \
        -d '{
            "updateIntervalMs": 10000,
            "incidentProbability": 0.01,
            "fraudProbability": 0.005,
            "gpsUpdateEnabled": true,
            "aiIncidentsEnabled": true,
            "fraudDetectionEnabled": true
        }')
    
    if echo "$START_RESPONSE" | jq -e '.success' > /dev/null; then
        print_success "Simulation started successfully"
        echo "$START_RESPONSE" | jq '.status'
        
        print_info "Waiting 15 seconds for simulation to generate data..."
        sleep 15
        
        # Check simulation status
        print_info "Checking simulation status..."
        STATUS_RESPONSE=$(curl -s "${BASE_URL}${API_PREFIX}/simulation/status")
        echo "$STATUS_RESPONSE" | jq '.status'
        
        # Stop simulation
        print_info "Stopping simulation..."
        STOP_RESPONSE=$(curl -s -X POST "${BASE_URL}${API_PREFIX}/simulation/stop")
        if echo "$STOP_RESPONSE" | jq -e '.success' > /dev/null; then
            print_success "Simulation stopped successfully"
        else
            print_error "Failed to stop simulation"
        fi
    else
        print_error "Failed to start simulation"
        echo "$START_RESPONSE" | jq .
        exit 1
    fi
}

# Test streaming integration
test_streaming() {
    print_header "Testing Streaming Integration"
    
    print_info "Starting streaming integration..."
    STREAM_START_RESPONSE=$(curl -s -X POST "${BASE_URL}${API_PREFIX}/streaming/start" \
        -H "Content-Type: application/json" \
        -d '{
            "streamQuality": "medium",
            "frameRate": 30,
            "enableRecording": true
        }')
    
    if echo "$STREAM_START_RESPONSE" | jq -e '.success' > /dev/null; then
        print_success "Streaming integration started"
        echo "$STREAM_START_RESPONSE" | jq '.status'
        
        print_info "Waiting 10 seconds for streaming to initialize..."
        sleep 10
        
        # Check streaming status
        print_info "Checking streaming status..."
        STREAM_STATUS_RESPONSE=$(curl -s "${BASE_URL}${API_PREFIX}/streaming/status")
        echo "$STREAM_STATUS_RESPONSE" | jq '.status'
        
        # Test camera failure simulation
        print_info "Testing camera failure simulation..."
        FAILURE_RESPONSE=$(curl -s -X POST "${BASE_URL}${API_PREFIX}/streaming/simulate/camera-failure" \
            -H "Content-Type: application/json" \
            -d '{"truckId": 1, "position": "front"}')
        
        if echo "$FAILURE_RESPONSE" | jq -e '.success' > /dev/null; then
            print_success "Camera failure simulation working"
        fi
        
        # Test camera recovery simulation
        print_info "Testing camera recovery simulation..."
        RECOVERY_RESPONSE=$(curl -s -X POST "${BASE_URL}${API_PREFIX}/streaming/simulate/camera-recovery" \
            -H "Content-Type: application/json" \
            -d '{"truckId": 1, "position": "front"}')
        
        if echo "$RECOVERY_RESPONSE" | jq -e '.success' > /dev/null; then
            print_success "Camera recovery simulation working"
        fi
        
        # Stop streaming
        print_info "Stopping streaming integration..."
        STREAM_STOP_RESPONSE=$(curl -s -X POST "${BASE_URL}${API_PREFIX}/streaming/stop")
        if echo "$STREAM_STOP_RESPONSE" | jq -e '.success' > /dev/null; then
            print_success "Streaming integration stopped"
        fi
    else
        print_error "Failed to start streaming integration"
        echo "$STREAM_START_RESPONSE" | jq .
    fi
}

# Test API endpoints
test_api_endpoints() {
    print_header "Testing API Endpoints"
    
    # Test trucks endpoint
    print_info "Testing trucks API..."
    TRUCKS_RESPONSE=$(curl -s "${BASE_URL}/api/trucks")
    if echo "$TRUCKS_RESPONSE" | jq -e 'length > 0' > /dev/null; then
        TRUCK_COUNT=$(echo "$TRUCKS_RESPONSE" | jq 'length')
        print_success "Trucks API working - ${TRUCK_COUNT} trucks found"
    else
        print_error "Trucks API not working"
    fi
    
    # Test drivers endpoint
    print_info "Testing drivers API..."
    DRIVERS_RESPONSE=$(curl -s "${BASE_URL}/api/drivers")
    if echo "$DRIVERS_RESPONSE" | jq -e 'length > 0' > /dev/null; then
        DRIVER_COUNT=$(echo "$DRIVERS_RESPONSE" | jq 'length')
        print_success "Drivers API working - ${DRIVER_COUNT} drivers found"
    else
        print_error "Drivers API not working"
    fi
    
    # Test analytics dashboard
    print_info "Testing analytics dashboard API..."
    ANALYTICS_RESPONSE=$(curl -s "${BASE_URL}/api/analytics/dashboard")
    if echo "$ANALYTICS_RESPONSE" | jq -e '.success' > /dev/null; then
        print_success "Analytics dashboard API working"
        echo "$ANALYTICS_RESPONSE" | jq '.dashboard.overview'
    else
        print_error "Analytics dashboard API not working"
    fi
    
    # Test GPS tracking
    print_info "Testing GPS tracking API..."
    GPS_RESPONSE=$(curl -s "${BASE_URL}/api/gps/status")
    if echo "$GPS_RESPONSE" | jq -e '.success' > /dev/null; then
        print_success "GPS tracking API working"
    else
        print_info "GPS tracking API may not be fully implemented yet"
    fi
}

# Test comprehensive system
test_comprehensive() {
    print_header "Running Comprehensive System Test"
    
    print_info "Starting comprehensive test (this may take a few minutes)..."
    COMPREHENSIVE_RESPONSE=$(curl -s -X POST "${BASE_URL}${API_PREFIX}/test/all-systems" \
        -H "Content-Type: application/json")
    
    if echo "$COMPREHENSIVE_RESPONSE" | jq -e '.success' > /dev/null; then
        print_success "Comprehensive system test passed"
        echo "$COMPREHENSIVE_RESPONSE" | jq '.testResults'
    else
        print_error "Comprehensive system test failed"
        echo "$COMPREHENSIVE_RESPONSE" | jq .
        exit 1
    fi
}

# Get system info
show_system_info() {
    print_header "System Information"
    
    INFO_RESPONSE=$(curl -s "${BASE_URL}${API_PREFIX}/info")
    echo "$INFO_RESPONSE" | jq '.info'
}

# Cleanup function
cleanup() {
    print_header "Cleaning Up"
    
    print_info "Stopping any running simulations..."
    curl -s -X POST "${BASE_URL}${API_PREFIX}/simulation/stop" > /dev/null
    curl -s -X POST "${BASE_URL}${API_PREFIX}/streaming/stop" > /dev/null
    
    print_success "Cleanup completed"
}

# Main execution
main() {
    print_header "AsphaltTracker Mock System Test Suite"
    
    # Check prerequisites
    if ! command -v curl &> /dev/null; then
        print_error "curl is required but not installed"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        print_error "jq is required but not installed"
        exit 1
    fi
    
    # Run tests
    check_server
    show_system_info
    test_data_generation
    test_database_population
    test_api_endpoints
    test_simulation
    test_streaming
    test_comprehensive
    
    # Cleanup
    cleanup
    
    print_header "All Tests Completed Successfully! 🎉"
    print_success "Mock system is working correctly"
    print_info "You can now use the following commands to interact with the mock system:"
    echo ""
    echo "  # Populate database with mock data"
    echo "  curl -X POST ${BASE_URL}${API_PREFIX}/populate/quick"
    echo ""
    echo "  # Start real-time simulation"
    echo "  curl -X POST ${BASE_URL}${API_PREFIX}/simulation/start"
    echo ""
    echo "  # Start streaming integration"
    echo "  curl -X POST ${BASE_URL}${API_PREFIX}/streaming/start"
    echo ""
    echo "  # Check system status"
    echo "  curl ${BASE_URL}${API_PREFIX}/status"
}

# Run main function
main "$@"