// Main entry point for data enrichment tasks
// This service will orchestrate the fetching, processing, and storage of enriched market data

import { processCMEData } from "./sources/cme";
import { processCBOEData } from "./sources/cboe";
import { fetchFinnhubOptionsData } from "./sources/finnhub";
import { dataEnrichmentDB } from "./db";
import { calculateVolumeProfile, calculateVWAP, saveVolumeProfileData, saveVWAPData } from "./volume_profile";

// Example function to run daily data enrichment
export async function runDailyEnrichment(date: Date = new Date()) {
    console.log("Starting daily data enrichment process...");
    
    try {
        // Process CME data
        await processCMEData(date);
        
        // Process CBOE data
        await processCBOEData(date);
        
        console.log("Daily data enrichment completed successfully.");
    } catch (error) {
        console.error("Error during daily data enrichment:", error);
        // TODO: Implement proper error handling and alerting
    }
}

// Example function to fetch intraday options data
export async function getIntradayOptionsData(symbol: string, date: Date = new Date()) {
    try {
        const data = await fetchFinnhubOptionsData(symbol, date);
        return data;
    } catch (error) {
        console.error(`Error fetching intraday options data for ${symbol}:`, error);
        // TODO: Implement proper error handling
        return null;
    }
}

// Function to process market data and calculate volume profile and VWAP
export async function processMarketData(symbol: string, marketData: any[], date: Date = new Date()) {
    console.log(`Processing market data for ${symbol} with ${marketData.length} data points`);
    
    try {
        // Calculate Volume Profile
        const volumeProfile = calculateVolumeProfile(marketData);
        
        // Calculate VWAP
        const vwap = calculateVWAP(marketData);
        
        // Save Volume Profile data to database
        await saveVolumeProfileData(
            dataEnrichmentDB,
            date,
            symbol,
            volumeProfile.poc,
            volumeProfile.vah,
            volumeProfile.val,
            volumeProfile.hvnLevels,
            volumeProfile.lvnLevels
        );
        
        // Save VWAP data to database
        await saveVWAPData(
            dataEnrichmentDB,
            date,
            symbol,
            vwap
        );
        
        console.log(`Market data processing completed for ${symbol}`);
        return { volumeProfile, vwap };
    } catch (error) {
        console.error(`Error processing market data for ${symbol}:`, error);
        // TODO: Implement proper error handling
        return null;
    }
}

// API Definitions
import { api } from "encore.dev/api";

// Define the MarketDataPoint interface locally to avoid import issues
interface MarketDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  spread: number;
  indicators: {
    rsi: number;
    macd: number;
    atr: number;
  };
  source: 'MT5' | 'FALLBACK';
}

// Request and response types for our API
interface GetEnrichedMarketDataRequest {
    symbol: string;
    date?: string; // ISO date string
}

interface VolumeProfileData {
    poc: number; // Point of Control
    vah: number; // Value Area High
    val: number; // Value Area Low
    hvnLevels: number[]; // High Volume Node levels
    lvnLevels: number[]; // Low Volume Node levels
}

interface OptionsData {
    gexLevels: { price: number; gex: number }[]; // Gamma Exposure levels
    putCallRatio: number;
}

interface GetEnrichedMarketDataResponse {
    volumeProfile?: VolumeProfileData;
    optionsData?: OptionsData;
    // We can also return the raw market data point if needed
    marketDataPoint?: MarketDataPoint;
}

// API endpoint to get enriched market data for a symbol on a specific date
export const getEnrichedMarketData = api(
    { method: "GET", path: "/enriched-data/:symbol" },
    async ({ symbol, date }: GetEnrichedMarketDataRequest): Promise<GetEnrichedMarketDataResponse> => {
        const targetDate = date ? new Date(date) : new Date();
        console.log(`API Request: Getting enriched market data for ${symbol} on ${targetDate.toISOString().split('T')[0]}`);
        
        try {
            // Fetch volume profile data
            const volumeProfileResult = await dataEnrichmentDB.queryRow`
                SELECT poc, vah, val, hvn_levels, lvn_levels
                FROM volume_profile_data
                WHERE symbol = ${symbol} AND date = ${targetDate}
            `;
            
            // Fetch options data
            const optionsDataResult = await dataEnrichmentDB.queryRow`
                SELECT gex_levels, put_call_ratio
                FROM options_0dte_data
                WHERE symbol = ${symbol} AND date = ${targetDate}
            `;
            
            // Fetch VWAP data
            const vwapResult = await dataEnrichmentDB.queryRow`
                SELECT vwap
                FROM vwap_data
                WHERE symbol = ${symbol} AND date = ${targetDate}
            `;
            
            // Transform database results to API response format
            const volumeProfile: VolumeProfileData | undefined = volumeProfileResult ? {
                poc: Number(volumeProfileResult.poc),
                vah: Number(volumeProfileResult.vah),
                val: Number(volumeProfileResult.val),
                hvnLevels: volumeProfileResult.hvn_levels ? JSON.parse(volumeProfileResult.hvn_levels as string) : [],
                lvnLevels: volumeProfileResult.lvn_levels ? JSON.parse(volumeProfileResult.lvn_levels as string) : []
            } : undefined;
            
            const optionsData: OptionsData | undefined = optionsDataResult ? {
                gexLevels: optionsDataResult.gex_levels ? JSON.parse(optionsDataResult.gex_levels as string) : [],
                putCallRatio: Number(optionsDataResult.put_call_ratio)
            } : undefined;
            
            // We could include VWAP in the response if needed
            // For now, we're just returning volumeProfile and optionsData
            
            return {
                volumeProfile,
                optionsData
            };
        } catch (error) {
            console.error(`Error fetching enriched market data for ${symbol}:`, error);
            // Return empty data if there's an error
            return {
                volumeProfile: {
                    poc: 0,
                    vah: 0,
                    val: 0,
                    hvnLevels: [],
                    lvnLevels: []
                },
                optionsData: {
                    gexLevels: [],
                    putCallRatio: 0
                }
            };
        }
    }
);

// Request and response types for running daily enrichment
interface RunDailyEnrichmentRequest {
    date?: string; // ISO date string
}

interface RunDailyEnrichmentResponse {
    success: boolean;
    message: string;
}

// API endpoint to trigger daily data enrichment
export const triggerDailyEnrichment = api(
    { method: "POST", path: "/enrichment/daily" },
    async ({ date }: RunDailyEnrichmentRequest): Promise<RunDailyEnrichmentResponse> => {
        const targetDate = date ? new Date(date) : new Date();
        console.log(`API Request: Triggering daily enrichment for ${targetDate.toISOString().split('T')[0]}`);
        
        try {
            await runDailyEnrichment(targetDate);
            return {
                success: true,
                message: `Daily enrichment completed for ${targetDate.toISOString().split('T')[0]}`
            };
        } catch (error) {
            console.error("Error in triggerDailyEnrichment:", error);
            return {
                success: false,
                message: `Daily enrichment failed for ${targetDate.toISOString().split('T')[0]}: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
);