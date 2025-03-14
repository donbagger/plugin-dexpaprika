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

// Define the schema for the GET_DEX_POOLS action
export const GetDexPoolsSchema = z.object({
    network: z.string().min(1).describe('Network ID (e.g., ethereum, solana)'),
    dex: z.string().min(1).describe('DEX identifier'),
    page: z.number().optional().default(0).describe('Page number for pagination'),
    limit: z.number().optional().default(10).describe('Number of items per page'),
    orderBy: z.enum(['volume_usd', 'price_usd', 'transactions', 'last_price_change_usd_24h', 'created_at'])
        .optional().default('volume_usd').describe('Field to order by'),
    sort: z.enum(['asc', 'desc']).optional().default('desc').describe('Sort order')
});

export type GetDexPoolsContent = z.infer<typeof GetDexPoolsSchema> & Content;

export const isGetDexPoolsContent = (obj: unknown): obj is GetDexPoolsContent => {
    return GetDexPoolsSchema.safeParse(obj).success;
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

// Format DEX name for display
const formatDexName = (dex: string): string => {
    return dex.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default {
    name: "GET_DEX_POOLS",
    similes: [
        "DEX_LIQUIDITY_POOLS",
        "LIST_POOLS_BY_DEX",
        "EXCHANGE_POOLS",
        "SPECIFIC_DEX_POOLS",
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const content = message.content;
        return isGetDexPoolsContent(content);
    },
    description: "Get top pools on a specific DEX within a network",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.log("Starting DexPaprika GET_DEX_POOLS handler...");

        // Initialize or update state
        let currentState = state;
        if (!currentState) {
            currentState = (await runtime.composeState(message)) as State;
        } else {
            currentState = await runtime.updateRecentMessageState(currentState);
        }

        try {
            const content = message.content as GetDexPoolsContent;
            const { 
                network,
                dex,
                page = 0, 
                limit = 10, 
                orderBy = 'volume_usd', 
                sort = 'desc' 
            } = content;
            
            // Get configuration
            const config = getConfig(runtime);
            const client = createApiClient(config.DEXPAPRIKA_API_URL, config.DEXPAPRIKA_API_KEY);
            
            const networkName = network.charAt(0).toUpperCase() + network.slice(1);
            const dexName = formatDexName(dex);
            
            elizaLogger.log(`Fetching top ${limit} pools on ${dexName} (${networkName}) ordered by ${orderBy} ${sort}...`);
            const response = await client.get(`/networks/${network}/dexes/${dex}/pools`, {
                params: { 
                    page, 
                    limit, 
                    order_by: orderBy, 
                    sort 
                }
            });

            if (!response.data) {
                throw new Error("No data received from DexPaprika API");
            }

            const { pools, page_info } = response.data;
            const timestamp = new Date().toISOString().replace('T', ' at ').substring(0, 19);
            
            // Format pools for display
            const formattedPools = pools.map((pool, index) => {
                const token0 = pool.tokens?.[0]?.symbol || 'Token1';
                const token1 = pool.tokens?.[1]?.symbol || 'Token2';
                const volumeFormatted = `$${Number(pool.volume_usd).toLocaleString()}`;
                const priceFormatted = `$${Number(pool.price_usd).toLocaleString()}`;
                const priceChange = pool.last_price_change_usd_24h ? 
                    `${(pool.last_price_change_usd_24h * 100).toFixed(2)}%` : 
                    'N/A';
                
                return {
                    position: index + 1,
                    name: `${token0}-${token1}`,
                    volume: volumeFormatted,
                    price: priceFormatted,
                    price_change_24h: priceChange,
                    transactions: pool.transactions?.toLocaleString() || 'N/A'
                };
            });
            
            // Create a readable text response
            const orderingText = `${orderBy.replace('_', ' ')} (${sort === 'desc' ? 'highest to lowest' : 'lowest to highest'})`;
            
            const responseText = [
                `Top Liquidity Pools on ${dexName} (${networkName})`,
                `Page ${page_info.page + 1} of ${page_info.total_pages}`,
                `Ordered by: ${orderingText}`,
                `Total pools: ${page_info.total_items}`,
                '',
                ...formattedPools.map(pool => {
                    return [
                        `${pool.position}. ${pool.name}`,
                        `   Volume: ${pool.volume}`,
                        `   Price: ${pool.price} (24h change: ${pool.price_change_24h})`,
                        `   Transactions: ${pool.transactions}`,
                    ].join('\n');
                })
            ].join('\n');

            elizaLogger.success(`Successfully retrieved ${pools.length} pools on ${dexName} (${networkName})!`);

            if (callback) {
                callback({
                    text: responseText,
                    content: {
                        network: networkName,
                        dex: dexName,
                        timestamp,
                        pools: formattedPools,
                        page_info: page_info,
                        order_by: orderBy,
                        sort: sort
                    }
                });
            }

            return true;
        } catch (error) {
            elizaLogger.error("Error in GET_DEX_POOLS handler:", error);

            // Enhanced error handling
            let errorMessage = "Error fetching DEX pools";
            
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    errorMessage = "Network or DEX not found. Please check the IDs and try again.";
                } else if (error.response?.status === 429) {
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
                    text: "What are the top pools on Uniswap V3 on Ethereum?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll find the top liquidity pools on Uniswap V3 on the Ethereum network.",
                    action: "GET_DEX_POOLS",
                    network: "ethereum",
                    dex: "uniswap_v3",
                    limit: 5
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Top Liquidity Pools on Uniswap V3 (Ethereum)\nPage 1 of 8\nOrdered by: volume usd (highest to lowest)\nTotal pools: 78\n\n1. WETH-USDC\n   Volume: $270,705,394\n   Price: $1,824.32 (24h change: -2.15%)\n   Transactions: 45,302\n{{dynamic}}",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Show me pools on Jupiter exchange on Solana",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll check the liquidity pools on Jupiter exchange on the Solana network.",
                    action: "GET_DEX_POOLS",
                    network: "solana",
                    dex: "jupiter",
                    limit: 5
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Top Liquidity Pools on Jupiter (Solana)\nPage 1 of 3\nOrdered by: volume usd (highest to lowest)\nTotal pools: 23\n\n1. SOL-USDC\n   Volume: $85,304,221\n   Price: $125.65 (24h change: -1.82%)\n   Transactions: 32,458\n{{dynamic}}",
                },
            },
        ],
    ] as ActionExample[][],
} as Action; 