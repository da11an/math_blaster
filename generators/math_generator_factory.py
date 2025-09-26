"""
Math Generator Factory

Factory for creating math generators with a consistent interface.
"""

import os
import sys
from typing import Optional

# Add parent directory to path to import config_manager
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from .math_generator_interface import MathGeneratorInterface
from .mental_math_wrapper import MentalMathWrapper
from .fact_ladder_wrapper import FactLadderWrapper

class MathGeneratorFactory:
    """Factory for creating math generators"""
    
    GENERATORS = {
        'mental': MentalMathWrapper,
        'fact_ladder': FactLadderWrapper
    }
    
    def __init__(self):
        try:
            from config_manager import ConfigManager
            self.config = ConfigManager()
        except ImportError:
            # Fallback if config_manager not available
            self.config = None
    
    def create_generator(self, generator_type: str = None, seed: Optional[int] = None, grade_level: str = "G3") -> MathGeneratorInterface:
        """Create a math generator of the specified type"""
        if generator_type is None:
            generator_type = self.get_default_generator()
        
        if generator_type not in self.GENERATORS:
            raise ValueError(f"Unknown generator type: {generator_type}. Available: {list(self.GENERATORS.keys())}")
        
        # Check if generator is enabled
        if self.config and not self.config.is_generator_enabled(generator_type):
            # Try fallback if enabled
            if self.config.enable_fallback():
                fallback_type = self.config.get_fallback_generator()
                if self.config.is_generator_enabled(fallback_type):
                    generator_type = fallback_type
                else:
                    raise ValueError(f"Generator {generator_type} is disabled and no fallback available")
            else:
                raise ValueError(f"Generator {generator_type} is disabled")
        
        return self.GENERATORS[generator_type](seed=seed, grade_band=grade_level)
    
    def get_available_generators(self) -> list:
        """Get list of available generator types"""
        if self.config:
            return self.config.get_enabled_generators()
        return list(self.GENERATORS.keys())
    
    def get_default_generator(self) -> str:
        """Get the default generator type"""
        if self.config:
            return self.config.get_default_generator()
        return 'mental'
    
    def is_generator_enabled(self, generator_type: str) -> bool:
        """Check if a generator is enabled"""
        if self.config:
            return self.config.is_generator_enabled(generator_type)
        return generator_type in self.GENERATORS
