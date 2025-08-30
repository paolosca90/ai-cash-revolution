"""
Build script for creating Windows executable installer
Run: python build_installer.py
"""

import subprocess
import sys
import os
from pathlib import Path

def install_pyinstaller():
    """Install PyInstaller if not present"""
    try:
        import PyInstaller
        print("PyInstaller already installed")
    except ImportError:
        print("Installing PyInstaller...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])
        print("PyInstaller installed")

def create_exe():
    """Create Windows executable"""
    print("Building Windows executable...")
    
    # Create temp spec file for customization
    spec_content = """
# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['ai_trading_installer.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=['tkinter', 'tkinter.ttk', 'MetaTrader5', 'flask', 'flask_cors', 'pandas', 'requests'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='AI_Trading_Bot_Installer',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # No console window
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,  # Add icon path if you have one
    version_info={
        'version': (1, 0, 0, 0),
        'description': 'AI Trading Bot - Automated MT5 Bridge Installer',
        'product_name': 'AI Trading Bot',
        'product_version': '1.0.0',
        'file_version': '1.0.0',
        'company_name': 'AI Trading Solutions',
        'copyright': '2024 AI Trading Solutions'
    }
)
"""
    
    # Write spec file
    with open('installer.spec', 'w') as f:
        f.write(spec_content)
    
    # Build with PyInstaller using spec file
    cmd = [
        sys.executable, '-m', 'PyInstaller',
        'installer.spec'
    ]
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print("Executable built successfully!")
        print(f"Location: {os.path.abspath('./dist/AI_Trading_Bot_Installer.exe')}")
        
        # Clean up
        if os.path.exists('installer.spec'):
            os.remove('installer.spec')
            
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"Build failed: {e}")
        print("stdout:", e.stdout)
        print("stderr:", e.stderr)
        return False

def create_portable_version():
    """Create a portable version with all files"""
    print("Creating portable version...")
    
    # Ensure dist directory exists
    Path("./dist").mkdir(exist_ok=True)
    portable_dir = Path("./dist/AI_Trading_Bot_Portable")
    portable_dir.mkdir(exist_ok=True)
    
    # Copy installer script
    import shutil
    shutil.copy2("ai_trading_installer.py", portable_dir)
    
    # Create run.bat
    batch_content = """@echo off
title AI Trading Bot - Portable
echo AI Trading Bot - Portable Version
echo.
echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo Python not found! Please install Python 3.7+ first
    echo Download from: https://python.org/downloads
    pause
    exit /b 1
)

echo Python found, starting installer...
python ai_trading_installer.py
pause
"""
    
    with open(portable_dir / "run.bat", 'w') as f:
        f.write(batch_content)
        
    # Create README
    readme_content = """# AI Trading Bot - Portable Version

## Quick Start:
1. Double-click 'run.bat' to start
2. Follow the automated setup
3. Your MT5 will be connected automatically

## Requirements:
- Python 3.7+ (will install packages automatically)
- MetaTrader 5 (will guide installation if missing)
- Windows 10/11

## What it does:
- Installs all Python dependencies automatically
- Finds or helps install MT5
- Configures bridge server
- Connects to your trading account
- Starts background service

## Support:
Open the web app at: https://ai-cash-revolution-frontend.vercel.app
"""
    
    with open(portable_dir / "README.txt", 'w') as f:
        f.write(readme_content)
        
    print(f"Portable version created: {portable_dir}")
    return True

if __name__ == "__main__":
    print("AI Trading Bot - Build Script")
    print("=" * 50)
    
    # Install dependencies
    install_pyinstaller()
    
    # Create executable
    exe_success = create_exe()
    
    # Create portable version
    portable_success = create_portable_version()
    
    print("\nBuild Summary:")
    print(f"Windows Executable: {'Success' if exe_success else 'Failed'}")
    print(f"Portable Version: {'Success' if portable_success else 'Failed'}")
    
    if exe_success:
        print(f"\nFiles ready for distribution:")
        print(f"   - ./dist/AI_Trading_Bot_Installer.exe (Single file installer)")
        print(f"   - ./dist/AI_Trading_Bot_Portable/ (Folder for users without Python)")
        
    print("\nNext steps:")
    print("1. Test the installer on a clean Windows machine")
    print("2. Upload to your protected download area")
    print("3. Users can download and run with one click!")