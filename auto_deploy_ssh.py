#!/usr/bin/env python3
import subprocess
import sys
import time

def run_ssh_command(command, host, port, user, password):
    """Run SSH command using SSH client"""
    try:
        # Try with built-in ssh first
        ssh_cmd = [
            "ssh", 
            "-o", "StrictHostKeyChecking=no",
            "-o", "UserKnownHostsFile=/dev/null",
            "-p", str(port),
            f"{user}@{host}",
            command
        ]
        
        print(f"Executing: {command}")
        result = subprocess.run(ssh_cmd, 
                              capture_output=True, 
                              text=True, 
                              timeout=60)
        
        if result.returncode == 0:
            print(f"SUCCESS: {result.stdout}")
            return True
        else:
            print(f"ERROR: {result.stderr}")
            return False
            
    except FileNotFoundError:
        print("SSH client not found. Please connect manually.")
        return False
    except subprocess.TimeoutExpired:
        print("Command timed out.")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def deploy_to_vps():
    # VPS details - Updated for Ubuntu
    HOST = "188.34.181.99"
    PORT = 22
    USER = "root"
    PASSWORD = "3gCifhcmNkac"
    
    print("AI Cash R-evolution - Auto SSH Deploy")
    print("=" * 40)
    print(f"Deploying to {HOST}:{PORT}")
    print()
    
    # List of commands to execute
    commands = [
        "sudo apt update",
        "sudo apt install -y curl wget git nodejs npm nginx postgresql redis-server",
        "sudo npm install -g pm2",
        "sudo mkdir -p /var/www/ai-cash-revolution",
        "cd /var/www/ai-cash-revolution && sudo git clone https://github.com/paolosca90/ai-cash-revolution.git . || sudo git pull origin main",
        "cd /var/www/ai-cash-revolution && sudo npm install --production",
        "cd /var/www/ai-cash-revolution/frontend && sudo npm install && sudo npm run build",
        "cd /var/www/ai-cash-revolution && sudo pm2 delete ai-cash-revolution 2>/dev/null || true",
        "cd /var/www/ai-cash-revolution && sudo pm2 start complete_server.js --name ai-cash-revolution",
        "sudo pm2 save && sudo pm2 startup"
    ]
    
    success_count = 0
    
    for i, cmd in enumerate(commands, 1):
        print(f"Step {i}/{len(commands)}: {cmd}")
        if run_ssh_command(cmd, HOST, PORT, USER, PASSWORD):
            success_count += 1
            time.sleep(2)  # Wait between commands
        else:
            print(f"Failed at step {i}. Continuing...")
        print("-" * 40)
    
    print()
    print(f"Deployment completed: {success_count}/{len(commands)} steps successful")
    
    if success_count >= 8:  # Most critical steps completed
        print("SUCCESS: Application should be running!")
        print(f"Access your app at: http://{HOST}")
    else:
        print("WARNING: Some steps failed. Manual intervention may be required.")
        print()
        print("Manual connection details:")
        print(f"IP: {HOST}")
        print(f"Port: {PORT}")
        print(f"User: {USER}")
        print(f"Password: {PASSWORD}")

if __name__ == "__main__":
    deploy_to_vps()