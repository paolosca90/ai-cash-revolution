/**
 * Advanced News & Sentiment Analysis Engine v2.0
 * Integra analisi delle news finanziarie con sentiment analysis in tempo reale
 * per valutare l'impatto sui mercati e sui segnali di trading
 */

import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = new SQLDatabase("news_analysis", {
  migrations: "./migrations",
});

// === INTERFACCE ===

export interface NewsEvent {
  id: string;
  title: string;
  description: string;
  source: string;
  publishedAt: Date;
  impact: "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
  category: "ECONOMIC_DATA" | "CENTRAL_BANK" | "GEOPOLITICAL" | "CORPORATE" | "MARKET_STRUCTURE";
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  confidence: number;
  relevantCurrencies: string[];
  relevantAssets: string[];
  timeToImpact: number; // minuti
  expectedDuration: number; // minuti
  volatilityImpact: number; // 0-1
}

export interface MarketSentiment {
  overall: "BULLISH" | "BEARISH" | "NEUTRAL";
  score: number; // -100 to +100
  confidence: number;
  drivers: string[];
  riskOnOff: "RISK_ON" | "RISK_OFF" | "NEUTRAL";
  fearGreedIndex: number; // 0-100
  marketMood: "EUPHORIC" | "OPTIMISTIC" | "NEUTRAL" | "PESSIMISTIC" | "PANIC";
}

export interface EconomicCalendar {
  events: Array<{
    id: string;
    title: string;
    country: string;
    currency: string;
    importance: "LOW" | "MEDIUM" | "HIGH";
    actual?: number;
    forecast?: number;
    previous?: number;
    time: Date;
    deviation?: number; // quanto si discosta dalla previsione
    marketReaction: "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "NO_REACTION";
  }>;
  nextHighImpactEvent?: Date;
  upcomingInNext60Min: number;
}

export interface NewsAnalysisResult {
  sentiment: MarketSentiment;
  newsEvents: NewsEvent[];
  economicCalendar: EconomicCalendar;
  assetSpecificAnalysis: Record<string, {
    sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
    impactScore: number;
    keyDrivers: string[];
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
  }>;
  tradingRecommendations: {
    avoidTrading: boolean;
    increaseVolatility: boolean;
    suggestedAssets: string[];
    suggestedStrategies: string[];
    riskAdjustment: number; // moltiplicatore del risk normale
  };
}

export interface SentimentAnalysisRequest {
  symbols: string[];
  timeHorizon?: number; // ore
  includeFuture?: boolean;
}

export interface SentimentAnalysisResponse {
  analysis: NewsAnalysisResult;
  lastUpdated: Date;
  nextUpdate: Date;
  dataQuality: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
}

// === NEWS SOURCES SIMULATION ===

const NEWS_SOURCES = [
  "Reuters", "Bloomberg", "MarketWatch", "Financial Times", "CNBC",
  "ForexLive", "DailyFX", "FXStreet", "Investing.com", "TradingView"
];

const ECONOMIC_INDICATORS = [
  "Non-Farm Payrolls", "CPI", "GDP", "Unemployment Rate", "Retail Sales",
  "Manufacturing PMI", "Services PMI", "Interest Rate Decision", "Consumer Confidence",
  "Trade Balance", "Industrial Production", "Core PCE", "JOLTS", "Durable Goods"
];

const CENTRAL_BANKS = ["FED", "ECB", "BOJ", "BOE", "RBA", "SNB", "BOC"];

// === ENDPOINT PRINCIPALE ===

