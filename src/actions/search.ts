import {
    type ActionExample,
    composeContext,
    type Content,
    elizaLogger,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
    type Action
} from "@elizaos/core";
import axios from "axios";
import { z } from "zod";
import { getConfig } from "../environment";

// Define the schema for the SEARCH action
export const SearchSchema = z.object({
    query: z.string().min(1).describe('Search term (e.g., "uniswap", "bitcoin", or a token address)')
});

export type SearchContent = z.infer<typeof SearchSchema> & Content;

export const isSearchContent = (obj: unknown): obj is SearchContent => {
    return SearchSchema.safeParse(obj).success;
};

// Create API client
const createApiClient = (baseURL: string, apiKey?: string) => {
    const client = axios.create({ baseURL });
    
    // Add API key if provided
    if (apiKey) {
        client.interceptors.request.use(config => {
            config.headers['Authorization'] = `Bearer ${apiKey}`;
            return config;
        });
    }
    
    return client;
};

export default {
    name: "SEARCH",
    similes: [
        "FIND",
        "LOOKUP",
        "SEARCH_CRYPTO",
        "FIND_TOKEN_OR_POOL",
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const content = message.content;
        return isSearchContent(content);
    },
    description: "Search for tokens, pools, and DEXes by name or identifier",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.log("Starting DexPaprika SEARCH handler...");

        // Initialize or update state
        let currentState = state;
        if (!currentState) {
            currentState = (await runtime.composeState(message)) as State;
        } else {
            currentState = await runtime.updateRecentMessageState(currentState);
        }

        try {
            const content = message.content as SearchContent;
            const { query } = content;
            
            // Get configuration
            const config = getConfig(runtime);
            const client = createApiClient(config.DEXPAPRIKA_API_URL, config.DEXPAPRIKA_API_KEY);
            
            elizaLogger.log(`Searching for "${query}"...`);
            const response = await client.get('/search', {
                params: { query }
            });

            if (!response.data) {
                throw new Error("No data received from DexPaprika API");
            }

            const { tokens, pools, dexes } = response.data;
            const timestamp = new Date().toISOString().replace('T', ' at ').substring(0, 19);
            
            // Format for display
            const tokenResults = (tokens || []).slice(0, 5).map((token, index) => {
                const price = token.price_usd ? `$${Number(token.price_usd).toLocaleString()}` : 'N/A';
                return {
                    position: index + 1,
                    name: `${token.name} (${token.symbol})`,
                    network: token.chain,
                    price: price,
                    address: token.id
                };
            });
            
            const poolResults = (pools || []).slice(0, 5).map((pool, index) => {
                const token0 = pool.tokens?.[0]?.symbol || 'Token1';
                const token1 = pool.tokens?.[1]?.symbol || 'Token2';
                const volumeFormatted = `$${Number(pool.volume_usd).toLocaleString()}`;
                return {
                    position: index + 1,
                    name: `${token0}-${token1}`,
                    dex: pool.dex_name,
                    network: pool.chain,
                    volume: volumeFormatted,
                    address: pool.id
                };
            });
            
            const dexResults = (dexes || []).slice(0, 5).map((dex, index) => {
                return {
                    position: index + 1,
                    name: dex.dex_name,
                    network: dex.chain,
                    protocol: dex.protocol
                };
            });
            
            // Create a readable text response
            const sections = [];
            
            if (tokens?.length) {
                sections.push(
                    `Tokens (${tokens.length} found):`,
                    ...tokenResults.map(token => {
                        return `${token.position}. ${token.name} (${token.network}) - ${token.price}`;
                    }),
                    ''
                );
            }
            
            if (pools?.length) {
                sections.push(
                    `Pools (${pools.length} found):`,
                    ...poolResults.map(pool => {
                        return `${pool.position}. ${pool.name} on ${pool.dex} (${pool.network}) - Volume: ${pool.volume}`;
                    }),
                    ''
                );
            }
            
            if (dexes?.length) {
                sections.push(
                    `DEXes (${dexes.length} found):`,
                    ...dexResults.map(dex => {
                        return `${dex.position}. ${dex.name} on ${dex.network} (Protocol: ${dex.protocol})`;
                    }),
                    ''
                );
            }
            
            if (sections.length === 0) {
                sections.push(`No results found for "${query}". Try a different search term.`);
            } else {
                sections.unshift(`Search Results for "${query}":`);
            }
            
            const responseText = sections.join('\n');

            elizaLogger.success(`Search completed for "${query}" - Found ${tokens?.length || 0} tokens, ${pools?.length || 0} pools, ${dexes?.length || 0} DEXes`);

            if (callback) {
                callback({
                    text: responseText,
                    content: {
                        query,
                        timestamp,
                        formatted_response: {
                            title: `Search Results for "${query}"`,
                            timestamp: timestamp,
                            tokens: {
                                count: tokens?.length || 0,
                                top_results: tokenResults
                            },
                            pools: {
                                count: pools?.length || 0,
                                top_results: poolResults
                            },
                            dexes: {
                                count: dexes?.length || 0,
                                top_results: dexResults
                            }
                        },
                        raw_data: response.data
                    }
                });
            }

            return true;
        } catch (error) {
            elizaLogger.error("Error in SEARCH handler:", error);

            // Enhanced error handling
            let errorMessage = "Error searching DexPaprika";
            
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 429) {
                    errorMessage = "Rate limit exceeded. Please try again later.";
                } else {
                    errorMessage = `API error: ${error.response?.status} - ${error.response?.data?.error || error.message}`;
                }
            } else {
                errorMessage = `Error: ${error.message}`;
            }

            if (callback) {
                callback({
                    text: errorMessage,
                    content: {
                        error: error.message,
                        statusCode: axios.isAxiosError(error) ? error.response?.status : undefined
                    },
                });
            }
            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Search for Bitcoin",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll search for Bitcoin in the DexPaprika database.",
                    action: "SEARCH",
                    query: "bitcoin"
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Search Results for \"bitcoin\":\n\nTokens (8 found):\n1. Bitcoin (BTC) (ethereum) - $63,245.32\n2. Wrapped Bitcoin (WBTC) (ethereum) - $63,218.54\n3. Bitcoin Cash (BCH) (ethereum) - $378.12\n4. Bitcoin SV (BSV) (ethereum) - $62.84\n5. Bitcoin Gold (BTG) (ethereum) - $42.15\n\nPools (12 found):\n1. WBTC-USDC on Uniswap V3 (ethereum) - Volume: $125,304,221\n{{dynamic}}",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Find information about Uniswap",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll search for Uniswap in the DexPaprika database.",
                    action: "SEARCH",
                    query: "uniswap"
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Search Results for \"uniswap\":\n\nTokens (3 found):\n1. Uniswap (UNI) (ethereum) - $8.45\n\nPools (75 found):\n1. UNI-WETH on Uniswap V3 (ethereum) - Volume: $15,304,221\n2. UNI-USDC on Uniswap V3 (ethereum) - Volume: $8,245,124\n{{dynamic}}\n\nDEXes (3 found):\n1. Uniswap V3 on ethereum (Protocol: uniswapv3)\n2. Uniswap V2 on ethereum (Protocol: uniswapv2)\n3. Uniswap on arbitrum (Protocol: uniswapv3)",
                },
            },
        ],
    ] as ActionExample[][],
} as Action; 