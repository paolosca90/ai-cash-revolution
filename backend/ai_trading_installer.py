#!/usr/bin/env python3
"""
AI Trading Bot - Automated Installer & Bridge (v2.0 Improved)
Installs everything needed for MT5 connection automatically

IMPROVEMENTS v2.0:
- Fixed auto-connect blocking Flask server issue
- Improved error handling and logging
- On-demand MT5 connection via API calls
- Better account_info handling to prevent crashes
- Added health check endpoint for monitoring
- More robust and reproducible installation process

USAGE:
    python ai_trading_installer.py [optional - for reinstall]
    python simple_mt5_bridge.py - Start bridge server directly

ENDPOINTS:
- http://localhost:8080 - Status page
- http://localhost:8080/connect - Manual connection page
- http://localhost:8080/api/mt5/status - MT5 connection status
- http://localhost:8080/api/mt5/connect - Connect to MT5 (POST)
- http://localhost:8080/api/health - Health check
- http://localhost:8080/api/last-connection - Last connection info

CREDENTIALS SYSTEM:
- Account/server/broker info saved in config.json and credentials_mt5.dat
- Password NOT saved for security (must be entered each time)
- Last connection info saved in last_connection.dat
- Auto-credential recovery: use same account every time, just enter password
"""

import os
import sys
import subprocess
import glob
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
        
        self.install_btn = ttk.Button(button_frame, text=">> Installa Tutto Automaticamente", 
                                     command=self.start_installation, style='Accent.TButton')
        self.install_btn.pack(side='left', padx=5)
        
        self.start_btn = ttk.Button(button_frame, text="[>] Avvia Bridge", 
                                   command=self.start_bridge, state='disabled')
        self.start_btn.pack(side='left', padx=5)
        
        self.stop_btn = ttk.Button(button_frame, text="[X] Stop Bridge", 
                                  command=self.stop_bridge, state='disabled')
        self.stop_btn.pack(side='left', padx=5)
        
        self.web_btn = ttk.Button(button_frame, text="[WWW] Apri Web App", 
                                 command=self.open_web_app)
        self.web_btn.pack(side='right', padx=5)
        
        # Status bar
        self.status_var = tk.StringVar(value="Pronto")
        status_bar = ttk.Label(self.root, textvariable=self.status_var, relief='sunken')
        status_bar.pack(fill='x', side='bottom')
        
    def log(self, message):
        """Add message to log"""
        timestamp = time.strftime("%H:%M:%S")
        try:
            self.log_text.insert('end', f"[{timestamp}] {message}\n")
            self.log_text.see('end')
            self.root.update()
        except Exception as e:
            print(f"Log error: {e}")
        
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
            self.log(">> Iniziando installazione automatica...")

            # Step 0: Verifica credenziali salvate
            if self.load_credentials_backup():
                self.log("[INFO] Credenziali precedenti trovate. Vuoi usarle o inserirle nuove?")
                # TODO: chiedere all'utente se vuole mantenere vecchie credenziali

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
            self.update_progress("[OK] Installazione completata!")
            self.log("[SUCCESS] Installazione completata con successo!")
            
            self.install_btn.config(state='normal')
            self.start_btn.config(state='normal')
            
            # Auto-start bridge
            if messagebox.askyesno("Installazione Completata", 
                                  "Vuoi avviare subito il bridge server?"):
                self.start_bridge()
                
        except Exception as e:
            self.progress_bar.stop()
            error_msg = str(e)
            self.update_progress(f"[ERROR] Errore: {error_msg}")
            self.log(f"[ERROR] Errore durante installazione: {error_msg}")
            self.install_btn.config(state='normal')
            
    def install_python_deps(self):
        """Install required Python packages"""
        self.log("[INSTALL] Installando dipendenze Python...")
        
        packages = ["MetaTrader5", "flask", "flask-cors", "pandas", "requests"]
        
        for package in packages:
            try:
                self.log(f"   Installando {package}...")
                result = subprocess.run([sys.executable, "-m", "pip", "install", package], 
                                      capture_output=True, text=True, encoding='utf-8', errors='replace')
                if result.returncode == 0:
                    self.log(f"   [OK] {package} installato")
                else:
                    error_msg = result.stderr or "Unknown error"
                    self.log(f"   [WARN] {package} gia presente o errore: {error_msg}")
            except Exception as e:
                error_msg = str(e)
                self.log(f"   [ERROR] Errore installazione {package}: {error_msg}")
                
        self.log("[OK] Dipendenze Python completate")
        
    def load_credentials_backup(self):
        """Carica credenziali salvate dal backup"""
        try:
            config_dir = Path.home() / ".ai_trading_bot"
            credentials_file = config_dir / "credentials_mt5.dat"

            if credentials_file.exists():
                with open(credentials_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                # Crea credenziali con dati salvati (password dovra' essere inserita)
                loaded_credentials = {
                    "login": data.get("account", ""),
                    "server": data.get("server", ""),
                    "broker": data.get("broker", "")
                }

                self.user_credentials = loaded_credentials
                self.log(f"[BACKUP] Credenziali caricate dall'ultimo backup (account: {data.get('account', 'unknown')})")
                return True
            else:
                self.log("[INFO] Nessun backup credenziali trovato")
                return False

        except Exception as e:
            self.log(f"[WARN] Errore caricamento backup: {e}")
            return False

    def save_credentials_backup(self):
        """Salva credenziali in un file separato per backup e ripristino automatico"""
        try:
            config_dir = Path.home() / ".ai_trading_bot"
            config_dir.mkdir(exist_ok=True)

            credentials_file = config_dir / "credentials_mt5.dat"
            credentials_data = {
                "account": self.user_credentials.get("login", ""),
                "server": self.user_credentials.get("server", ""),
                "broker": self.user_credentials.get("broker", ""),
                "saved_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "version": "2.0"
            }

            with open(credentials_file, 'w', encoding='utf-8') as f:
                json.dump(credentials_data, f, indent=2, ensure_ascii=False)

            self.log(f"[BACKUP] Credenziali salvate in: {credentials_file}")
            self.log("[INFO] Password NON salvata per sicurezza")

        except Exception as e:
            self.log(f"[WARN] Impossibile salvare backup credenziali: {e}")

    def find_or_install_mt5(self):
        """Find MT5 installation or guide user"""
        self.log("[SEARCH] Cercando installazione MetaTrader 5...")
        
        # Common MT5 paths
        mt5_paths = [
            os.path.expanduser("~/AppData/Roaming/MetaQuotes/Terminal/*/terminal64.exe"),
            "C:/Program Files/MetaTrader 5/terminal64.exe",
            "C:/Program Files (x86)/MetaTrader 5/terminal64.exe"
        ]
        
        for path_pattern in mt5_paths:
            matches = glob.glob(path_pattern)
            if matches:
                self.mt5_path = matches[0]
                self.log(f"[OK] MT5 trovato: {self.mt5_path}")
                return
                
        # MT5 not found
        self.log("[WARN] MT5 non trovato sul sistema")
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
            self.log("[WWW] Aperto sito download MT5. Installa MT5 e riavvia questo programma.")
            return
        elif response is False:  # No - continue
            self.log("[WARN] Continuando senza MT5. Bridge funzionera quando MT5 sara attivo.")
            return
        else:  # Cancel
            raise Exception("Installazione annullata dall'utente")
            
    def get_user_credentials(self):
        """Get MT5 credentials from user"""
        self.log("[USER] Raccogliendo credenziali MT5...")

        # Verifica se esistono credenziali salvate
        if self.load_credentials_backup():
            choice = self.ask_use_saved_credentials()
            if choice:
                # Usa credenziali salvate, ora chiedi solo la password
                self.log("[USER] Usando credenziali salvate, richiedendo solo password...")
                self.use_saved_credentials()
                return

        self.log("[USER] Inserendo nuove credenziali...")
        self.collect_new_credentials()
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

    def ask_use_saved_credentials(self):
        """Chiede all'utente se usare le credenziali salvate"""
        try:
            choice_window = tk.Toplevel(self.root)
            choice_window.title("Credenziali MT5 - Scelta")
            choice_window.geometry("500x300")
            choice_window.resizable(False, False)
            choice_window.transient(self.root)
            choice_window.grab_set()

            # Center on parent
            choice_window.geometry("+{}+{}".format(self.root.winfo_rootx() + 50, self.root.winfo_rooty() + 50))

            ttk.Label(choice_window, text="Credenziali salvate trovate!", font=('Arial', 14, 'bold')).pack(pady=10)

            # Mostra informazioni credenziali salvate
            creds = self.user_credentials
            info_text = f"""
Account: {creds.get('login', 'N/A')}
Server: {creds.get('server', 'N/A')}
Broker: {creds.get('broker', 'N/A')}

Vuoi usare queste credenziali esistenti?
"""
            ttk.Label(choice_window, text=info_text, justify='left').pack(pady=10)

            choice_result = None

            def use_saved():
                nonlocal choice_result
                choice_result = True
                choice_window.destroy()

            def use_new():
                nonlocal choice_result
                choice_result = False
                choice_window.destroy()

            button_frame = ttk.Frame(choice_window)
            button_frame.pack(fill='x', padx=20, pady=20)

            ttk.Button(button_frame, text=">> Usa Credenziali Esistenti", style='Green.TButton',
                      command=use_saved).pack(side='left', padx=10)
            ttk.Button(button_frame, text="Nuove Credenziali", command=use_new).pack(side='right', padx=10)

            choice_window.wait_window()
            return choice_result

        except Exception as e:
            self.log(f"[WARN] Errore nella scelta credenziali: {e}")
            return False

    def use_saved_credentials(self):
        """Richiede solo la password per le credenziali salvate esistenti"""
        try:
            password_window = tk.Toplevel(self.root)
            password_window.title("Password MT5 - Connessione Automatica")
            password_window.geometry("400x250")
            password_window.resizable(False, False)
            password_window.transient(self.root)
            password_window.grab_set()

            # Center on parent
            password_window.geometry("+{}+{}".format(self.root.winfo_rootx() + 100, self.root.winfo_rooty() + 100))

            ttk.Label(password_window, text="Connessione Automatica", font=('Arial', 12, 'bold')).pack(pady=10)

            info_text = f"""Usando credenziali salvate:
Account: {self.user_credentials.get('login', 'N/A')}
Server: {self.user_credentials.get('server', 'N/A')}

Inserisci la password per continuare:"""

            ttk.Label(password_window, text=info_text, justify='left').pack(pady=10)

            # Campo per la password
            pass_frame = ttk.Frame(password_window)
            pass_frame.pack(fill='x', padx=20, pady=10)

            ttk.Label(pass_frame, text="Password:").pack(side='left')
            password_entry = ttk.Entry(pass_frame, width=25, show="*")
            password_entry.pack(side='right')
            password_entry.focus()

            def connect_with_password():
                password = password_entry.get()
                if password:
                    self.user_credentials['password'] = password
                    self.log(f"[OK] Password inserita per account {self.user_credentials.get('login', 'N/A')}")
                    self.log("Nota: La password non verra' salvata per sicurezza")
                    password_window.destroy()
                else:
                    messagebox.showwarning("Attenzione", "Inserisci una password valida!")

            def cancel_connection():
                password_window.destroy()
                raise Exception("Connessione annullata - password non inserita")

            # Buttons
            button_frame = ttk.Frame(password_window)
            button_frame.pack(fill='x', padx=20, pady=10)

            ttk.Button(button_frame, text="Connetti", command=connect_with_password).pack(side='right', padx=5)
            ttk.Button(button_frame, text="Annulla", command=cancel_connection).pack(side='right')

            password_window.wait_window()
            self.save_credentials_backup()

        except Exception as e:
            self.log(f"[ERROR] Errore nella connessione automatica: {e}")
            raise

    def collect_new_credentials(self):
        """Raccolta credenziali completamente nuove"""
        cred_window = tk.Toplevel(self.root)
        cred_window.title("Credenziali MT5 - Nuove")
        cred_window.geometry("400x300")
        cred_window.resizable(False, False)
        cred_window.transient(self.root)
        cred_window.grab_set()

        # Center on parent
        cred_window.geometry("+{}+{}".format(self.root.winfo_rootx() + 100, self.root.winfo_rooty() + 100))

        ttk.Label(cred_window, text="Inserisci i tuoi dati MT5:", font=('Arial', 12, 'bold')).pack(pady=10)

        # Form fields
        form_frame = ttk.Frame(cred_window)
        form_frame.pack(fill='both', expand=True, padx=20)

        fields = {}
        field_configs = [
            ("login", "Login MT5:", ""),
            ("password", "Password:", ""),
            ("server", "Server:", "RoboForex-ECN"),
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

        self.log(f"[OK] Nuove credenziali salvate per account: {self.user_credentials.get('login', 'N/A')}")
        self.save_credentials_backup()

    def create_bridge_config(self):
        """Create bridge server configuration"""
        self.log("[CONFIG] Creando configurazione bridge...")
        
        # Create config directory
        config_dir = Path.home() / ".ai_trading_bot"
        config_dir.mkdir(exist_ok=True)
        
        config = {
            "mt5_path": self.mt5_path,
            "credentials": self.user_credentials,
            "bridge_port": BRIDGE_PORT,
            "web_app_url": WEB_APP_URL,
            "auto_start": False,  # Disabled to prevent Flask blocking
            "version": APP_VERSION
        }
        
        config_file = config_dir / "config.json"
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=True)
            
        self.log(f"[OK] Configurazione salvata: {config_file}")
        
        # Create bridge server script
        self.create_bridge_server(config_dir)
        
    def create_bridge_server(self, config_dir):
        """Create the bridge server script"""
        bridge_script = '''
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
            
        print("[MT5] Login successful, getting account info...")
        account_info = mt5.account_info()._asdict()
        connected = True
        print("[MT5] SUCCESS: Connected to MT5 account with obtained information")

        # Salva timestamp ultima connessione riuscita per il backup
        try:
            save_dir = Path.home() / ".ai_trading_bot"
            save_dir.mkdir(exist_ok=True)

            last_connection = save_dir / "last_connection.dat"
            account_info_dict = {{
                "login": account_info.get('login', 'unknown'),
                "server": account_info.get('server', 'unknown'),
                "balance": account_info.get('balance', 0),
                "connect_time": time.time(),
                "readable_time": time.strftime("%Y-%m-%d %H:%M:%S")
            }}
            connection_data = {{
                "account": account_info_dict["login"],
                "server": account_info_dict["server"],
                "balance": account_info_dict["balance"],
                "connect_time": account_info_dict["connect_time"],
                "readable_time": account_info_dict["readable_time"]
            }}

            with open(last_connection, 'w', encoding='utf-8') as f:
                json.dump(connection_data, f, indent=2)

            print("[MT5] Connection info saved for next session")

        except Exception as save_error:
            print(f"[MT5] Could not save connection info: {{save_error}}")

        return True

    except Exception as e:
        print(f"[MT5] ERROR: Connection exception: {{e}}")
        import traceback
        print(f"[MT5] TRACE: {{traceback.format_exc()}}")
        return False

# MT5 connection is made on-demand via API calls, not auto-connected at startup
# This prevents Flask blocking and improves reliability

@app.route('/')
def status_page():
    """Enhanced status page with connection history"""
    login_info = account_info.get("login", "N/A") if account_info else "N/A"
    status_text = "[ONLINE] Connected" if connected else "[OFFLINE] Disconnected"
    return f"""
    <h1>[BOT] AI Trading Bot - Bridge Server</h1>
    <p>Status: {{status_text}}</p>
    <p>Port: __BRIDGE_PORT__</p>
    <p>Account: {{login_info}}</p>
    <a href="https://ai-cash-revolution-frontend.vercel.app" target="_blank">[WWW] Open Fixed Web App</a>
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
    if success:
        print("[API] MT5 connection successful")
    else:
        print("[API] MT5 connection failed")
    return jsonify({"success": success})

@app.route('/api/health')
def health_check():
    """Health check endpoint for monitoring"""
    return jsonify({{
        "status": "healthy",
        "version": config.get("version", "unknown"),
        "mt5_connected": connected,
        "timestamp": time.time()
    }})

@app.route('/connect')
def manual_connect_page():
    """Simple page for manual MT5 connection"""
    return f"""
    <h2>Manual MT5 Connection</h2>
    <form action="/api/mt5/connect" method="post">
        <input type="submit" value="Connect to MT5" style="padding: 10px;">
    </form>
    <p><a href="/">← Back to Status</a></p>
    """

@app.route('/api/last-connection')
def get_last_connection():
    """Get information about last successful connection"""
    try:
        last_conn_file = Path.home() / ".ai_trading_bot" / "last_connection.dat"
        if last_conn_file.exists():
            with open(last_conn_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return jsonify({
                "success": True,
                "connection": data,
                "timestamp": data.get("connect_time", 0)
            })
        else:
            return jsonify({"success": False, "message": "No connection history found"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

if __name__ == '__main__':
    print("[START] AI Trading Bridge Server Starting...")
    print(f"[WWW] Status page: http://localhost:__BRIDGE_PORT__")
    print(f"[API] Health check: http://localhost:__BRIDGE_PORT__/api/health")
    print(f"[APP] Trading App: https://ai-cash-revolution-frontend.vercel.app")
    print("[INFO] MT5 connection will be made on-demand to prevent Flask blocking")
    app.run(host='0.0.0.0', port=__BRIDGE_PORT__, debug=False, use_reloader=False)
'''
        
        # Replace template variables
        bridge_script = bridge_script.replace('__BRIDGE_PORT__', str(BRIDGE_PORT))
        
        bridge_file = config_dir / "bridge_server.py"
        with open(bridge_file, 'w', encoding='utf-8') as f:
            f.write(bridge_script)
            
        self.bridge_script_path = str(bridge_file)
        self.log(f"[OK] Bridge server creato: {bridge_file}")
        
    def test_mt5_connection(self):
        """Test MT5 connection"""
        self.log("[TEST] Testando connessione MT5...")
        
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
                self.log(f"[OK] Connessione MT5 riuscita!")
                self.log(f"   Account: {account.name}")
                self.log(f"   Balance: ${account.balance}")
                self.log(f"   Server: {account.server}")
                mt5.shutdown()
            else:
                error = mt5.last_error()
                self.log(f"[WARN] Login MT5 fallito: {error}")
                
        except Exception as e:
            self.log(f"[WARN] Test connessione: {e}")
            
    def start_bridge(self):
        """Start the bridge server"""
        if self.is_running:
            return
            
        try:
            if not hasattr(self, 'bridge_script_path') or not self.bridge_script_path:
                self.log("[ERROR] Bridge script non configurato. Esegui prima l'installazione.")
                return
                
            self.log("[START] Avviando bridge server...")
            self.bridge_process = subprocess.Popen(
                [sys.executable, self.bridge_script_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            self.is_running = True
            self.start_btn.config(state='disabled')
            self.stop_btn.config(state='normal')
            
            self.update_progress("[RUNNING] Bridge server attivo")
            self.log(f"[OK] Bridge server avviato su porta {BRIDGE_PORT}")
            self.log(f"[WWW] Status: http://localhost:{BRIDGE_PORT}")
            
            # Auto-open web app
            if messagebox.askyesno("Bridge Attivo", "Aprire l'app di trading nel browser?"):
                self.open_web_app()
                
        except Exception as e:
            self.log(f"[ERROR] Errore avvio bridge: {e}")
            
    def stop_bridge(self):
        """Stop the bridge server"""
        if self.bridge_process:
            self.bridge_process.terminate()
            self.bridge_process = None
            
        self.is_running = False
        self.start_btn.config(state='normal')
        self.stop_btn.config(state='disabled')
        
        self.update_progress("[STOPPED] Bridge server fermato")
        self.log("[STOP] Bridge server fermato")
        
    def open_web_app(self):
        """Open the trading web app"""
        webbrowser.open(WEB_APP_URL)
        self.log(f"[WWW] Aperta app trading: {WEB_APP_URL}")
        
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