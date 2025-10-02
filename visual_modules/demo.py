#!/usr/bin/env python3
"""
Visual Math Modules Demo

Demonstrates all the visual math modules and their capabilities.
"""

from numberline import NumberLineModule, NumberLineOrientation
from arrays import ArraysModule, ArrayOrientation
from area_models import AreaModelsModule, DecompositionStrategy
from quotative import QuotativeModule, MeasurementType

def demo_numberline():
    """Demonstrate number line module"""
    print("=" * 60)
    print("NUMBER LINE MODULE DEMO")
    print("=" * 60)
    
    module = NumberLineModule()
    
    # Generate different types of problems
    addition_problem = module.generate_addition_problem(0, 15, 1, 8)
    subtraction_problem = module.generate_subtraction_problem(10, 25, 1, 8)
    
    print(f"Addition Problem: {module.get_problem_statement(addition_problem)}")
    print(f"Visual Description: {addition_problem.operation} from {addition_problem.start_value} by {addition_problem.change_value}")
    print(f"Hint: {module.get_hint(addition_problem)}")
    print()
    
    print(f"Subtraction Problem: {module.get_problem_statement(subtraction_problem)}")
    print(f"Visual Description: {subtraction_problem.operation} from {subtraction_problem.start_value} by {subtraction_problem.change_value}")
    print(f"Hint: {module.get_hint(subtraction_problem)}")
    print()

def demo_arrays():
    """Demonstrate arrays module"""
    print("=" * 60)
    print("ARRAYS MODULE DEMO")
    print("=" * 60)
    
    module = ArraysModule()
    
    # Generate multiplication and division problems
    mult_problem = module.generate_multiplication_problem(3, 6, 3, 6)
    div_problem = module.generate_division_problem(12, 30, 3, 6)
    
    print(f"Multiplication Problem: {module.get_problem_statement(mult_problem)}")
    print(f"Array: {mult_problem.rows} rows × {mult_problem.columns} columns = {mult_problem.total_elements} total")
    print(f"Hint: {module.get_hint(mult_problem)}")
    print()
    
    print(f"Division Problem: {module.get_problem_statement(div_problem)}")
    print(f"Array: {div_problem.total_elements} items ÷ {div_problem.rows} groups = {div_problem.columns} per group")
    print(f"Hint: {module.get_hint(div_problem)}")
    print()

def demo_area_models():
    """Demonstrate area models module"""
    print("=" * 60)
    print("AREA MODELS MODULE DEMO")
    print("=" * 60)
    
    module = AreaModelsModule()
    
    # Generate different decomposition strategies
    standard_problem = module.generate_area_problem(4, 8, 4, 8)
    partial_problem = module.generate_decomposed_problem(12, 18, 12, 18, DecompositionStrategy.PARTIAL_PRODUCTS)
    
    print(f"Standard Area Problem: {module.get_problem_statement(standard_problem)}")
    print(f"Area: {standard_problem.length} × {standard_problem.width} = {standard_problem.total_area} square units")
    print(f"Hint: {module.get_hint(standard_problem)}")
    print()
    
    print(f"Partial Products Problem: {module.get_problem_statement(partial_problem)}")
    print(f"Area: {partial_problem.length} × {partial_problem.width} = {partial_problem.total_area} square units")
    print(f"Strategy: {partial_problem.decomposition_strategy.value}")
    print(f"Hint: {module.get_hint(partial_problem)}")
    print("Decomposition steps:")
    for step in module.get_decomposition_steps(partial_problem):
        print(f"  {step}")
    print()

def demo_quotative():
    """Demonstrate quotative module"""
    print("=" * 60)
    print("QUOTATIVE MODULE DEMO")
    print("=" * 60)
    
    module = QuotativeModule()
    
    # Generate different measurement types
    length_problem = module.generate_length_problem(20, 40, 3, 6)
    groups_problem = module.generate_groups_problem(15, 30, 4, 7)
    money_problem = module.generate_money_problem(30, 60, 6, 12)
    
    print(f"Length Problem: {module.get_problem_statement(length_problem)}")
    print(f"Context: {module.get_context_description(length_problem)}")
    print(f"Answer: {length_problem.number_of_groups} segments")
    print(f"Remainder: {length_problem.total_amount % length_problem.group_size} units")
    print()
    
    print(f"Groups Problem: {module.get_problem_statement(groups_problem)}")
    print(f"Context: {module.get_context_description(groups_problem)}")
    print(f"Answer: {groups_problem.number_of_groups} groups")
    print(f"Remainder: {groups_problem.total_amount % groups_problem.group_size} items")
    print()
    
    print(f"Money Problem: {module.get_problem_statement(money_problem)}")
    print(f"Context: {module.get_context_description(money_problem)}")
    print(f"Answer: {money_problem.number_of_groups} items")
    print(f"Remainder: ${money_problem.total_amount % money_problem.group_size}")
    print()

def demo_difficulty_levels():
    """Demonstrate different difficulty levels"""
    print("=" * 60)
    print("DIFFICULTY LEVELS DEMO")
    print("=" * 60)
    
    modules = {
        "Number Line": NumberLineModule(),
        "Arrays": ArraysModule(),
        "Area Models": AreaModelsModule(),
        "Quotative": QuotativeModule()
    }
    
    difficulties = ["easy", "medium", "hard"]
    
    for module_name, module in modules.items():
        print(f"\n{module_name} Module:")
        for difficulty in difficulties:
            if module_name == "Number Line":
                problem = module.generate_random_problem(difficulty=difficulty)
                print(f"  {difficulty.capitalize()}: {module.get_problem_statement(problem)}")
            elif module_name == "Arrays":
                problem = module.generate_random_problem(difficulty=difficulty)
                print(f"  {difficulty.capitalize()}: {module.get_problem_statement(problem)}")
            elif module_name == "Area Models":
                problem = module.generate_random_problem(difficulty=difficulty)
                print(f"  {difficulty.capitalize()}: {module.get_problem_statement(problem)}")
            else:  # Quotative
                problem = module.generate_random_problem(difficulty=difficulty)
                print(f"  {difficulty.capitalize()}: {module.get_problem_statement(problem)}")

if __name__ == "__main__":
    print("VISUAL MATH MODULES DEMONSTRATION")
    print("=" * 60)
    print("This demo shows the capabilities of all visual math modules")
    print("for Math Blaster educational game.")
    print()
    
    demo_numberline()
    demo_arrays()
    demo_area_models()
    demo_quotative()
    demo_difficulty_levels()
    
    print("=" * 60)
    print("DEMO COMPLETE")
    print("=" * 60)
    print("All visual modules are ready for integration into Math Blaster!")
    print("Each module provides:")
    print("- Problem generation with configurable difficulty")
    print("- Visual descriptions for rendering")
    print("- Answer validation")
    print("- Hints and step-by-step solutions")
    print("- Multiple representation strategies")
