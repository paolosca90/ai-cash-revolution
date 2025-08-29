// CBOE data processing logic
// This file contains functions to download and process CBOE Market Stats CSV

import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import * as csv from 'csv-parse/sync';
import { dataEnrichmentDB } from '../db';

// Function to get the URL for the CBOE Market Stats CSV for a given date
function getCBOEStatsUrl(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const yyyymmdd = `${yyyy}-${mm}-${dd}`;
    
    // The URL format for CBOE daily stats CSV
    return `https://cdn.cboe.com/data/us-options-market-statistics/daily-market-statistics/us-options-market-statistics/daily/${yyyymmdd}.csv`;
}

// Function to download the CBOE Market Stats CSV
async function downloadCBOECsv(url: string, filepath: string): Promise<void> {
    console.log(`Downloading CBOE CSV from ${url}`);
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Failed to download CSV: ${response.status} ${response.statusText}`);
        }
        
        const text = await response.text();
        fs.writeFileSync(filepath, text);
        console.log(`CSV downloaded successfully to ${filepath}`);
    } catch (error) {
        console.error(`Error downloading CSV:`, error);
        throw error;
    }
}

// Function to parse the CBOE Market Stats CSV
function parseCBOECsv(filepath: string): any[] {
    console.log(`Parsing CBOE CSV from ${filepath}`);
    
    try {
        const csvContent = fs.readFileSync(filepath, 'utf8');
        const records = csv.parse(csvContent, {
            columns: true,
            skip_empty_lines: true
        });
        
        console.log(`CSV parsed. Number of records: ${records.length}`);
        return records;
    } catch (error) {
        console.error(`Error parsing CSV:`, error);
        throw error;
    }
}

// Function to save CBOE data to database
async function saveCBOEData(
    date: Date, 
    putCallRatio: number, 
    totalPutVolume: number, 
    totalCallVolume: number
): Promise<void> {
    console.log(`Saving CBOE data to database for ${date.toISOString().split('T')[0]}`);
    
    try {
        await dataEnrichmentDB.exec`
            INSERT INTO cboe_daily_data (date, put_call_ratio, total_put_volume, total_call_volume)
            VALUES (${date}, ${putCallRatio}, ${totalPutVolume}, ${totalCallVolume})
            ON CONFLICT (date) 
            DO UPDATE SET 
                put_call_ratio = EXCLUDED.put_call_ratio,
                total_put_volume = EXCLUDED.total_put_volume,
                total_call_volume = EXCLUDED.total_call_volume
        `;
        console.log(`CBOE data saved successfully`);
    } catch (error) {
        console.error(`Error saving CBOE data:`, error);
        throw error;
    }
}

// Main function to process CBOE data
export async function processCBOEData(date: Date): Promise<void> {
    console.log(`Processing CBOE data for ${date.toISOString().split('T')[0]}`);
    
    try {
        // 1. Get the URL for the CSV
        const url = getCBOEStatsUrl(date);
        
        // 2. Download the CSV
        const filename = `cboe_stats_${date.toISOString().split('T')[0]}.csv`;
        const filepath = path.join(process.cwd(), 'temp', filename);
        
        // Ensure temp directory exists
        if (!fs.existsSync(path.join(process.cwd(), 'temp'))) {
            fs.mkdirSync(path.join(process.cwd(), 'temp'), { recursive: true });
        }
        
        await downloadCBOECsv(url, filepath);
        
        // 3. Parse the CSV
        const records = parseCBOECsv(filepath);
        
        // 4. Extract relevant data (Put/Call ratios)
        // TODO: Implement extraction logic based on actual CSV structure
        
        // For now, use placeholder data
        const putCallRatio = 0.85; // Placeholder value
        const totalPutVolume = 5000000; // Placeholder value
        const totalCallVolume = 5882353; // Placeholder value (5000000 / 0.85)
        
        // 5. Process data into structured format
        // (Already done in extraction step)
        
        // 6. Save to database
        await saveCBOEData(date, putCallRatio, totalPutVolume, totalCallVolume);
        
        console.log(`CBOE data processing completed for ${date.toISOString().split('T')[0]}`);
    } catch (error) {
        console.error(`Error processing CBOE data for ${date.toISOString().split('T')[0]}:`, error);
        // TODO: Implement proper error handling and alerting
    }
}