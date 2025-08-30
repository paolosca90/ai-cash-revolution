import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Target, Shield, BarChart, Clock, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AutoSignal {
  id: string;
  symbol: string;
  action: "BUY" | "SELL";
  direction?: "LONG" | "SHORT";
  confidence: number;
  price: number;
  entryPrice?: number;
  takeProfit?: number;
  stopLoss?: number;
  riskRewardRatio?: number;
  strategy: string;
  timestamp: string;
  createdAt?: string;
}

interface AutoSignalCardProps {
  signal: AutoSignal;
}

const AutoSignalCard: React.FC<AutoSignalCardProps> = ({ signal }) => {
  const navigate = useNavigate();
  // Handle both action and direction properties
  const action = signal.action || (signal.direction === "LONG" ? "BUY" : "SELL");
  const isBuy = action === "BUY";
  // Handle both price and entryPrice properties
  const price = signal.price || signal.entryPrice || 0;
  const confidenceColor = signal.confidence > 85 ? "bg-green-500" : signal.confidence > 75 ? "bg-yellow-500" : "bg-red-500";
  // Handle both timestamp and createdAt properties
  const timestamp = signal.timestamp || signal.createdAt || new Date().toISOString();

  const handleTradeNow = () => {
    navigate('/trade', { state: { selectedSymbol: signal.symbol } });
  };

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
    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getSymbolFlag(signal.symbol)}</span>
            <span className="font-bold">{signal.symbol}</span>
            <Badge variant={isBuy ? "default" : "destructive"} className="text-xs">
              {action}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {isBuy ? <TrendingUp className="h-5 w-5 text-green-500" /> : <TrendingDown className="h-5 w-5 text-red-500" />}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Confidence Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Confidenza AI</span>
            <span className={`font-bold text-sm ${confidenceColor} text-white px-2 py-1 rounded`}>
              {signal.confidence}%
            </span>
          </div>
          <Progress value={signal.confidence} className="h-2" />
        </div>

        {/* Price Levels */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Target className="h-3 w-3 text-muted-foreground" />
            <span>Prezzo:</span>
            <span className="font-mono text-xs">{price.toFixed(5)}</span>
          </div>
          {(signal.takeProfit || signal.takeProfit === 0) && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span>TP:</span>
              <span className="font-mono text-xs">{signal.takeProfit.toFixed(5)}</span>
            </div>
          )}
          {(signal.stopLoss || signal.stopLoss === 0) && (
            <div className="flex items-center gap-2">
              <Shield className="h-3 w-3 text-red-600" />
              <span>SL:</span>
              <span className="font-mono text-xs">{signal.stopLoss.toFixed(5)}</span>
            </div>
          )}
          {signal.riskRewardRatio && (
            <div className="flex items-center gap-2">
              <BarChart className="h-3 w-3 text-muted-foreground" />
              <span>R/R:</span>
              <span className="font-mono text-xs">1:{signal.riskRewardRatio.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Strategy and Analysis */}
        <div className="bg-muted/50 p-3 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">Strategia:</span>
            <Badge variant="outline" className="text-xs">{signal.strategy}</Badge>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span>Ora segnale:</span>
            <span className="font-mono">{new Date(timestamp).toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Action Button */}
        <Button 
          onClick={handleTradeNow}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          size="sm"
        >
          <Zap className="h-4 w-4 mr-2" />
          Genera Segnale Completo
        </Button>

        {/* Timestamp */}
        <div className="text-xs text-muted-foreground text-center">
          <Clock className="h-3 w-3 inline mr-1" />
          Aggiornato: {new Date(timestamp).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoSignalCard;