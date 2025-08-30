
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
