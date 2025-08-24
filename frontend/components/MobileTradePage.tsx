import React, { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import SignalCard from "./cards/SignalCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TradingStrategy } from "~backend/analysis/trading-strategies";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Sparkles, 
  TrendingUp, 
  Clock, 
  Target, 
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Zap,
  DollarSign,
  Activity,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMobileFeatures } from "../hooks/useMobileFeatures";
import { Input } from "@/components/ui/input";

const popularAssets = [
  { symbol: "BTCUSD", name: "Bitcoin", flag: "₿", category: "Crypto" },
  { symbol: "ETHUSD", name: "Ethereum", flag: "⟠", category: "Crypto" },
  { symbol: "EURUSD", name: "EUR/USD", flag: "🇪🇺", category: "Forex" },
  { symbol: "GBPUSD", name: "GBP/USD", flag: "🇬🇧", category: "Forex" },
  { symbol: "XAUUSD", name: "Gold", flag: "🥇", category: "Commodity" },
  { symbol: "US500", name: "S&P 500", flag: "📈", category: "Index" },
  { symbol: "NAS100", name: "Nasdaq", flag: "💻", category: "Index" },
  { symbol: "US30", name: "Dow Jones", flag: "📊", category: "Index" },
];

const assetCategories = {
  "🔥 Popular": [
    "BTCUSD", "ETHUSD", "EURUSD", "GBPUSD", "XAUUSD", "US500", "NAS100", "US30"
  ],
  "💱 Forex": [
    "EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD",
    "EURGBP", "EURJPY", "GBPJPY", "AUDJPY"
  ],
  "📈 Indices": [
    "US30", "US500", "NAS100", "UK100", "GER40", "FRA40", "JPN225"
  ],
  "🏗️ Commodities": [
    "XAUUSD", "XAGUSD", "CRUDE", "BRENT", "NATGAS"
  ],
  "₿ Crypto": [
    "BTCUSD", "ETHUSD", "LTCUSD", "XRPUSD", "ADAUSD"
  ]
};

const strategies = [
  { value: "auto", name: "🤖 Auto", description: "AI chooses best strategy" },
  { value: TradingStrategy.SCALPING, name: "⚡ Scalp", description: "Quick 1-15min trades" },
  { value: TradingStrategy.INTRADAY, name: "📊 Intraday", description: "1-6 hour positions" },
];

interface MobileTradePageProps {}

