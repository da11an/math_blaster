#!/usr/bin/env python3
"""
Visual Math Modules for Math Blaster

This package contains visual representations of different math concepts:
- NumberLine: Addition and subtraction on number lines
- Arrays: Multiplication and division using arrays
- AreaModels: Multiplication using area models
- Quotative: Division using quotative (measurement) models
"""

__version__ = "1.0.0"
__author__ = "Math Blaster Team"

# Import all visual modules
from .numberline import NumberLineModule
from .arrays import ArraysModule
from .area_models import AreaModelsModule
from .quotative import QuotativeModule

__all__ = [
    'NumberLineModule',
    'ArraysModule', 
    'AreaModelsModule',
    'QuotativeModule'
]
