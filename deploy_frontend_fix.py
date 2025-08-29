#!/usr/bin/env python3
import subprocess
import sys
import time

def run_ssh_command(command, host, port, user):
    """Run SSH command using SSH client"""
    try:
        ssh_cmd = [
            "ssh", 
            "-o", "StrictHostKeyChecking=no",
            "-o", "ConnectTimeout=15",
            "-p", str(port),
            f"{user}@{host}",
            command
        ]
        
        print(f"Executing: {command}")
        result = subprocess.run(ssh_cmd, 
                              capture_output=True, 
                              text=True, 
                              timeout=60,
                              encoding='utf-8',
                              errors='replace')
        
        if result.returncode == 0:
            print(f"SUCCESS: {result.stdout.strip()}")
            return True
        else:
            print(f"ERROR: {result.stderr.strip()}")
            return False
            
    except subprocess.TimeoutExpired:
        print("Command timed out")
        return False
    except Exception as e:
        print(f"Exception: {e}")
        return False

def deploy_frontend_fix():
    HOST = "188.34.181.99"
    PORT = 22
    USER = "root"
    PASSWORD = "3gCifhcmNkac"
    
    print("AI Cash R-evolution - Deploy Frontend Fix")
    print("=" * 42)
    
    # Test SSH connectivity first
    print("Testing SSH connectivity...")
    if not run_ssh_command("echo 'SSH test successful'", HOST, PORT, USER):
        print("SSH connection failed. Unable to deploy.")
        print("Manual steps when SSH is available:")
        print(f"1. ssh {USER}@{HOST}")
        print("2. cd /var/www/ai-cash-revolution")
        print("3. git pull origin main")
        print("4. pm2 restart ai-cash-revolution")
        print("5. Test at http://188.34.181.99")
        return False
    
    # Deployment steps
    steps = [
        ("Pull latest changes with frontend fix", "cd /var/www/ai-cash-revolution && git pull origin main"),
        ("Restart PM2 application", "pm2 restart ai-cash-revolution"),
        ("Wait for startup", "sleep 3"),
        ("Test health endpoint", "curl -s http://localhost:5000/health"),
        ("Test main page", "curl -s http://localhost:5000/ | head -5"),
    ]
    
    success_count = 0
    
    for i, (description, command) in enumerate(steps, 1):
        print(f"\nStep {i}/{len(steps)}: {description}")
        if run_ssh_command(command, HOST, PORT, USER):
            success_count += 1
            time.sleep(2)
        else:
            print(f"Failed at step {i}: {description}")
            if i <= 2:  # Critical steps
                break
        print("-" * 42)
    
    print(f"\nDeployment completed: {success_count}/{len(steps)} steps successful")
    
    if success_count >= 4:
        print("SUCCESS: Frontend fix deployed!")
        print(f"Access your app at: http://{HOST}")
        print("The fallback frontend should now be working.")
        return True
    else:
        print("DEPLOYMENT ISSUES: Manual intervention may be required.")
        return False

if __name__ == "__main__":
    success = deploy_frontend_fix()
    
    if success:
        print("\n🎉 Frontend fix deployment completed successfully!")
    else:
        print("\n⚠️ Deployment incomplete - retry when SSH is available.")
    
    sys.exit(0 if success else 1)