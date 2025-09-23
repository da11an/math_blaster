"""
Simple Math Generator

The original math generator from the spaceship game, wrapped to implement the common interface.
"""

import random
from typing import Union
from .math_generator_interface import MathGeneratorInterface, MathProblem

Number = Union[int, float]

class SimpleMathGenerator(MathGeneratorInterface):
    """Simple math generator that implements the original spaceship game logic"""
    
    def __init__(self, seed=None):
        if seed is not None:
            random.seed(seed)
    
    def generate_problem(self, level: int) -> MathProblem:
        """Generate a single math problem for the given level"""
        operations = ['+', '-', '*', '/']
        operation = operations[random.randint(0, len(operations) - 1)]
        
        max_num = self._get_max_number_for_level(level)
        
        if operation == '+':
            a = random.randint(1, max_num)
            b = random.randint(1, max_num)
            answer = a + b
        elif operation == '-':
            a = random.randint(1, max_num)
            b = random.randint(1, a)
            answer = a - b
        elif operation == '*':
            a = random.randint(1, max_num)
            b = random.randint(1, max_num)
            answer = a * b
        elif operation == '/':
            b = random.randint(2, max_num)
            answer = random.randint(1, max_num)
            a = b * answer
        
        # Convert operation symbols to proper mathematical notation
        symbol_map = {'+': '+', '-': '-', '*': '×', '/': '÷'}
        math_operation = symbol_map.get(operation, operation)
        question = f"{a} {math_operation} {b}"
        
        return MathProblem(
            question=question,
            answer=answer,
            level=level,
            problem_type=operation
        )
    
    def get_max_level(self) -> int:
        """Get the maximum level supported by this generator"""
        return 4  # Easy, Medium, Hard, Expert
    
    def describe_level(self, level: int) -> str:
        """Get a description of what the level contains"""
        descriptions = {
            1: "Easy: Numbers 1-10",
            2: "Medium: Numbers 1-50", 
            3: "Hard: Numbers 1-100",
            4: "Expert: Numbers 1-500"
        }
        return descriptions.get(level, f"Level {level}")
    
    def get_level_name(self, level: int) -> str:
        """Get a human-readable name for the level"""
        names = {
            1: "Easy",
            2: "Medium", 
            3: "Hard",
            4: "Expert"
        }
        return names.get(level, f"Level {level}")
    
    def _get_max_number_for_level(self, level: int) -> int:
        """Map level to max number range (corrected logic)"""
        if level == 1:
            return 10  # Easy math for level 1
        elif level == 2:
            return 50  # Medium math for level 2
        elif level == 3:
            return 100 # Hard math for level 3
        elif level == 4:
            return 500 # Expert math for level 4
        else:
            return 500 # Default to expert for any other level