const MobileTradePage: React.FC<MobileTradePageProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [symbol, setSymbol] = useState("BTCUSD");
  const [strategy, setStrategy] = useState<TradingStrategy | "auto">("auto");
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("generate");
  
  const backend = useBackend();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { device, vibration } = useMobileFeatures();
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check if a symbol was passed from navigation
  useEffect(() => {
    if (location.state?.selectedSymbol) {
      setSymbol(location.state.selectedSymbol);
    }
  }, [location.state]);

  // Generate signal mutation
  const predictMutation = useMutation({
    mutationFn: () => {
      const strategyParam = strategy === "auto" ? undefined : strategy;
      return backend.analysis.predict({ symbol, strategy: strategyParam });
    },
    onSuccess: (data) => {
      vibration.vibratePattern('success');
      toast({ 
        title: "✅ Signal Generated", 
        description: `${data.direction} signal for ${symbol} (${data.confidence}% confidence)` 
      });
      setActiveTab("signal");
    },
    onError: (err: any) => {
      vibration.vibratePattern('error');
      toast({ 
        variant: "destructive", 
        title: "❌ Error", 
        description: err.message || "Failed to generate signal" 
      });
    },
  });

  // Execute trade mutation
  const executeMutation = useMutation({
    mutationFn: (params: { tradeId: string; lotSize: number }) => {
      return backend.analysis.execute(params);
    },
    onSuccess: (data) => {
      vibration.vibratePattern('success');
      toast({ 
        title: "🚀 Trade Executed", 
        description: `Order ID: ${data.orderId}` 
      });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      setActiveTab("positions");
    },
    onError: (err: any) => {
      vibration.vibratePattern('error');
      toast({ 
        variant: "destructive", 
        title: "❌ Execution Failed", 
        description: err.message 
      });
    },
  });

  // Close position mutation
  const closePositionMutation = useMutation({
    mutationFn: (ticket: number) => {
      return backend.analysis.closePosition({ ticket });
    },
    onSuccess: () => {
      vibration.vibratePattern('light');
      toast({ 
        title: "✅ Position Closed", 
        description: "Position closed successfully" 
      });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
    },
    onError: (err: any) => {
      vibration.vibratePattern('error');
      toast({ 
        variant: "destructive", 
        title: "❌ Close Failed", 
        description: err.message 
      });
    },
  });

  // Positions query
  const { data: positionsData, isLoading: isLoadingPositions } = useQuery({
    queryKey: ["positions"],
    queryFn: () => backend.analysis.listPositions(),
    refetchInterval: 30000,
  });

  // Filter assets based on search
  const filteredAssets = popularAssets.filter(asset =>
    asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedAsset = popularAssets.find(a => a.symbol === symbol) || 
    { symbol, name: symbol, flag: "📊", category: "Other" };

  const handleAssetSelect = (selectedSymbol: string) => {
    setSymbol(selectedSymbol);
    setShowAssetPicker(false);
    setSearchTerm("");
  };

  const handleGenerateSignal = () => {
    vibration.vibratePattern('tap');
    predictMutation.mutate();
  };

  return (
    <div className="space-y-4">
      {/* Mobile Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">AI Trading</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Asset & Strategy Selection */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-primary/20">
        <CardContent className="p-4 space-y-4">
          {/* Asset Selection */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Trading Asset
            </label>
            <Button
              variant="outline"
              className="w-full justify-between touch-target h-12"
              onClick={() => setShowAssetPicker(true)}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{selectedAsset.flag}</span>
                <div className="text-left">
                  <div className="font-semibold">{selectedAsset.symbol}</div>
                  <div className="text-xs text-muted-foreground">{selectedAsset.name}</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Strategy Selection */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Strategy
            </label>
            <div className="flex gap-2">
              {strategies.map((strat) => (
                <Button
                  key={strat.value}
                  variant={strategy === strat.value ? "default" : "outline"}
                  size="sm"
                  className="flex-1 h-12"
                  onClick={() => setStrategy(strat.value as any)}
                >
                  <div className="text-center">
                    <div className="font-semibold text-xs">{strat.name}</div>
                  </div>
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {strategies.find(s => s.value === strategy)?.description}
            </p>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerateSignal}
            disabled={predictMutation.isPending}
            className="w-full touch-target h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {predictMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 mr-2" />
                Generate AI Signal
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 touch-target h-12">
          <TabsTrigger value="generate" className="relative">
            <Target className="h-4 w-4 mr-2" />
            Signal
            {predictMutation.data && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
                1
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="positions" className="relative">
            <Activity className="h-4 w-4 mr-2" />
            Positions
            {positionsData?.positions?.length ? (
              <Badge variant="secondary" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
                {positionsData.positions.length}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        {/* Signal Tab */}
        <TabsContent value="generate" className="space-y-4">
          {predictMutation.isPending && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <h4 className="font-semibold text-blue-800 mb-2">AI Analysis in Progress</h4>
                <p className="text-sm text-blue-700">
                  Analyzing {symbol} with advanced machine learning...
                </p>
              </CardContent>
            </Card>
          )}

          {predictMutation.error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
                <h4 className="font-semibold text-red-800 mb-2">Generation Failed</h4>
                <p className="text-sm text-red-700 mb-4">
                  {predictMutation.error.message}
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleGenerateSignal}
                  className="border-red-300 text-red-700"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {predictMutation.data && (
            <div className="space-y-4">
              <SignalCard
                signal={predictMutation.data}
                onExecute={(tradeId, lotSize) => executeMutation.mutate({ tradeId, lotSize })}
              />
            </div>
          )}

          {!predictMutation.isPending && !predictMutation.error && !predictMutation.data && (
            <Card className="border-dashed border-2">
              <CardContent className="p-6 text-center">
                <Target className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <h4 className="font-semibold mb-2">Ready to Generate</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Select an asset and strategy, then tap "Generate AI Signal"
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="font-semibold">✨ 100+ Assets</p>
                    <p>Forex, Crypto, Indices</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="font-semibold">🎯 AI Powered</p>
                    <p>Machine Learning Analysis</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Positions Tab */}
        <TabsContent value="positions" className="space-y-4">
          {isLoadingPositions ? (
            <Card>
              <CardContent className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading positions...</p>
              </CardContent>
            </Card>
          ) : positionsData?.positions?.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="p-6 text-center">
                <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <h4 className="font-semibold mb-2">No Active Positions</h4>
                <p className="text-sm text-muted-foreground">
                  Your executed trades will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {positionsData?.positions?.map((position: any) => (
                <Card key={position.ticket} className="mobile-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{position.symbol}</span>
                        <Badge 
                          variant={position.type === 0 ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {position.type === 0 ? "BUY" : "SELL"}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => closePositionMutation.mutate(position.ticket)}
                        disabled={closePositionMutation.isPending}
                        className="h-7 px-2 text-xs"
                      >
                        Close
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-muted-foreground">Entry Price</p>
                        <p className="font-mono">{position.openPrice?.toFixed(5) || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Current P&L</p>
                        <p className={cn(
                          "font-mono font-bold",
                          (position.profit || 0) >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          ${position.profit?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Volume</p>
                        <p className="font-mono">{position.volume || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Swap</p>
                        <p className="font-mono">${position.swap?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Asset Picker Modal */}
      {showAssetPicker && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowAssetPicker(false)}
          />
          <div className="fixed inset-4 z-50 bg-background rounded-lg shadow-lg flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Select Asset</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAssetPicker(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Asset List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {(searchTerm ? filteredAssets : popularAssets).map((asset) => (
                <Button
                  key={asset.symbol}
                  variant="outline"
                  className="w-full justify-start touch-target h-12"
                  onClick={() => handleAssetSelect(asset.symbol)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{asset.flag}</span>
                    <div className="text-left">
                      <div className="font-semibold">{asset.symbol}</div>
                      <div className="text-xs text-muted-foreground">{asset.name}</div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {asset.category}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MobileTradePage;