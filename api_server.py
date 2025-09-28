#!/usr/bin/env python3
"""
API Server for Math Blaster
Handles user authentication and data persistence
"""

import json
import os
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from user_data import user_manager
from math_problem_logger import math_logger

def log_with_timestamp(message):
    """Log a message with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {message}")

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
        elif path == '/api/generators':
            self.handle_get_generators()
        elif path == '/api/leaderboard':
            self.handle_get_leaderboard()
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
        elif path == '/api/log_answer':
            self.handle_log_answer(data)
        elif path == '/api/log_skip':
            self.handle_log_skip(data)
        elif path == '/api/math_stats':
            self.handle_math_stats(data)
        elif path == '/api/rate_session':
            self.handle_rate_session(data)
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
            grade_level = data.get('grade_level', 'G3')  # Default to 3rd grade
            username = data.get('username', 'guest')
            bank_number = data.get('bank_number', None)
            
            # Log the request details
            log_with_timestamp(f"🧮 Math Problem Request: Level={level}, Generator={generator_type}, User={username}")
            
            # Validate level
            if not isinstance(level, int) or level < 1:
                log_with_timestamp(f"❌ Invalid level: {level}")
                self.send_json_response(400, {
                    'success': False,
                    'message': 'Level must be a positive integer'
                })
                return
            
            # Create factory and generator
            factory = MathGeneratorFactory()
            generator = factory.create_generator(generator_type, grade_level=grade_level)
            
            # Log generator details
            generator_name = generator.__class__.__name__
            max_level = generator.get_max_level()
            log_with_timestamp(f"📊 Using Generator: {generator_name} (Max Level: {max_level})")
            
            # Check if level is valid for this generator
            if level > generator.get_max_level():
                log_with_timestamp(f"❌ Level {level} exceeds max level {max_level} for {generator_name}")
                self.send_json_response(400, {
                    'success': False,
                    'message': f'Level {level} not supported. Max level: {generator.get_max_level()}'
                })
                return
            
            # Generate problem
            problem = generator.generate_problem(level)
            
            # Log the generated problem
            log_with_timestamp(f"✅ Generated: '{problem.question}' = {problem.answer} (Type: {problem.problem_type})")
            
            # Log to math problem logger
            problem_id = math_logger.log_problem_generated(
                username=username,
                problem_statement=problem.question,
                generator_type=generator_name,
                level=level,
                level_name=generator.get_level_name(level),
                correct_answer=problem.answer,
                bank_number=bank_number
            )
            
            self.send_json_response(200, {
                'success': True,
                'problem': {
                    'question': problem.question,
                    'answer': problem.answer,
                    'level': problem.level,
                    'type': problem.problem_type,
                    'level_name': generator.get_level_name(level),
                    'description': generator.describe_level(level),
                    'problem_id': problem_id
                }
            })
            
        except Exception as e:
            log_with_timestamp(f"💥 Error generating math problem: {str(e)}")
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
    
    def handle_get_generators(self):
        """Handle getting available math generators"""
        try:
            from generators.math_generator_factory import MathGeneratorFactory
            
            log_with_timestamp("🔧 Generators Request: Loading available math generators...")
            
            factory = MathGeneratorFactory()
            available_generators = factory.get_available_generators()
            default_generator = factory.get_default_generator()
            
            log_with_timestamp(f"📋 Available generators: {available_generators}")
            log_with_timestamp(f"🎯 Default generator: {default_generator}")
            
            # Reorder generators to put the default first
            ordered_generators = []
            if default_generator in available_generators:
                ordered_generators.append(default_generator)
                # Add the rest
                for gen_type in available_generators:
                    if gen_type != default_generator:
                        ordered_generators.append(gen_type)
            else:
                ordered_generators = available_generators
            
            log_with_timestamp(f"📋 Ordered generators (default first): {ordered_generators}")
            
            # Get descriptions for each generator
            generators_info = []
            for gen_type in ordered_generators:
                try:
                    generator = factory.create_generator(gen_type)
                    max_level = generator.get_max_level()
                    
                    if gen_type == 'mental':
                        description = "Progressive difficulty with specialized problem types (Levels 1-10)"
                    elif gen_type == 'fact_ladder':
                        description = "Structured progression through math facts (Levels 1-9)"
                    else:
                        description = f"Math generator with {max_level} levels"
                    
                    # Generate proper name for each generator type
                    if gen_type == 'fact_ladder':
                        name = 'Fact Ladder Math'
                    else:
                        name = gen_type.title() + ' Math'
                    
                    generators_info.append({
                        'type': gen_type,
                        'name': name,
                        'description': description,
                        'max_level': max_level
                    })
                    
                    log_with_timestamp(f"✅ Loaded generator: {gen_type.title()} Math (Levels 1-{max_level})")
                    
                except Exception as e:
                    log_with_timestamp(f"❌ Failed to load generator {gen_type}: {str(e)}")
                    # Skip generators that can't be instantiated
                    continue
            
            log_with_timestamp(f"🎯 Returning {len(generators_info)} generators to client (default: {default_generator})")
            
            self.send_json_response(200, {
                'success': True,
                'generators': generators_info,
                'default_generator': default_generator
            })
            
        except Exception as e:
            log_with_timestamp(f"💥 Error getting generators: {str(e)}")
            self.send_json_response(500, {
                'success': False,
                'message': f'Error getting generators: {str(e)}'
            })
    
    def handle_get_leaderboard(self):
        """Handle getting ammunition leaderboard"""
        try:
            log_with_timestamp("🏆 Leaderboard Request: Loading ammunition leaderboard...")
            
            # Load user data
            users = user_manager.list_users()
            
            # Calculate total ammunition for each user
            leaderboard_data = []
            for username in users:
                user_data = user_manager.get_user_data(username)
                if user_data and 'ammunition_banks' in user_data:
                    total_ammo = sum(user_data['ammunition_banks'].values())
                    leaderboard_data.append({
                        'username': username,
                        'total_ammo': total_ammo,
                        'ammunition': user_data['ammunition_banks']
                    })
            
            # Sort by total ammunition (descending) and take top 10
            leaderboard_data.sort(key=lambda x: x['total_ammo'], reverse=True)
            top_10 = leaderboard_data[:10]
            
            log_with_timestamp(f"🏆 Returning leaderboard with {len(top_10)} players")
            
            self.send_json_response(200, {
                'success': True,
                'leaderboard': top_10
            })
            
        except Exception as e:
            log_with_timestamp(f"💥 Error getting leaderboard: {str(e)}")
            self.send_json_response(500, {
                'success': False,
                'message': f'Error getting leaderboard: {str(e)}'
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
    
    def handle_log_answer(self, data):
        """Handle logging math problem answers"""
        try:
            problem_id = data.get('problem_id')
            user_answer = data.get('user_answer')
            time_elapsed = data.get('time_elapsed')
            
            if not problem_id or user_answer is None or time_elapsed is None:
                self.send_json_response(400, {
                    'success': False,
                    'message': 'Missing required fields: problem_id, user_answer, time_elapsed'
                })
                return
            
            # Log the answer
            success = math_logger.log_problem_answered(problem_id, user_answer, time_elapsed)
            
            if success:
                log_with_timestamp(f"📝 Logged answer: Problem {problem_id}, Answer: {user_answer}, Time: {time_elapsed:.2f}s")
                self.send_json_response(200, {'success': True})
            else:
                log_with_timestamp(f"❌ Failed to log answer: Problem {problem_id} not found")
                self.send_json_response(404, {
                    'success': False,
                    'message': 'Problem not found'
                })
                
        except Exception as e:
            log_with_timestamp(f"💥 Error logging answer: {str(e)}")
            self.send_json_response(500, {
                'success': False,
                'message': 'Internal server error'
            })
    
    def handle_log_skip(self, data):
        """Handle logging skipped math problems"""
        try:
            problem_id = data.get('problem_id')
            reason = data.get('reason', 'user_skipped')
            
            if not problem_id:
                self.send_json_response(400, {
                    'success': False,
                    'message': 'Missing required field: problem_id'
                })
                return
            
            # Log the skip
            success = math_logger.log_problem_skipped(problem_id, reason)
            
            if success:
                log_with_timestamp(f"⏭️ Logged skip: Problem {problem_id}, Reason: {reason}")
                self.send_json_response(200, {'success': True})
            else:
                log_with_timestamp(f"❌ Failed to log skip: Problem {problem_id} not found")
                self.send_json_response(404, {
                    'success': False,
                    'message': 'Problem not found'
                })
                
        except Exception as e:
            log_with_timestamp(f"💥 Error logging skip: {str(e)}")
            self.send_json_response(500, {
                'success': False,
                'message': 'Internal server error'
            })
    
    def handle_math_stats(self, data):
        """Handle getting math problem statistics"""
        try:
            username = data.get('username', None)
            stats = math_logger.get_stats(username)
            
            log_with_timestamp(f"📊 Retrieved math stats for user: {username or 'all'}")
            self.send_json_response(200, {
                'success': True,
                'stats': stats
            })
            
        except Exception as e:
            log_with_timestamp(f"💥 Error getting math stats: {str(e)}")
            self.send_json_response(500, {
                'success': False,
                'message': 'Internal server error'
            })
    
    def handle_rate_session(self, data):
        """Handle rating a user's math session"""
        try:
            username = data.get('username', None)
            
            if not username:
                self.send_json_response(400, {
                    'success': False,
                    'message': 'Missing required field: username'
                })
                return
            
            # Read all log entries
            log_entries = []
            if os.path.exists(math_logger.log_file):
                with open(math_logger.log_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        try:
                            entry = json.loads(line.strip())
                            log_entries.append(entry)
                        except json.JSONDecodeError:
                            continue
            
            # Import and use the rate_session function
            from rate_session import rate_session
            
            # Rate the session
            rating_result = rate_session(log_entries, username)
            
            log_with_timestamp(f"📊 Rated session for user: {username}")
            self.send_json_response(200, {
                'success': True,
                'rating': rating_result
            })
            
        except Exception as e:
            log_with_timestamp(f"💥 Error rating session: {str(e)}")
            self.send_json_response(500, {
                'success': False,
                'message': 'Internal server error'
            })

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
    print("  POST /api/generate_math_problem - Generate math problem")
    print("  POST /api/log_answer - Log math problem answer")
    print("  POST /api/log_skip - Log skipped math problem")
    print("  POST /api/math_stats - Get math problem statistics")
    print("  POST /api/rate_session - Rate user's math session")
    print("  GET /api/user/{username} - Get user data")
    print("  GET /api/users - List all users")
    print("  GET /api/generators - Get available math generators")
    print("  GET /api/leaderboard - Get ammunition leaderboard")
    print("Press Ctrl+C to stop the server")
    print("=" * 40)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 API Server stopped. Thanks for playing Math Blaster!")

if __name__ == "__main__":
    main()
