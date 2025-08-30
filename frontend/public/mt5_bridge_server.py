#!/usr/bin/env python3
"""
MT5 Bridge Server - Ponte tra WebApp e MetaTrader 5
Richiede: pip install MetaTrader5 flask flask-cors pandas
"""

import MetaTrader5 as mt5
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import json
import logging
from datetime import datetime, timedelta
import threading
import time

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Allow requests from frontend

# Global variables
connected = False
account_info = None
last_connection_check = None

def check_mt5_connection():
    """Check if MT5 is connected and update global state"""
    global connected, account_info, last_connection_check
    
    try:
        if not mt5.terminal_info():
            connected = False
            return False
            
        info = mt5.account_info()
        if info:
            account_info = info._asdict()
            connected = True
            last_connection_check = datetime.now()
            return True
        else:
            connected = False
            return False
            
    except Exception as e:
        logger.error(f"Error checking MT5 connection: {e}")
        connected = False
        return False

def periodic_connection_check():
    """Periodically check MT5 connection in background"""
    while True:
        check_mt5_connection()
        time.sleep(30)  # Check every 30 seconds

# Start background connection checker
connection_thread = threading.Thread(target=periodic_connection_check, daemon=True)
connection_thread.start()

@app.route('/api/mt5/status', methods=['GET'])
def mt5_status():
    """Get MT5 terminal status"""
    try:
        terminal_info = mt5.terminal_info()
        if terminal_info is None:
            return jsonify({
                'error': 'MT5 terminal not found or not running',
                'connected': False
            }), 500
            
        return jsonify({
            'connected': True,
            'terminal_info': terminal_info._asdict(),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'connected': False
        }), 500

