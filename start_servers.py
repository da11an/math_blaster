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

def kill_existing_servers():
    """Kill any existing Math Blaster servers using system commands"""
    print("🔍 Checking for existing servers...")
    
    # First, try to kill any Python server processes by name
    try:
        # Kill gracefully first
        subprocess.run(['pkill', '-TERM', '-f', 'server.py'], timeout=5)
        subprocess.run(['pkill', '-TERM', '-f', 'api_server.py'], timeout=5)
        print("🔄 Sent termination signals to existing servers")
    except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
        pass
    
    # Wait for graceful shutdown
    time.sleep(2)
    
    # Check for processes on our ports
    ports_to_check = [8000, 8001]
    for port in ports_to_check:
        try:
            # Find processes using the port
            result = subprocess.run(['lsof', '-ti', f':{port}'], 
                                  capture_output=True, text=True, timeout=5)
            
            if result.returncode == 0 and result.stdout.strip():
                pids = result.stdout.strip().split('\n')
                for pid in pids:
                    if pid.strip():
                        try:
                            # Check if it's a Math Blaster server
                            cmd_result = subprocess.run(['ps', '-p', pid, '-o', 'cmd='], 
                                                      capture_output=True, text=True, timeout=5)
                            if cmd_result.returncode == 0:
                                cmdline = cmd_result.stdout.strip()
                                if 'server.py' in cmdline or 'api_server.py' in cmdline:
                                    print(f"🔄 Killing server on port {port} (PID: {pid})")
                                    subprocess.run(['kill', '-TERM', pid], timeout=5)
                        except (subprocess.TimeoutExpired, subprocess.CalledProcessError):
                            pass
        except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
            pass
    
    # Wait a bit more for graceful shutdown
    time.sleep(2)
    
    # Force kill any remaining Python server processes
    try:
        subprocess.run(['pkill', '-9', '-f', 'server.py'], timeout=5)
        subprocess.run(['pkill', '-9', '-f', 'api_server.py'], timeout=5)
        print("🔨 Force killed any remaining server processes")
    except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
        pass
    
    # Final wait
    time.sleep(1)
    
    # Verify ports are free
    for port in ports_to_check:
        try:
            result = subprocess.run(['lsof', '-ti', f':{port}'], 
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0 and result.stdout.strip():
                print(f"⚠️  Warning: Port {port} still in use")
            else:
                print(f"✅ Port {port} is free")
        except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
            print(f"✅ Port {port} appears to be free")

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
    
    # Kill any existing servers first
    kill_existing_servers()
    
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
