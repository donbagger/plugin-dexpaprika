import { actions, newActions } from "./actions/index.js";
import { CustomPlugin } from "./types.js";

/**
 * DexPaprika Plugin for ElizaOS
 * 
 * A plugin that integrates DexPaprika's DeFi analytics API with ElizaOS,
 * providing real-time information about blockchain networks, DEXes, 
 * liquidity pools, and tokens.
 * 
 * @author DexPaprika Team
 * @version 0.1.0
 */
export const dexpaprikaPlugin: CustomPlugin = {
    name: "dexpaprika",
    description: "DeFi analytics plugin using DexPaprika API",
    actions: actions,
    evaluators: [],
    providers: [],
    
    // Initialize the plugin with runtime
    initialize: (runtime: any) => {
        const apiUrl = runtime.getSetting('DEXPAPRIKA_API_URL') || 'https://api.dexpaprika.com';
        console.log(`DexPaprika plugin initialized with API URL: ${apiUrl}`);
        return Promise.resolve(true);
    }
};

// For ElizaOS, we also export a version with the new-style actions
export const elizaPlugin = {
    ...dexpaprikaPlugin,
    name: "@elizaos/plugin-dexpaprika",
    actions: newActions
};

// Default export for backward compatibility with tests
export default dexpaprikaPlugin; 