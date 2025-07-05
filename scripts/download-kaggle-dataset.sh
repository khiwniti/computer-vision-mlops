#!/bin/bash

# Download Kaggle Driving Video Dataset
# Script to download and prepare driving videos for CCTV simulation

set -e

# Configuration
DATASET_DIR="$(pwd)/data/videos"
TEMP_DIR="$DATASET_DIR/temp"
PROCESSED_DIR="$DATASET_DIR/processed"
KAGGLE_DATASET="robikscube/driving-video-with-object-tracking"

echo "=== Kaggle Driving Video Dataset Downloader ==="
echo "Dataset: $KAGGLE_DATASET"
echo "Target directory: $DATASET_DIR"
echo ""

# Create directories
echo "Creating directories..."
mkdir -p "$DATASET_DIR"
mkdir -p "$TEMP_DIR"
mkdir -p "$PROCESSED_DIR"

# Check if kaggle CLI is available
if command -v kaggle &> /dev/null; then
    echo "Using Kaggle CLI for download..."
    
    # Download using Kaggle CLI
    cd "$TEMP_DIR"
    kaggle datasets download -d "$KAGGLE_DATASET"
    
    # Extract the dataset
    echo "Extracting dataset..."
    unzip -o "driving-video-with-object-tracking.zip"
    
else
    echo "Kaggle CLI not found. Using curl for download..."
    
    # Alternative download using curl
    DOWNLOAD_URL="https://www.kaggle.com/api/v1/datasets/download/$KAGGLE_DATASET"
    ZIP_FILE="$TEMP_DIR/driving-video-with-object-tracking.zip"
    
    echo "Downloading from: $DOWNLOAD_URL"
    curl -L -o "$ZIP_FILE" "$DOWNLOAD_URL"
    
    # Extract the dataset
    echo "Extracting dataset..."
    cd "$TEMP_DIR"
    unzip -o "$(basename "$ZIP_FILE")"
fi

# Find video files
echo "Scanning for video files..."
VIDEO_FILES=$(find "$TEMP_DIR" -type f \( -iname "*.mp4" -o -iname "*.avi" -o -iname "*.mov" -o -iname "*.mkv" \) | head -10)

if [ -z "$VIDEO_FILES" ]; then
    echo "No video files found in the dataset!"
    exit 1
fi

echo "Found video files:"
echo "$VIDEO_FILES" | nl

# Process videos for streaming (if ffmpeg is available)
if command -v ffmpeg &> /dev/null; then
    echo ""
    echo "Processing videos for streaming optimization..."
    
    counter=1
    while IFS= read -r video_file; do
        if [ -f "$video_file" ]; then
            output_file="$PROCESSED_DIR/driving_sample_$counter.mp4"
            
            echo "Processing: $(basename "$video_file") -> driving_sample_$counter.mp4"
            
            # Optimize video for streaming
            ffmpeg -i "$video_file" \
                -c:v libx264 \
                -preset medium \
                -crf 23 \
                -maxrate 2000k \
                -bufsize 4000k \
                -vf "scale=1280:720" \
                -r 25 \
                -c:a aac \
                -b:a 128k \
                -ar 44100 \
                -f mp4 \
                -movflags +faststart \
                -y "$output_file" \
                2>/dev/null || echo "  Warning: Failed to process $(basename "$video_file")"
            
            counter=$((counter + 1))
            
            # Limit to 6 videos for demo
            if [ $counter -gt 6 ]; then
                break
            fi
        fi
    done <<< "$VIDEO_FILES"
    
    echo ""
    echo "Video processing completed!"
    echo "Processed videos saved to: $PROCESSED_DIR"
    ls -la "$PROCESSED_DIR"/*.mp4 2>/dev/null || echo "No processed videos found"
    
else
    echo ""
    echo "FFmpeg not found. Copying raw video files..."
    
    # Copy raw videos if ffmpeg is not available
    counter=1
    while IFS= read -r video_file; do
        if [ -f "$video_file" ]; then
            output_file="$PROCESSED_DIR/driving_sample_$counter.mp4"
            cp "$video_file" "$output_file"
            echo "Copied: $(basename "$video_file") -> driving_sample_$counter.mp4"
            
            counter=$((counter + 1))
            
            # Limit to 6 videos for demo
            if [ $counter -gt 6 ]; then
                break
            fi
        fi
    done <<< "$VIDEO_FILES"
fi

# Generate sample metadata
echo ""
echo "Generating metadata..."
cat > "$PROCESSED_DIR/metadata.json" << 'EOF'
[
  {
    "filename": "driving_sample_1.mp4",
    "duration": 120,
    "resolution": "1280x720",
    "frameRate": 25,
    "size": 15728640,
    "codec": "h264",
    "bitrate": 2000,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "checksum": "sample_checksum_1"
  },
  {
    "filename": "driving_sample_2.mp4",
    "duration": 135,
    "resolution": "1280x720",
    "frameRate": 25,
    "size": 17825792,
    "codec": "h264",
    "bitrate": 2000,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "checksum": "sample_checksum_2"
  },
  {
    "filename": "driving_sample_3.mp4",
    "duration": 110,
    "resolution": "1280x720",
    "frameRate": 25,
    "size": 14515200,
    "codec": "h264",
    "bitrate": 2000,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "checksum": "sample_checksum_3"
  },
  {
    "filename": "driving_sample_4.mp4",
    "duration": 125,
    "resolution": "1280x720",
    "frameRate": 25,
    "size": 16515072,
    "codec": "h264",
    "bitrate": 2000,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "checksum": "sample_checksum_4"
  },
  {
    "filename": "driving_sample_5.mp4",
    "duration": 140,
    "resolution": "1280x720",
    "frameRate": 25,
    "size": 18677760,
    "codec": "h264",
    "bitrate": 2000,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "checksum": "sample_checksum_5"
  },
  {
    "filename": "driving_sample_6.mp4",
    "duration": 115,
    "resolution": "1280x720",
    "frameRate": 25,
    "size": 15206400,
    "codec": "h264",
    "bitrate": 2000,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "checksum": "sample_checksum_6"
  }
]
EOF

# Cleanup temporary files
echo ""
echo "Cleaning up temporary files..."
rm -rf "$TEMP_DIR"

# Summary
echo ""
echo "=== Download and Processing Complete ==="
echo "Dataset location: $DATASET_DIR"
echo "Processed videos: $PROCESSED_DIR"
echo "Total processed videos: $(ls -1 "$PROCESSED_DIR"/*.mp4 2>/dev/null | wc -l)"
echo ""
echo "You can now start the streaming server with:"
echo "  npm run dev"
echo ""
echo "Then test the streaming API:"
echo "  curl http://localhost:5000/api/streams/dataset/videos"
echo "  curl -X POST http://localhost:5000/api/streams/initialize"
echo ""