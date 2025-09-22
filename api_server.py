#!/usr/bin/env python3
"""
API Server for Math Blaster
Handles user authentication and data persistence
"""

import json
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from user_data import user_manager

class APIHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/api/users':
            self.handle_list_users()
        elif path.startswith('/api/user/'):
            username = path.split('/')[-1]
            self.handle_get_user(username)
        else:
            self.send_error(404, "Not Found")
    
    def do_POST(self):
        """Handle POST requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Read request body
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON")
            return
        
        if path == '/api/login':
            self.handle_login(data)
        elif path == '/api/register':
            self.handle_register(data)
        elif path == '/api/save_ammunition':
            self.handle_save_ammunition(data)
        elif path == '/api/save_stats':
            self.handle_save_stats(data)
        else:
            self.send_error(404, "Not Found")
    
    def handle_login(self, data):
        """Handle user login"""
        username = data.get('username', '')
        password = data.get('password', '')
        
        if user_manager.authenticate_user(username, password):
            user_data = user_manager.get_user_data(username)
            self.send_json_response(200, {
                'success': True,
                'message': 'Login successful',
                'user_data': user_data
            })
        else:
            self.send_json_response(401, {
                'success': False,
                'message': 'Invalid username or password'
            })
    
    def handle_register(self, data):
        """Handle user registration"""
        username = data.get('username', '')
        password = data.get('password', '')
        
        if not username or not password:
            self.send_json_response(400, {
                'success': False,
                'message': 'Username and password are required'
            })
            return
        
        if user_manager.create_user(username, password):
            user_data = user_manager.get_user_data(username)
            self.send_json_response(201, {
                'success': True,
                'message': 'User created successfully',
                'user_data': user_data
            })
        else:
            self.send_json_response(409, {
                'success': False,
                'message': 'Username already exists'
            })
    
    def handle_save_ammunition(self, data):
        """Handle saving ammunition banks"""
        username = data.get('username', '')
        banks = data.get('ammunition_banks', {})
        
        if user_manager.update_ammunition_banks(username, banks):
            self.send_json_response(200, {
                'success': True,
                'message': 'Ammunition saved successfully'
            })
        else:
            self.send_json_response(404, {
                'success': False,
                'message': 'User not found'
            })
    
    def handle_save_stats(self, data):
        """Handle saving game statistics"""
        username = data.get('username', '')
        stats = data.get('game_stats', {})
        
        if user_manager.update_game_stats(username, stats):
            self.send_json_response(200, {
                'success': True,
                'message': 'Stats saved successfully'
            })
        else:
            self.send_json_response(404, {
                'success': False,
                'message': 'User not found'
            })
    
    def handle_get_user(self, username):
        """Handle getting user data"""
        user_data = user_manager.get_user_data(username)
        if user_data:
            self.send_json_response(200, {
                'success': True,
                'user_data': user_data
            })
        else:
            self.send_json_response(404, {
                'success': False,
                'message': 'User not found'
            })
    
    def handle_list_users(self):
        """Handle listing all users (admin)"""
        users = user_manager.list_users()
        self.send_json_response(200, {
            'success': True,
            'users': users
        })
    
    def send_json_response(self, status_code, data):
        """Send JSON response with CORS headers"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        response = json.dumps(data, indent=2)
        self.wfile.write(response.encode('utf-8'))

def main():
    """Start the API server"""
    port = 8001
    server_address = ('', port)
    httpd = HTTPServer(server_address, APIHandler)
    
    print("🚀 Math Blaster API Server")
    print("=" * 40)
    print(f"API Server running at: http://localhost:{port}")
    print("Endpoints:")
    print("  POST /api/login - User login")
    print("  POST /api/register - User registration")
    print("  POST /api/save_ammunition - Save ammunition banks")
    print("  POST /api/save_stats - Save game statistics")
    print("  GET /api/user/{username} - Get user data")
    print("  GET /api/users - List all users")
    print("Press Ctrl+C to stop the server")
    print("=" * 40)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 API Server stopped. Thanks for playing Math Blaster!")

if __name__ == "__main__":
    main()
