"""
Math Blaster Game Logic
Contains the main game class and functionality
"""

import random
import time
import json
import os
from typing import Dict, List, Tuple

class MathGame:
    """Main game class for Math Blaster"""
    
    def __init__(self):
        self.score = 0
        self.high_score = self.load_high_score()
        self.difficulty = "easy"
        self.problem_count = 0
        self.correct_answers = 0
        
    def load_high_score(self) -> int:
        """Load high score from file"""
        try:
            if os.path.exists("high_score.json"):
                with open("high_score.json", "r") as f:
                    data = json.load(f)
                    return data.get("high_score", 0)
        except (FileNotFoundError, json.JSONDecodeError):
            pass
        return 0
    
    def save_high_score(self):
        """Save high score to file"""
        try:
            with open("high_score.json", "w") as f:
                json.dump({"high_score": self.high_score}, f)
        except Exception:
            pass
    
    def display_menu(self):
        """Display the main menu"""
        print("\n📋 MAIN MENU")
        print("-" * 20)
        print("1. Start Game")
        print("2. Change Difficulty")
        print("3. View High Score")
        print("4. Instructions")
        print("5. Quit")
        print()
    
    def display_difficulty_menu(self):
        """Display difficulty selection menu"""
        print("\n🎯 DIFFICULTY LEVELS")
        print("-" * 25)
        print("1. Easy (1-10)")
        print("2. Medium (1-50)")
        print("3. Hard (1-100)")
        print("4. Expert (1-500)")
        print()
    
    def set_difficulty(self, choice: str):
        """Set game difficulty based on user choice"""
        difficulty_map = {
            "1": ("easy", 10),
            "2": ("medium", 50),
            "3": ("hard", 100),
            "4": ("expert", 500)
        }
        
        if choice in difficulty_map:
            self.difficulty, self.max_number = difficulty_map[choice]
            print(f"✅ Difficulty set to: {self.difficulty.title()}")
        else:
            print("❌ Invalid choice. Please try again.")
    
    def generate_problem(self) -> Tuple[str, int]:
        """Generate a random math problem"""
        operations = ["+", "-", "*", "/"]
        operation = random.choice(operations)
        
        if operation == "+":
            a = random.randint(1, self.max_number)
            b = random.randint(1, self.max_number)
            problem = f"{a} {operation} {b}"
            answer = a + b
            
        elif operation == "-":
            a = random.randint(1, self.max_number)
            b = random.randint(1, min(a, self.max_number))
            problem = f"{a} {operation} {b}"
            answer = a - b
            
        elif operation == "*":
            a = random.randint(1, min(12, self.max_number))
            b = random.randint(1, min(12, self.max_number))
            problem = f"{a} {operation} {b}"
            answer = a * b
            
        else:  # division
            b = random.randint(2, min(12, self.max_number))
            answer = random.randint(1, min(12, self.max_number))
            a = b * answer
            problem = f"{a} {operation} {b}"
        
        return problem, answer
    
    def play_round(self):
        """Play a single round of the game"""
        problem, correct_answer = self.generate_problem()
        
        print(f"\n🧮 Problem {self.problem_count + 1}: {problem} = ?")
        
        start_time = time.time()
        
        try:
            user_answer = int(input("Your answer: "))
        except ValueError:
            print("❌ Please enter a valid number!")
            return False
        
        end_time = time.time()
        response_time = end_time - start_time
        
        if user_answer == correct_answer:
            self.correct_answers += 1
            points = max(1, int(10 - response_time))  # Faster answers get more points
            self.score += points
            
            print(f"✅ Correct! (+{points} points)")
            if response_time < 2:
                print("⚡ Lightning fast!")
            elif response_time < 5:
                print("🚀 Great speed!")
        else:
            print(f"❌ Wrong! The correct answer was {correct_answer}")
        
        self.problem_count += 1
        return True
    
    def display_stats(self):
        """Display current game statistics"""
        accuracy = (self.correct_answers / self.problem_count * 100) if self.problem_count > 0 else 0
        
        print(f"\n📊 GAME STATISTICS")
        print("-" * 20)
        print(f"Score: {self.score}")
        print(f"Problems Solved: {self.problem_count}")
        print(f"Correct Answers: {self.correct_answers}")
        print(f"Accuracy: {accuracy:.1f}%")
        
        if self.score > self.high_score:
            self.high_score = self.score
            self.save_high_score()
            print("🎉 NEW HIGH SCORE! 🎉")
        else:
            print(f"High Score: {self.high_score}")
    
    def show_instructions(self):
        """Display game instructions"""
        print("\n📖 INSTRUCTIONS")
        print("-" * 15)
        print("• Answer math problems as quickly and accurately as possible")
        print("• You get more points for faster answers")
        print("• Choose your difficulty level before starting")
        print("• Try to beat your high score!")
        print("• Type 'quit' during gameplay to return to menu")
        print()
    
    def run(self):
        """Main game loop"""
        self.set_difficulty("1")  # Default to easy
        
        while True:
            self.display_menu()
            choice = input("Enter your choice (1-5): ").strip()
            
            if choice == "1":
                self.start_game()
            elif choice == "2":
                self.display_difficulty_menu()
                diff_choice = input("Select difficulty (1-4): ").strip()
                self.set_difficulty(diff_choice)
            elif choice == "3":
                print(f"\n🏆 High Score: {self.high_score}")
            elif choice == "4":
                self.show_instructions()
            elif choice == "5":
                print("\n👋 Thanks for playing Math Blaster!")
                break
            else:
                print("❌ Invalid choice. Please try again.")
    
    def start_game(self):
        """Start a new game session"""
        self.score = 0
        self.problem_count = 0
        self.correct_answers = 0
        
        print(f"\n🎮 Starting {self.difficulty.title()} mode!")
        print("Type 'quit' to return to menu")
        print("-" * 40)
        
        while True:
            if not self.play_round():
                continue
            
            if self.problem_count >= 10:  # Play 10 problems per game
                break
            
            continue_choice = input("\nPress Enter for next problem or 'quit' to stop: ").strip().lower()
            if continue_choice == "quit":
                break
        
        self.display_stats()
        
        play_again = input("\nPlay again? (y/n): ").strip().lower()
        if play_again == "y":
            self.start_game()

if __name__ == "__main__":
    game = MathGame()
    game.run()

