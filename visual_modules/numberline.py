#!/usr/bin/env python3
"""
Number Line Visual Module for Math Blaster

Provides visual representations of addition and subtraction problems using number lines.
Supports both horizontal and vertical number line orientations.
"""

import random
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum

class NumberLineOrientation(Enum):
    HORIZONTAL = "horizontal"
    VERTICAL = "vertical"

@dataclass
class NumberLineProblem:
    """Data structure for number line problems"""
    operation: str  # "addition" or "subtraction"
    start_value: int
    change_value: int
    result: int
    orientation: NumberLineOrientation
    tick_interval: int = 1
    show_labels: bool = True
    highlight_result: bool = True

class NumberLineModule:
    """Visual module for number line math problems"""
    
    def __init__(self):
        self.supported_operations = ["addition", "subtraction"]
        self.default_orientation = NumberLineOrientation.HORIZONTAL
        self.default_tick_interval = 1
    
    def generate_addition_problem(self, 
                                min_start: int = 0, 
                                max_start: int = 20,
                                min_addend: int = 1,
                                max_addend: int = 10,
                                orientation: NumberLineOrientation = None) -> NumberLineProblem:
        """Generate an addition problem for number line visualization"""
        if orientation is None:
            orientation = self.default_orientation
            
        start_value = random.randint(min_start, max_start)
        addend = random.randint(min_addend, max_addend)
        result = start_value + addend
        
        return NumberLineProblem(
            operation="addition",
            start_value=start_value,
            change_value=addend,
            result=result,
            orientation=orientation,
            tick_interval=self.default_tick_interval
        )
    
    def generate_subtraction_problem(self,
                                   min_start: int = 5,
                                   max_start: int = 30,
                                   min_subtrahend: int = 1,
                                   max_subtrahend: int = 10,
                                   orientation: NumberLineOrientation = None) -> NumberLineProblem:
        """Generate a subtraction problem for number line visualization"""
        if orientation is None:
            orientation = self.default_orientation
            
        start_value = random.randint(min_start, max_start)
        subtrahend = random.randint(min_subtrahend, max_subtrahend)
        result = start_value - subtrahend
        
        # Ensure result is non-negative
        if result < 0:
            start_value = subtrahend + random.randint(0, 10)
            result = start_value - subtrahend
        
        return NumberLineProblem(
            operation="subtraction",
            start_value=start_value,
            change_value=subtrahend,
            result=result,
            orientation=orientation,
            tick_interval=self.default_tick_interval
        )
    
    def generate_random_problem(self, 
                              operation: str = None,
                              difficulty: str = "easy") -> NumberLineProblem:
        """Generate a random number line problem"""
        if operation is None:
            operation = random.choice(self.supported_operations)
        
        if difficulty == "easy":
            if operation == "addition":
                return self.generate_addition_problem(0, 10, 1, 5)
            else:
                return self.generate_subtraction_problem(5, 15, 1, 5)
        elif difficulty == "medium":
            if operation == "addition":
                return self.generate_addition_problem(0, 20, 1, 10)
            else:
                return self.generate_subtraction_problem(10, 30, 1, 10)
        else:  # hard
            if operation == "addition":
                return self.generate_addition_problem(0, 50, 1, 20)
            else:
                return self.generate_subtraction_problem(20, 50, 1, 20)
    
    def get_number_line_range(self, problem: NumberLineProblem) -> Tuple[int, int]:
        """Get the range of numbers to display on the number line"""
        min_val = min(problem.start_value, problem.result)
        max_val = max(problem.start_value, problem.result)
        
        # Add some padding
        padding = max(2, problem.change_value // 2)
        return (min_val - padding, max_val + padding)
    
    def get_tick_positions(self, problem: NumberLineProblem) -> List[int]:
        """Get the positions for tick marks on the number line"""
        min_val, max_val = self.get_number_line_range(problem)
        interval = problem.tick_interval
        
        positions = []
        current = min_val
        while current <= max_val:
            positions.append(current)
            current += interval
        
        return positions
    
    def get_problem_statement(self, problem: NumberLineProblem) -> str:
        """Generate a text description of the problem"""
        if problem.operation == "addition":
            return f"{problem.start_value} + {problem.change_value} = ?"
        else:
            return f"{problem.start_value} - {problem.change_value} = ?"
    
    def get_visual_description(self, problem: NumberLineProblem) -> Dict:
        """Get a structured description for visual rendering"""
        min_val, max_val = self.get_number_line_range(problem)
        tick_positions = self.get_tick_positions(problem)
        
        return {
            "type": "number_line",
            "operation": problem.operation,
            "orientation": problem.orientation.value,
            "range": {"min": min_val, "max": max_val},
            "tick_interval": problem.tick_interval,
            "tick_positions": tick_positions,
            "start_position": problem.start_value,
            "change_amount": problem.change_value,
            "result_position": problem.result,
            "show_labels": problem.show_labels,
            "highlight_result": problem.highlight_result,
            "problem_statement": self.get_problem_statement(problem)
        }
    
    def validate_answer(self, problem: NumberLineProblem, user_answer: int) -> bool:
        """Validate if the user's answer is correct"""
        return user_answer == problem.result
    
    def get_hint(self, problem: NumberLineProblem) -> str:
        """Generate a hint for the problem"""
        if problem.operation == "addition":
            return f"Start at {problem.start_value} and move {problem.change_value} steps to the right"
        else:
            return f"Start at {problem.start_value} and move {problem.change_value} steps to the left"