@app.route('/api/mt5/connect', methods=['POST'])
def mt5_connect():
    """Connect to MT5 with credentials"""
    try:
        data = request.get_json()
        login = data.get('login')
        password = data.get('password') 
        server = data.get('server')
        
        if not all([login, password, server]):
            return jsonify({'error': 'Login, password e server sono richiesti'}), 400
            
        # Initialize MT5
        if not mt5.initialize():
            return jsonify({'error': 'Errore inizializzazione MT5'}), 500
            
        # Try to login
        if not mt5.login(login=int(login), password=password, server=server):
            error_code = mt5.last_error()
            mt5.shutdown()
            return jsonify({
                'error': f'Login fallito: {error_code}'
            }), 401
            
        # Get account info
        account = mt5.account_info()
        if account is None:
            return jsonify({'error': 'Impossibile ottenere info account'}), 500
            
        global connected, account_info
        connected = True
        account_info = account._asdict()
        
        return jsonify({
            'success': True,
            'account': account_info,
            'message': 'Connesso con successo a MT5'
        })
        
    except Exception as e:
        logger.error(f"MT5 connection error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/mt5/account-info', methods=['GET'])
def get_account_info():
    """Get current account information"""
    global account_info, connected
    
    if not connected:
        check_mt5_connection()
        
    if not connected or not account_info:
        return jsonify({'error': 'MT5 non connesso'}), 503
        
    try:
        # Get fresh account info
        fresh_info = mt5.account_info()
        if fresh_info:
            account_info = fresh_info._asdict()
            
        return jsonify({
            'connected': True,
            'account': account_info,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/mt5/quotes', methods=['POST'])
def get_quotes():
    """Get live quotes for symbols"""
    if not connected:
        return jsonify({'error': 'MT5 non connesso'}), 503
        
    try:
        data = request.get_json()
        symbols = data.get('symbols', ['EURUSD', 'GBPUSD', 'USDJPY'])
        
        quotes = {}
        for symbol in symbols:
            tick = mt5.symbol_info_tick(symbol)
            if tick:
                quotes[symbol] = {
                    'bid': tick.bid,
                    'ask': tick.ask,
                    'spread': tick.ask - tick.bid,
                    'time': datetime.fromtimestamp(tick.time).isoformat(),
                    'volume': tick.volume
                }
            else:
                quotes[symbol] = {'error': 'Symbol not available'}
                
        return jsonify({
            'quotes': quotes,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/mt5/history', methods=['POST'])
def get_history():
    """Get historical data"""
    if not connected:
        return jsonify({'error': 'MT5 non connesso'}), 503
        
    try:
        data = request.get_json()
        symbol = data.get('symbol', 'EURUSD')
        timeframe = data.get('timeframe', mt5.TIMEFRAME_H1)
        count = data.get('count', 100)
        
        rates = mt5.copy_rates_from_pos(symbol, timeframe, 0, count)
        
        if rates is None or len(rates) == 0:
            return jsonify({'error': f'No data for {symbol}'}), 404
            
        # Convert to list of dicts
        df = pd.DataFrame(rates)
        df['time'] = pd.to_datetime(df['time'], unit='s')
        
        return jsonify({
            'symbol': symbol,
            'data': df.to_dict('records'),
            'count': len(df)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/mt5/positions', methods=['GET'])
def get_positions():
    """Get open positions"""
    if not connected:
        return jsonify({'error': 'MT5 non connesso'}), 503
        
    try:
        positions = mt5.positions_get()
        if positions is None:
            return jsonify({'positions': []})
            
        positions_list = []
        for pos in positions:
            positions_list.append({
                'ticket': pos.ticket,
                'symbol': pos.symbol,
                'type': 'BUY' if pos.type == 0 else 'SELL',
                'volume': pos.volume,
                'price_open': pos.price_open,
                'price_current': pos.price_current,
                'profit': pos.profit,
                'comment': pos.comment,
                'time': datetime.fromtimestamp(pos.time).isoformat()
            })
            
        return jsonify({
            'positions': positions_list,
            'count': len(positions_list)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/mt5/place-order', methods=['POST'])
def place_order():
    """Place a trading order"""
    if not connected:
        return jsonify({'error': 'MT5 non connesso'}), 503
        
    try:
        data = request.get_json()
        symbol = data.get('symbol')
        action = data.get('action')  # BUY or SELL
        volume = float(data.get('volume', 0.1))
        sl = data.get('sl')  # Stop loss
        tp = data.get('tp')  # Take profit
        
        if not symbol or not action:
            return jsonify({'error': 'Symbol e action richiesti'}), 400
            
        # Prepare order request
        order_type = mt5.ORDER_TYPE_BUY if action.upper() == 'BUY' else mt5.ORDER_TYPE_SELL
        price = mt5.symbol_info_tick(symbol).ask if action.upper() == 'BUY' else mt5.symbol_info_tick(symbol).bid
        
        request_dict = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": symbol,
            "volume": volume,
            "type": order_type,
            "price": price,
            "deviation": 20,
            "magic": 234000,
            "comment": "AI Trading Bot",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }
        
        if sl:
            request_dict["sl"] = float(sl)
        if tp:
            request_dict["tp"] = float(tp)
            
        # Send order
        result = mt5.order_send(request_dict)
        
        if result.retcode != mt5.TRADE_RETCODE_DONE:
            return jsonify({
                'error': f'Order failed: {result.comment}',
                'retcode': result.retcode
            }), 400
            
        return jsonify({
            'success': True,
            'order_ticket': result.order,
            'retcode': result.retcode,
            'comment': result.comment
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'running',
        'mt5_connected': connected,
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("🚀 Starting MT5 Bridge Server...")
    print("📋 Requirements:")
    print("   - MetaTrader 5 must be installed and running")
    print("   - Enable 'Allow automated trading' in MT5")
    print("   - Install: pip install MetaTrader5 flask flask-cors pandas")
    print(f"🌐 Server starting on http://localhost:8080")
    print("✅ Ready to connect to your trading app!")
    
    # Initialize MT5 on startup
    if mt5.initialize():
        print("✅ MT5 initialized successfully")
    else:
        print("⚠️ MT5 not initialized - make sure MT5 is running")
    
    app.run(host='0.0.0.0', port=8080, debug=False)