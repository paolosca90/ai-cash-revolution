// Test script for data enrichment service
// This script will test the functionality of our data enrichment modules

import { processCMEData } from './sources/cme';
import { processCBOEData } from './sources/cboe';
import { fetchFinnhubOptionsData } from './sources/finnhub';

async function runTests() {
    console.log('Starting data enrichment tests...');
    
    try {
        // Test CME data processing
        console.log('\n--- Testing CME Data Processing ---');
        const testDate = new Date();
        testDate.setDate(testDate.getDate() - 1); // Use yesterday's date for testing
        await processCMEData(testDate);
        
        // Test CBOE data processing
        console.log('\n--- Testing CBOE Data Processing ---');
        await processCBOEData(testDate);
        
        // Test Finnhub options data fetching
        console.log('\n--- Testing Finnhub Options Data Fetching ---');
        // Note: This will fail without a valid API key
        const optionsData = await fetchFinnhubOptionsData('SPY', testDate);
        console.log('Finnhub options data:', optionsData);
        
        console.log('\nAll tests completed.');
    } catch (error) {
        console.error('Error during tests:', error);
    }
}

// Run the tests
runTests();