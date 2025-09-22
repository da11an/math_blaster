"""
Math Generator Interface

A common interface for different math problem generators.
All generators should implement this interface to be interchangeable.
"""

from abc import ABC, abstractmethod
from typing import Dict, Union, List
from dataclasses import dataclass

Number = Union[int, float]

@dataclass
class MathProblem:
    """Standard math problem structure"""
    question: str
    answer: Number
    level: int
    problem_type: str = ""

class MathGeneratorInterface(ABC):
    """Abstract base class for math generators"""
    
    @abstractmethod
    def generate_problem(self, level: int) -> MathProblem:
        """Generate a single math problem for the given level"""
        pass
    
    @abstractmethod
    def get_max_level(self) -> int:
        """Get the maximum level supported by this generator"""
        pass
    
    @abstractmethod
    def describe_level(self, level: int) -> str:
        """Get a description of what the level contains"""
        pass
    
    @abstractmethod
    def get_level_name(self, level: int) -> str:
        """Get a human-readable name for the level"""
        pass
