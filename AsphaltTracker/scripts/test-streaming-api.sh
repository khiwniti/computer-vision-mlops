#!/bin/bash

# Test Script for Streaming API
# Tests various endpoints of the streaming API

set -e

BASE_URL="http://localhost:5000/api/streams"

echo "=== Streaming API Test Suite ==="
echo "Base URL: $BASE_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -e "${BLUE}Testing:${NC} $description"
    echo "  $method $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL$endpoint" 2>/dev/null || echo "HTTPSTATUS:000")
    elif [ "$method" = "POST" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint" 2>/dev/null || echo "HTTPSTATUS:000")
        else
            response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$BASE_URL$endpoint" 2>/dev/null || echo "HTTPSTATUS:000")
        fi
    fi
    
    http_code=$(echo "$response" | sed -n 's/.*HTTPSTATUS:\([0-9]*\)$/\1/p')
    body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "  ${GREEN}✓ Success${NC} (HTTP $http_code)"
        echo "$body" | jq . 2>/dev/null | head -10 || echo "$body" | head -3
    else
        echo -e "  ${RED}✗ Failed${NC} (HTTP $http_code)"
        echo "$body" | head -3
    fi
    echo ""
}

# Check if server is running
echo "Checking if server is running..."
if ! curl -s "$BASE_URL/health" > /dev/null 2>&1; then
    echo -e "${RED}Error: Server is not running at $BASE_URL${NC}"
    echo "Please start the server with: npm run dev"
    exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}"
echo ""

# Test 1: Health Check
test_endpoint "GET" "/health" "Health check"

# Test 2: System Status
test_endpoint "GET" "/status" "System status"

# Test 3: Dataset Statistics
test_endpoint "GET" "/dataset/stats" "Dataset statistics"

# Test 4: Available Videos
test_endpoint "GET" "/dataset/videos" "Available videos"

# Test 5: Processing Jobs
test_endpoint "GET" "/dataset/jobs" "Processing jobs"

# Test 6: Stream Groups
test_endpoint "GET" "/groups" "Stream groups"

# Test 7: Active Stream URLs
test_endpoint "GET" "/urls" "Active stream URLs"

# Test 8: Initialize Streams (if no streams are running)
echo -e "${BLUE}Checking if streams need initialization...${NC}"
stream_count=$(curl -s "$BASE_URL/status" | jq -r '.streams.runningStreams // 0' 2>/dev/null || echo "0")

if [ "$stream_count" = "0" ]; then
    echo "No running streams found. Initializing..."
    test_endpoint "POST" "/initialize" "Initialize streams"
    
    # Wait a moment for initialization
    echo "Waiting for streams to start..."
    sleep 5
    
    # Check status again
    test_endpoint "GET" "/status" "System status after initialization"
else
    echo -e "${GREEN}✓ Streams already running ($stream_count streams)${NC}"
    echo ""
fi

# Test 9: Get first truck's streams (if any exist)
truck_id=$(curl -s "$BASE_URL/groups" | jq -r '.groups[0].truckId // empty' 2>/dev/null)

if [ -n "$truck_id" ] && [ "$truck_id" != "null" ]; then
    echo -e "${BLUE}Testing truck-specific endpoints for truck $truck_id...${NC}"
    test_endpoint "GET" "/groups/$truck_id" "Get truck $truck_id streams"
    
    # Test stream control (optional - commented out to avoid disrupting running streams)
    # test_endpoint "POST" "/groups/$truck_id/stop" "Stop truck $truck_id streams"
    # sleep 2
    # test_endpoint "POST" "/groups/$truck_id/start" "Start truck $truck_id streams"
else
    echo -e "${BLUE}No trucks found in stream groups${NC}"
    echo ""
fi

# Test 10: Create Custom Stream (example)
echo -e "${BLUE}Testing custom stream creation...${NC}"
custom_stream_data='{
  "id": "test_custom_stream",
  "name": "Test Custom Stream",
  "sourceVideo": "driving_sample_1.mp4",
  "rtspPort": 8600,
  "resolution": "1280x720",
  "frameRate": 25,
  "bitrate": "2000k",
  "loop": true,
  "cameraPosition": "front",
  "truckId": 999,
  "enabled": true
}'

# Only create if not already exists
existing_custom=$(curl -s "$BASE_URL/status" | jq -r '.activeStreams[] | select(.id == "test_custom_stream") | .id' 2>/dev/null || echo "")

if [ -z "$existing_custom" ]; then
    test_endpoint "POST" "/custom" "Create custom stream" "$custom_stream_data"
    
    # Clean up custom stream
    sleep 2
    echo -e "${BLUE}Cleaning up custom stream...${NC}"
    curl -s -X DELETE "$BASE_URL/test_custom_stream" > /dev/null 2>&1 || true
    echo -e "${GREEN}✓ Custom stream cleaned up${NC}"
    echo ""
else
    echo -e "${BLUE}Custom stream already exists, skipping creation${NC}"
    echo ""
fi

# Summary
echo "=== Test Summary ==="
final_status=$(curl -s "$BASE_URL/status" | jq -r '.system.status // "unknown"' 2>/dev/null)
running_streams=$(curl -s "$BASE_URL/status" | jq -r '.streams.runningStreams // 0' 2>/dev/null)
total_streams=$(curl -s "$BASE_URL/status" | jq -r '.streams.totalStreams // 0' 2>/dev/null)

echo "System Status: $final_status"
echo "Running Streams: $running_streams / $total_streams"
echo ""

if [ "$final_status" = "healthy" ] && [ "$running_streams" -gt "0" ]; then
    echo -e "${GREEN}✓ Streaming API is working correctly!${NC}"
    echo ""
    echo "You can now:"
    echo "  - View the streaming dashboard at: http://localhost:5000/live-monitoring"
    echo "  - Monitor streams with: curl $BASE_URL/status"
    echo "  - View RTSP streams with VLC or similar: rtsp://localhost:8554/[stream_id]"
    echo ""
else
    echo -e "${RED}⚠ Some issues detected. Check the logs for details.${NC}"
    echo ""
fi