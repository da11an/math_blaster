#!/usr/bin/env python3
"""
User Data Management for Math Blaster
Handles user accounts and persistent ammunition storage
"""

import json
import os
import hashlib
from datetime import datetime
from typing import Dict, List, Optional

class UserManager:
    def __init__(self, data_dir="user_data"):
        self.data_dir = data_dir
        self.users_file = os.path.join(data_dir, "users.json")
        self.ensure_data_directory()
        self.load_users()
    
    def ensure_data_directory(self):
        """Create data directory if it doesn't exist"""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
    
    def load_users(self):
        """Load user data from file"""
        if os.path.exists(self.users_file):
            try:
                with open(self.users_file, 'r') as f:
                    self.users = json.load(f)
            except (json.JSONDecodeError, FileNotFoundError):
                self.users = {}
        else:
            self.users = {}
    
    def save_users(self):
        """Save user data to file"""
        with open(self.users_file, 'w') as f:
            json.dump(self.users, f, indent=2)
    
    def hash_password(self, password: str) -> str:
        """Simple password hashing"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def create_user(self, username: str, password: str) -> bool:
        """Create a new user account"""
        if username in self.users:
            return False  # User already exists
        
        # Initialize user with default ammunition banks (efficient count-based storage)
        self.users[username] = {
            'password_hash': self.hash_password(password),
            'created_at': datetime.now().isoformat(),
            'last_login': None,
            'ammunition_banks': {
                '0': 0,  # Bank 0 is infinite, so count is always 0
                '1': 0, '2': 0, '3': 0, '4': 0, '5': 0,
                '6': 0, '7': 0, '8': 0, '9': 0
            },
            'game_stats': {
                'total_score': 0,
                'highest_level': 1,
                'total_math_problems': 0,
                'correct_math_problems': 0,
                'total_enemies_destroyed': 0
            },
            'settings': {
                'ammo_persistence': True  # Keep ammunition between games by default
            }
        }
        self.save_users()
        return True
    
    def authenticate_user(self, username: str, password: str) -> bool:
        """Authenticate user login"""
        if username not in self.users:
            return False
        
        password_hash = self.hash_password(password)
        if self.users[username]['password_hash'] == password_hash:
            self.users[username]['last_login'] = datetime.now().isoformat()
            self.save_users()
            return True
        return False
    
    def get_user_data(self, username: str) -> Optional[Dict]:
        """Get user's game data"""
        if username not in self.users:
            return None
        return self.users[username]
    
    def update_ammunition_banks(self, username: str, banks: Dict) -> bool:
        """Update user's ammunition banks"""
        if username not in self.users:
            return False
        
        self.users[username]['ammunition_banks'] = banks
        self.save_users()
        return True
    
    def update_game_stats(self, username: str, stats: Dict) -> bool:
        """Update user's game statistics"""
        if username not in self.users:
            return False
        
        self.users[username]['game_stats'].update(stats)
        self.save_users()
        return True
    
    def update_user_settings(self, username: str, settings: Dict) -> bool:
        """Update user's settings"""
        if username not in self.users:
            return False
        
        # Initialize settings if they don't exist
        if 'settings' not in self.users[username]:
            self.users[username]['settings'] = {}
        
        # Update settings
        self.users[username]['settings'].update(settings)
        self.save_users()
        return True
    
    def list_users(self) -> List[str]:
        """Get list of all usernames (for admin purposes)"""
        return list(self.users.keys())
    
    def delete_user(self, username: str) -> bool:
        """Delete a user account"""
        if username not in self.users:
            return False
        
        del self.users[username]
        self.save_users()
        return True

# Global user manager instance
user_manager = UserManager()
