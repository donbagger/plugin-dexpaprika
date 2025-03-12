import { Plugin } from './types';
import { actions } from './actions';

/**
 * DexPaprika Plugin for ElizaOS
 * 
 * Provides real-time data on DEX pools, tokens, and networks across multiple blockchains
 * using the DexPaprika API.
 * 
 * @version 0.1.0
 */
export const dexpaprikaPlugin: Plugin = {
  name: 'dexpaprika',
  description: 'DeFi analytics plugin using DexPaprika API',
  version: '0.1.0',
  actions: actions,
  
  // Initialize the plugin with runtime
  initialize: async (runtime) => {
    // Verify required settings
    const apiUrl = runtime.getSetting('DEXPAPRIKA_API_URL');
    console.log(`DexPaprika plugin initialized with API URL: ${apiUrl || 'https://api.dexpaprika.com'}`);
  }
};

// Default export
export default dexpaprikaPlugin; 