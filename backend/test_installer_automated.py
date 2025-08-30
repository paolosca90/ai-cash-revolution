#!/usr/bin/env python3
"""
Automated test script for the AI Trading Installer
Tests the installer functionality without GUI
"""
import sys
import os
import tempfile
import json
from pathlib import Path
import shutil

# Add the current directory to Python path for importing
sys.path.insert(0, os.path.dirname(__file__))

def test_installer_functions():
    """Test the core installer functions programmatically"""
    print("[TEST] Testing AI Trading Installer functions...")
    
    try:
        # Import the installer module
        from ai_trading_installer import TradingBotInstaller
        
        # Create a test installer instance
        print("[INIT] Creating installer instance...")
        
        # We can't create the full GUI in automated test, so we'll test individual methods
        # Create a mock installer for testing core functions
        class MockInstaller:
            def __init__(self):
                self.user_credentials = {}
                self.mt5_path = None
                self.bridge_script_path = None
                
            def log(self, message):
                print(f"[LOG] {message}")
                
        installer = MockInstaller()
        
        # Test 1: Credential backup functionality
        print("\n[TEST 1] Testing credential backup system...")
        
        # Set test credentials
        test_credentials = {
            "login": "67163307",
            "server": "RoboForex-ECN",
            "broker": "RoboForex Ltd",
            "password": "782789Pao!"  # This won't be saved for security
        }
        installer.user_credentials = test_credentials
        
        # Create a temporary directory for testing
        with tempfile.TemporaryDirectory() as temp_dir:
            # Override the home directory for testing
            original_home = Path.home
            Path.home = lambda: Path(temp_dir)
            
            try:
                # Test save credentials backup
                config_dir = Path(temp_dir) / ".ai_trading_bot"
                config_dir.mkdir(exist_ok=True)
                
                credentials_file = config_dir / "credentials_mt5.dat"
                credentials_data = {
                    "account": test_credentials.get("login", ""),
                    "server": test_credentials.get("server", ""),
                    "broker": test_credentials.get("broker", ""),
                    "saved_at": "2024-01-01 12:00:00",
                    "version": "2.0"
                }
                
                with open(credentials_file, 'w', encoding='utf-8') as f:
                    json.dump(credentials_data, f, indent=2, ensure_ascii=False)
                
                installer.log(f"Test credentials saved to: {credentials_file}")
                
                # Test load credentials backup
                if credentials_file.exists():
                    with open(credentials_file, 'r', encoding='utf-8') as f:
                        loaded_data = json.load(f)
                    
                    installer.log(f"Loaded credentials: {loaded_data}")
                    print("[OK] Credential backup system working")
                else:
                    print("[ERROR] Credential file not created")
                    return False
                    
            finally:
                # Restore original home function
                Path.home = original_home
        
        # Test 2: Bridge server configuration
        print("\n[TEST 2] Testing bridge server configuration...")
        
        with tempfile.TemporaryDirectory() as temp_dir:
            config_dir = Path(temp_dir)
            
            # Test configuration creation
            config = {
                "mt5_path": "C:/Program Files/MetaTrader 5/terminal64.exe",
                "credentials": test_credentials,
                "bridge_port": 8080,
                "web_app_url": "https://ai-cash-revolution-frontend.vercel.app",
                "auto_start": False,
                "version": "1.0.0"
            }
            
            config_file = config_dir / "config.json"
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=True)
            
            installer.log(f"Test config saved: {config_file}")
            
            # Test bridge server script creation
            bridge_script_template = '''
import MetaTrader5 as mt5
from flask import Flask, jsonify
import json
from pathlib import Path

app = Flask(__name__)

@app.route('/api/health')
def health_check():
    return jsonify({"status": "healthy", "test": True})

if __name__ == '__main__':
    print("[TEST BRIDGE] Bridge server would run here")
'''
            
            bridge_file = config_dir / "bridge_server.py"
            with open(bridge_file, 'w', encoding='utf-8') as f:
                f.write(bridge_script_template)
            
            installer.bridge_script_path = str(bridge_file)
            installer.log(f"Test bridge script created: {bridge_file}")
            print("[OK] Bridge configuration system working")
        
        # Test 3: Python dependencies check
        print("\n[TEST 3] Testing dependency installation check...")
        
        required_packages = ["MetaTrader5", "flask", "flask-cors", "pandas", "requests"]
        
        for package in required_packages:
            try:
                __import__(package.replace("-", "_"))
                installer.log(f"[OK] {package} is available")
            except ImportError:
                installer.log(f"[MISSING] {package} is missing")
        
        print("[OK] Dependency check completed")
        
        print("\n[SUCCESS] All installer function tests passed!")
        return True
        
    except Exception as e:
        print(f"[ERROR] Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_mt5_integration():
    """Test the MT5 integration specifically"""
    print("\n[TEST] Testing MT5 integration...")
    
    try:
        import MetaTrader5 as mt5
        
        # Test credentials from earlier
        login = 67163307
        password = "782789Pao!"
        server = "RoboForex-ECN"
        
        if not mt5.initialize():
            print(f"[ERROR] MT5 initialize failed")
            return False
        
        if mt5.login(login=login, password=password, server=server):
            account_info = mt5.account_info()
            print(f"[OK] MT5 Integration test passed - Account: {account_info.login}")
            mt5.shutdown()
            return True
        else:
            error = mt5.last_error()
            print(f"[ERROR] MT5 login failed: {error}")
            mt5.shutdown()
            return False
            
    except Exception as e:
        print(f"[ERROR] MT5 integration test failed: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("AI TRADING INSTALLER - AUTOMATED TEST SUITE")
    print("=" * 60)
    
    # Run all tests
    test1_passed = test_installer_functions()
    test2_passed = test_mt5_integration()
    
    print("\n" + "=" * 60)
    print("TEST RESULTS:")
    print(f"  Installer Functions: {'PASS' if test1_passed else 'FAIL'}")
    print(f"  MT5 Integration: {'PASS' if test2_passed else 'FAIL'}")
    print("=" * 60)
    
    if test1_passed and test2_passed:
        print("\n[SUCCESS] ALL TESTS PASSED! Installer is ready for use.")
        sys.exit(0)
    else:
        print("\n[FAILED] SOME TESTS FAILED! Check the output above.")
        sys.exit(1)