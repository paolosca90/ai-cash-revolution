#!/usr/bin/env python3
"""
Test script for MT5 connection with provided credentials
"""
import MetaTrader5 as mt5
import sys

def test_mt5_connection():
    """Test MT5 connection with the provided credentials"""
    print("[TEST] Testing MT5 connection...")
    
    # Provided credentials
    login = 67163307
    password = "782789Pao!"
    server = "RoboForex-ECN"
    
    try:
        # Initialize MT5
        print("[INIT] Initializing MetaTrader 5...")
        if not mt5.initialize():
            print(f"[ERROR] MT5 initialize failed: {mt5.last_error()}")
            return False
        
        print("[OK] MT5 initialized successfully")
        
        # Attempt login
        print(f"[LOGIN] Attempting login with account {login} on server {server}...")
        if not mt5.login(login=login, password=password, server=server):
            error = mt5.last_error()
            print(f"[ERROR] Login failed: {error}")
            mt5.shutdown()
            return False
        
        print("[OK] Login successful!")
        
        # Get account information
        print("[INFO] Retrieving account information...")
        account_info = mt5.account_info()
        if account_info is None:
            print("[ERROR] Failed to get account info")
            mt5.shutdown()
            return False
        
        # Display account information
        print("\n[ACCOUNT INFO]")
        print(f"  Login: {account_info.login}")
        print(f"  Name: {account_info.name}")
        print(f"  Server: {account_info.server}")
        print(f"  Balance: ${account_info.balance}")
        print(f"  Currency: {account_info.currency}")
        print(f"  Company: {account_info.company}")
        print(f"  Leverage: 1:{account_info.leverage}")
        
        # Test getting symbols
        print("\n[SYMBOLS] Testing symbol data...")
        symbols = mt5.symbols_get()
        if symbols:
            print(f"  Available symbols: {len(symbols)}")
            print(f"  First 5 symbols: {[s.name for s in symbols[:5]]}")
        else:
            print("  [WARN] No symbols available")
        
        # Test getting market data for EURUSD
        print("\n[MARKET DATA] Testing market data...")
        symbol = "EURUSD"
        symbol_info = mt5.symbol_info(symbol)
        if symbol_info:
            print(f"  {symbol} - Bid: {symbol_info.bid}, Ask: {symbol_info.ask}")
        else:
            print(f"  [WARN] No data for {symbol}")
        
        # Shutdown
        mt5.shutdown()
        print("\n[SUCCESS] All tests passed!")
        return True
        
    except Exception as e:
        print(f"[ERROR] Exception during test: {e}")
        mt5.shutdown()
        return False

if __name__ == "__main__":
    success = test_mt5_connection()
    sys.exit(0 if success else 1)