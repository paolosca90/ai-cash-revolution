// Volume Profile and VWAP calculation logic
// This file contains functions to calculate volume profile and VWAP from market data

// Function to calculate Volume Profile from market data
export function calculateVolumeProfile(marketData: any[]): any {
    console.log(`Calculating Volume Profile for ${marketData.length} data points`);
    
    if (marketData.length === 0) {
        return {
            poc: 0, // Point of Control
            vah: 0, // Value Area High
            val: 0, // Value Area Low
            hvnLevels: [], // High Volume Node levels
            lvnLevels: []  // Low Volume Node levels
        };
    }
    
    // Find the overall high and low prices
    let high = marketData[0].high;
    let low = marketData[0].low;
    
    for (const data of marketData) {
        if (data.high > high) high = data.high;
        if (data.low < low) low = data.low;
    }
    
    // Define the number of bins for the volume profile (e.g., 50 bins)
    const numBins = 50;
    const priceRange = high - low;
    const binSize = priceRange / numBins;
    
    // Initialize bins
    const bins: { price: number; volume: number }[] = [];
    for (let i = 0; i < numBins; i++) {
        bins.push({ price: low + (i * binSize), volume: 0 });
    }
    
    // Assign volume to bins
    for (const data of marketData) {
        const averagePrice = (data.high + data.low + data.close) / 3;
        const binIndex = Math.floor((averagePrice - low) / binSize);
        
        // Make sure binIndex is within bounds
        if (binIndex >= 0 && binIndex < numBins) {
            bins[binIndex].volume += data.volume;
        }
    }
    
    // Find Point of Control (bin with highest volume)
    let poc = bins[0].price;
    let maxVolume = bins[0].volume;
    
    for (const bin of bins) {
        if (bin.volume > maxVolume) {
            maxVolume = bin.volume;
            poc = bin.price;
        }
    }
    
    // Calculate Value Area (70% of total volume)
    const totalVolume = bins.reduce((sum, bin) => sum + bin.volume, 0);
    const valueAreaVolume = totalVolume * 0.7;
    
    // Sort bins by volume in descending order to find value area
    const sortedBins = [...bins].sort((a, b) => b.volume - a.volume);
    
    // Start with the POC bin
    let accumulatedVolume = maxVolume;
    const valueAreaBins = [bins.find(bin => bin.price === poc)];
    
    // Add bins until we reach 70% of total volume
    for (const bin of sortedBins) {
        if (bin.price === poc) continue; // Skip POC bin as it's already included
        
        if (accumulatedVolume >= valueAreaVolume) break;
        
        valueAreaBins.push(bin);
        accumulatedVolume += bin.volume;
    }
    
    // Determine Value Area High (VAH) and Value Area Low (VAL)
    let vah = poc;
    let val = poc;
    
    for (const bin of valueAreaBins) {
        if (bin && bin.price > vah) vah = bin.price;
        if (bin && bin.price < val) val = bin.price;
    }
    
    // Identify High Volume Nodes (HVN) and Low Volume Nodes (LVN)
    // For simplicity, we'll define HVN as bins with volume > 1.5 * average volume
    // and LVN as bins with volume < 0.5 * average volume
    const averageVolume = totalVolume / numBins;
    const hvnThreshold = averageVolume * 1.5;
    const lvnThreshold = averageVolume * 0.5;
    
    const hvnLevels: number[] = [];
    const lvnLevels: number[] = [];
    
    for (const bin of bins) {
        if (bin.volume > hvnThreshold) {
            hvnLevels.push(bin.price);
        } else if (bin.volume < lvnThreshold) {
            lvnLevels.push(bin.price);
        }
    }
    
    return {
        poc, // Point of Control
        vah, // Value Area High
        val, // Value Area Low
        hvnLevels, // High Volume Node levels
        lvnLevels  // Low Volume Node levels
    };
}

// Function to calculate VWAP (Volume Weighted Average Price)
export function calculateVWAP(marketData: any[]): number {
    console.log(`Calculating VWAP for ${marketData.length} data points`);
    
    if (marketData.length === 0) {
        return 0;
    }
    
    let totalVolumePrice = 0;
    let totalVolume = 0;
    
    for (const data of marketData) {
        // Typical price = (High + Low + Close) / 3
        const typicalPrice = (data.high + data.low + data.close) / 3;
        totalVolumePrice += typicalPrice * data.volume;
        totalVolume += data.volume;
    }
    
    // Avoid division by zero
    if (totalVolume === 0) {
        return 0;
    }
    
    return totalVolumePrice / totalVolume;
}

// Function to save Volume Profile data to database
export async function saveVolumeProfileData(
    db: any, // Database client
    date: Date,
    symbol: string,
    poc: number,
    vah: number,
    val: number,
    hvnLevels: number[],
    lvnLevels: number[]
): Promise<void> {
    console.log(`Saving Volume Profile data to database for ${symbol} on ${date.toISOString().split('T')[0]}`);
    
    try {
        await db.exec`
            INSERT INTO volume_profile_data (date, symbol, poc, vah, val, hvn_levels, lvn_levels)
            VALUES (${date}, ${symbol}, ${poc}, ${vah}, ${val}, ${JSON.stringify(hvnLevels)}, ${JSON.stringify(lvnLevels)})
            ON CONFLICT (date, symbol) 
            DO UPDATE SET 
                poc = EXCLUDED.poc,
                vah = EXCLUDED.vah,
                val = EXCLUDED.val,
                hvn_levels = EXCLUDED.hvn_levels,
                lvn_levels = EXCLUDED.lvn_levels
        `;
        console.log(`Volume Profile data saved successfully for ${symbol}`);
    } catch (error) {
        console.error(`Error saving Volume Profile data for ${symbol}:`, error);
        throw error;
    }
}

// Function to save VWAP data to database
export async function saveVWAPData(
    db: any, // Database client
    date: Date,
    symbol: string,
    vwap: number
): Promise<void> {
    console.log(`Saving VWAP data to database for ${symbol} on ${date.toISOString().split('T')[0]}`);
    
    try {
        await db.exec`
            INSERT INTO vwap_data (date, symbol, vwap)
            VALUES (${date}, ${symbol}, ${vwap})
            ON CONFLICT (date, symbol) 
            DO UPDATE SET 
                vwap = EXCLUDED.vwap
        `;
        console.log(`VWAP data saved successfully for ${symbol}`);
    } catch (error) {
        console.error(`Error saving VWAP data for ${symbol}:`, error);
        throw error;
    }
}