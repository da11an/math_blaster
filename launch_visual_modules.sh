#!/bin/bash

# Visual Module Launcher Startup Script
# This script starts the API server and opens the direct loading visual launcher

echo "🚀 Starting Math Visual Modules Launcher (Direct Loading)..."
echo ""

# Check if API server is already running
if curl -s http://localhost:8001/api/generators > /dev/null 2>&1; then
    echo "✅ API server is already running"
else
    echo "🔄 Starting API server..."
    cd "$(dirname "$0")"
    python3 api_server.py &
    API_PID=$!
    
    # Wait for API server to start
    echo "⏳ Waiting for API server to start..."
    for i in {1..10}; do
        if curl -s http://localhost:8001/api/generators > /dev/null 2>&1; then
            echo "✅ API server started successfully"
            break
        fi
        sleep 1
    done
    
    if [ $i -eq 10 ]; then
        echo "❌ Failed to start API server"
        exit 1
    fi
fi

# Start HTTP server for direct loading (needed for API calls)
echo "🔄 Starting HTTP server for direct loading..."
if curl -s http://localhost:8080/ > /dev/null 2>&1; then
    echo "✅ HTTP server already running on port 8080"
else
    python3 -m http.server 8080 &
    HTTP_PID=$!
    
    # Wait for HTTP server to start
    echo "⏳ Waiting for HTTP server to start..."
    for i in {1..5}; do
        if curl -s http://localhost:8080/ > /dev/null 2>&1; then
            echo "✅ HTTP server started successfully"
            break
        fi
        sleep 1
    done
    
    if [ $i -eq 5 ]; then
        echo "❌ Failed to start HTTP server"
        exit 1
    fi
fi

# Open the direct loading visual launcher via HTTP
echo "🌐 Opening Direct Loading Visual Launcher..."
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:8080/direct_visual_launcher.html
elif command -v open > /dev/null; then
    open http://localhost:8080/direct_visual_launcher.html
else
    echo "📝 Please open http://localhost:8080/direct_visual_launcher.html in your web browser"
fi

echo ""
echo "🎯 Direct Loading Visual Launcher is ready!"
echo "   - No iframes required - direct DOM integration"
echo "   - Generate problems using the control panel"
echo "   - Visual representations appear immediately"
echo "   - Use Show Hint, Animate, and Reset buttons to interact"
echo ""
echo "🌐 Server URLs:"
echo "   - Direct Launcher: http://localhost:8080/direct_visual_launcher.html"
echo "   - Simple Test: http://localhost:8080/direct_visual_test.html"
echo "   - API Server: http://localhost:8001"
echo ""
echo "Press Ctrl+C to stop both servers when done"

