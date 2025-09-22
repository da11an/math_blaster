#!/usr/bin/env python3
"""
Generator Management Script

Easy command-line tool to manage math generators.
"""

import sys
import argparse
from config_manager import ConfigManager

def main():
    parser = argparse.ArgumentParser(description='Manage Math Blaster generators')
    parser.add_argument('--list', action='store_true', help='List available generators')
    parser.add_argument('--enable', type=str, help='Enable a generator')
    parser.add_argument('--disable', type=str, help='Disable a generator')
    parser.add_argument('--set-default', type=str, help='Set default generator')
    parser.add_argument('--status', action='store_true', help='Show current status')
    
    args = parser.parse_args()
    
    config = ConfigManager()
    
    if args.list:
        print("Available generators:")
        print("  mental - Mental math generator (10 levels, proper math symbols)")
        print("  simple - Simple math generator (4 levels, proper math symbols)")
        print(f"\nEnabled: {', '.join(config.get_enabled_generators())}")
        print(f"Default: {config.get_default_generator()}")
        print(f"Fallback: {config.get_fallback_generator()}")
    
    elif args.enable:
        if config.set_generator_enabled(args.enable, True):
            print(f"✅ Enabled generator: {args.enable}")
        else:
            print(f"❌ Failed to enable generator: {args.enable}")
    
    elif args.disable:
        if config.set_generator_enabled(args.disable, False):
            print(f"✅ Disabled generator: {args.disable}")
        else:
            print(f"❌ Failed to disable generator: {args.disable}")
    
    elif args.set_default:
        if config.set_default_generator(args.set_default):
            print(f"✅ Set default generator: {args.set_default}")
        else:
            print(f"❌ Failed to set default generator: {args.set_default}")
    
    elif args.status:
        print("Math Generator Status:")
        print(f"  Enabled generators: {', '.join(config.get_enabled_generators())}")
        print(f"  Default generator: {config.get_default_generator()}")
        print(f"  Fallback generator: {config.get_fallback_generator()}")
        print(f"  Proper math symbols: {config.use_proper_math_symbols()}")
        print(f"  Fallback enabled: {config.enable_fallback()}")
    
    else:
        parser.print_help()

if __name__ == '__main__':
    main()
