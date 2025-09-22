#!/usr/bin/env python3
"""
Startup script for Math Blaster
Runs both the web server and API server
"""

import subprocess
import sys
import time
import os
import signal
import threading

def run_web_server():
    """Run the web server on port 8000"""
    try:
        subprocess.run([sys.executable, 'server.py'], check=True)
    except KeyboardInterrupt:
        pass

def run_api_server():
    """Run the API server on port 8001"""
    try:
        subprocess.run([sys.executable, 'api_server.py'], check=True)
    except KeyboardInterrupt:
        pass

def main():
    print("🚀 Starting Math Blaster Servers...")
    print("=" * 50)
    
    # Start API server in a separate thread
    api_thread = threading.Thread(target=run_api_server, daemon=True)
    api_thread.start()
    
    # Give API server time to start
    time.sleep(2)
    
    print("✅ API Server started on port 8001")
    print("✅ Starting Web Server on port 8000...")
    print("=" * 50)
    print("🌐 Game will open at: http://localhost:8000")
    print("🔧 API available at: http://localhost:8001")
    print("Press Ctrl+C to stop both servers")
    print("=" * 50)
    
    try:
        # Start web server in main thread
        run_web_server()
    except KeyboardInterrupt:
        print("\n👋 Shutting down servers...")
        print("Thanks for playing Math Blaster!")

if __name__ == "__main__":
    main()
