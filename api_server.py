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
        elif path == '/api/save_settings':
            self.handle_save_settings(data)
        elif path == '/api/generate_math_problem':
            self.handle_generate_math_problem(data)
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
    
    def handle_save_settings(self, data):
        """Handle saving user settings"""
        username = data.get('username', '')
        settings = data.get('settings', {})
        
        if not username:
            self.send_json_response(400, {
                'success': False,
                'message': 'Username required'
            })
            return
        
        success = user_manager.update_user_settings(username, settings)
        if success:
            self.send_json_response(200, {
                'success': True,
                'message': 'Settings saved successfully'
            })
        else:
            self.send_json_response(404, {
                'success': False,
                'message': 'User not found'
            })
    
    def handle_generate_math_problem(self, data):
        """Handle generating math problems"""
        try:
            from generators.math_generator_factory import MathGeneratorFactory
            
            level = data.get('level', 1)
            generator_type = data.get('generator_type', None)  # Let factory decide default
            
            # Validate level
            if not isinstance(level, int) or level < 1:
                self.send_json_response(400, {
                    'success': False,
                    'message': 'Level must be a positive integer'
                })
                return
            
            # Create factory and generator
            factory = MathGeneratorFactory()
            generator = factory.create_generator(generator_type)
            
            # Check if level is valid for this generator
            if level > generator.get_max_level():
                self.send_json_response(400, {
                    'success': False,
                    'message': f'Level {level} not supported. Max level: {generator.get_max_level()}'
                })
                return
            
            # Generate problem
            problem = generator.generate_problem(level)
            
            self.send_json_response(200, {
                'success': True,
                'problem': {
                    'question': problem.question,
                    'answer': problem.answer,
                    'level': problem.level,
                    'type': problem.problem_type,
                    'level_name': generator.get_level_name(level),
                    'description': generator.describe_level(level)
                }
            })
            
        except Exception as e:
            self.send_json_response(500, {
                'success': False,
                'message': f'Error generating math problem: {str(e)}'
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
