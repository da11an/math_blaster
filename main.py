#!/usr/bin/env python3
"""
Math Blaster - A fun math game
Main entry point for the application
"""

from math_game import MathGame

def main():
    """Main function to start the Math Blaster game"""
    print("=" * 50)
    print("🎯 WELCOME TO MATH BLASTER! 🎯")
    print("=" * 50)
    print()
    
    game = MathGame()
    game.run()

if __name__ == "__main__":
    main()

