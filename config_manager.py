"""
Configuration Manager

Manages configuration settings for the Math Blaster game.
"""

import json
import os
from typing import Dict, List, Any

class ConfigManager:
    def __init__(self, config_file: str = "config.json"):
        self.config_file = config_file
        self.config = self.load_config()
    
    def load_config(self) -> Dict[str, Any]:
        """Load configuration from file"""
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError) as e:
                print(f"Error loading config: {e}")
                return self.get_default_config()
        else:
            return self.get_default_config()
    
    def get_default_config(self) -> Dict[str, Any]:
        """Get default configuration"""
        return {
            "math_generators": {
                "enabled": ["mental"],
                "default": "mental",
                "fallback": "mental"
            },
            "symbols": {
                "multiplication": "×",
                "division": "÷",
                "addition": "+",
                "subtraction": "-"
            },
            "settings": {
                "use_proper_math_symbols": True,
                "enable_fallback": True
            }
        }
    
    def save_config(self) -> bool:
        """Save configuration to file"""
        try:
            with open(self.config_file, 'w') as f:
                json.dump(self.config, f, indent=4)
            return True
        except IOError as e:
            print(f"Error saving config: {e}")
            return False
    
    def get_enabled_generators(self) -> List[str]:
        """Get list of enabled math generators"""
        return self.config.get("math_generators", {}).get("enabled", ["mental"])
    
    def get_default_generator(self) -> str:
        """Get the default math generator"""
        return self.config.get("math_generators", {}).get("default", "mental")
    
    def get_fallback_generator(self) -> str:
        """Get the fallback math generator"""
        return self.config.get("math_generators", {}).get("fallback", "simple")
    
    def is_generator_enabled(self, generator_name: str) -> bool:
        """Check if a generator is enabled"""
        return generator_name in self.get_enabled_generators()
    
    def get_symbols(self) -> Dict[str, str]:
        """Get math symbols configuration"""
        return self.config.get("symbols", {
            "multiplication": "×",
            "division": "÷",
            "addition": "+",
            "subtraction": "-"
        })
    
    def use_proper_math_symbols(self) -> bool:
        """Check if proper math symbols should be used"""
        return self.config.get("settings", {}).get("use_proper_math_symbols", True)
    
    def enable_fallback(self) -> bool:
        """Check if fallback should be enabled"""
        return self.config.get("settings", {}).get("enable_fallback", True)
    
    def set_generator_enabled(self, generator_name: str, enabled: bool) -> bool:
        """Enable or disable a generator"""
        enabled_generators = self.get_enabled_generators()
        if enabled and generator_name not in enabled_generators:
            enabled_generators.append(generator_name)
        elif not enabled and generator_name in enabled_generators:
            enabled_generators.remove(generator_name)
        
        self.config["math_generators"]["enabled"] = enabled_generators
        return self.save_config()
    
    def set_default_generator(self, generator_name: str) -> bool:
        """Set the default generator"""
        if generator_name in self.get_enabled_generators():
            self.config["math_generators"]["default"] = generator_name
            return self.save_config()
        return False
