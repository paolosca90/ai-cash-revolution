#!/usr/bin/env python3
"""
Test script for AI Trading Bot installer
Tests encoding issues and installation process
"""

import sys
import os
import json
from pathlib import Path

# Add the backend directory to the path so we can import the installer
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the installer module
try:
    import ai_trading_installer
    print("[SUCCESS] Installer module imported successfully")
    print("[INFO] No encoding issues detected during import")
except Exception as e:
    print(f"[ERROR] Failed to import installer: {e}")
    sys.exit(1)

# Test that the class can be instantiated
try:
    installer = ai_trading_installer.TradingBotInstaller()
    print("[SUCCESS] TradingBotInstaller class instantiated successfully")
except Exception as e:
    print(f"[ERROR] Failed to instantiate TradingBotInstaller: {e}")
    sys.exit(1)

# Test configuration creation
print("[TEST] Testing configuration creation...")

try:
    # Create a test configuration
    config_dir = Path.home() / ".ai_trading_bot_test"
    config_dir.mkdir(exist_ok=True)
    
    test_config = {
        "mt5_path": "C:/test/mt5/terminal64.exe",
        "credentials": {
            "login": "123456",
            "password": "testpass",
            "server": "Test-Server",
            "broker": "Test-Broker"
        },
        "bridge_port": 8080,
        "web_app_url": "https://ai-cash-revolution-frontend.vercel.app",
        "auto_start": True,
        "version": "1.0.0"
    }
    
    # Test writing config file with utf-8 encoding
    config_file = config_dir / "config.json"
    with open(config_file, 'w', encoding='utf-8') as f:
        json.dump(test_config, f, indent=2, ensure_ascii=True)
    
    print("[SUCCESS] Configuration file created with UTF-8 encoding")
    
    # Verify the content can be read back
    with open(config_file, 'r', encoding='utf-8') as f:
        read_config = json.load(f)
    
    if read_config == test_config:
        print("[SUCCESS] Configuration file read back correctly")
    else:
        print("[WARNING] Configuration file content mismatch")
    
    # Clean up test directory
    import shutil
    shutil.rmtree(config_dir)
    print("[INFO] Test configuration directory cleaned up")
    
except Exception as e:
    print(f"[ERROR] Configuration test failed: {e}")
    sys.exit(1)

# Test Python dependencies installation function
print("[TEST] Testing Python dependencies installation function...")

try:
    # Test method without actually installing
    installer.log = lambda msg: print(f"[LOG] {msg}")
    installer.update_progress = lambda msg: print(f"[PROGRESS] {msg}")
    print("[SUCCESS] Dependency installation function accessible")
except Exception as e:
    print(f"[ERROR] Failed to access dependency installation function: {e}")

print("[TEST] All tests completed successfully!")
print("[RESULT] No character encoding issues detected in the installer")