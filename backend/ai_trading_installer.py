#!/usr/bin/env python3
"""
AI Trading Bot - Automated Installer & Bridge
Installs everything needed for MT5 connection automatically
"""

import os
import sys
import subprocess
import tkinter as tk
from tkinter import ttk, messagebox, simpledialog
import threading
import time
import requests
import zipfile
import json
import winreg
from pathlib import Path
import webbrowser

# Configuration
APP_NAME = "AI Trading Bot"
APP_VERSION = "1.0.0"
BRIDGE_PORT = 8080
WEB_APP_URL = "https://ai-cash-revolution-frontend.vercel.app"

class TradingBotInstaller:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title(f"{APP_NAME} - Installer Automatico")
        self.root.geometry("600x500")
        self.root.resizable(False, False)
        
        # Variables
        self.mt5_path = None
        self.user_credentials = {}
        self.bridge_process = None
        self.is_running = False
        
        # Create UI
        self.setup_ui()
        
    def setup_ui(self):
        # Title
        title_frame = ttk.Frame(self.root)
        title_frame.pack(fill='x', padx=20, pady=10)
        
        title_label = ttk.Label(title_frame, text=f"{APP_NAME} - Setup Automatico", 
                               font=('Arial', 16, 'bold'))
        title_label.pack()
        
        subtitle_label = ttk.Label(title_frame, text="Configurazione automatica MT5 + Bridge Server")
        subtitle_label.pack()
        
        # Progress section
        progress_frame = ttk.LabelFrame(self.root, text="Progresso Installazione")
        progress_frame.pack(fill='x', padx=20, pady=10)
        
        self.progress_var = tk.StringVar(value="Pronto per iniziare...")
        self.progress_label = ttk.Label(progress_frame, textvariable=self.progress_var)
        self.progress_label.pack(pady=5)
        
        self.progress_bar = ttk.Progressbar(progress_frame, mode='indeterminate')
        self.progress_bar.pack(fill='x', padx=10, pady=5)
        
        # Log area
        log_frame = ttk.LabelFrame(self.root, text="Log Installazione")
        log_frame.pack(fill='both', expand=True, padx=20, pady=10)
        
        self.log_text = tk.Text(log_frame, height=10, wrap='word')
        scrollbar = ttk.Scrollbar(log_frame, orient='vertical', command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=scrollbar.set)
        
        self.log_text.pack(side='left', fill='both', expand=True)
        scrollbar.pack(side='right', fill='y')
        
        # Control buttons
        button_frame = ttk.Frame(self.root)
        button_frame.pack(fill='x', padx=20, pady=10)
        
        self.install_btn = ttk.Button(button_frame, text="🚀 Installa Tutto Automaticamente", 
                                     command=self.start_installation, style='Accent.TButton')
        self.install_btn.pack(side='left', padx=5)
        
        self.start_btn = ttk.Button(button_frame, text="▶️ Avvia Bridge", 
                                   command=self.start_bridge, state='disabled')
        self.start_btn.pack(side='left', padx=5)
        
        self.stop_btn = ttk.Button(button_frame, text="⏹️ Stop Bridge", 
                                  command=self.stop_bridge, state='disabled')
        self.stop_btn.pack(side='left', padx=5)
        
        self.web_btn = ttk.Button(button_frame, text="🌐 Apri Web App", 
                                 command=self.open_web_app)
        self.web_btn.pack(side='right', padx=5)
        
        # Status bar
        self.status_var = tk.StringVar(value="Pronto")
        status_bar = ttk.Label(self.root, textvariable=self.status_var, relief='sunken')
        status_bar.pack(fill='x', side='bottom')
        
    def log(self, message):
        """Add message to log"""
        timestamp = time.strftime("%H:%M:%S")
        self.log_text.insert('end', f"[{timestamp}] {message}\n")
        self.log_text.see('end')
        self.root.update()
        
    def update_progress(self, message):
        """Update progress message"""
        self.progress_var.set(message)
        self.status_var.set(message)
        self.root.update()
        
    def start_installation(self):
        """Start automated installation"""
        self.install_btn.config(state='disabled')
        self.progress_bar.start()
        
        # Run installation in separate thread
        thread = threading.Thread(target=self.run_installation)
        thread.daemon = True
        thread.start()
        
    def run_installation(self):
        """Run the complete installation process"""
        try:
            self.log("🚀 Iniziando installazione automatica...")
            
            # Step 1: Check Python dependencies
            self.update_progress("Verificando dipendenze Python...")
            self.install_python_deps()
            
            # Step 2: Find or download MT5
            self.update_progress("Rilevando MetaTrader 5...")
            self.find_or_install_mt5()
            
            # Step 3: Get user credentials
            self.update_progress("Configurando credenziali...")
            self.get_user_credentials()
            
            # Step 4: Create bridge configuration
            self.update_progress("Configurando bridge server...")
            self.create_bridge_config()
            
            # Step 5: Test MT5 connection
            self.update_progress("Testando connessione MT5...")
            self.test_mt5_connection()
            
            self.progress_bar.stop()
            self.update_progress("✅ Installazione completata!")
            self.log("🎉 Installazione completata con successo!")
            
            self.install_btn.config(state='normal')
            self.start_btn.config(state='normal')
            
            # Auto-start bridge
            if messagebox.askyesno("Installazione Completata", 
                                  "Vuoi avviare subito il bridge server?"):
                self.start_bridge()
                
        except Exception as e:
            self.progress_bar.stop()
            self.update_progress(f"❌ Errore: {str(e)}")
            self.log(f"❌ Errore durante installazione: {str(e)}")
            self.install_btn.config(state='normal')
            
    def install_python_deps(self):
        """Install required Python packages"""
        self.log("📦 Installando dipendenze Python...")
        
        packages = ["MetaTrader5", "flask", "flask-cors", "pandas", "requests"]
        
        for package in packages:
            try:
                self.log(f"   Installando {package}...")
                result = subprocess.run([sys.executable, "-m", "pip", "install", package], 
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    self.log(f"   ✅ {package} installato")
                else:
                    self.log(f"   ⚠️ {package} già presente o errore: {result.stderr}")
            except Exception as e:
                self.log(f"   ❌ Errore installazione {package}: {e}")
                
        self.log("✅ Dipendenze Python completate")
        
    def find_or_install_mt5(self):
        """Find MT5 installation or guide user"""
        self.log("🔍 Cercando installazione MetaTrader 5...")
        
        # Common MT5 paths
        mt5_paths = [
            os.path.expanduser("~/AppData/Roaming/MetaQuotes/Terminal/*/terminal64.exe"),
            "C:/Program Files/MetaTrader 5/terminal64.exe",
            "C:/Program Files (x86)/MetaTrader 5/terminal64.exe"
        ]
        
        for path_pattern in mt5_paths:
            import glob
            matches = glob.glob(path_pattern)
            if matches:
                self.mt5_path = matches[0]
                self.log(f"✅ MT5 trovato: {self.mt5_path}")
                return
                
        # MT5 not found
        self.log("⚠️ MT5 non trovato sul sistema")
        response = messagebox.askyesnocancel(
            "MetaTrader 5 Non Trovato",
            "MetaTrader 5 non è installato.\n\n"
            "Opzioni:\n"
            "• SÌ: Apri sito per scaricare MT5\n"
            "• NO: Continua senza (inserirò il path manualmente)\n"
            "• ANNULLA: Ferma installazione"
        )
        
        if response is True:  # Yes - open download
            webbrowser.open("https://www.metatrader5.com/en/download")
            self.log("🌐 Aperto sito download MT5. Installa MT5 e riavvia questo programma.")
        elif response is False:  # No - continue
            self.log("⚠️ Continuando senza MT5. Bridge funzionerà quando MT5 sarà attivo.")
        else:  # Cancel
            raise Exception("Installazione annullata dall'utente")
            
    def get_user_credentials(self):
        """Get MT5 credentials from user"""
        self.log("👤 Raccogliendo credenziali MT5...")
        
        # Create credential dialog
        cred_window = tk.Toplevel(self.root)
        cred_window.title("Credenziali MT5")
        cred_window.geometry("400x300")
        cred_window.resizable(False, False)
        cred_window.transient(self.root)
        cred_window.grab_set()
        
        # Center on parent
        cred_window.geometry("+%d+%d" % (self.root.winfo_rootx() + 100, 
                                        self.root.winfo_rooty() + 100))
        
        ttk.Label(cred_window, text="Inserisci i tuoi dati MT5:", 
                 font=('Arial', 12, 'bold')).pack(pady=10)
        
        # Form fields
        form_frame = ttk.Frame(cred_window)
        form_frame.pack(fill='both', expand=True, padx=20)
        
        fields = {}
        field_configs = [
            ("login", "Login MT5:", "123456"),
            ("password", "Password:", ""),
            ("server", "Server:", "Demo-Server"),
            ("broker", "Broker:", "MetaQuotes-Demo")
        ]
        
        for i, (key, label, placeholder) in enumerate(field_configs):
            ttk.Label(form_frame, text=label).grid(row=i, column=0, sticky='w', pady=5)
            entry = ttk.Entry(form_frame, width=30)
            entry.grid(row=i, column=1, sticky='ew', pady=5, padx=(10, 0))
            entry.insert(0, placeholder)
            if key == "password":
                entry.config(show="*")
            fields[key] = entry
            
        form_frame.columnconfigure(1, weight=1)
        
        # Buttons
        button_frame = ttk.Frame(cred_window)
        button_frame.pack(fill='x', padx=20, pady=10)
        
        def save_credentials():
            self.user_credentials = {key: field.get() for key, field in fields.items()}
            cred_window.destroy()
            
        def cancel_credentials():
            cred_window.destroy()
            raise Exception("Credenziali non fornite")
            
        ttk.Button(button_frame, text="Salva", command=save_credentials).pack(side='right', padx=5)
        ttk.Button(button_frame, text="Annulla", command=cancel_credentials).pack(side='right')
        
        # Wait for dialog to close
        cred_window.wait_window()
        
        self.log(f"✅ Credenziali salvate per account: {self.user_credentials.get('login', 'N/A')}")
        
    def create_bridge_config(self):
        """Create bridge server configuration"""
        self.log("⚙️ Creando configurazione bridge...")
        
        # Create config directory
        config_dir = Path.home() / ".ai_trading_bot"
        config_dir.mkdir(exist_ok=True)
        
        config = {
            "mt5_path": self.mt5_path,
            "credentials": self.user_credentials,
            "bridge_port": BRIDGE_PORT,
            "web_app_url": WEB_APP_URL,
            "auto_start": True,
            "version": APP_VERSION
        }
        
        config_file = config_dir / "config.json"
        with open(config_file, 'w') as f:
            json.dump(config, f, indent=2)
            
        self.log(f"✅ Configurazione salvata: {config_file}")
        
        # Create bridge server script
        self.create_bridge_server(config_dir)
        
    def create_bridge_server(self, config_dir):
        """Create the bridge server script"""
        bridge_script = f'''
import MetaTrader5 as mt5
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import threading
import time
import os
from pathlib import Path

app = Flask(__name__)
CORS(app)

# Load configuration
config_file = Path.home() / ".ai_trading_bot" / "config.json"
with open(config_file) as f:
    config = json.load(f)

connected = False
account_info = None

def auto_connect_mt5():
    """Automatically connect to MT5 with saved credentials"""
    global connected, account_info
    
    try:
        if not mt5.initialize():
            return False
            
        creds = config.get("credentials", {{}})
        if not mt5.login(login=int(creds["login"]), 
                        password=creds["password"], 
                        server=creds["server"]):
            return False
            
        account_info = mt5.account_info()._asdict()
        connected = True
        return True
        
    except Exception as e:
        print(f"Auto-connect error: {{e}}")
        return False

# Auto-connect on startup
if config.get("auto_start", False):
    threading.Timer(2.0, auto_connect_mt5).start()

@app.route('/')
def status_page():
    return f"""
    <h1>🤖 AI Trading Bot - Bridge Server</h1>
    <p>Status: {{"🟢 Connected" if connected else "🔴 Disconnected"}}</p>
    <p>Port: {BRIDGE_PORT}</p>
    <p>Account: {{account_info.get("login", "N/A") if account_info else "N/A"}}</p>
    <a href="{WEB_APP_URL}" target="_blank">🌐 Open Trading App</a>
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
    return jsonify({{"success": auto_connect_mt5()}})

if __name__ == '__main__':
    print("🚀 AI Trading Bridge Server Starting...")
    print(f"🌐 Status page: http://localhost:{BRIDGE_PORT}")
    print(f"📱 Trading App: {WEB_APP_URL}")
    app.run(host='0.0.0.0', port={BRIDGE_PORT}, debug=False)
'''
        
        bridge_file = config_dir / "bridge_server.py"
        with open(bridge_file, 'w') as f:
            f.write(bridge_script)
            
        self.bridge_script_path = str(bridge_file)
        self.log(f"✅ Bridge server creato: {bridge_file}")
        
    def test_mt5_connection(self):
        """Test MT5 connection"""
        self.log("🧪 Testando connessione MT5...")
        
        try:
            import MetaTrader5 as mt5
            
            if not mt5.initialize():
                raise Exception("MT5 non inizializzato")
                
            # Try to connect with user credentials
            login = int(self.user_credentials["login"])
            password = self.user_credentials["password"]
            server = self.user_credentials["server"]
            
            if mt5.login(login=login, password=password, server=server):
                account = mt5.account_info()
                self.log(f"✅ Connessione MT5 riuscita!")
                self.log(f"   Account: {account.name}")
                self.log(f"   Balance: ${account.balance}")
                self.log(f"   Server: {account.server}")
                mt5.shutdown()
            else:
                error = mt5.last_error()
                self.log(f"⚠️ Login MT5 fallito: {error}")
                
        except Exception as e:
            self.log(f"⚠️ Test connessione: {e}")
            
    def start_bridge(self):
        """Start the bridge server"""
        if self.is_running:
            return
            
        try:
            self.log("🚀 Avviando bridge server...")
            self.bridge_process = subprocess.Popen(
                [sys.executable, self.bridge_script_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            self.is_running = True
            self.start_btn.config(state='disabled')
            self.stop_btn.config(state='normal')
            
            self.update_progress("🟢 Bridge server attivo")
            self.log(f"✅ Bridge server avviato su porta {BRIDGE_PORT}")
            self.log(f"🌐 Status: http://localhost:{BRIDGE_PORT}")
            
            # Auto-open web app
            if messagebox.askyesno("Bridge Attivo", "Aprire l'app di trading nel browser?"):
                self.open_web_app()
                
        except Exception as e:
            self.log(f"❌ Errore avvio bridge: {e}")
            
    def stop_bridge(self):
        """Stop the bridge server"""
        if self.bridge_process:
            self.bridge_process.terminate()
            self.bridge_process = None
            
        self.is_running = False
        self.start_btn.config(state='normal')
        self.stop_btn.config(state='disabled')
        
        self.update_progress("🔴 Bridge server fermato")
        self.log("⏹️ Bridge server fermato")
        
    def open_web_app(self):
        """Open the trading web app"""
        webbrowser.open(WEB_APP_URL)
        self.log(f"🌐 Aperta app trading: {WEB_APP_URL}")
        
    def on_closing(self):
        """Handle window closing"""
        if self.is_running:
            if messagebox.askyesno("Bridge Attivo", 
                                  "Il bridge server è attivo. Vuoi fermarlo e chiudere?"):
                self.stop_bridge()
                self.root.destroy()
        else:
            self.root.destroy()
            
    def run(self):
        """Run the installer"""
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
        self.root.mainloop()

if __name__ == "__main__":
    installer = TradingBotInstaller()
    installer.run()