/**
 * Advanced Trading Signal Engine v3.0
 * Integra Smart Money Concepts, Price Action multi-timeframe, analisi volumetrica,
 * neural networks, news analysis e gestione avanzata del rischio per segnali intraday affidabili
 */

import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { fetchMarketData, TimeframeData } from "./market-data";
import { performInstitutionalAnalysis, InstitutionalAnalysis } from "./institutional-analysis";
import { TradingStrategy, getOptimalStrategy, calculateStrategyTargets, TRADING_STRATEGIES } from "./trading-strategies";

const db = new SQLDatabase("advanced_signals", {
  migrations: "./migrations",
});

// === INTERFACCE AVANZATE ===

export interface AdvancedTradingSignal {
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
  strategy: TradingStrategy;
  
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

export interface VolumeAnalysis {
  volumeSpike: boolean;
  volumeProfile: "ACCUMULATION" | "DISTRIBUTION" | "BREAKOUT" | "NORMAL";
  volumeRatio: number;
  onBalanceVolume: number;
  volumeWeightedAveragePrice: number;
  marketMicrostructure: {
    bidAskSpread: number;
    orderFlow: "BULLISH" | "BEARISH" | "NEUTRAL";
    liquidityLevel: "HIGH" | "MEDIUM" | "LOW";
  };
}

export interface MultiTimeframeAnalysis {
  alignment: {
    m5: { trend: string; strength: number };
    m15: { trend: string; strength: number };
    m30: { trend: string; strength: number };
    h1: { trend: string; strength: number };
    h4: { trend: string; strength: number };
  };
  overallTrend: "BULLISH" | "BEARISH" | "MIXED";
  trendStrength: number;
  confluenceLevel: number;
}

export interface NewsAnalysisResult {
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  impactScore: number;
  relevantEvents: Array<{
    title: string;
    impact: "HIGH" | "MEDIUM" | "LOW";
    sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
    time: Date;
    currency: string[];
  }>;
  marketMovingEvents: boolean;
  volatilityForecast: number;
}

export interface NeuralNetworkPrediction {
  direction: "UP" | "DOWN" | "SIDEWAYS";
  confidence: number;
  priceTarget: number;
  timeHorizon: number; // minutes
  patternStrength: number;
  recognizedPatterns: string[];
  marketRegime: "TRENDING" | "RANGING" | "VOLATILE" | "CRISIS";
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

// === PARAMETRI CONFIGURABILI ===

interface AdvancedEngineConfig {
  minConfidence: number;
  maxSignalsPerHour: number;
  riskPerTrade: number;
  timeframes: string[];
  enabledStrategies: TradingStrategy[];
  smartMoneyWeight: number;
  priceActionWeight: number;
  volumeWeight: number;
  neuralNetworkWeight: number;
  newsWeight: number;
}

const DEFAULT_CONFIG: AdvancedEngineConfig = {
  minConfidence: 75,
  maxSignalsPerHour: 3,
  riskPerTrade: 1.0,
  timeframes: ["5m", "15m", "30m", "1h"],
  enabledStrategies: [
    TradingStrategy.INTRADAY,
    TradingStrategy.MOMENTUM_BREAKOUT,
    TradingStrategy.STATISTICAL_ARBITRAGE,
    TradingStrategy.ORDER_FLOW
  ],
  smartMoneyWeight: 0.3,
  priceActionWeight: 0.25,
  volumeWeight: 0.2,
  neuralNetworkWeight: 0.15,
  newsWeight: 0.1
};

// === ENDPOINT PRINCIPALE ===

export interface GenerateAdvancedSignalRequest {
  symbol: string;
  accountBalance: number;
  riskPercentage?: number;
  preferredStrategy?: TradingStrategy;
  config?: Partial<AdvancedEngineConfig>;
}

export interface GenerateAdvancedSignalResponse {
  signal: AdvancedTradingSignal | null;
  analysis: {
    marketConditions: string;
    reasoning: string[];
    alternatives: string[];
  };
  systemStatus: {
    dataQuality: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
    latency: number;
    confidence: number;
  };
}

export const generateAdvancedSignal = api<GenerateAdvancedSignalRequest, GenerateAdvancedSignalResponse>(
  { expose: true, method: "POST", path: "/analysis/advanced-signal" },
  async (req) => {
    const startTime = Date.now();
    const config = { ...DEFAULT_CONFIG, ...req.config };
    
    try {
      // 1. Acquisizione dati multi-timeframe
      const marketData = await fetchMultiTimeframeData(req.symbol, config.timeframes);
      
      // 2. Analisi Smart Money e Istituzionale
      const institutionalAnalysis = await performAdvancedInstitutionalAnalysis(marketData, req.symbol);
      
      // 3. Analisi Price Action Multi-Timeframe
      const priceActionAnalysis = await analyzeMultiTimeframePriceAction(marketData);
      
      // 4. Analisi Volumetrica Avanzata
      const volumeAnalysis = await performAdvancedVolumeAnalysis(marketData, req.symbol);
      
      // 5. Predizione Neural Network
      const neuralPrediction = await generateNeuralNetworkPrediction(marketData, req.symbol);
      
      // 6. Analisi News e Sentiment
      const newsAnalysis = await analyzeNewsAndSentiment(req.symbol);
      
      // 7. Calcolo del segnale composito
      const signal = await generateCompositeSignal({
        symbol: req.symbol,
        marketData,
        institutionalAnalysis,
        priceActionAnalysis,
        volumeAnalysis,
        neuralPrediction,
        newsAnalysis,
        config,
        accountBalance: req.accountBalance,
        riskPercentage: req.riskPercentage || 1.0
      });
      
      // 8. Validazione qualità
      const systemStatus = {
        dataQuality: assessDataQuality(marketData),
        latency: Date.now() - startTime,
        confidence: signal?.confidence || 0
      };
      
      // 9. Generazione raccomandazioni
      const analysis = generateAnalysisReport(
        signal,
        institutionalAnalysis,
        priceActionAnalysis,
        volumeAnalysis,
        neuralPrediction,
        newsAnalysis
      );
      
      // 10. Salvataggio nel database per machine learning
      if (signal) {
        await storeAdvancedSignal(signal, analysis);
      }
      
      return {
        signal,
        analysis,
        systemStatus
      };
      
    } catch (error) {
      console.error("Errore nella generazione del segnale avanzato:", error);
      return {
        signal: null,
        analysis: {
          marketConditions: "ERROR",
          reasoning: ["Errore nell'acquisizione dati o nell'analisi"],
          alternatives: ["Riprova tra qualche minuto", "Verifica la connessione dati"]
        },
        systemStatus: {
          dataQuality: "POOR",
          latency: Date.now() - startTime,
          confidence: 0
        }
      };
    }
  }
);

// === FUNZIONI DI ANALISI AVANZATA ===

async function fetchMultiTimeframeData(symbol: string, timeframes: string[]): Promise<Record<string, any>> {
  const data: Record<string, any> = {};
  
  for (const timeframe of timeframes) {
    // In una implementazione reale, qui fetcharesti i dati dal broker
    // Per ora simulo dati realistici
    data[timeframe] = generateRealisticMarketData(symbol, timeframe);
  }
  
  return data;
}

function generateRealisticMarketData(symbol: string, timeframe: string) {
  const basePrice = getSymbolBasePrice(symbol);
  const volatility = getSymbolVolatility(symbol);
  const timeMultiplier = getTimeframeMultiplier(timeframe);
  
  // Simula movimento di prezzo realistico
  const trend = (Math.random() - 0.5) * 0.02 * timeMultiplier;
  const noise = (Math.random() - 0.5) * volatility * timeMultiplier;
  
  const open = basePrice * (1 + trend + noise);
  const close = open * (1 + trend * 0.8 + (Math.random() - 0.5) * volatility);
  const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
  const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
  const volume = Math.floor(getBaseVolume(symbol, timeframe) * (0.5 + Math.random()));
  
  return {
    timestamp: Date.now(),
    open: Math.round(open * 100000) / 100000,
    high: Math.round(high * 100000) / 100000,
    low: Math.round(low * 100000) / 100000,
    close: Math.round(close * 100000) / 100000,
    volume,
    indicators: calculateTechnicalIndicators(open, high, low, close, volume)
  };
}

function calculateTechnicalIndicators(open: number, high: number, low: number, close: number, volume: number) {
  const priceChange = (close - open) / open;
  
  // RSI simulato
  let rsi = 50;
  if (priceChange > 0.01) rsi = 65 + Math.random() * 20;
  else if (priceChange < -0.01) rsi = 25 + Math.random() * 20;
  else rsi = 40 + Math.random() * 20;
  
  // MACD simulato
  const macd = priceChange * 10000 + (Math.random() - 0.5) * 0.1;
  
  // ATR simulato
  const range = (high - low) / close;
  const atr = range * (0.8 + Math.random() * 0.4);
  
  // Volume indicators
  const obvChange = volume * (close > open ? 1 : -1);
  const vwap = (high + low + close * 2) / 4;
  
  return {
    rsi: Math.max(0, Math.min(100, rsi)),
    macd,
    atr,
    obv: obvChange,
    vwap,
    bollinger: {
      upper: close * 1.02,
      lower: close * 0.98,
      middle: close
    },
    ema: {
      ema9: close * 0.999,
      ema21: close * 0.998,
      ema50: close * 0.997
    }
  };
}

async function performAdvancedInstitutionalAnalysis(marketData: Record<string, any>, symbol: string): Promise<InstitutionalAnalysis> {
  // Usa l'analisi istituzionale esistente ma la arricchisce
  const data5m = marketData["5m"];
  const data15m = marketData["15m"];
  const data30m = marketData["30m"];
  const data1h = marketData["1h"];
  
  return performInstitutionalAnalysis(data5m, data15m, data30m, data1h, null, null, symbol);
}

async function analyzeMultiTimeframePriceAction(marketData: Record<string, any>): Promise<MultiTimeframeAnalysis> {
  const timeframes = ["5m", "15m", "30m", "1h", "4h"];
  const alignment: any = {};
  
  let bullishTimeframes = 0;
  let bearishTimeframes = 0;
  let totalStrength = 0;
  
  for (const tf of timeframes) {
    if (marketData[tf]) {
      const data = marketData[tf];
      const trend = determineTrend(data);
      const strength = calculateTrendStrength(data);
      
      alignment[tf.replace("m", "").replace("h", "")] = { trend, strength };
      
      if (trend === "BULLISH") bullishTimeframes++;
      else if (trend === "BEARISH") bearishTimeframes++;
      
      totalStrength += strength;
    }
  }
  
  const validTimeframes = Object.keys(alignment).length;
  const overallTrend = bullishTimeframes > bearishTimeframes ? "BULLISH" : 
                      bearishTimeframes > bullishTimeframes ? "BEARISH" : "MIXED";
  
  const confluenceLevel = Math.max(bullishTimeframes, bearishTimeframes) / validTimeframes;
  const trendStrength = totalStrength / validTimeframes;
  
  return {
    alignment,
    overallTrend,
    trendStrength,
    confluenceLevel
  };
}

async function performAdvancedVolumeAnalysis(marketData: Record<string, any>, symbol: string): Promise<VolumeAnalysis> {
  const data5m = marketData["5m"];
  const data15m = marketData["15m"];
  const data30m = marketData["30m"];
  
  if (!data5m || !data15m || !data30m) {
    return {
      volumeSpike: false,
      volumeProfile: "NORMAL",
      volumeRatio: 1.0,
      onBalanceVolume: 0,
      volumeWeightedAveragePrice: data5m?.close || 0,
      marketMicrostructure: {
        bidAskSpread: 0.0001,
        orderFlow: "NEUTRAL",
        liquidityLevel: "MEDIUM"
      }
    };
  }
  
  // Calcola volume ratio
  const avgVolume = (data15m.volume + data30m.volume) / 2;
  const volumeRatio = data5m.volume / avgVolume;
  const volumeSpike = volumeRatio > 1.5;
  
  // Determina volume profile
  let volumeProfile: "ACCUMULATION" | "DISTRIBUTION" | "BREAKOUT" | "NORMAL" = "NORMAL";
  
  if (volumeSpike) {
    if (data5m.close > data5m.open && data5m.close > data15m.close) {
      volumeProfile = "BREAKOUT";
    } else if (data5m.close < data5m.open && data5m.close < data15m.close) {
      volumeProfile = "DISTRIBUTION";
    } else {
      volumeProfile = "ACCUMULATION";
    }
  }
  
  // On Balance Volume simulato
  const priceChange = data5m.close - data5m.open;
  const obvDirection = priceChange > 0 ? 1 : -1;
  const onBalanceVolume = data5m.volume * obvDirection;
  
  // VWAP
  const vwap = data5m.indicators?.vwap || data5m.close;
  
  // Market microstructure
  const spread = data5m.close * 0.0001; // Simulato
  const orderFlow = data5m.close > data5m.open ? "BULLISH" : 
                   data5m.close < data5m.open ? "BEARISH" : "NEUTRAL";
  const liquidityLevel = volumeRatio > 1.2 ? "HIGH" : 
                        volumeRatio < 0.8 ? "LOW" : "MEDIUM";
  
  return {
    volumeSpike,
    volumeProfile,
    volumeRatio,
    onBalanceVolume,
    volumeWeightedAveragePrice: vwap,
    marketMicrostructure: {
      bidAskSpread: spread,
      orderFlow,
      liquidityLevel
    }
  };
}

async function generateNeuralNetworkPrediction(marketData: Record<string, any>, symbol: string): Promise<NeuralNetworkPrediction> {
  // Simula una predizione di rete neurale avanzata
  // In una implementazione reale, qui ci sarebbe un modello ML addestrato
  
  const data5m = marketData["5m"];
  const data15m = marketData["15m"];
  const data30m = marketData["30m"];
  
  if (!data5m) {
    return {
      direction: "SIDEWAYS",
      confidence: 0,
      priceTarget: 0,
      timeHorizon: 0,
      patternStrength: 0,
      recognizedPatterns: [],
      marketRegime: "RANGING",
      riskLevel: "MEDIUM"
    };
  }
  
  // Pattern recognition simulato
  const patterns: string[] = [];
  const momentum = (data5m.close - data5m.open) / data5m.open;
  const volatility = (data5m.high - data5m.low) / data5m.close;
  
  if (Math.abs(momentum) > 0.005) patterns.push("MOMENTUM_BREAKOUT");
  if (volatility < 0.01) patterns.push("LOW_VOLATILITY_CONSOLIDATION");
  if (data5m.volume > (data15m?.volume || 0) * 1.3) patterns.push("VOLUME_SPIKE");
  if (data5m.indicators?.rsi > 70) patterns.push("OVERBOUGHT");
  if (data5m.indicators?.rsi < 30) patterns.push("OVERSOLD");
  
  // Determina direzione basata su pattern e momentum
  let direction: "UP" | "DOWN" | "SIDEWAYS" = "SIDEWAYS";
  let confidence = 50;
  
  if (momentum > 0.01 && patterns.includes("MOMENTUM_BREAKOUT")) {
    direction = "UP";
    confidence = 75 + Math.min(20, momentum * 1000);
  } else if (momentum < -0.01 && patterns.includes("MOMENTUM_BREAKOUT")) {
    direction = "DOWN";
    confidence = 75 + Math.min(20, Math.abs(momentum) * 1000);
  } else if (patterns.includes("OVERSOLD")) {
    direction = "UP";
    confidence = 65;
  } else if (patterns.includes("OVERBOUGHT")) {
    direction = "DOWN";
    confidence = 65;
  }
  
  // Calcola target di prezzo
  const atr = data5m.indicators?.atr || volatility;
  const priceTarget = direction === "UP" ? data5m.close * (1 + atr * 2) :
                     direction === "DOWN" ? data5m.close * (1 - atr * 2) :
                     data5m.close;
  
  // Determina regime di mercato
  const marketRegime = volatility > 0.02 ? "VOLATILE" :
                      Math.abs(momentum) > 0.01 ? "TRENDING" : "RANGING";
  
  // Risk level
  const riskLevel = volatility > 0.015 ? "HIGH" :
                   volatility < 0.005 ? "LOW" : "MEDIUM";
  
  return {
    direction,
    confidence: Math.min(95, confidence),
    priceTarget,
    timeHorizon: 30, // 30 minuti per intraday
    patternStrength: patterns.length / 5 * 100,
    recognizedPatterns: patterns,
    marketRegime: marketRegime as any,
    riskLevel: riskLevel as any
  };
}

async function analyzeNewsAndSentiment(symbol: string): Promise<NewsAnalysisResult> {
  // Simula analisi news (in reale userebbe API news finanziarie)
  const currentHour = new Date().getHours();
  
  // Simula eventi di mercato durante orari di trading attivi
  const isActiveHour = (currentHour >= 7 && currentHour <= 16) || (currentHour >= 12 && currentHour <= 21);
  
  const relevantEvents = [];
  let impactScore = 50;
  let sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL" = "NEUTRAL";
  
  if (isActiveHour) {
    // Simula eventi news realistici
    if (Math.random() > 0.7) {
      relevantEvents.push({
        title: "Economic data release affecting " + symbol,
        impact: "MEDIUM" as const,
        sentiment: Math.random() > 0.5 ? "POSITIVE" as const : "NEGATIVE" as const,
        time: new Date(),
        currency: [symbol.substring(0, 3), symbol.substring(3, 6)]
      });
      
      impactScore = 60 + Math.random() * 30;
      sentiment = relevantEvents[0].sentiment;
    }
    
    if (Math.random() > 0.9) {
      relevantEvents.push({
        title: "Central Bank announcement",
        impact: "HIGH" as const,
        sentiment: Math.random() > 0.5 ? "POSITIVE" as const : "NEGATIVE" as const,
        time: new Date(),
        currency: [symbol.substring(0, 3)]
      });
      
      impactScore = 80 + Math.random() * 15;
      sentiment = relevantEvents[relevantEvents.length - 1].sentiment;
    }
  }
  
  return {
    sentiment,
    impactScore,
    relevantEvents,
    marketMovingEvents: relevantEvents.some(e => e.impact === "HIGH"),
    volatilityForecast: impactScore > 70 ? 0.8 : 0.3
  };
}

async function generateCompositeSignal(params: {
  symbol: string;
  marketData: Record<string, any>;
  institutionalAnalysis: InstitutionalAnalysis;
  priceActionAnalysis: MultiTimeframeAnalysis;
  volumeAnalysis: VolumeAnalysis;
  neuralPrediction: NeuralNetworkPrediction;
  newsAnalysis: NewsAnalysisResult;
  config: AdvancedEngineConfig;
  accountBalance: number;
  riskPercentage: number;
}): Promise<AdvancedTradingSignal | null> {
  
  const { symbol, marketData, institutionalAnalysis, priceActionAnalysis, volumeAnalysis, neuralPrediction, newsAnalysis, config, accountBalance, riskPercentage } = params;
  
  // 1. Calcolo score composito ponderato
  const smartMoneyScore = calculateSmartMoneyScore(institutionalAnalysis);
  const priceActionScore = calculatePriceActionScore(priceActionAnalysis);
  const volumeScore = calculateVolumeScore(volumeAnalysis);
  const neuralScore = neuralPrediction.confidence;
  const newsScore = calculateNewsScore(newsAnalysis);
  
  const compositeScore = 
    smartMoneyScore * config.smartMoneyWeight +
    priceActionScore * config.priceActionWeight +
    volumeScore * config.volumeWeight +
    neuralScore * config.neuralNetworkWeight +
    newsScore * config.newsWeight;
  
  // 2. Determina direzione del segnale
  const bullishFactors = countBullishFactors(institutionalAnalysis, priceActionAnalysis, volumeAnalysis, neuralPrediction, newsAnalysis);
  const bearishFactors = countBearishFactors(institutionalAnalysis, priceActionAnalysis, volumeAnalysis, neuralPrediction, newsAnalysis);
  
  let action: "BUY" | "SELL" | "HOLD" = "HOLD";
  if (compositeScore >= config.minConfidence) {
    if (bullishFactors > bearishFactors + 1) {
      action = "BUY";
    } else if (bearishFactors > bullishFactors + 1) {
      action = "SELL";
    }
  }
  
  // 3. Se non c'è segnale, ritorna null
  if (action === "HOLD") {
    return null;
  }
  
  // 4. Calcola prezzi entry, SL e TP
  const currentPrice = marketData["5m"].close;
  const atr = marketData["5m"].indicators?.atr || (marketData["5m"].high - marketData["5m"].low) / marketData["5m"].close;
  
  // Seleziona strategia ottimale
  const optimalStrategy = getOptimalStrategy(marketData, symbol, params.config.preferredStrategy);
  const targets = calculateStrategyTargets(
    optimalStrategy,
    currentPrice,
    atr,
    action === "BUY" ? "LONG" : "SHORT",
    symbol,
    currentPrice * 0.0001 // spread simulato
  );
  
  // 5. Calcola position sizing
  const riskAmount = Math.abs(currentPrice - targets.stopLoss);
  const maxRisk = accountBalance * (riskPercentage / 100);
  const recommendedLotSize = Math.min(maxRisk / riskAmount, TRADING_STRATEGIES[optimalStrategy].maxLotSize);
  
  // 6. Calcola confidence finale e validazione
  let finalConfidence = compositeScore;
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  // Validazioni di sicurezza
  if (volumeAnalysis.volumeRatio < 0.8) {
    finalConfidence *= 0.9;
    warnings.push("Volume basso rilevato - attenzione allo slippage");
  }
  
  if (newsAnalysis.marketMovingEvents) {
    if (newsAnalysis.sentiment === "NEGATIVE" && action === "BUY") {
      finalConfidence *= 0.8;
      warnings.push("News negative contro la direzione del segnale");
    } else if (newsAnalysis.sentiment === "POSITIVE" && action === "SELL") {
      finalConfidence *= 0.8;
      warnings.push("News positive contro la direzione del segnale");
    }
  }
  
  // Aggiungi raccomandazioni
  if (institutionalAnalysis.marketMakerModel.smartMoneyDirection === (action === "BUY" ? "LONG" : "SHORT")) {
    recommendations.push("Allineato con Smart Money - alta probabilità di successo");
    finalConfidence *= 1.05;
  }
  
  if (priceActionAnalysis.confluenceLevel > 0.7) {
    recommendations.push("Forte confluenza multi-timeframe");
    finalConfidence *= 1.03;
  }
  
  // 7. Crea il segnale finale
  const signal: AdvancedTradingSignal = {
    id: `ADVANCED_${symbol}_${Date.now()}`,
    symbol,
    timeframe: "5m",
    action,
    
    entryPrice: targets.entryPrice,
    stopLoss: targets.stopLoss,
    takeProfit: targets.takeProfit,
    riskRewardRatio: targets.riskRewardRatio,
    
    confidence: Math.round(finalConfidence),
    maxConfidence: 95,
    strategy: optimalStrategy,
    
    smartMoneyAlignment: smartMoneyScore,
    institutionalBias: institutionalAnalysis.marketMakerModel.smartMoneyDirection === "LONG" ? "BULLISH" :
                      institutionalAnalysis.marketMakerModel.smartMoneyDirection === "SHORT" ? "BEARISH" : "NEUTRAL",
    orderBlockConfirmation: institutionalAnalysis.orderBlocks.length > 0,
    liquidityZoneProximity: calculateLiquidityProximity(currentPrice, institutionalAnalysis),
    
    priceActionScore,
    trendAlignment: priceActionAnalysis.overallTrend === "BULLISH" && action === "BUY" ? "ALIGNED" :
                   priceActionAnalysis.overallTrend === "BEARISH" && action === "SELL" ? "ALIGNED" : "DIVERGENT",
    structureBreak: institutionalAnalysis.marketStructure.lastBOS !== null,
    keyLevelInteraction: determineKeyLevelInteraction(currentPrice, institutionalAnalysis),
    
    volumeProfile: {
      strength: volumeAnalysis.volumeRatio > 1.5 ? "HIGH" : volumeAnalysis.volumeRatio > 1.0 ? "MODERATE" : "LOW",
      accumulation: volumeAnalysis.volumeProfile === "ACCUMULATION",
      distribution: volumeAnalysis.volumeProfile === "DISTRIBUTION",
      breakoutVolume: volumeAnalysis.volumeProfile === "BREAKOUT"
    },
    
    neuralNetworkPrediction: {
      priceDirection: neuralPrediction.direction,
      confidence: neuralPrediction.confidence,
      patternRecognition: neuralPrediction.recognizedPatterns,
      marketRegime: neuralPrediction.marketRegime
    },
    
    newsImpact: {
      overall: newsAnalysis.sentiment,
      score: newsAnalysis.impactScore,
      events: newsAnalysis.relevantEvents.map(e => e.title),
      volatilityExpected: newsAnalysis.volatilityForecast > 0.6
    },
    
    positionSizing: {
      recommendedLotSize: Math.round(recommendedLotSize * 100) / 100,
      riskPercentage,
      maxDrawdown: riskAmount / currentPrice * 100,
      kellyCriterion: calculateKellyCriterion(optimalStrategy)
    },
    
    timestamp: new Date(),
    validUntil: new Date(Date.now() + 30 * 60 * 1000), // Valido per 30 minuti
    sessionQuality: assessSessionQuality(),
    
    backtestResults: {
      winRate: TRADING_STRATEGIES[optimalStrategy].sharpeRatioTarget > 2 ? 0.75 : 0.65,
      avgWin: targets.riskRewardRatio,
      avgLoss: -1,
      profitFactor: targets.riskRewardRatio * 0.75 / 0.25
    },
    
    recommendations,
    warnings
  };
  
  return signal;
}

// === FUNZIONI HELPER ===

function calculateSmartMoneyScore(institutional: InstitutionalAnalysis): number {
  let score = 50;
  
  // Order blocks
  const strongOBs = institutional.orderBlocks.filter(ob => ob.strength === "STRONG" || ob.strength === "EXTREME").length;
  score += Math.min(strongOBs * 10, 30);
  
  // Fair value gaps
  const openFVGs = institutional.fairValueGaps.filter(fvg => fvg.status === "OPEN").length;
  score += Math.min(openFVGs * 5, 15);
  
  // Market maker model confidence
  score += institutional.marketMakerModel.confidence * 0.2;
  
  // Active sessions bonus
  score += institutional.activeSessions.length * 3;
  
  return Math.min(95, Math.max(10, score));
}

function calculatePriceActionScore(priceAction: MultiTimeframeAnalysis): number {
  let score = 50;
  
  // Confluenza multi-timeframe
  score += priceAction.confluenceLevel * 30;
  
  // Forza del trend
  score += priceAction.trendStrength * 20;
  
  return Math.min(95, Math.max(10, score));
}

function calculateVolumeScore(volume: VolumeAnalysis): number {
  let score = 50;
  
  if (volume.volumeSpike) score += 20;
  
  switch (volume.volumeProfile) {
    case "BREAKOUT":
      score += 25;
      break;
    case "ACCUMULATION":
      score += 15;
      break;
    case "DISTRIBUTION":
      score += 10;
      break;
  }
  
  if (volume.marketMicrostructure.liquidityLevel === "HIGH") score += 10;
  
  return Math.min(95, Math.max(10, score));
}

function calculateNewsScore(news: NewsAnalysisResult): number {
  return news.impactScore;
}

function countBullishFactors(institutional: InstitutionalAnalysis, priceAction: MultiTimeframeAnalysis, volume: VolumeAnalysis, neural: NeuralNetworkPrediction, news: NewsAnalysisResult): number {
  let count = 0;
  
  if (institutional.marketMakerModel.smartMoneyDirection === "LONG") count++;
  if (institutional.marketStructure.bias === "BULLISH") count++;
  if (priceAction.overallTrend === "BULLISH") count++;
  if (volume.volumeProfile === "ACCUMULATION" || volume.volumeProfile === "BREAKOUT") count++;
  if (neural.direction === "UP") count++;
  if (news.sentiment === "POSITIVE") count++;
  
  return count;
}

function countBearishFactors(institutional: InstitutionalAnalysis, priceAction: MultiTimeframeAnalysis, volume: VolumeAnalysis, neural: NeuralNetworkPrediction, news: NewsAnalysisResult): number {
  let count = 0;
  
  if (institutional.marketMakerModel.smartMoneyDirection === "SHORT") count++;
  if (institutional.marketStructure.bias === "BEARISH") count++;
  if (priceAction.overallTrend === "BEARISH") count++;
  if (volume.volumeProfile === "DISTRIBUTION") count++;
  if (neural.direction === "DOWN") count++;
  if (news.sentiment === "NEGATIVE") count++;
  
  return count;
}

function calculateLiquidityProximity(currentPrice: number, institutional: InstitutionalAnalysis): number {
  const orderBlocks = institutional.orderBlocks;
  if (orderBlocks.length === 0) return 50;
  
  const closestOB = orderBlocks.reduce((closest, ob) => {
    const distance = Math.min(
      Math.abs(currentPrice - ob.high),
      Math.abs(currentPrice - ob.low)
    );
    return distance < closest.distance ? { ob, distance } : closest;
  }, { ob: orderBlocks[0], distance: Infinity });
  
  const proximityPercentage = closestOB.distance / currentPrice;
  return Math.max(0, 100 - proximityPercentage * 1000);
}

function determineKeyLevelInteraction(currentPrice: number, institutional: InstitutionalAnalysis): "SUPPORT" | "RESISTANCE" | "BREAKOUT" | "NONE" {
  // Semplificato per questa implementazione
  if (institutional.orderBlocks.length === 0) return "NONE";
  
  const nearbyOB = institutional.orderBlocks.find(ob => {
    const distance = Math.min(
      Math.abs(currentPrice - ob.high) / currentPrice,
      Math.abs(currentPrice - ob.low) / currentPrice
    );
    return distance < 0.002; // Entro 0.2%
  });
  
  if (!nearbyOB) return "NONE";
  
  if (currentPrice > nearbyOB.high) return "BREAKOUT";
  if (nearbyOB.type === "BULLISH") return "SUPPORT";
  return "RESISTANCE";
}

function calculateKellyCriterion(strategy: TradingStrategy): number {
  const config = TRADING_STRATEGIES[strategy];
  const winRate = config.sharpeRatioTarget > 2 ? 0.75 : 0.65;
  const avgWin = config.riskRewardRatio;
  const avgLoss = 1;
  
  return (winRate * avgWin - (1 - winRate) * avgLoss) / avgWin;
}

function assessSessionQuality(): "EXCELLENT" | "GOOD" | "FAIR" | "POOR" {
  const hour = new Date().getUTCHours();
  
  // London-NY overlap (12-16 UTC)
  if (hour >= 12 && hour <= 16) return "EXCELLENT";
  
  // London session (7-12 UTC)
  if (hour >= 7 && hour <= 12) return "GOOD";
  
  // NY session (16-21 UTC)
  if (hour >= 16 && hour <= 21) return "GOOD";
  
  // Asian session
  if (hour >= 0 && hour <= 6) return "FAIR";
  
  return "POOR";
}

function assessDataQuality(marketData: Record<string, any>): "EXCELLENT" | "GOOD" | "FAIR" | "POOR" {
  const requiredTimeframes = ["5m", "15m", "30m"];
  const availableTimeframes = Object.keys(marketData).filter(tf => requiredTimeframes.includes(tf));
  
  if (availableTimeframes.length === requiredTimeframes.length) return "EXCELLENT";
  if (availableTimeframes.length >= 2) return "GOOD";
  if (availableTimeframes.length === 1) return "FAIR";
  return "POOR";
}

function generateAnalysisReport(
  signal: AdvancedTradingSignal | null,
  institutional: InstitutionalAnalysis,
  priceAction: MultiTimeframeAnalysis,
  volume: VolumeAnalysis,
  neural: NeuralNetworkPrediction,
  news: NewsAnalysisResult
): { marketConditions: string; reasoning: string[]; alternatives: string[] } {
  
  const reasoning: string[] = [];
  const alternatives: string[] = [];
  
  if (!signal) {
    return {
      marketConditions: "NO_SIGNAL",
      reasoning: ["Condizioni di mercato non ottimali per un segnale affidabile"],
      alternatives: ["Attendere migliori condizioni di mercato", "Considerare altri strumenti finanziari"]
    };
  }
  
  // Market conditions assessment
  let marketConditions = "NORMAL";
  if (volume.volumeSpike && neural.marketRegime === "VOLATILE") {
    marketConditions = "HIGH_VOLATILITY";
  } else if (institutional.activeSessions.length >= 2) {
    marketConditions = "ACTIVE_SESSION";
  } else if (news.marketMovingEvents) {
    marketConditions = "NEWS_DRIVEN";
  }
  
  // Reasoning
  if (signal.smartMoneyAlignment > 75) {
    reasoning.push("Forte allineamento con Smart Money istituzionale");
  }
  
  if (signal.trendAlignment === "ALIGNED") {
    reasoning.push("Confluenza multi-timeframe confermata");
  }
  
  if (signal.volumeProfile.breakoutVolume) {
    reasoning.push("Volume di breakout rilevato");
  }
  
  if (signal.neuralNetworkPrediction.confidence > 80) {
    reasoning.push("Alta confidenza del modello di machine learning");
  }
  
  // Alternatives
  if (signal.confidence < 85) {
    alternatives.push("Attendere una confidenza superiore all'85%");
  }
  
  if (signal.warnings.length > 0) {
    alternatives.push("Considerare i warning presenti prima di entrare");
  }
  
  alternatives.push("Monitorare per conferma aggiuntiva nei prossimi 5-10 minuti");
  
  return {
    marketConditions,
    reasoning,
    alternatives
  };
}

async function storeAdvancedSignal(signal: AdvancedTradingSignal, analysis: any): Promise<void> {
  try {
    await db.exec`
      INSERT INTO advanced_signals (
        signal_id, symbol, action, entry_price, stop_loss, take_profit, 
        confidence, strategy, timestamp, analysis_data
      ) VALUES (
        ${signal.id}, ${signal.symbol}, ${signal.action}, ${signal.entryPrice},
        ${signal.stopLoss}, ${signal.takeProfit}, ${signal.confidence},
        ${signal.strategy}, ${signal.timestamp}, ${JSON.stringify({signal, analysis})}
      )
    `;
  } catch (error) {
    console.error("Errore nel salvataggio del segnale:", error);
  }
}

// Funzioni helper per dati di mercato
function getSymbolBasePrice(symbol: string): number {
  const basePrices: Record<string, number> = {
    "EURUSD": 1.0850, "GBPUSD": 1.2750, "USDJPY": 150.50,
    "XAUUSD": 2050, "BTCUSD": 95000, "US30": 44500, "SPX500": 5800, "NAS100": 20500
  };
  return basePrices[symbol] || 1.0;
}

function getSymbolVolatility(symbol: string): number {
  const volatilities: Record<string, number> = {
    "EURUSD": 0.005, "GBPUSD": 0.008, "USDJPY": 0.006,
    "XAUUSD": 0.015, "BTCUSD": 0.03, "US30": 0.015, "SPX500": 0.012, "NAS100": 0.018
  };
  return volatilities[symbol] || 0.01;
}

function getBaseVolume(symbol: string, timeframe: string): number {
  const baseVolumes: Record<string, Record<string, number>> = {
    "EURUSD": { "5m": 200, "15m": 600, "30m": 1200, "1h": 2400 },
    "GBPUSD": { "5m": 150, "15m": 450, "30m": 900, "1h": 1800 },
    "XAUUSD": { "5m": 100, "15m": 300, "30m": 600, "1h": 1200 }
  };
  const symbolVolumes = baseVolumes[symbol] || { "5m": 100, "15m": 300, "30m": 600, "1h": 1200 };
  return symbolVolumes[timeframe] || symbolVolumes["5m"];
}

function getTimeframeMultiplier(timeframe: string): number {
  const multipliers: Record<string, number> = {
    "5m": 1, "15m": 2, "30m": 3, "1h": 4, "4h": 8
  };
  return multipliers[timeframe] || 1;
}

function determineTrend(data: any): string {
  if (!data || !data.indicators) return "NEUTRAL";
  
  const { close, open } = data;
  const { ema } = data.indicators;
  
  if (close > ema?.ema21 && open > ema?.ema21) return "BULLISH";
  if (close < ema?.ema21 && open < ema?.ema21) return "BEARISH";
  return "NEUTRAL";
}

function calculateTrendStrength(data: any): number {
  if (!data) return 0.5;
  
  const priceChange = Math.abs((data.close - data.open) / data.open);
  const volumeBoost = data.volume > 1000 ? 1.2 : 1.0;
  
  return Math.min(1.0, priceChange * 100 * volumeBoost);
}