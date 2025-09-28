#!/usr/bin/env python3
"""
Math Problem Logger for Math Blaster
Handles logging of math problems, answers, and diagnostic data
"""

import json
import os
import threading
from datetime import datetime
from typing import Dict, Optional, List
from dataclasses import dataclass, asdict

@dataclass
class MathProblemLogEntry:
    """Data structure for math problem log entries"""
    username: str
    problem_id: str
    problem_statement: str
    generator_type: str
    level: int
    level_name: str
    correct_answer: int
    user_answer: Optional[int] = None
    time_elapsed: Optional[float] = None
    is_correct: Optional[bool] = None
    status: str = "generated"  # "generated", "answered", "skipped"
    timestamp: str = None
    bank_number: Optional[int] = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now().isoformat()

class MathProblemLogger:
    """Thread-safe logger for math problems"""
    
    def __init__(self, log_dir=None):
        # Use provided log_dir or get from config
        if log_dir is None:
            from config_manager import ConfigManager
            config = ConfigManager()
            log_dir = config.get_logs_dir()
        
        self.log_dir = log_dir
        self.log_file = os.path.join(log_dir, "math_problems.jsonl")
        self.pending_problems = {}  # Track problems waiting for answers
        self.lock = threading.Lock()
        self.ensure_log_directory()
    
    def ensure_log_directory(self):
        """Create log directory if it doesn't exist"""
        if not os.path.exists(self.log_dir):
            os.makedirs(self.log_dir)
    
    def generate_problem_id(self, username: str, timestamp: str) -> str:
        """Generate unique problem ID"""
        return f"{username}_{timestamp.replace(':', '-').replace('.', '-')}"
    
    def _clean_math_symbols(self, problem_statement: str) -> str:
        """Substitute math symbols for simpler logging"""
        # Replace × with * (multiplication symbol)
        problem_statement = problem_statement.replace('×', '*')
        # Replace ÷ with / (division symbol)
        problem_statement = problem_statement.replace('÷', '/')
        return problem_statement
    
    def log_problem_generated(self, username: str, problem_statement: str, 
                            generator_type: str, level: int, level_name: str, 
                            correct_answer: int, bank_number: int = None) -> str:
        """Log when a problem is generated"""
        with self.lock:
            timestamp = datetime.now().isoformat()
            problem_id = self.generate_problem_id(username, timestamp)
            
            # Substitute math symbols for cleaner logging
            clean_problem_statement = self._clean_math_symbols(problem_statement)
            
            entry = MathProblemLogEntry(
                username=username,
                problem_id=problem_id,
                problem_statement=clean_problem_statement,
                generator_type=generator_type,
                level=level,
                level_name=level_name,
                correct_answer=correct_answer,
                status="generated",
                bank_number=bank_number
            )
            
            # Store in pending problems for later completion (don't log yet)
            self.pending_problems[problem_id] = entry
            
            return problem_id
    
    def log_problem_answered(self, problem_id: str, user_answer: int, 
                           time_elapsed: float) -> bool:
        """Log when a problem is answered"""
        with self.lock:
            if problem_id not in self.pending_problems:
                return False
            
            entry = self.pending_problems[problem_id]
            entry.user_answer = user_answer
            entry.time_elapsed = time_elapsed
            entry.is_correct = (user_answer == entry.correct_answer)
            entry.status = "answered"
            
            # Log the answered problem (first and only log entry for this problem)
            self._write_log_entry(entry)
            
            # Remove from pending
            del self.pending_problems[problem_id]
            
            return True
    
    def log_problem_skipped(self, problem_id: str, reason: str = "user_skipped") -> bool:
        """Log when a problem is skipped"""
        with self.lock:
            if problem_id not in self.pending_problems:
                return False
            
            entry = self.pending_problems[problem_id]
            entry.status = f"skipped_{reason}"
            
            # Log the skipped problem (first and only log entry for this problem)
            self._write_log_entry(entry)
            
            # Remove from pending
            del self.pending_problems[problem_id]
            
            return True
    
    def _write_log_entry(self, entry: MathProblemLogEntry):
        """Write log entry to file (thread-safe)"""
        try:
            with open(self.log_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(asdict(entry)) + '\n')
        except Exception as e:
            print(f"Error writing to log file: {e}")
    
    def get_pending_problems(self, username: str = None) -> List[str]:
        """Get list of pending problem IDs, optionally filtered by username"""
        with self.lock:
            if username:
                return [pid for pid, entry in self.pending_problems.items() 
                       if entry.username == username]
            return list(self.pending_problems.keys())
    
    def cleanup_old_pending_problems(self, max_age_minutes: int = 30):
        """Clean up old pending problems that were never answered"""
        with self.lock:
            current_time = datetime.now()
            to_remove = []
            
            for problem_id, entry in self.pending_problems.items():
                entry_time = datetime.fromisoformat(entry.timestamp)
                age_minutes = (current_time - entry_time).total_seconds() / 60
                
                if age_minutes > max_age_minutes:
                    to_remove.append(problem_id)
            
            for problem_id in to_remove:
                self.log_problem_skipped(problem_id, "timeout")
    
    def get_stats(self, username: str = None) -> Dict:
        """Get statistics from log file"""
        stats = {
            "total_generated": 0,
            "total_answered": 0,
            "total_skipped": 0,
            "total_correct": 0,
            "total_incorrect": 0,
            "avg_time_elapsed": 0,
            "by_generator": {},
            "by_level": {}
        }
        
        try:
            if not os.path.exists(self.log_file):
                return stats
            
            total_time = 0
            time_count = 0
            
            with open(self.log_file, 'r', encoding='utf-8') as f:
                for line in f:
                    try:
                        entry_data = json.loads(line.strip())
                        
                        # Filter by username if specified
                        if username and entry_data.get('username') != username:
                            continue
                        
                        stats["total_generated"] += 1
                        
                        if entry_data.get('status') == 'answered':
                            stats["total_answered"] += 1
                            if entry_data.get('is_correct'):
                                stats["total_correct"] += 1
                            else:
                                stats["total_incorrect"] += 1
                            
                            if entry_data.get('time_elapsed'):
                                total_time += entry_data['time_elapsed']
                                time_count += 1
                        
                        elif entry_data.get('status', '').startswith('skipped'):
                            stats["total_skipped"] += 1
                        
                        # Count by generator
                        generator = entry_data.get('generator_type', 'unknown')
                        stats["by_generator"][generator] = stats["by_generator"].get(generator, 0) + 1
                        
                        # Count by level
                        level = entry_data.get('level', 0)
                        stats["by_level"][level] = stats["by_level"].get(level, 0) + 1
                        
                    except json.JSONDecodeError:
                        continue
            
            if time_count > 0:
                stats["avg_time_elapsed"] = total_time / time_count
                
        except Exception as e:
            print(f"Error reading stats: {e}")
        
        return stats

# Global logger instance
math_logger = MathProblemLogger()
