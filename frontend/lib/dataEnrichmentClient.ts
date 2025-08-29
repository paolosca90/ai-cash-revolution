// Client for the data enrichment service
import type { VolumeProfileData, OptionsData } from '../../backend/data_enrichment/index';

// Define the types for our API requests and responses
export interface GetEnrichedMarketDataRequest {
    symbol: string;
    date?: string; // ISO date string
}

export interface GetEnrichedMarketDataResponse {
    volumeProfile?: VolumeProfileData;
    optionsData?: OptionsData;
}

export interface RunDailyEnrichmentRequest {
    date?: string; // ISO date string
}

export interface RunDailyEnrichmentResponse {
    success: boolean;
    message: string;
}

// Data enrichment service client
export class DataEnrichmentService {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    // Get enriched market data for a symbol on a specific date
    async getEnrichedMarketData(params: GetEnrichedMarketDataRequest): Promise<GetEnrichedMarketDataResponse> {
        const url = new URL(`${this.baseURL}/data_enrichment/enriched-data/${params.symbol}`);
        
        if (params.date) {
            url.searchParams.append('date', params.date);
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    // Trigger daily data enrichment
    async triggerDailyEnrichment(params: RunDailyEnrichmentRequest): Promise<RunDailyEnrichmentResponse> {
        const response = await fetch(`${this.baseURL}/data_enrichment/enrichment/daily`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }
}

// Export a default instance of the service
const baseURL = import.meta.env.VITE_CLIENT_TARGET || 'http://localhost:4000';
export default new DataEnrichmentService(baseURL);