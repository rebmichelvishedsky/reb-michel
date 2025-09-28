// config.js - Environment configuration for memorial website
// This file handles the Airtable API key configuration

// Configuration object that will be populated
window.MEMORIAL_CONFIG = {
    AIRTABLE_BASE_ID: 'YOUR_BASE_ID', // Replace with your actual base ID
    AIRTABLE_API_KEY: ''
};

// Function to initialize configuration from Netlify environment
async function initializeConfig() {
    try {
        // Try to fetch from Netlify function that returns environment variables
        const response = await fetch('/.netlify/functions/get-config');
        if (response.ok) {
            const config = await response.json();
            window.MEMORIAL_CONFIG.AIRTABLE_API_KEY = config.AIRTABLE_API_KEY;
        }
    } catch (error) {
        console.warn('Could not load configuration from environment. Please set up Netlify function.');
    }

    // If no environment config available, try localStorage for development
    if (!window.MEMORIAL_CONFIG.AIRTABLE_API_KEY) {
        const storedKey = localStorage.getItem('AIRTABLE_API_KEY');
        if (storedKey) {
            window.MEMORIAL_CONFIG.AIRTABLE_API_KEY = storedKey;
        }
    }

    // Make the API key available to the main script
    window.AIRTABLE_API_KEY = window.MEMORIAL_CONFIG.AIRTABLE_API_KEY;
}

// Initialize when script loads
initializeConfig();