export const analyzeSentiment = api<SentimentAnalysisRequest, SentimentAnalysisResponse>(
  { expose: true, method: "POST", path: "/analysis/news-sentiment" },
  async (req) => {
    try {
      const { symbols, timeHorizon = 24, includeFuture = true } = req;
      
      // 1. Genera/simula news events
      const newsEvents = await generateCurrentNewsEvents(symbols);
      
      // 2. Analizza sentiment complessivo
      const marketSentiment = await analyzeOverallMarketSentiment(newsEvents);
      
      // 3. Genera calendario economico
      const economicCalendar = await generateEconomicCalendar(includeFuture);
      
      // 4. Analisi specifica per asset
      const assetSpecificAnalysis = await analyzeAssetSpecificSentiment(symbols, newsEvents, economicCalendar);
      
      // 5. Generazione raccomandazioni
      const tradingRecommendations = await generateTradingRecommendations(
        marketSentiment, 
        newsEvents, 
        economicCalendar,
        symbols
      );
      
      const analysis: NewsAnalysisResult = {
        sentiment: marketSentiment,
        newsEvents,
        economicCalendar,
        assetSpecificAnalysis,
        tradingRecommendations
      };
      
      // Salva per training ML
      await storeAnalysisResults(analysis, symbols);
      
      return {
        analysis,
        lastUpdated: new Date(),
        nextUpdate: new Date(Date.now() + 5 * 60 * 1000), // ogni 5 minuti
        dataQuality: assessDataQuality(newsEvents, economicCalendar)
      };
      
    } catch (error) {
      console.error("Errore nell'analisi sentiment:", error);
      
      return {
        analysis: getDefaultAnalysis(),
        lastUpdated: new Date(),
        nextUpdate: new Date(Date.now() + 5 * 60 * 1000),
        dataQuality: "POOR"
      };
    }
  }
);

// === FUNZIONI DI ANALISI ===

