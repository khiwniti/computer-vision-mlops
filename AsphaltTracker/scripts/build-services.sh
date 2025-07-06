#!/bin/bash

# Build script for AsphaltTracker Restack services
# Ensures proper compilation and deployment of AI-powered services

set -e

echo "🏗️ Building AsphaltTracker Restack Services..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create dist directory if it doesn't exist
mkdir -p dist

# Build the services using esbuild
echo "🔨 Building services with esbuild..."
npx esbuild src/services.ts \
    --platform=node \
    --packages=external \
    --bundle \
    --format=esm \
    --outdir=dist \
    --target=node18 \
    --sourcemap \
    --minify

# Check if services.js was created
if [ -f "dist/services.js" ]; then
    echo "✅ Services built successfully: dist/services.js"
    
    # Show file size
    SIZE=$(du -h dist/services.js | cut -f1)
    echo "📊 Bundle size: $SIZE"
    
    # Verify the file is valid JavaScript
    if node -c dist/services.js; then
        echo "✅ Services bundle is valid"
    else
        echo "❌ Services bundle has syntax errors"
        exit 1
    fi
else
    echo "❌ Failed to build services.js"
    exit 1
fi

# Build the main application as well
echo "🔨 Building main application..."
npm run build

echo "🎉 Build completed successfully!"
echo ""
echo "To start the services:"
echo "  npm run services:start"
echo ""
echo "To start everything:"
echo "  npm run start:all"
