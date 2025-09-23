"""
Fact Ladder Wrapper

Wrapper for the FactLadderGenerator to implement the MathGeneratorInterface.
"""

from typing import Optional
from .math_generator_interface import MathGeneratorInterface, MathProblem
from .math_fact_ladder import FactLadderGenerator

class FactLadderWrapper(MathGeneratorInterface):
    """Wrapper for FactLadderGenerator to implement the common interface"""
    
    def __init__(self, seed: Optional[int] = None):
        self.generator = FactLadderGenerator(seed=seed)
    
    def generate_problem(self, level: int) -> MathProblem:
        """Generate a single math problem for the given level"""
        result = self.generator.generate_problem(level)
        
        return MathProblem(
            question=result["q"],
            answer=result["a"],
            level=result["level"],
            problem_type=result["type"]
        )
    
    def get_max_level(self) -> int:
        """Get the maximum level supported by this generator"""
        return 9  # FactLadderGenerator supports levels 1-9
    
    def describe_level(self, level: int) -> str:
        """Get a description of what the level contains"""
        return self.generator.describe_level(level)
    
    def get_level_name(self, level: int) -> str:
        """Get a human-readable name for the level"""
        level_names = {
            1: "Basic Addition",
            2: "Basic Subtraction", 
            3: "Advanced Addition",
            4: "Advanced Subtraction",
            5: "Basic Multiplication",
            6: "Basic Division",
            7: "Advanced Multiplication",
            8: "Advanced Division",
            9: "Two-Step Problems"
        }
        return level_names.get(level, f"Level {level}")
