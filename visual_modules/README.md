# Visual Math Modules

This package contains visual representations of different math concepts for the Math Blaster educational game. Each module provides structured data for rendering visual math problems in the browser.

## Modules Overview

### 1. Number Line Module (`numberline.py`)
**Purpose**: Visual representations of addition and subtraction using number lines

**Features**:
- Horizontal and vertical number line orientations
- Configurable tick intervals
- Start position and movement visualization
- Support for both addition and subtraction operations

**Example Problem**: `5 + 3 = ?` - Start at 5, move 3 steps right to reach 8

### 2. Arrays Module (`arrays.py`)
**Purpose**: Visual representations of multiplication and division using rectangular arrays

**Features**:
- Row-first and column-first orientations
- Group highlighting for division problems
- Support for both multiplication and division operations
- Alternative representations (repeated addition)

**Example Problem**: `4 × 3 = ?` - Show 4 rows of 3 items each

### 3. Area Models Module (`area_models.py`)
**Purpose**: Visual representations of multiplication using area models with decomposition strategies

**Features**:
- Standard area models
- Partial products decomposition
- Distributive property visualization
- Step-by-step decomposition instructions

**Example Problem**: `12 × 8 = ?` - Break into (10 + 2) × 8 = 80 + 16 = 96

### 4. Quotative Module (`quotative.py`)
**Purpose**: Visual representations of division using quotative (measurement) models

**Features**:
- Multiple measurement contexts (length, capacity, groups, money)
- Visual grouping with remainder handling
- Real-world problem contexts
- Step-by-step solution processes

**Example Problem**: "How many groups of 4 can be made from 17 items?" - Answer: 4 groups with 1 remainder

## Usage

```python
from visual_modules import NumberLineModule, ArraysModule, AreaModelsModule, QuotativeModule

# Create module instances
numberline = NumberLineModule()
arrays = ArraysModule()
area_models = AreaModelsModule()
quotative = QuotativeModule()

# Generate problems
addition_problem = numberline.generate_addition_problem()
mult_problem = arrays.generate_multiplication_problem()
area_problem = area_models.generate_area_problem()
groups_problem = quotative.generate_groups_problem()

# Get visual descriptions for rendering
visual_data = numberline.get_visual_description(addition_problem)
```

## Problem Generation

Each module supports three difficulty levels:
- **Easy**: Smaller numbers, simpler concepts
- **Medium**: Moderate complexity
- **Hard**: Larger numbers, advanced strategies

## Visual Description Format

All modules return structured data in this format:
```python
{
    "type": "module_type",
    "operation": "addition|subtraction|multiplication|division",
    "problem_statement": "5 + 3 = ?",
    "visual_data": {
        # Module-specific visual information
    },
    "hints": ["Start at 5", "Move 3 steps right"],
    "answer": 8
}
```

## Integration Notes

These modules are designed to be integrated with:
- Frontend rendering (HTML5 Canvas, SVG, or DOM)
- Problem generation systems
- Answer validation
- Hint systems
- Progress tracking

## File Structure

```
visual_modules/
├── __init__.py          # Package initialization
├── numberline.py        # Number line visualizations
├── arrays.py           # Array visualizations  
├── area_models.py     # Area model visualizations
├── quotative.py       # Quotative division visualizations
├── demo.py            # Demonstration script
└── README.md          # This file
```

## Running the Demo

```bash
cd visual_modules
python demo.py
```

This will demonstrate all modules with sample problems and show their capabilities.
