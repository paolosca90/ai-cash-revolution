/**
 * Advanced Signal Card Component v3.0
 * Visualizza segnali di trading avanzati con tutte le analisi integrate:
 * Smart Money, Price Action, Volume, Neural Networks, News Impact, Risk Management
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  Shield, 
  DollarSign, 
  Clock, 
  Target,
  AlertTriangle,
  Info,
  BarChart3,
  Volume2,
  Newspaper,
  Zap,
  Settings,
  CheckCircle,
  XCircle
} from 'lucide-react';

// === INTERFACCE ===

interface AdvancedTradingSignal {
  id: string;
  symbol: string;
  timeframe: string;
  action: "BUY" | "SELL" | "HOLD";
  
  // Prezzi e target
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskRewardRatio: number;
  
  // Confidence e analisi
  confidence: number;
  maxConfidence: number;
  strategy: string;
  
  // Smart Money Analysis
  smartMoneyAlignment: number;
  institutionalBias: "BULLISH" | "BEARISH" | "NEUTRAL";
  orderBlockConfirmation: boolean;
  liquidityZoneProximity: number;
  
  // Price Action Multi-Timeframe
  priceActionScore: number;
  trendAlignment: "ALIGNED" | "DIVERGENT" | "NEUTRAL";
  structureBreak: boolean;
  keyLevelInteraction: "SUPPORT" | "RESISTANCE" | "BREAKOUT" | "NONE";
  
  // Volume Analysis
  volumeProfile: {
    strength: "HIGH" | "MODERATE" | "LOW";
    accumulation: boolean;
    distribution: boolean;
    breakoutVolume: boolean;
  };
  
  // Neural Network Analysis
  neuralNetworkPrediction: {
    priceDirection: "UP" | "DOWN" | "SIDEWAYS";
    confidence: number;
    patternRecognition: string[];
    marketRegime: "TRENDING" | "RANGING" | "VOLATILE";
  };
  
  // News & Sentiment
  newsImpact: {
    overall: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
    score: number;
    events: string[];
    volatilityExpected: boolean;
  };
  
  // Risk Management
  positionSizing: {
    recommendedLotSize: number;
    riskPercentage: number;
    maxDrawdown: number;
    kellyCriterion: number;
  };
  
  // Timing
  timestamp: Date;
  validUntil: Date;
  sessionQuality: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
  
  // Metadata
  backtestResults: {
    winRate: number;
    avgWin: number;
    avgLoss: number;
    profitFactor: number;
  };
  
  recommendations: string[];
  warnings: string[];
}

interface AdvancedSignalCardProps {
  signal: AdvancedTradingSignal;
  onExecute?: (signal: AdvancedTradingSignal) => void;
  onDismiss?: (signalId: string) => void;
  accountBalance?: number;
  autoTradeEnabled?: boolean;
}

// === COMPONENT PRINCIPALE ===

const AdvancedSignalCard: React.FC<AdvancedSignalCardProps> = ({
  signal,
  onExecute,
  onDismiss,
  accountBalance = 10000,
  autoTradeEnabled = false
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Calcolo tempo rimanente
  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const validUntil = new Date(signal.validUntil);
      const diff = validUntil.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining("Scaduto");
        return;
      }
      
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    
    return () => clearInterval(interval);
  }, [signal.validUntil]);

  // Handlers
  const handleExecute = async () => {
    if (!onExecute) return;
    
    setIsExecuting(true);
    try {
      await onExecute(signal);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss(signal.id);
    }
  };

  // Utility functions
  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY': return 'text-green-600 bg-green-100';
      case 'SELL': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSessionQualityColor = (quality: string) => {
    switch (quality) {
      case 'EXCELLENT': return 'text-green-600 bg-green-100';
      case 'GOOD': return 'text-blue-600 bg-blue-100';
      case 'FAIR': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-red-600 bg-red-100';
    }
  };

  const formatPrice = (price: number) => {
    return price.toFixed(signal.symbol.includes('JPY') ? 3 : 5);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getActionIcon = (action: string) => {
    return action === 'BUY' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />;
  };

  return (
    <Card className={`w-full max-w-4xl mx-auto shadow-lg transition-all duration-300 hover:shadow-xl ${
      signal.action !== 'HOLD' ? 'border-l-4' : ''
    } ${
      signal.action === 'BUY' ? 'border-l-green-500' : 
      signal.action === 'SELL' ? 'border-l-red-500' : ''
    }`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Badge 
              variant="outline" 
              className={`px-3 py-1 font-semibold ${getActionColor(signal.action)}`}
            >
              {getActionIcon(signal.action)}
              {signal.action}
            </Badge>
            <h3 className="text-xl font-bold">{signal.symbol}</h3>
            <Badge variant="secondary">{signal.timeframe}</Badge>
            <Badge 
              variant="outline"
              className={getSessionQualityColor(signal.sessionQuality)}
            >
              {signal.sessionQuality}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className={`text-lg font-bold ${getConfidenceColor(signal.confidence)}`}>
                {signal.confidence}%
              </div>
              <div className="text-xs text-gray-500">Confidenza</div>
            </div>
            
            <div className="text-right">
              <div className="text-lg font-bold text-blue-600">
                {timeRemaining}
              </div>
              <div className="text-xs text-gray-500">Scadenza</div>
            </div>
          </div>
        </div>
        
        {/* Progress Bar Confidence */}
        <div className="mt-3">
          <Progress 
            value={(signal.confidence / signal.maxConfidence) * 100} 
            className="h-2"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Sezione Prezzi Principale */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Entry</div>
            <div className="text-lg font-bold">{formatPrice(signal.entryPrice)}</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-sm text-gray-600">Stop Loss</div>
            <div className="text-lg font-bold text-red-600">{formatPrice(signal.stopLoss)}</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-sm text-gray-600">Take Profit</div>
            <div className="text-lg font-bold text-green-600">{formatPrice(signal.takeProfit)}</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-600">Risk/Reward</div>
            <div className="text-lg font-bold text-blue-600">1:{signal.riskRewardRatio.toFixed(1)}</div>
          </div>
        </div>

        {/* Tabs per Analisi Dettagliate */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="smart-money">Smart Money</TabsTrigger>
            <TabsTrigger value="neural">Neural AI</TabsTrigger>
            <TabsTrigger value="risk">Risk</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Tab Overview */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold">Price Action Score:</span>
                  <Badge variant={signal.priceActionScore > 70 ? "default" : "secondary"}>
                    {signal.priceActionScore}%
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold">Trend Alignment:</span>
                  <Badge 
                    variant={signal.trendAlignment === "ALIGNED" ? "default" : "secondary"}
                  >
                    {signal.trendAlignment}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4 text-orange-600" />
                  <span className="font-semibold">Volume Strength:</span>
                  <Badge variant={signal.volumeProfile.strength === "HIGH" ? "default" : "secondary"}>
                    {signal.volumeProfile.strength}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-yellow-600" />
                  <span className="font-semibold">Structure Break:</span>
                  {signal.structureBreak ? 
                    <CheckCircle className="w-4 h-4 text-green-600" /> : 
                    <XCircle className="w-4 h-4 text-red-600" />
                  }
                </div>
                
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-gray-600" />
                  <span className="font-semibold">Strategy:</span>
                  <Badge variant="outline">{signal.strategy}</Badge>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold">Key Level:</span>
                  <Badge variant="secondary">{signal.keyLevelInteraction}</Badge>
                </div>
              </div>
            </div>
            
            {/* Raccomandazioni */}
            {signal.recommendations.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <Info className="w-4 h-4 mr-2" />
                  Raccomandazioni
                </h4>
                <ul className="space-y-1">
                  {signal.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-blue-700">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Warnings */}
            {signal.warnings.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Avvertenze
                </h4>
                <ul className="space-y-1">
                  {signal.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-yellow-700">⚠️ {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>

          {/* Tab Smart Money */}
          <TabsContent value="smart-money" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Smart Money Analysis</h4>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Smart Money Alignment</span>
                      <span className="text-sm font-bold">{signal.smartMoneyAlignment}%</span>
                    </div>
                    <Progress value={signal.smartMoneyAlignment} className="h-2 mt-1" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Liquidity Zone Proximity</span>
                      <span className="text-sm font-bold">{signal.liquidityZoneProximity}%</span>
                    </div>
                    <Progress value={signal.liquidityZoneProximity} className="h-2 mt-1" />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Institutional Bias:</span>
                  <Badge 
                    variant={
                      signal.institutionalBias === "BULLISH" ? "default" :
                      signal.institutionalBias === "BEARISH" ? "destructive" : "secondary"
                    }
                  >
                    {signal.institutionalBias}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Order Block Confirmation:</span>
                  {signal.orderBlockConfirmation ? 
                    <CheckCircle className="w-5 h-5 text-green-600" /> : 
                    <XCircle className="w-5 h-5 text-red-600" />
                  }
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Volume Analysis</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Accumulation</span>
                    {signal.volumeProfile.accumulation ? 
                      <CheckCircle className="w-4 h-4 text-green-600" /> : 
                      <XCircle className="w-4 h-4 text-gray-400" />
                    }
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Distribution</span>
                    {signal.volumeProfile.distribution ? 
                      <CheckCircle className="w-4 h-4 text-red-600" /> : 
                      <XCircle className="w-4 h-4 text-gray-400" />
                    }
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Breakout Volume</span>
                    {signal.volumeProfile.breakoutVolume ? 
                      <CheckCircle className="w-4 h-4 text-blue-600" /> : 
                      <XCircle className="w-4 h-4 text-gray-400" />
                    }
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab Neural Network */}
          <TabsContent value="neural" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-lg">Neural Network Prediction</h4>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">Direction:</span>
                    <Badge 
                      variant={
                        signal.neuralNetworkPrediction.priceDirection === "UP" ? "default" :
                        signal.neuralNetworkPrediction.priceDirection === "DOWN" ? "destructive" : "secondary"
                      }
                    >
                      {signal.neuralNetworkPrediction.priceDirection}
                    </Badge>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">NN Confidence</span>
                      <span className="text-sm font-bold">{signal.neuralNetworkPrediction.confidence}%</span>
                    </div>
                    <Progress value={signal.neuralNetworkPrediction.confidence} className="h-2 mt-1" />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">Market Regime:</span>
                    <Badge variant="outline">{signal.neuralNetworkPrediction.marketRegime}</Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Pattern Recognition</h4>
                <div className="space-y-2">
                  {signal.neuralNetworkPrediction.patternRecognition.length > 0 ? (
                    signal.neuralNetworkPrediction.patternRecognition.map((pattern, index) => (
                      <Badge key={index} variant="secondary" className="mr-2 mb-2">
                        {pattern}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Nessun pattern rilevato</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab Risk Management */}
          <TabsContent value="risk" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-lg">Position Sizing</h4>
                </div>
                
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600">Recommended Lot Size</div>
                    <div className="text-lg font-bold">{signal.positionSizing.recommendedLotSize} lots</div>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="text-sm text-gray-600">Risk Percentage</div>
                    <div className="text-lg font-bold">{signal.positionSizing.riskPercentage}%</div>
                  </div>
                  
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="text-sm text-gray-600">Max Drawdown</div>
                    <div className="text-lg font-bold">{signal.positionSizing.maxDrawdown.toFixed(2)}%</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Risk Calculation</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Kelly Criterion</span>
                    <span className="text-sm font-bold">{(signal.positionSizing.kellyCriterion * 100).toFixed(1)}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Risk Amount</span>
                    <span className="text-sm font-bold">
                      {formatCurrency(accountBalance * signal.positionSizing.riskPercentage / 100)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Potential Profit</span>
                    <span className="text-sm font-bold text-green-600">
                      {formatCurrency(accountBalance * signal.positionSizing.riskPercentage / 100 * signal.riskRewardRatio)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab News */}
          <TabsContent value="news" className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Newspaper className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-lg">News Impact Analysis</h4>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Overall Sentiment:</span>
                  <Badge 
                    variant={
                      signal.newsImpact.overall === "POSITIVE" ? "default" :
                      signal.newsImpact.overall === "NEGATIVE" ? "destructive" : "secondary"
                    }
                  >
                    {signal.newsImpact.overall}
                  </Badge>
                </div>
                
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Impact Score</span>
                    <span className="text-sm font-bold">{signal.newsImpact.score}/100</span>
                  </div>
                  <Progress value={signal.newsImpact.score} className="h-2 mt-1" />
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">High Volatility Expected:</span>
                  {signal.newsImpact.volatilityExpected ? 
                    <AlertTriangle className="w-5 h-5 text-yellow-600" /> : 
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  }
                </div>
              </div>
              
              <div className="space-y-4">
                <h5 className="font-semibold">Recent News Events</h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {signal.newsImpact.events.length > 0 ? (
                    signal.newsImpact.events.map((event, index) => (
                      <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                        {event}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Nessun evento significativo</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab Performance */}
          <TabsContent value="performance" className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-lg">Backtest Results</h4>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-600">Win Rate</div>
                <div className="text-2xl font-bold text-green-600">
                  {(signal.backtestResults.winRate * 100).toFixed(1)}%
                </div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600">Avg Win</div>
                <div className="text-2xl font-bold text-blue-600">
                  {signal.backtestResults.avgWin.toFixed(2)}x
                </div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-sm text-gray-600">Avg Loss</div>
                <div className="text-2xl font-bold text-red-600">
                  {signal.backtestResults.avgLoss.toFixed(2)}x
                </div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-gray-600">Profit Factor</div>
                <div className="text-2xl font-bold text-purple-600">
                  {signal.backtestResults.profitFactor.toFixed(2)}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Pulsanti Azione */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button 
            onClick={handleExecute}
            disabled={isExecuting || signal.action === 'HOLD' || timeRemaining === "Scaduto"}
            className="flex-1"
            size="lg"
          >
            {isExecuting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Esecuzione...
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4 mr-2" />
                Esegui Trade ({signal.positionSizing.recommendedLotSize} lots)
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleDismiss}
            className="sm:w-auto"
          >
            Ignora
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => setShowDetails(!showDetails)}
            className="sm:w-auto"
          >
            <Info className="w-4 h-4 mr-2" />
            {showDetails ? 'Nascondi' : 'Dettagli'}
          </Button>
        </div>
        
        {/* Auto Trade Status */}
        {autoTradeEnabled && (
          <div className="flex items-center justify-center p-3 bg-blue-50 rounded-lg border">
            <Zap className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-700">
              Auto-trading attivo - Il trade verrà eseguito automaticamente
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedSignalCard;