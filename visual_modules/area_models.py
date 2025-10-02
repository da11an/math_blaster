#!/usr/bin/env python3
"""
Area Models Visual Module for Math Blaster

Provides visual representations of multiplication problems using area models.
Supports rectangular area models with different decomposition strategies.
"""

import random
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum

class DecompositionStrategy(Enum):
    STANDARD = "standard"  # Standard area model
    PARTIAL_PRODUCTS = "partial_products"  # Show partial products
    DISTRIBUTIVE = "distributive"  # Show distributive property

@dataclass
class AreaModelProblem:
    """Data structure for area model problems"""
    length: int
    width: int
    total_area: int
    decomposition_strategy: DecompositionStrategy
    show_grid: bool = True
    show_partial_products: bool = True
    show_labels: bool = True
    highlight_regions: bool = True

class AreaModelsModule:
    """Visual module for area model-based multiplication problems"""
    
    def __init__(self):
        self.supported_strategies = [DecompositionStrategy.STANDARD, 
                                   DecompositionStrategy.PARTIAL_PRODUCTS,
                                   DecompositionStrategy.DISTRIBUTIVE]
        self.default_strategy = DecompositionStrategy.STANDARD
    
    def generate_area_problem(self,
                            min_length: int = 2,
                            max_length: int = 12,
                            min_width: int = 2,
                            max_width: int = 12,
                            strategy: DecompositionStrategy = None) -> AreaModelProblem:
        """Generate an area model multiplication problem"""
        if strategy is None:
            strategy = self.default_strategy
            
        length = random.randint(min_length, max_length)
        width = random.randint(min_width, max_width)
        area = length * width
        
        return AreaModelProblem(
            length=length,
            width=width,
            total_area=area,
            decomposition_strategy=strategy
        )
    
    def generate_decomposed_problem(self,
                                  min_length: int = 10,
                                  max_length: int = 20,
                                  min_width: int = 10,
                                  max_width: int = 20,
                                  strategy: DecompositionStrategy = None) -> AreaModelProblem:
        """Generate a problem suitable for decomposition strategies"""
        if strategy is None:
            strategy = self.default_strategy
            
        # Generate numbers that work well with decomposition
        length = random.randint(min_length, max_length)
        width = random.randint(min_width, max_width)
        area = length * width
        
        return AreaModelProblem(
            length=length,
            width=width,
            total_area=area,
            decomposition_strategy=strategy
        )
    
    def generate_random_problem(self,
                              difficulty: str = "easy",
                              strategy: DecompositionStrategy = None) -> AreaModelProblem:
        """Generate a random area model problem"""
        if strategy is None:
            strategy = random.choice(self.supported_strategies)
        
        if difficulty == "easy":
            return self.generate_area_problem(2, 6, 2, 6, strategy)
        elif difficulty == "medium":
            return self.generate_area_problem(3, 10, 3, 10, strategy)
        else:  # hard
            return self.generate_decomposed_problem(10, 20, 10, 20, strategy)
    
    def get_problem_statement(self, problem: AreaModelProblem) -> str:
        """Generate a text description of the problem"""
        return f"{problem.length} × {problem.width} = ?"
    
    def get_area_coordinates(self, problem: AreaModelProblem) -> List[Tuple[int, int]]:
        """Get all coordinate positions in the area model"""
        coordinates = []
        for x in range(problem.length):
            for y in range(problem.width):
                coordinates.append((x, y))
        return coordinates
    
    def get_partial_products(self, problem: AreaModelProblem) -> List[Dict]:
        """Get partial products for decomposition strategies"""
        partial_products = []
        
        if problem.decomposition_strategy == DecompositionStrategy.PARTIAL_PRODUCTS:
            # Break down into tens and ones
            length_tens = (problem.length // 10) * 10
            length_ones = problem.length % 10
            width_tens = (problem.width // 10) * 10
            width_ones = problem.width % 10
            
            if length_tens > 0 and width_tens > 0:
                partial_products.append({
                    "region": "tens_tens",
                    "length": length_tens,
                    "width": width_tens,
                    "area": length_tens * width_tens,
                    "coordinates": [(x, y) for x in range(length_tens) for y in range(width_tens)]
                })
            
            if length_tens > 0 and width_ones > 0:
                partial_products.append({
                    "region": "tens_ones",
                    "length": length_tens,
                    "width": width_ones,
                    "area": length_tens * width_ones,
                    "coordinates": [(x, y) for x in range(length_tens) for y in range(width_tens, problem.width)]
                })
            
            if length_ones > 0 and width_tens > 0:
                partial_products.append({
                    "region": "ones_tens",
                    "length": length_ones,
                    "width": width_tens,
                    "area": length_ones * width_tens,
                    "coordinates": [(x, y) for x in range(length_tens, problem.length) for y in range(width_tens)]
                })
            
            if length_ones > 0 and width_ones > 0:
                partial_products.append({
                    "region": "ones_ones",
                    "length": length_ones,
                    "width": width_ones,
                    "area": length_ones * width_ones,
                    "coordinates": [(x, y) for x in range(length_tens, problem.length) for y in range(width_tens, problem.width)]
                })
        
        elif problem.decomposition_strategy == DecompositionStrategy.DISTRIBUTIVE:
            # Show distributive property decomposition
            # Break one dimension into two parts
            if problem.length > problem.width:
                # Break length
                part1 = problem.length // 2
                part2 = problem.length - part1
                partial_products.append({
                    "region": "part1",
                    "length": part1,
                    "width": problem.width,
                    "area": part1 * problem.width,
                    "coordinates": [(x, y) for x in range(part1) for y in range(problem.width)]
                })
                partial_products.append({
                    "region": "part2",
                    "length": part2,
                    "width": problem.width,
                    "area": part2 * problem.width,
                    "coordinates": [(x, y) for x in range(part1, problem.length) for y in range(problem.width)]
                })
            else:
                # Break width
                part1 = problem.width // 2
                part2 = problem.width - part1
                partial_products.append({
                    "region": "part1",
                    "length": problem.length,
                    "width": part1,
                    "area": problem.length * part1,
                    "coordinates": [(x, y) for x in range(problem.length) for y in range(part1)]
                })
                partial_products.append({
                    "region": "part2",
                    "length": problem.length,
                    "width": part2,
                    "area": problem.length * part2,
                    "coordinates": [(x, y) for x in range(problem.length) for y in range(part1, problem.width)]
                })
        
        return partial_products
    
    def get_visual_description(self, problem: AreaModelProblem) -> Dict:
        """Get a structured description for visual rendering"""
        coordinates = self.get_area_coordinates(problem)
        partial_products = self.get_partial_products(problem)
        
        return {
            "type": "area_model",
            "strategy": problem.decomposition_strategy.value,
            "dimensions": {"length": problem.length, "width": problem.width},
            "total_area": problem.total_area,
            "coordinates": coordinates,
            "partial_products": partial_products,
            "show_grid": problem.show_grid,
            "show_partial_products": problem.show_partial_products,
            "show_labels": problem.show_labels,
            "highlight_regions": problem.highlight_regions,
            "problem_statement": self.get_problem_statement(problem)
        }
    
    def validate_answer(self, problem: AreaModelProblem, user_answer: int) -> bool:
        """Validate if the user's answer is correct"""
        return user_answer == problem.total_area
    
    def get_hint(self, problem: AreaModelProblem) -> str:
        """Generate a hint for the problem"""
        if problem.decomposition_strategy == DecompositionStrategy.STANDARD:
            return f"Find the area of a rectangle that is {problem.length} units long and {problem.width} units wide"
        elif problem.decomposition_strategy == DecompositionStrategy.PARTIAL_PRODUCTS:
            return f"Break {problem.length} × {problem.width} into smaller rectangles and add their areas"
        else:  # distributive
            return f"Use the distributive property: break one dimension into two parts"
    
    def get_decomposition_steps(self, problem: AreaModelProblem) -> List[str]:
        """Get step-by-step decomposition instructions"""
        steps = []
        
        if problem.decomposition_strategy == DecompositionStrategy.PARTIAL_PRODUCTS:
            steps.append(f"Break {problem.length} into tens and ones: {problem.length} = {(problem.length // 10) * 10} + {problem.length % 10}")
            steps.append(f"Break {problem.width} into tens and ones: {problem.width} = {(problem.width // 10) * 10} + {problem.width % 10}")
            steps.append("Multiply each part:")
            
            partial_products = self.get_partial_products(problem)
            for pp in partial_products:
                steps.append(f"  {pp['length']} × {pp['width']} = {pp['area']}")
            
            steps.append(f"Add all parts: {' + '.join([str(pp['area']) for pp in partial_products])} = {problem.total_area}")
        
        elif problem.decomposition_strategy == DecompositionStrategy.DISTRIBUTIVE:
            if problem.length > problem.width:
                part1 = problem.length // 2
                part2 = problem.length - part1
                steps.append(f"Break {problem.length} into {part1} + {part2}")
                steps.append(f"({part1} + {part2}) × {problem.width}")
                steps.append(f"= {part1} × {problem.width} + {part2} × {problem.width}")
                steps.append(f"= {part1 * problem.width} + {part2 * problem.width}")
                steps.append(f"= {problem.total_area}")
            else:
                part1 = problem.width // 2
                part2 = problem.width - part1
                steps.append(f"Break {problem.width} into {part1} + {part2}")
                steps.append(f"{problem.length} × ({part1} + {part2})")
                steps.append(f"= {problem.length} × {part1} + {problem.length} × {part2}")
                steps.append(f"= {problem.length * part1} + {problem.length * part2}")
                steps.append(f"= {problem.total_area}")
        
        return steps
