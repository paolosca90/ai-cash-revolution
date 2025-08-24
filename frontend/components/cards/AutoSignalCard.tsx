import React, { memo, useState, useCallback, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Target, Shield, BarChart, Clock, Zap, Loader2, AlertCircle, CheckCircle2, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface AutoSignal {
  symbol: string;
  direction: "LONG" | "SHORT";
  confidence: number;
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  riskRewardRatio: number;
  strategy: string;
  timeframe: string;
  analysis: {
    rsi: number;
    macd: number;
    trend: string;
    volatility: string;
  };
  timestamp?: string;
  status?: 'pending' | 'executed' | 'closed';
  executionPrice?: number;
  pnl?: number;
}

interface AutoSignalCardProps {
  signal: AutoSignal;
}

const AutoSignalCard: React.FC<AutoSignalCardProps> = ({ signal }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  const isLong = signal.direction === "LONG";
  const confidenceColor = signal.confidence > 85 ? "bg-green-500" : signal.confidence > 75 ? "bg-yellow-500" : "bg-red-500";

  // Detect mobile device
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleTradeNow = () => {
    // Add haptic feedback for mobile
    if (isMobile && navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    navigate('/trade', { state: { selectedSymbol: signal.symbol } });
    
    toast({
      title: "🎯 Signal Selected",
      description: `Opening ${signal.symbol} ${signal.direction} signal`,
    });
  };

  const handleCardPress = useCallback(() => {
    if (isMobile) {
      setIsPressed(true);
      setTimeout(() => setIsPressed(false), 150);
    }
  }, [isMobile]);

  const getSymbolFlag = (symbol: string) => {
    if (symbol.includes("EUR")) return "🇪🇺";
    if (symbol.includes("GBP")) return "🇬🇧";
    if (symbol.includes("USD")) return "🇺🇸";
    if (symbol.includes("JPY")) return "🇯🇵";
    if (symbol === "XAUUSD") return "🥇";
    if (symbol === "US500" || symbol === "SPX500") return "📈";
    if (symbol === "US100" || symbol === "NAS100") return "💻";
    return "📊";
  };

  return (
    <Card 
      className={cn(
        "transition-all duration-300 border-l-4 border-l-primary",
        // Desktop hover effects
        "hover:shadow-lg",
        // Mobile touch effects
        isMobile && "mobile-card touch-target",
        isPressed && "scale-95 bg-muted/30"
      )}
      onTouchStart={handleCardPress}
    >
      <CardHeader className={cn("pb-3", isMobile && "pb-2")}>
        <CardTitle className={cn("flex items-center justify-between", isMobile && "text-base")}>
          <div className="flex items-center gap-2">
            <span className={cn("text-lg", isMobile && "text-base")}>{getSymbolFlag(signal.symbol)}</span>
            <span className={cn("font-bold", isMobile && "text-sm")}>{signal.symbol}</span>
            <Badge variant={isLong ? "default" : "destructive"} className="text-xs">
              {signal.direction}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {isLong ? <TrendingUp className="h-5 w-5 text-green-500" /> : <TrendingDown className="h-5 w-5 text-red-500" />}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-4", isMobile && "space-y-3 px-4 pb-4")}>
        {/* Confidence Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={cn("text-sm font-medium", isMobile && "text-xs")}>AI Confidence</span>
            <span className={cn(
              `font-bold text-sm ${confidenceColor} text-white px-2 py-1 rounded`,
              isMobile && "text-xs px-1.5 py-0.5"
            )}>
              {signal.confidence}%
            </span>
          </div>
          <Progress value={signal.confidence} className={cn("h-2", isMobile && "h-1.5")} />
        </div>

        {/* Price Levels - Mobile optimized layout */}
        <div className={cn("grid gap-3 text-sm", isMobile ? "grid-cols-1 gap-2" : "grid-cols-2")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className={cn("h-3 w-3 text-muted-foreground", isMobile && "h-3 w-3")} />
              <span className={cn(isMobile && "text-xs")}>Entry:</span>
            </div>
            <span className={cn("font-mono text-xs font-bold", isMobile && "text-xs")}>{signal.entryPrice.toFixed(5)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className={cn("h-3 w-3 text-green-600", isMobile && "h-3 w-3")} />
              <span className={cn(isMobile && "text-xs")}>TP:</span>
            </div>
            <span className={cn("font-mono text-xs font-bold text-green-600", isMobile && "text-xs")}>{signal.takeProfit.toFixed(5)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className={cn("h-3 w-3 text-red-600", isMobile && "h-3 w-3")} />
              <span className={cn(isMobile && "text-xs")}>SL:</span>
            </div>
            <span className={cn("font-mono text-xs font-bold text-red-600", isMobile && "text-xs")}>{signal.stopLoss.toFixed(5)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart className={cn("h-3 w-3 text-muted-foreground", isMobile && "h-3 w-3")} />
              <span className={cn(isMobile && "text-xs")}>R/R:</span>
            </div>
            <span className={cn("font-mono text-xs font-bold", isMobile && "text-xs")}>1:{signal.riskRewardRatio.toFixed(2)}</span>
          </div>
        </div>

        {/* Strategy and Analysis - Condensed for mobile */}
        <div className={cn("bg-muted/50 p-3 rounded-lg space-y-2", isMobile && "p-2 space-y-1")}>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">Strategy:</span>
            <Badge variant="outline" className={cn("text-xs", isMobile && "text-xs py-0 px-1 h-5")}>{signal.strategy}</Badge>
          </div>
          {!isMobile && (
            <>
              <div className="flex items-center justify-between text-xs">
                <span>Timeframe:</span>
                <span className="font-mono">{signal.timeframe}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>RSI:</span>
                <span className={`font-mono ${signal.analysis.rsi > 70 ? 'text-red-600' : signal.analysis.rsi < 30 ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {signal.analysis.rsi.toFixed(1)}
                </span>
              </div>
            </>
          )}
          <div className="flex items-center justify-between text-xs">
            <span>Trend:</span>
            <span className="font-medium">{signal.analysis.trend}</span>
          </div>
        </div>

        {/* Action Button - Mobile optimized */}
        <Button 
          onClick={handleTradeNow}
          className={cn(
            "w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
            "active:scale-95 transition-transform",
            isMobile ? "touch-target h-12 text-sm" : "h-9"
          )}
          size={isMobile ? "default" : "sm"}
        >
          <Zap className={cn("h-4 w-4 mr-2", isMobile && "h-5 w-5")} />
          {isMobile ? "Trade Now" : "Genera Segnale Completo"}
        </Button>

        {/* Timestamp - Only on desktop */}
        {!isMobile && (
          <div className="text-xs text-muted-foreground text-center">
            <Clock className="h-3 w-3 inline mr-1" />
            Updated: {new Date().toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AutoSignalCard;
