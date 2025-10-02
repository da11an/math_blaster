#!/usr/bin/env python3
"""
Fact Ladder Visual Module Mapper

Maps problems from the FactLadderGenerator to appropriate visual modules.
This creates a bridge between the Python problem generator and HTML visual modules.
"""

from typing import Dict, List, Optional, Tuple
import re
from .fact_ladder_wrapper import FactLadderWrapper
from .math_generator_interface import MathProblem

class FactLadderVisualMapper:
    """Maps FactLadder problems to visual representations"""
    
    def __init__(self, grade_band: str = "G3"):
        self.generator = FactLadderWrapper(grade_band=grade_band)
        self.visual_modules = {
            'numberline': None,
            'arrays': None,
            'area_models': None,
            'quotative': None
        }
    
    def generate_visual_problem(self, level: int) -> Dict:
        """Generate a problem and map it to appropriate visual representation"""
        problem = self.generator.generate_problem(level)
        visual_data = self.map_problem_to_visual(problem)
        
        return {
            'problem': problem,
            'visual_data': visual_data,
            'level': level,
            'level_name': self.generator.get_level_name(level)
        }
    
    def map_problem_to_visual(self, problem: MathProblem) -> Dict:
        """Map a math problem to its visual representation"""
        question = problem.question
        answer = problem.answer
        problem_type = problem.problem_type
        
        # Parse the question to extract operands
        operands = self.parse_question(question)
        
        if not operands:
            return self.create_fallback_visual(question, answer)
        
        # Map based on problem type and level
        if problem.level in [1, 2, 3, 4]:  # Addition and Subtraction
            return self.create_numberline_visual(operands, answer, problem.level)
        elif problem.level in [5, 6, 7, 8]:  # Multiplication and Division
            if problem.level in [5, 7]:  # Multiplication
                return self.create_arrays_visual(operands, answer, problem.level)
            else:  # Division
                return self.create_quotative_visual(operands, answer, problem.level)
        elif problem.level == 9:  # Two-step problems
            return self.create_two_step_visual(operands, answer, question)
        else:
            return self.create_fallback_visual(question, answer)
    
    def parse_question(self, question: str) -> Optional[Tuple[int, int, str]]:
        """Parse question string to extract operands and operation"""
        # Handle parentheses for two-step problems
        if '(' in question and ')' in question:
            return self.parse_two_step_question(question)
        
        # Simple patterns: "a + b", "a - b", "a × b", "a ÷ b"
        patterns = [
            (r'(\d+)\s*\+\s*(\d+)', 'addition'),
            (r'(\d+)\s*-\s*(\d+)', 'subtraction'),
            (r'(\d+)\s*×\s*(\d+)', 'multiplication'),
            (r'(\d+)\s*÷\s*(\d+)', 'division')
        ]
        
        for pattern, operation in patterns:
            match = re.match(pattern, question)
            if match:
                a, b = int(match.group(1)), int(match.group(2))
                return (a, b, operation)
        
        return None
    
    def parse_two_step_question(self, question: str) -> Optional[Tuple[int, int, str]]:
        """Parse two-step questions like "(a + b) × c" or "a × b + c" """
        # Pattern for (a + b) × c or (a - b) × c
        paren_pattern = r'\((\d+)\s*([+\-])\s*(\d+)\)\s*×\s*(\d+)'
        match = re.match(paren_pattern, question)
        if match:
            a, op, b, c = match.groups()
            if op == '+':
                first_result = int(a) + int(b)
            else:
                first_result = int(a) - int(b)
            return (first_result, int(c), 'multiplication')
        
        # Pattern for a × b + c or a × b - c
        chain_pattern = r'(\d+)\s*×\s*(\d+)\s*([+\-])\s*(\d+)'
        match = re.match(chain_pattern, question)
        if match:
            a, b, op, c = match.groups()
            if op == '+':
                return (int(a) * int(b), int(c), 'addition')
            else:
                return (int(a) * int(b), int(c), 'subtraction')
        
        # Pattern for a ÷ b + c or a ÷ b - c
        div_pattern = r'(\d+)\s*÷\s*(\d+)\s*([+\-])\s*(\d+)'
        match = re.match(div_pattern, question)
        if match:
            a, b, op, c = match.groups()
            quotient = int(a) // int(b)
            if op == '+':
                return (quotient, int(c), 'addition')
            else:
                return (quotient, int(c), 'subtraction')
        
        return None
    
    def create_numberline_visual(self, operands: Tuple[int, int, str], answer: int, level: int) -> Dict:
        """Create number line visual for addition/subtraction"""
        a, b, operation = operands
        
        if operation == 'addition':
            start_value = a
            change_value = b
            result = answer
        else:  # subtraction
            start_value = a
            change_value = b
            result = answer
        
        # Calculate range for number line
        min_val = min(start_value, result) - 2
        max_val = max(start_value, result) + 2
        
        tick_positions = list(range(min_val, max_val + 1))
        
        return {
            'type': 'number_line',
            'operation': operation,
            'orientation': 'horizontal',
            'range': {'min': min_val, 'max': max_val},
            'tick_interval': 1,
            'tick_positions': tick_positions,
            'start_position': start_value,
            'change_amount': change_value,
            'result_position': result,
            'show_labels': True,
            'highlight_result': True,
            'problem_statement': f"{a} {'+' if operation == 'addition' else '-'} {b} = ?"
        }
    
    def create_arrays_visual(self, operands: Tuple[int, int, str], answer: int, level: int) -> Dict:
        """Create array visual for multiplication"""
        a, b, operation = operands
        
        if operation == 'multiplication':
            rows = a
            columns = b
            total = answer
        else:  # This shouldn't happen for multiplication levels
            return self.create_fallback_visual(f"{a} {operation} {b}", answer)
        
        return {
            'type': 'array',
            'operation': 'multiplication',
            'orientation': 'rows_first',
            'dimensions': {'rows': rows, 'columns': columns},
            'total_elements': total,
            'problem_statement': f"{a} × {b} = ?"
        }
    
    def create_quotative_visual(self, operands: Tuple[int, int, str], answer: int, level: int) -> Dict:
        """Create quotative visual for division"""
        a, b, operation = operands
        
        if operation == 'division':
            total_amount = a
            group_size = b
            number_of_groups = answer
            remainder_count = total_amount % group_size
        else:
            return self.create_fallback_visual(f"{a} {operation} {b}", answer)
        
        # Generate groups
        groups = []
        for i in range(number_of_groups):
            start_item = i * group_size + 1
            group = list(range(start_item, start_item + group_size))
            groups.append(group)
        
        # Generate remainder items
        remainder_items = []
        if remainder_count > 0:
            start_item = number_of_groups * group_size + 1
            remainder_items = list(range(start_item, start_item + remainder_count))
        
        return {
            'type': 'quotative',
            'measurement_type': 'groups',
            'total_amount': total_amount,
            'group_size': group_size,
            'number_of_groups': number_of_groups,
            'groups': groups,
            'remainder_items': remainder_items,
            'remainder_count': remainder_count,
            'units': {'total_unit': 'items', 'group_unit': 'items'},
            'show_units': True,
            'show_remainder': remainder_count > 0,
            'highlight_groups': True,
            'show_labels': True,
            'problem_statement': f"How many groups of {group_size} can be made from {total_amount} items?"
        }
    
    def create_two_step_visual(self, operands: Tuple[int, int, str], answer: int, question: str) -> Dict:
        """Create visual for two-step problems"""
        a, b, operation = operands
        
        # For two-step problems, we'll use number line for the final operation
        if operation in ['addition', 'subtraction']:
            return self.create_numberline_visual(operands, answer, 9)
        else:
            # For multiplication in two-step, use arrays
            return self.create_arrays_visual(operands, answer, 9)
    
    def create_fallback_visual(self, question: str, answer: int) -> Dict:
        """Create a simple fallback visual when parsing fails"""
        return {
            'type': 'text',
            'problem_statement': f"{question} = ?",
            'answer': answer,
            'visual_type': 'fallback'
        }
    
    def get_supported_levels(self) -> List[int]:
        """Get list of supported levels"""
        return list(range(1, 10))
    
    def get_level_description(self, level: int) -> str:
        """Get description of what a level contains"""
        return self.generator.describe_level(level)
    
    def generate_level_samples(self, level: int, count: int = 5) -> List[Dict]:
        """Generate sample problems for a level"""
        samples = []
        for _ in range(count):
            visual_problem = self.generate_visual_problem(level)
            samples.append(visual_problem)
        return samples

# Example usage and testing
if __name__ == "__main__":
    mapper = FactLadderVisualMapper(grade_band="G3")
    
    print("Fact Ladder Visual Mapper Demo")
    print("=" * 50)
    
    for level in range(1, 10):
        print(f"\nLevel {level}: {mapper.get_level_description(level)}")
        samples = mapper.generate_level_samples(level, 3)
        
        for i, sample in enumerate(samples, 1):
            problem = sample['problem']
            visual = sample['visual_data']
            print(f"  Sample {i}: {problem.question} = {problem.answer}")
            print(f"    Visual Type: {visual['type']}")
            print(f"    Problem Statement: {visual['problem_statement']}")
