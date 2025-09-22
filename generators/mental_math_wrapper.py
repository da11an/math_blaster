"""
Mental Math Generator Wrapper

Wraps the mental math generator to implement the common interface.
"""

from typing import Union
from .math_generator_interface import MathGeneratorInterface, MathProblem
from .mental_math_generator import MentalMathGenerator

Number = Union[int, float]

class MentalMathWrapper(MathGeneratorInterface):
    """Wrapper for the mental math generator to implement the common interface"""
    
    def __init__(self, seed=None):
        self.generator = MentalMathGenerator(seed=seed)
        self.level_names = {
            1: "Easy",      # Banks 1-2
            2: "Easy",      # Banks 1-2  
            3: "Medium",    # Banks 3-4
            4: "Medium",    # Banks 3-4
            5: "Hard",      # Banks 5-6
            6: "Hard",      # Banks 5-6
            7: "Expert",    # Banks 7-8
            8: "Expert",    # Banks 7-8
            9: "Master",    # Banks 9
            10: "Master"    # Banks 9 (highest level)
        }
    
    def generate_problem(self, level: int) -> MathProblem:
        """Generate a single math problem for the given level"""
        if level < 1 or level > 10:
            raise ValueError("Level must be between 1 and 10")
        
        problem_data = self.generator.generate_problem(level)
        
        return MathProblem(
            question=problem_data["q"],
            answer=problem_data["a"],
            level=level,
            problem_type=problem_data["type"]
        )
    
    def get_max_level(self) -> int:
        """Get the maximum level supported by this generator"""
        return 10
    
    def describe_level(self, level: int) -> str:
        """Get a description of what the level contains"""
        return self.generator.describe_level(level)
    
    def get_level_name(self, level: int) -> str:
        """Get a human-readable name for the level"""
        return self.level_names.get(level, f"Level {level}")
