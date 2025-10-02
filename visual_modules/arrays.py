#!/usr/bin/env python3
"""
Arrays Visual Module for Math Blaster

Provides visual representations of multiplication and division problems using arrays.
Supports both rectangular arrays and square arrays for different multiplication concepts.
"""

import random
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum

class ArrayOrientation(Enum):
    ROWS_FIRST = "rows_first"  # rows × columns
    COLUMNS_FIRST = "columns_first"  # columns × rows

@dataclass
class ArrayProblem:
    """Data structure for array problems"""
    operation: str  # "multiplication" or "division"
    rows: int
    columns: int
    total_elements: int
    orientation: ArrayOrientation
    show_grid: bool = True
    highlight_groups: bool = True
    show_labels: bool = True

class ArraysModule:
    """Visual module for array-based math problems"""
    
    def __init__(self):
        self.supported_operations = ["multiplication", "division"]
        self.default_orientation = ArrayOrientation.ROWS_FIRST
    
    def generate_multiplication_problem(self,
                                      min_rows: int = 2,
                                      max_rows: int = 6,
                                      min_cols: int = 2,
                                      max_cols: int = 6,
                                      orientation: ArrayOrientation = None) -> ArrayProblem:
        """Generate a multiplication problem using arrays"""
        if orientation is None:
            orientation = self.default_orientation
            
        rows = random.randint(min_rows, max_rows)
        columns = random.randint(min_cols, max_cols)
        total = rows * columns
        
        return ArrayProblem(
            operation="multiplication",
            rows=rows,
            columns=columns,
            total_elements=total,
            orientation=orientation
        )
    
    def generate_division_problem(self,
                                min_total: int = 6,
                                max_total: int = 36,
                                min_divisor: int = 2,
                                max_divisor: int = 6,
                                orientation: ArrayOrientation = None) -> ArrayProblem:
        """Generate a division problem using arrays"""
        if orientation is None:
            orientation = self.default_orientation
            
        # Generate a divisor and calculate total
        divisor = random.randint(min_divisor, max_divisor)
        quotient = random.randint(min_total // divisor, max_total // divisor)
        total = divisor * quotient
        
        # Determine rows and columns based on orientation
        if orientation == ArrayOrientation.ROWS_FIRST:
            rows = divisor
            columns = quotient
        else:
            rows = quotient
            columns = divisor
        
        return ArrayProblem(
            operation="division",
            rows=rows,
            columns=columns,
            total_elements=total,
            orientation=orientation
        )
    
    def generate_random_problem(self,
                              operation: str = None,
                              difficulty: str = "easy") -> ArrayProblem:
        """Generate a random array problem"""
        if operation is None:
            operation = random.choice(self.supported_operations)
        
        if difficulty == "easy":
            if operation == "multiplication":
                return self.generate_multiplication_problem(2, 4, 2, 4)
            else:
                return self.generate_division_problem(6, 20, 2, 4)
        elif difficulty == "medium":
            if operation == "multiplication":
                return self.generate_multiplication_problem(2, 6, 2, 6)
            else:
                return self.generate_division_problem(12, 36, 2, 6)
        else:  # hard
            if operation == "multiplication":
                return self.generate_multiplication_problem(3, 8, 3, 8)
            else:
                return self.generate_division_problem(18, 64, 3, 8)
    
    def get_problem_statement(self, problem: ArrayProblem) -> str:
        """Generate a text description of the problem"""
        if problem.operation == "multiplication":
            if problem.orientation == ArrayOrientation.ROWS_FIRST:
                return f"{problem.rows} × {problem.columns} = ?"
            else:
                return f"{problem.columns} × {problem.rows} = ?"
        else:
            if problem.orientation == ArrayOrientation.ROWS_FIRST:
                return f"{problem.total_elements} ÷ {problem.rows} = ?"
            else:
                return f"{problem.total_elements} ÷ {problem.columns} = ?"
    
    def get_array_coordinates(self, problem: ArrayProblem) -> List[Tuple[int, int]]:
        """Get all coordinate positions in the array"""
        coordinates = []
        for row in range(problem.rows):
            for col in range(problem.columns):
                coordinates.append((row, col))
        return coordinates
    
    def get_group_coordinates(self, problem: ArrayProblem, group_type: str = "rows") -> List[List[Tuple[int, int]]]:
        """Get coordinates grouped by rows or columns"""
        groups = []
        
        if group_type == "rows":
            for row in range(problem.rows):
                group = [(row, col) for col in range(problem.columns)]
                groups.append(group)
        else:  # columns
            for col in range(problem.columns):
                group = [(row, col) for row in range(problem.rows)]
                groups.append(group)
        
        return groups
    
    def get_visual_description(self, problem: ArrayProblem) -> Dict:
        """Get a structured description for visual rendering"""
        coordinates = self.get_array_coordinates(problem)
        row_groups = self.get_group_coordinates(problem, "rows")
        column_groups = self.get_group_coordinates(problem, "columns")
        
        return {
            "type": "array",
            "operation": problem.operation,
            "orientation": problem.orientation.value,
            "dimensions": {"rows": problem.rows, "columns": problem.columns},
            "total_elements": problem.total_elements,
            "coordinates": coordinates,
            "row_groups": row_groups,
            "column_groups": column_groups,
            "show_grid": problem.show_grid,
            "highlight_groups": problem.highlight_groups,
            "show_labels": problem.show_labels,
            "problem_statement": self.get_problem_statement(problem)
        }
    
    def validate_answer(self, problem: ArrayProblem, user_answer: int) -> bool:
        """Validate if the user's answer is correct"""
        if problem.operation == "multiplication":
            return user_answer == problem.total_elements
        else:  # division
            if problem.orientation == ArrayOrientation.ROWS_FIRST:
                return user_answer == problem.columns
            else:
                return user_answer == problem.rows
    
    def get_hint(self, problem: ArrayProblem) -> str:
        """Generate a hint for the problem"""
        if problem.operation == "multiplication":
            if problem.orientation == ArrayOrientation.ROWS_FIRST:
                return f"Count {problem.rows} groups of {problem.columns} items each"
            else:
                return f"Count {problem.columns} groups of {problem.rows} items each"
        else:  # division
            if problem.orientation == ArrayOrientation.ROWS_FIRST:
                return f"Divide {problem.total_elements} items into {problem.rows} equal groups"
            else:
                return f"Divide {problem.total_elements} items into {problem.columns} equal groups"
    
    def get_alternative_representations(self, problem: ArrayProblem) -> List[Dict]:
        """Get alternative ways to represent the same problem"""
        alternatives = []
        
        if problem.operation == "multiplication":
            # Show as repeated addition
            if problem.orientation == ArrayOrientation.ROWS_FIRST:
                addition_str = f"{problem.columns} + " * (problem.rows - 1) + f"{problem.columns}"
                alternatives.append({
                    "type": "repeated_addition",
                    "description": f"Repeated addition: {addition_str}",
                    "value": problem.total_elements
                })
            else:
                addition_str = f"{problem.rows} + " * (problem.columns - 1) + f"{problem.rows}"
                alternatives.append({
                    "type": "repeated_addition", 
                    "description": f"Repeated addition: {addition_str}",
                    "value": problem.total_elements
                })
        
        return alternatives
