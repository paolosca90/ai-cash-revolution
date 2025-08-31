// MT5 Bridge Connection Detector
// This handles the connection between the cloud-hosted frontend and local MT5 bridge

export class MT5BridgeDetector {
  private localBridgeUrl = 'http://localhost:8080';
  private connected = false;
  private lastCheck = 0;
  private checkInterval = 30000; // 30 seconds

  async detectLocalBridge(): Promise<{
    available: boolean;
    url?: string;
    account?: any;
    error?: string;
  }> {
    try {
      // Check if we recently verified the connection
      const now = Date.now();
      if (this.connected && (now - this.lastCheck) < this.checkInterval) {
        return { available: true, url: this.localBridgeUrl };
      }

      // Try to connect to local MT5 bridge
      const response = await fetch(`${this.localBridgeUrl}/api/health`, {
        method: 'GET',
        mode: 'cors',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`Bridge server returned ${response.status}`);
      }

      const healthData = await response.json();
      
      // Update connection state
      this.connected = true;
      this.lastCheck = now;

      // Try to get MT5 status
      try {
        const mt5Response = await fetch(`${this.localBridgeUrl}/api/mt5/status`, {
          method: 'GET',
          mode: 'cors',
          signal: AbortSignal.timeout(3000)
        });
        
        if (mt5Response.ok) {
          const mt5Data = await mt5Response.json();
          return {
            available: true,
            url: this.localBridgeUrl,
            account: mt5Data.account,
          };
        }
      } catch (mt5Error) {
        // Bridge is available but MT5 is not connected
        console.warn('MT5 bridge available but MT5 not connected:', mt5Error);
      }

      return {
        available: true,
        url: this.localBridgeUrl,
      };

    } catch (error) {
      this.connected = false;
      
      // Provide specific error messages based on error type
      let errorMessage = 'Local MT5 bridge not available';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Cannot connect to local MT5 bridge. Please ensure the AI Trading Installer is running.';
      } else if (error instanceof DOMException && error.name === 'TimeoutError') {
        errorMessage = 'Connection to local MT5 bridge timed out. Please check if the bridge server is running.';
      } else if (error instanceof Error) {
        errorMessage = `MT5 bridge error: ${error.message}`;
      }

      return {
        available: false,
        error: errorMessage
      };
    }
  }

  async connectToMT5(): Promise<{
    success: boolean;
    account?: any;
    error?: string;
  }> {
    try {
      const bridgeCheck = await this.detectLocalBridge();
      
      if (!bridgeCheck.available) {
        return {
          success: false,
          error: bridgeCheck.error || 'MT5 bridge not available'
        };
      }

      // Try to establish MT5 connection
      const response = await fetch(`${this.localBridgeUrl}/api/mt5/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        signal: AbortSignal.timeout(10000) // 10 second timeout for connection
      });

      if (!response.ok) {
        throw new Error(`MT5 connection failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Get account information
        const statusResponse = await fetch(`${this.localBridgeUrl}/api/mt5/status`);
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          return {
            success: true,
            account: statusData.account
          };
        }
      }

      return {
        success: result.success || false,
        error: result.error || 'Unknown connection error'
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to MT5'
      };
    }
  }

  async getAccountInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.localBridgeUrl}/api/mt5/status`, {
        mode: 'cors',
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Failed to get account info: ${response.status}`);
      }

      const data = await response.json();
      return data.account;

    } catch (error) {
      console.error('Failed to get MT5 account info:', error);
      return null;
    }
  }

  async executeOrder(orderData: {
    symbol: string;
    action: 'BUY' | 'SELL';
    volume: number;
    sl?: number;
    tp?: number;
    comment?: string;
  }): Promise<{
    success: boolean;
    order?: any;
    error?: string;
  }> {
    try {
      const bridgeCheck = await this.detectLocalBridge();
      
      if (!bridgeCheck.available) {
        return {
          success: false,
          error: 'MT5 bridge not available for trading'
        };
      }

      const response = await fetch(`${this.localBridgeUrl}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify(orderData),
        signal: AbortSignal.timeout(15000) // 15 second timeout for order execution
      });

      if (!response.ok) {
        throw new Error(`Order execution failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Order execution failed'
      };
    }
  }

  // Get user-friendly instructions for setting up MT5 bridge
  getSetupInstructions(): string[] {
    return [
      '1. Download and run the AI Trading Installer (ai_trading_installer.py)',
      '2. Complete the automatic installation process',
      '3. Start the MT5 bridge server using the installer',
      '4. Ensure MetaTrader 5 is running and logged in',
      '5. Refresh this page to detect the connection'
    ];
  }
}

// Export singleton instance
export const mt5Bridge = new MT5BridgeDetector();