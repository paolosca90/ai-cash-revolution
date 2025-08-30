#!/usr/bin/env python3
"""
Test script for the Bridge Server functionality
Creates a temporary bridge server and tests all endpoints
"""
import json
import time
import threading
import subprocess
import sys
import requests
from pathlib import Path
import tempfile

def create_test_bridge_server(temp_dir, credentials):
    """Create a test bridge server script"""
    bridge_script = f'''
import MetaTrader5 as mt5
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import threading
import time
import os
from pathlib import Path

app = Flask(__name__)
CORS(app)

# Test configuration
config = {{
    "credentials": {json.dumps(credentials)},
    "bridge_port": 8080,
    "version": "1.0.0"
}}

connected = False
account_info = None

def auto_connect_mt5():
    """Automatically connect to MT5 with saved credentials"""
    global connected, account_info
    
    try:
        if not mt5.initialize():
            print("[MT5] Initialize failed")
            return False
            
        creds = config.get("credentials", {{}})
        if not mt5.login(login=int(creds["login"]), 
                        password=creds["password"], 
                        server=creds["server"]):
            print(f"[MT5] Login failed: {{mt5.last_error()}}")
            return False
            
        print("[MT5] Login successful")
        account_info = mt5.account_info()._asdict()
        connected = True
        
        return True
        
    except Exception as e:
        print(f"[MT5] Connection error: {{e}}")
        return False

@app.route('/')
def status_page():
    """Status page"""
    login_info = account_info.get("login", "N/A") if account_info else "N/A"
    status_text = "[ONLINE] Connected" if connected else "[OFFLINE] Disconnected"
    return f"""
    <h1>[TEST] AI Trading Bridge Server</h1>
    <p>Status: {{status_text}}</p>
    <p>Account: {{login_info}}</p>
    <p><a href="/api/health">Health Check</a></p>
    <p><a href="/connect">Manual Connect</a></p>
    """

@app.route('/api/mt5/status')
def mt5_status():
    return jsonify({{
        'connected': connected,
        'account': account_info,
        'timestamp': time.time()
    }})

@app.route('/api/mt5/connect', methods=['POST'])
def mt5_connect():
    print("[API] Manual MT5 connection requested")
    success = auto_connect_mt5()
    return jsonify({{"success": success}})

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({{
        "status": "healthy",
        "version": config.get("version", "test"),
        "mt5_connected": connected,
        "timestamp": time.time()
    }})

@app.route('/connect')
def manual_connect_page():
    """Manual connection page"""
    return """
    <h2>Manual MT5 Connection</h2>
    <form action="/api/mt5/connect" method="post">
        <input type="submit" value="Connect to MT5">
    </form>
    <p><a href="/">← Back</a></p>
    """

if __name__ == '__main__':
    print("[TEST BRIDGE] Starting test bridge server on port 8080...")
    app.run(host='127.0.0.1', port=8080, debug=False, use_reloader=False)
'''
    
    bridge_file = Path(temp_dir) / "test_bridge_server.py"
    with open(bridge_file, 'w', encoding='utf-8') as f:
        f.write(bridge_script)
    
    return str(bridge_file)

def test_bridge_endpoints():
    """Test all bridge server endpoints"""
    base_url = "http://127.0.0.1:8080"
    
    tests = [
        ("Health Check", f"{base_url}/api/health"),
        ("Status Page", f"{base_url}/"),
        ("MT5 Status", f"{base_url}/api/mt5/status"),
        ("Manual Connect Page", f"{base_url}/connect"),
    ]
    
    print("[ENDPOINT TESTS] Testing all endpoints...")
    
    for test_name, url in tests:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"  ✓ {test_name}: OK (Status {response.status_code})")
                
                # For JSON endpoints, validate content
                if '/api/' in url:
                    try:
                        data = response.json()
                        print(f"    JSON Keys: {list(data.keys())}")
                    except:
                        print(f"    Response: Text ({len(response.text)} chars)")
            else:
                print(f"  ✗ {test_name}: FAILED (Status {response.status_code})")
                return False
        except Exception as e:
            print(f"  ✗ {test_name}: ERROR - {e}")
            return False
    
    # Test POST endpoint
    print("\n[POST TEST] Testing MT5 connect endpoint...")
    try:
        response = requests.post(f"{base_url}/api/mt5/connect", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"  ✓ MT5 Connect: {data}")
            return True
        else:
            print(f"  ✗ MT5 Connect failed: Status {response.status_code}")
            return False
    except Exception as e:
        print(f"  ✗ MT5 Connect error: {e}")
        return False

def main():
    """Main test function"""
    print("=" * 60)
    print("BRIDGE SERVER - FUNCTIONALITY TEST")
    print("=" * 60)
    
    # Test credentials
    credentials = {
        "login": "67163307",
        "password": "782789Pao!",
        "server": "RoboForex-ECN"
    }
    
    with tempfile.TemporaryDirectory() as temp_dir:
        print(f"[SETUP] Creating test bridge server in {temp_dir}")
        
        # Create test bridge server
        bridge_script = create_test_bridge_server(temp_dir, credentials)
        print(f"[SETUP] Bridge script created: {bridge_script}")
        
        # Start bridge server in subprocess
        print("[SETUP] Starting bridge server...")
        try:
            process = subprocess.Popen(
                [sys.executable, bridge_script],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Wait for server to start
            print("[SETUP] Waiting for server to start...")
            time.sleep(3)
            
            # Test if server is running
            try:
                response = requests.get("http://127.0.0.1:8080/api/health", timeout=5)
                if response.status_code == 200:
                    print("[SETUP] ✓ Bridge server is running")
                    
                    # Run endpoint tests
                    success = test_bridge_endpoints()
                    
                    if success:
                        print("\n" + "=" * 60)
                        print("[SUCCESS] ALL BRIDGE SERVER TESTS PASSED!")
                        print("=" * 60)
                    else:
                        print("\n" + "=" * 60)
                        print("[FAILED] SOME BRIDGE SERVER TESTS FAILED!")
                        print("=" * 60)
                else:
                    print("[ERROR] Bridge server health check failed")
                    success = False
                    
            except Exception as e:
                print(f"[ERROR] Cannot connect to bridge server: {e}")
                success = False
            
            # Stop the server
            print("\\n[CLEANUP] Stopping bridge server...")
            process.terminate()
            process.wait(timeout=5)
            
        except Exception as e:
            print(f"[ERROR] Failed to start bridge server: {e}")
            success = False
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)