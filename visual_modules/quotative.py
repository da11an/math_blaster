#!/usr/bin/env python3
"""
Quotative (Measurement) Division Visual Module for Math Blaster

Provides visual representations of division problems using quotative (measurement) models.
Shows "how many groups of X fit into Y" using visual grouping and measurement concepts.
"""

import random
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum

class MeasurementType(Enum):
    LENGTH = "length"  # Measuring length with a unit
    CAPACITY = "capacity"  # Measuring capacity/volume
    GROUPS = "groups"  # Counting groups
    MONEY = "money"  # Money measurement

@dataclass
class QuotativeProblem:
    """Data structure for quotative division problems"""
    total_amount: int
    group_size: int
    number_of_groups: int
    measurement_type: MeasurementType
    show_units: bool = True
    show_remainder: bool = True
    highlight_groups: bool = True
    show_labels: bool = True

class QuotativeModule:
    """Visual module for quotative division problems"""
    
    def __init__(self):
        self.supported_measurements = [MeasurementType.LENGTH, 
                                     MeasurementType.CAPACITY,
                                     MeasurementType.GROUPS,
                                     MeasurementType.MONEY]
        self.default_measurement = MeasurementType.GROUPS
    
    def generate_length_problem(self,
                              min_total: int = 12,
                              max_total: int = 60,
                              min_unit: int = 2,
                              max_unit: int = 8) -> QuotativeProblem:
        """Generate a length measurement division problem"""
        total_length = random.randint(min_total, max_total)
        unit_length = random.randint(min_unit, max_unit)
        number_of_units = total_length // unit_length
        remainder = total_length % unit_length
        
        return QuotativeProblem(
            total_amount=total_length,
            group_size=unit_length,
            number_of_groups=number_of_units,
            measurement_type=MeasurementType.LENGTH,
            show_remainder=(remainder > 0)
        )
    
    def generate_capacity_problem(self,
                                min_total: int = 15,
                                max_total: int = 50,
                                min_unit: int = 3,
                                max_unit: int = 8) -> QuotativeProblem:
        """Generate a capacity measurement division problem"""
        total_capacity = random.randint(min_total, max_total)
        unit_capacity = random.randint(min_unit, max_unit)
        number_of_units = total_capacity // unit_capacity
        remainder = total_capacity % unit_capacity
        
        return QuotativeProblem(
            total_amount=total_capacity,
            group_size=unit_capacity,
            number_of_groups=number_of_units,
            measurement_type=MeasurementType.CAPACITY,
            show_remainder=(remainder > 0)
        )
    
    def generate_groups_problem(self,
                              min_total: int = 12,
                              max_total: int = 48,
                              min_group_size: int = 3,
                              max_group_size: int = 8) -> QuotativeProblem:
        """Generate a groups division problem"""
        total_items = random.randint(min_total, max_total)
        group_size = random.randint(min_group_size, max_group_size)
        number_of_groups = total_items // group_size
        remainder = total_items % group_size
        
        return QuotativeProblem(
            total_amount=total_items,
            group_size=group_size,
            number_of_groups=number_of_groups,
            measurement_type=MeasurementType.GROUPS,
            show_remainder=(remainder > 0)
        )
    
    def generate_money_problem(self,
                             min_total: int = 20,
                             max_total: int = 100,
                             min_unit: int = 5,
                             max_unit: int = 15) -> QuotativeProblem:
        """Generate a money measurement division problem"""
        total_money = random.randint(min_total, max_total)
        unit_money = random.randint(min_unit, max_unit)
        number_of_units = total_money // unit_money
        remainder = total_money % unit_money
        
        return QuotativeProblem(
            total_amount=total_money,
            group_size=unit_money,
            number_of_groups=number_of_units,
            measurement_type=MeasurementType.MONEY,
            show_remainder=(remainder > 0)
        )
    
    def generate_random_problem(self,
                              measurement_type: MeasurementType = None,
                              difficulty: str = "easy") -> QuotativeProblem:
        """Generate a random quotative division problem"""
        if measurement_type is None:
            measurement_type = random.choice(self.supported_measurements)
        
        if difficulty == "easy":
            if measurement_type == MeasurementType.LENGTH:
                return self.generate_length_problem(12, 30, 2, 5)
            elif measurement_type == MeasurementType.CAPACITY:
                return self.generate_capacity_problem(15, 30, 3, 6)
            elif measurement_type == MeasurementType.GROUPS:
                return self.generate_groups_problem(12, 24, 3, 6)
            else:  # money
                return self.generate_money_problem(20, 50, 5, 10)
        elif difficulty == "medium":
            if measurement_type == MeasurementType.LENGTH:
                return self.generate_length_problem(20, 50, 3, 8)
            elif measurement_type == MeasurementType.CAPACITY:
                return self.generate_capacity_problem(20, 40, 4, 8)
            elif measurement_type == MeasurementType.GROUPS:
                return self.generate_groups_problem(18, 36, 4, 8)
            else:  # money
                return self.generate_money_problem(30, 80, 6, 12)
        else:  # hard
            if measurement_type == MeasurementType.LENGTH:
                return self.generate_length_problem(30, 80, 4, 12)
            elif measurement_type == MeasurementType.CAPACITY:
                return self.generate_capacity_problem(30, 60, 5, 12)
            elif measurement_type == MeasurementType.GROUPS:
                return self.generate_groups_problem(24, 60, 5, 12)
            else:  # money
                return self.generate_money_problem(50, 120, 8, 20)
    
    def get_problem_statement(self, problem: QuotativeProblem) -> str:
        """Generate a text description of the problem"""
        remainder = problem.total_amount % problem.group_size
        
        if problem.measurement_type == MeasurementType.LENGTH:
            unit = "inches" if problem.group_size <= 5 else "feet"
            if remainder > 0:
                return f"How many {problem.group_size}-{unit} segments fit in {problem.total_amount} {unit}?"
            else:
                return f"How many {problem.group_size}-{unit} segments fit in {problem.total_amount} {unit}?"
        elif problem.measurement_type == MeasurementType.CAPACITY:
            unit = "cups" if problem.group_size <= 5 else "quarts"
            return f"How many {problem.group_size}-{unit} containers can be filled from {problem.total_amount} {unit}?"
        elif problem.measurement_type == MeasurementType.GROUPS:
            return f"How many groups of {problem.group_size} can be made from {problem.total_amount} items?"
        else:  # money
            return f"How many ${problem.group_size} items can be bought with ${problem.total_amount}?"
    
    def get_visual_groups(self, problem: QuotativeProblem) -> List[List[int]]:
        """Get the visual representation of groups"""
        groups = []
        items = list(range(1, problem.total_amount + 1))
        
        for i in range(problem.number_of_groups):
            start_idx = i * problem.group_size
            end_idx = start_idx + problem.group_size
            group = items[start_idx:end_idx]
            groups.append(group)
        
        return groups
    
    def get_remainder_items(self, problem: QuotativeProblem) -> List[int]:
        """Get items that don't fit into complete groups"""
        remainder_count = problem.total_amount % problem.group_size
        if remainder_count == 0:
            return []
        
        start_idx = problem.number_of_groups * problem.group_size
        return list(range(start_idx + 1, problem.total_amount + 1))
    
    def get_measurement_units(self, problem: QuotativeProblem) -> Dict[str, str]:
        """Get appropriate units for the measurement type"""
        if problem.measurement_type == MeasurementType.LENGTH:
            return {
                "total_unit": "inches" if problem.total_amount <= 50 else "feet",
                "group_unit": "inches" if problem.group_size <= 5 else "feet"
            }
        elif problem.measurement_type == MeasurementType.CAPACITY:
            return {
                "total_unit": "cups" if problem.total_amount <= 30 else "quarts",
                "group_unit": "cups" if problem.group_size <= 5 else "quarts"
            }
        elif problem.measurement_type == MeasurementType.GROUPS:
            return {
                "total_unit": "items",
                "group_unit": "items"
            }
        else:  # money
            return {
                "total_unit": "dollars",
                "group_unit": "dollars"
            }
    
    def get_visual_description(self, problem: QuotativeProblem) -> Dict:
        """Get a structured description for visual rendering"""
        groups = self.get_visual_groups(problem)
        remainder_items = self.get_remainder_items(problem)
        units = self.get_measurement_units(problem)
        
        return {
            "type": "quotative",
            "measurement_type": problem.measurement_type.value,
            "total_amount": problem.total_amount,
            "group_size": problem.group_size,
            "number_of_groups": problem.number_of_groups,
            "groups": groups,
            "remainder_items": remainder_items,
            "remainder_count": len(remainder_items),
            "units": units,
            "show_units": problem.show_units,
            "show_remainder": problem.show_remainder,
            "highlight_groups": problem.highlight_groups,
            "show_labels": problem.show_labels,
            "problem_statement": self.get_problem_statement(problem)
        }
    
    def validate_answer(self, problem: QuotativeProblem, user_answer: int) -> bool:
        """Validate if the user's answer is correct"""
        return user_answer == problem.number_of_groups
    
    def get_hint(self, problem: QuotativeProblem) -> str:
        """Generate a hint for the problem"""
        if problem.measurement_type == MeasurementType.LENGTH:
            return f"Count how many {problem.group_size}-unit segments fit in {problem.total_amount} units"
        elif problem.measurement_type == MeasurementType.CAPACITY:
            return f"Count how many {problem.group_size}-unit containers can be filled"
        elif problem.measurement_type == MeasurementType.GROUPS:
            return f"Count how many complete groups of {problem.group_size} can be made"
        else:  # money
            return f"Count how many ${problem.group_size} items can be purchased"
    
    def get_context_description(self, problem: QuotativeProblem) -> str:
        """Get a real-world context description"""
        if problem.measurement_type == MeasurementType.LENGTH:
            return f"A rope is {problem.total_amount} inches long. How many {problem.group_size}-inch pieces can be cut from it?"
        elif problem.measurement_type == MeasurementType.CAPACITY:
            return f"You have {problem.total_amount} cups of water. How many {problem.group_size}-cup containers can you fill?"
        elif problem.measurement_type == MeasurementType.GROUPS:
            return f"You have {problem.total_amount} marbles. How many groups of {problem.group_size} marbles can you make?"
        else:  # money
            return f"You have ${problem.total_amount}. How many items costing ${problem.group_size} each can you buy?"
    
    def get_step_by_step_solution(self, problem: QuotativeProblem) -> List[str]:
        """Get step-by-step solution process"""
        steps = []
        
        steps.append(f"Problem: {self.get_problem_statement(problem)}")
        steps.append(f"Total amount: {problem.total_amount}")
        steps.append(f"Group size: {problem.group_size}")
        steps.append("")
        steps.append("Solution steps:")
        
        # Show grouping process
        groups = self.get_visual_groups(problem)
        for i, group in enumerate(groups, 1):
            steps.append(f"Group {i}: {group}")
        
        remainder_items = self.get_remainder_items(problem)
        if remainder_items:
            steps.append(f"Remainder: {remainder_items}")
            steps.append(f"Answer: {problem.number_of_groups} groups with {len(remainder_items)} left over")
        else:
            steps.append(f"Answer: {problem.number_of_groups} groups exactly")
        
        return steps