async function generateCurrentNewsEvents(symbols: string[]): Promise<NewsEvent[]> {
  const events: NewsEvent[] = [];
  const now = new Date();
  
  // Simula eventi news realistici basati sull'ora corrente
  const currentHour = now.getHours();
  const dayOfWeek = now.getDay();
  
  // Eventi più probabili durante orari di mercato
  const isMarketHours = (currentHour >= 7 && currentHour <= 21);
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  
  if (isMarketHours && isWeekday) {
    // Genera eventi economici
    if (Math.random() > 0.7) {
      const indicator = ECONOMIC_INDICATORS[Math.floor(Math.random() * ECONOMIC_INDICATORS.length)];
      const impact = Math.random() > 0.8 ? "HIGH" : Math.random() > 0.6 ? "MEDIUM" : "LOW";
      
      events.push({
        id: `NEWS_${now.getTime()}_1`,
        title: `${indicator} Data Release`,
        description: `Latest ${indicator} figures released, showing ${Math.random() > 0.5 ? 'better' : 'worse'} than expected results`,
        source: NEWS_SOURCES[Math.floor(Math.random() * NEWS_SOURCES.length)],
        publishedAt: new Date(now.getTime() - Math.random() * 30 * 60 * 1000),
        impact: impact as any,
        category: "ECONOMIC_DATA",
        sentiment: Math.random() > 0.5 ? "POSITIVE" : "NEGATIVE",
        confidence: 70 + Math.random() * 25,
        relevantCurrencies: getCurrenciesFromSymbols(symbols),
        relevantAssets: symbols,
        timeToImpact: Math.random() > 0.5 ? 0 : Math.floor(Math.random() * 60),
        expectedDuration: 60 + Math.floor(Math.random() * 180),
        volatilityImpact: impact === "HIGH" ? 0.8 + Math.random() * 0.2 : 
                         impact === "MEDIUM" ? 0.4 + Math.random() * 0.4 :
                         Math.random() * 0.3
      });
    }
    
    // Eventi banca centrale
    if (Math.random() > 0.85) {
      const centralBank = CENTRAL_BANKS[Math.floor(Math.random() * CENTRAL_BANKS.length)];
      const eventTypes = ["Speech", "Meeting Minutes", "Policy Decision", "Press Conference"];
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      events.push({
        id: `NEWS_${now.getTime()}_2`,
        title: `${centralBank} ${eventType}`,
        description: `Central bank communication that could impact monetary policy expectations`,
        source: "Central Bank Communications",
        publishedAt: new Date(now.getTime() - Math.random() * 60 * 60 * 1000),
        impact: "HIGH",
        category: "CENTRAL_BANK",
        sentiment: Math.random() > 0.6 ? "POSITIVE" : Math.random() > 0.3 ? "NEGATIVE" : "NEUTRAL",
        confidence: 80 + Math.random() * 15,
        relevantCurrencies: getCentralBankCurrencies(centralBank),
        relevantAssets: symbols,
        timeToImpact: Math.random() > 0.3 ? 0 : Math.floor(Math.random() * 120),
        expectedDuration: 120 + Math.floor(Math.random() * 240),
        volatilityImpact: 0.6 + Math.random() * 0.4
      });
    }
    
    // Eventi geopolitici
    if (Math.random() > 0.9) {
      const geopoliticalEvents = [
        "Trade Relations Update", "International Summit", "Sanctions Announcement",
        "Military Conflict Development", "Election Results", "Brexit Update"
      ];
      
      const eventType = geopoliticalEvents[Math.floor(Math.random() * geopoliticalEvents.length)];
      
      events.push({
        id: `NEWS_${now.getTime()}_3`,
        title: eventType,
        description: `Geopolitical development that could impact market sentiment and risk appetite`,
        source: "International News",
        publishedAt: new Date(now.getTime() - Math.random() * 120 * 60 * 1000),
        impact: Math.random() > 0.7 ? "HIGH" : "MEDIUM",
        category: "GEOPOLITICAL",
        sentiment: Math.random() > 0.4 ? "NEGATIVE" : Math.random() > 0.7 ? "NEUTRAL" : "POSITIVE",
        confidence: 60 + Math.random() * 30,
        relevantCurrencies: ["USD", "EUR", "GBP", "JPY"], // Valute rifugio e major
        relevantAssets: symbols.filter(s => s.includes("USD") || s.includes("JPY") || s === "XAUUSD"),
        timeToImpact: Math.floor(Math.random() * 180),
        expectedDuration: 240 + Math.floor(Math.random() * 480),
        volatilityImpact: 0.5 + Math.random() * 0.5
      });
    }
    
    // Eventi corporate per crypto e indici
    symbols.forEach(symbol => {
      if ((symbol.includes("BTC") || symbol.includes("ETH") || symbol.includes("US") || symbol.includes("SPX")) && Math.random() > 0.85) {
        events.push({
          id: `NEWS_${now.getTime()}_${symbol}`,
          title: `${symbol} Market Development`,
          description: `Significant development affecting ${symbol} market conditions`,
          source: "Market News",
          publishedAt: new Date(now.getTime() - Math.random() * 45 * 60 * 1000),
          impact: Math.random() > 0.8 ? "HIGH" : "MEDIUM",
          category: "MARKET_STRUCTURE",
          sentiment: Math.random() > 0.5 ? "POSITIVE" : "NEGATIVE",
          confidence: 65 + Math.random() * 25,
          relevantCurrencies: symbol.includes("USD") ? ["USD"] : [],
          relevantAssets: [symbol],
          timeToImpact: Math.floor(Math.random() * 30),
          expectedDuration: 60 + Math.floor(Math.random() * 120),
          volatilityImpact: 0.4 + Math.random() * 0.4
        });
      }
    });
  }
  
  return events.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

async function analyzeOverallMarketSentiment(newsEvents: NewsEvent[]): Promise<MarketSentiment> {
  if (newsEvents.length === 0) {
    return {
      overall: "NEUTRAL",
      score: 0,
      confidence: 30,
      drivers: ["Nessun evento significativo rilevato"],
      riskOnOff: "NEUTRAL",
      fearGreedIndex: 50,
      marketMood: "NEUTRAL"
    };
  }
  
  // Calcola score sentiment ponderato per impatto
  let totalScore = 0;
  let totalWeight = 0;
  const drivers: string[] = [];
  
  newsEvents.forEach(event => {
    const impactWeight = getImpactWeight(event.impact);
    const sentimentScore = getSentimentScore(event.sentiment);
    
    totalScore += sentimentScore * impactWeight * (event.confidence / 100);
    totalWeight += impactWeight;
    
    if (event.impact === "HIGH" || event.impact === "EXTREME") {
      drivers.push(`${event.title} (${event.sentiment})`);
    }
  });
  
  const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;
  
  // Determina sentiment generale
  let overall: "BULLISH" | "BEARISH" | "NEUTRAL" = "NEUTRAL";
  if (normalizedScore > 15) overall = "BULLISH";
  else if (normalizedScore < -15) overall = "BEARISH";
  
  // Risk On/Off analysis
  const negativeEvents = newsEvents.filter(e => e.sentiment === "NEGATIVE" && 
    (e.impact === "HIGH" || e.impact === "EXTREME")).length;
  const geopoliticalRisk = newsEvents.filter(e => e.category === "GEOPOLITICAL" && 
    e.sentiment === "NEGATIVE").length;
  
  let riskOnOff: "RISK_ON" | "RISK_OFF" | "NEUTRAL" = "NEUTRAL";
  if (negativeEvents >= 2 || geopoliticalRisk >= 1) riskOnOff = "RISK_OFF";
  else if (normalizedScore > 20) riskOnOff = "RISK_ON";
  
  // Fear & Greed Index simulation
  const fearGreedIndex = Math.max(0, Math.min(100, 50 + normalizedScore));
  
  // Market Mood
  let marketMood: MarketSentiment["marketMood"] = "NEUTRAL";
  if (fearGreedIndex >= 80) marketMood = "EUPHORIC";
  else if (fearGreedIndex >= 60) marketMood = "OPTIMISTIC";
  else if (fearGreedIndex <= 20) marketMood = "PANIC";
  else if (fearGreedIndex <= 40) marketMood = "PESSIMISTIC";
  
  const confidence = Math.min(95, 40 + newsEvents.length * 10);
  
  return {
    overall,
    score: Math.round(normalizedScore),
    confidence,
    drivers: drivers.slice(0, 5),
    riskOnOff,
    fearGreedIndex: Math.round(fearGreedIndex),
    marketMood
  };
}

async function generateEconomicCalendar(includeFuture: boolean): Promise<EconomicCalendar> {
  const events = [];
  const now = new Date();
  
  // Eventi passati recenti (ultime 4 ore)
  for (let i = 0; i < 3; i++) {
    if (Math.random() > 0.6) {
      const indicator = ECONOMIC_INDICATORS[Math.floor(Math.random() * ECONOMIC_INDICATORS.length)];
      const eventTime = new Date(now.getTime() - (i + 1) * 60 * 60 * 1000);
      
      const forecast = Math.round((Math.random() * 10 + 1) * 10) / 10;
      const actual = forecast + (Math.random() - 0.5) * 2;
      const deviation = Math.abs(actual - forecast) / forecast;
      
      events.push({
        id: `ECON_PAST_${i}`,
        title: indicator,
        country: "US",
        currency: "USD",
        importance: Math.random() > 0.7 ? "HIGH" : Math.random() > 0.4 ? "MEDIUM" : "LOW",
        actual,
        forecast,
        previous: forecast + (Math.random() - 0.5),
        time: eventTime,
        deviation,
        marketReaction: deviation > 0.1 ? (actual > forecast ? "POSITIVE" : "NEGATIVE") : "NO_REACTION"
      });
    }
  }
  
  // Eventi futuri (prossime 24 ore)
  if (includeFuture) {
    for (let i = 1; i <= 6; i++) {
      if (Math.random() > 0.5) {
        const indicator = ECONOMIC_INDICATORS[Math.floor(Math.random() * ECONOMIC_INDICATORS.length)];
        const eventTime = new Date(now.getTime() + i * 4 * 60 * 60 * 1000);
        
        events.push({
          id: `ECON_FUTURE_${i}`,
          title: indicator,
          country: Math.random() > 0.7 ? "US" : Math.random() > 0.5 ? "EU" : "JP",
          currency: Math.random() > 0.7 ? "USD" : Math.random() > 0.5 ? "EUR" : "JPY",
          importance: Math.random() > 0.8 ? "HIGH" : Math.random() > 0.5 ? "MEDIUM" : "LOW",
          forecast: Math.round((Math.random() * 10 + 1) * 10) / 10,
          previous: Math.round((Math.random() * 10 + 1) * 10) / 10,
          time: eventTime,
          marketReaction: "NEUTRAL"
        });
      }
    }
  }
  
  // Trova prossimo evento ad alto impatto
  const futureHighImpactEvents = events
    .filter(e => e.time > now && e.importance === "HIGH")
    .sort((a, b) => a.time.getTime() - b.time.getTime());
  
  const upcomingInNext60Min = events
    .filter(e => e.time > now && e.time.getTime() <= now.getTime() + 60 * 60 * 1000).length;
  
  return {
    events,
    nextHighImpactEvent: futureHighImpactEvents[0]?.time,
    upcomingInNext60Min
  };
}

async function analyzeAssetSpecificSentiment(
  symbols: string[],
  newsEvents: NewsEvent[],
  economicCalendar: EconomicCalendar
): Promise<Record<string, any>> {
  const analysis: Record<string, any> = {};
  
  symbols.forEach(symbol => {
    // Filtra eventi rilevanti per questo asset
    const relevantNews = newsEvents.filter(event => 
      event.relevantAssets.includes(symbol) || 
      event.relevantCurrencies.some(curr => symbol.includes(curr))
    );
    
    const relevantEconEvents = economicCalendar.events.filter(event => 
      symbol.includes(event.currency)
    );
    
    // Calcola sentiment specifico
    let sentimentScore = 0;
    const keyDrivers: string[] = [];
    
    relevantNews.forEach(event => {
      const impact = getImpactWeight(event.impact);
      const sentiment = getSentimentScore(event.sentiment);
      sentimentScore += sentiment * impact;
      
      if (event.impact === "HIGH" || event.impact === "EXTREME") {
        keyDrivers.push(event.title);
      }
    });
    
    // Eventi economici
    relevantEconEvents.forEach(event => {
      if (event.deviation && event.deviation > 0.1) {
        const impact = event.importance === "HIGH" ? 3 : event.importance === "MEDIUM" ? 2 : 1;
        const direction = event.marketReaction === "POSITIVE" ? 1 : 
                         event.marketReaction === "NEGATIVE" ? -1 : 0;
        
        sentimentScore += direction * impact * 10;
        
        if (event.importance === "HIGH") {
          keyDrivers.push(`${event.title}: ${event.actual} vs ${event.forecast} expected`);
        }
      }
    });
    
    // Determina sentiment finale
    let sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL" = "NEUTRAL";
    if (sentimentScore > 20) sentiment = "POSITIVE";
    else if (sentimentScore < -20) sentiment = "NEGATIVE";
    
    // Risk level
    const volatilityEvents = relevantNews.filter(e => e.volatilityImpact > 0.6).length;
    const riskLevel = volatilityEvents >= 2 ? "HIGH" : volatilityEvents === 1 ? "MEDIUM" : "LOW";
    
    analysis[symbol] = {
      sentiment,
      impactScore: Math.abs(sentimentScore),
      keyDrivers: keyDrivers.slice(0, 3),
      riskLevel
    };
  });
  
  return analysis;
}

async function generateTradingRecommendations(
  marketSentiment: MarketSentiment,
  newsEvents: NewsEvent[],
  economicCalendar: EconomicCalendar,
  symbols: string[]
): Promise<any> {
  
  const highVolatilityEvents = newsEvents.filter(e => e.volatilityImpact > 0.7).length;
  const upcomingHighImpactEvents = economicCalendar.upcomingInNext60Min;
  
  // Determina se evitare il trading
  const avoidTrading = (
    highVolatilityEvents >= 2 ||
    upcomingHighImpactEvents >= 2 ||
    marketSentiment.riskOnOff === "RISK_OFF" && marketSentiment.fearGreedIndex < 25
  );
  
  // Volatilità aumentata
  const increaseVolatility = (
    highVolatilityEvents >= 1 ||
    upcomingHighImpactEvents >= 1 ||
    newsEvents.some(e => e.category === "CENTRAL_BANK" && e.timeToImpact <= 30)
  );
  
  // Asset suggeriti
  const suggestedAssets = [];
  if (marketSentiment.riskOnOff === "RISK_ON") {
    suggestedAssets.push(...symbols.filter(s => s.includes("BTC") || s.includes("NAS")));
  } else if (marketSentiment.riskOnOff === "RISK_OFF") {
    suggestedAssets.push(...symbols.filter(s => s.includes("JPY") || s === "XAUUSD"));
  }
  
  // Strategie suggerite
  const suggestedStrategies = [];
  if (increaseVolatility) {
    suggestedStrategies.push("MOMENTUM_BREAKOUT", "VOLATILITY_TRADING");
  } else {
    suggestedStrategies.push("MEAN_REVERSION", "STATISTICAL_ARBITRAGE");
  }
  
  // Risk adjustment
  let riskAdjustment = 1.0;
  if (avoidTrading) riskAdjustment = 0.3;
  else if (increaseVolatility) riskAdjustment = 0.7;
  else if (marketSentiment.fearGreedIndex > 75) riskAdjustment = 0.8;
  
  return {
    avoidTrading,
    increaseVolatility,
    suggestedAssets,
    suggestedStrategies,
    riskAdjustment
  };
}

// === FUNZIONI HELPER ===

function getCurrenciesFromSymbols(symbols: string[]): string[] {
  const currencies = new Set<string>();
  symbols.forEach(symbol => {
    if (symbol.length >= 6) {
      currencies.add(symbol.substring(0, 3));
      currencies.add(symbol.substring(3, 6));
    }
  });
  return Array.from(currencies);
}

function getCentralBankCurrencies(centralBank: string): string[] {
  const mapping: Record<string, string[]> = {
    "FED": ["USD"],
    "ECB": ["EUR"],
    "BOJ": ["JPY"],
    "BOE": ["GBP"],
    "RBA": ["AUD"],
    "SNB": ["CHF"],
    "BOC": ["CAD"]
  };
  return mapping[centralBank] || [];
}

function getImpactWeight(impact: string): number {
  const weights = { "EXTREME": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1 };
  return weights[impact as keyof typeof weights] || 1;
}

function getSentimentScore(sentiment: string): number {
  const scores = { "POSITIVE": 30, "NEGATIVE": -30, "NEUTRAL": 0 };
  return scores[sentiment as keyof typeof scores] || 0;
}

function getDefaultAnalysis(): NewsAnalysisResult {
  return {
    sentiment: {
      overall: "NEUTRAL",
      score: 0,
      confidence: 30,
      drivers: ["Nessun dato disponibile"],
      riskOnOff: "NEUTRAL",
      fearGreedIndex: 50,
      marketMood: "NEUTRAL"
    },
    newsEvents: [],
    economicCalendar: { events: [], upcomingInNext60Min: 0 },
    assetSpecificAnalysis: {},
    tradingRecommendations: {
      avoidTrading: false,
      increaseVolatility: false,
      suggestedAssets: [],
      suggestedStrategies: [],
      riskAdjustment: 1.0
    }
  };
}

function assessDataQuality(newsEvents: NewsEvent[], economicCalendar: EconomicCalendar): "EXCELLENT" | "GOOD" | "FAIR" | "POOR" {
  const recentNews = newsEvents.filter(e => 
    Date.now() - e.publishedAt.getTime() < 4 * 60 * 60 * 1000
  ).length;
  
  const upcomingEvents = economicCalendar.events.filter(e => e.time > new Date()).length;
  
  if (recentNews >= 3 && upcomingEvents >= 3) return "EXCELLENT";
  if (recentNews >= 2 && upcomingEvents >= 2) return "GOOD";
  if (recentNews >= 1 || upcomingEvents >= 1) return "FAIR";
  return "POOR";
}

async function storeAnalysisResults(analysis: NewsAnalysisResult, symbols: string[]): Promise<void> {
  try {
    await db.exec`
      INSERT INTO news_analysis_results (
        timestamp, symbols, sentiment_score, news_count, 
        economic_events_count, risk_adjustment, analysis_data
      ) VALUES (
        ${new Date()}, ${JSON.stringify(symbols)}, ${analysis.sentiment.score},
        ${analysis.newsEvents.length}, ${analysis.economicCalendar.events.length},
        ${analysis.tradingRecommendations.riskAdjustment}, ${JSON.stringify(analysis)}
      )
    `;
  } catch (error) {
    console.error("Errore nel salvataggio dell'analisi news:", error);
  }
}

// === ENDPOINT AUSILIARIO PER MONITORAGGIO ===

export const getNewsOverview = api(
  { expose: true, method: "GET", path: "/analysis/news-overview" },
  async () => {
    try {
      // Simula overview rapido
      const now = new Date();
      const currentHour = now.getHours();
      
      const marketStatus = (currentHour >= 7 && currentHour <= 21) ? "ACTIVE" : "CLOSED";
      const nextMajorEvent = new Date(now.getTime() + Math.random() * 4 * 60 * 60 * 1000);
      
      return {
        marketStatus,
        currentSentiment: Math.random() > 0.5 ? "POSITIVE" : "NEGATIVE",
        nextMajorEvent,
        activeNewsCount: Math.floor(Math.random() * 5) + 1,
        riskLevel: Math.random() > 0.7 ? "HIGH" : "MEDIUM",
        lastUpdate: now
      };
    } catch (error) {
      console.error("Errore nel news overview:", error);
      return {
        marketStatus: "UNKNOWN",
        currentSentiment: "NEUTRAL",
        nextMajorEvent: new Date(),
        activeNewsCount: 0,
        riskLevel: "MEDIUM",
        lastUpdate: new Date()
      };
    }
  }
);