#!/bin/bash

# Simple HTTP server for testing visual modules
# This avoids CORS issues with file:// protocol

echo "🚀 Starting HTTP Server for Visual Module Testing..."
echo ""
echo "This will serve files via HTTP to avoid CORS issues with iframe loading"
echo ""

# Check if port 8080 is available
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ Port 8080 is already in use"
    echo "Please stop the service using port 8080 or modify this script to use a different port"
    exit 1
fi

echo "✅ Port 8080 is available"
echo ""
echo "Starting HTTP server on http://localhost:8080"
echo ""
echo "Test URLs:"
echo "  - Main test: http://localhost:8080/test_visual_modules.html"
echo "  - Simple test: http://localhost:8080/simple_iframe_test.html"
echo "  - Direct modules:"
echo "    - http://localhost:8080/html_visual_modules/numberline.html"
echo "    - http://localhost:8080/html_visual_modules/area_models.html"
echo "    - http://localhost:8080/html_visual_modules/quotative.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start Python HTTP server
python3 -m http.server 8080
