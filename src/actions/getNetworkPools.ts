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

// Define the schema for the GET_NETWORK_POOLS action
export const GetNetworkPoolsSchema = z.object({
    network: z.string().min(1).describe('Network ID (e.g., ethereum, solana)'),
    page: z.number().optional().default(0).describe('Page number for pagination'),
    limit: z.number().optional().default(10).describe('Number of items per page'),
    orderBy: z.enum(['volume_usd', 'price_usd', 'transactions', 'last_price_change_usd_24h', 'created_at'])
        .optional().default('volume_usd').describe('Field to order by'),
    sort: z.enum(['asc', 'desc']).optional().default('desc').describe('Sort order')
});

export type GetNetworkPoolsContent = z.infer<typeof GetNetworkPoolsSchema> & Content;

export const isGetNetworkPoolsContent = (obj: unknown): obj is GetNetworkPoolsContent => {
    return GetNetworkPoolsSchema.safeParse(obj).success;
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
    name: "GET_NETWORK_POOLS",
    similes: [
        "NETWORK_LIQUIDITY_POOLS",
        "LIST_POOLS_BY_NETWORK",
        "CHAIN_POOLS",
        "BLOCKCHAIN_POOLS",
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const content = message.content;
        return isGetNetworkPoolsContent(content);
    },
    description: "Get a list of top liquidity pools on a specific network",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.log("Starting DexPaprika GET_NETWORK_POOLS handler...");

        // Initialize or update state
        let currentState = state;
        if (!currentState) {
            currentState = (await runtime.composeState(message)) as State;
        } else {
            currentState = await runtime.updateRecentMessageState(currentState);
        }

        try {
            const content = message.content as GetNetworkPoolsContent;
            const { 
                network,
                page = 0, 
                limit = 10, 
                orderBy = 'volume_usd', 
                sort = 'desc' 
            } = content;
            
            // Get configuration
            const config = getConfig(runtime);
            const client = createApiClient(config.DEXPAPRIKA_API_URL, config.DEXPAPRIKA_API_KEY);
            
            const networkName = network.charAt(0).toUpperCase() + network.slice(1);
            elizaLogger.log(`Fetching top ${limit} pools on ${networkName} ordered by ${orderBy} ${sort}...`);
            const response = await client.get(`/networks/${network}/pools`, {
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
                    dex: pool.dex_name,
                    volume: volumeFormatted,
                    price: priceFormatted,
                    price_change_24h: priceChange
                };
            });
            
            // Create a readable text response
            const orderingText = `${orderBy.replace('_', ' ')} (${sort === 'desc' ? 'highest to lowest' : 'lowest to highest'})`;
            
            const responseText = [
                `Top Liquidity Pools on ${networkName} (Page ${page_info.page + 1} of ${page_info.total_pages})`,
                `Ordered by: ${orderingText}`,
                `Total pools: ${page_info.total_items}`,
                '',
                ...formattedPools.map(pool => {
                    return [
                        `${pool.position}. ${pool.name} (${pool.dex})`,
                        `   Volume: ${pool.volume}`,
                        `   Price: ${pool.price} (24h change: ${pool.price_change_24h})`,
                    ].join('\n');
                })
            ].join('\n');

            elizaLogger.success(`Successfully retrieved ${pools.length} pools on ${networkName}!`);

            if (callback) {
                callback({
                    text: responseText,
                    content: {
                        network: networkName,
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
            elizaLogger.error("Error in GET_NETWORK_POOLS handler:", error);

            // Enhanced error handling
            let errorMessage = "Error fetching network pools";
            
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    errorMessage = "Network not found. Please check the network ID and try again.";
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
                    text: "What are the top pools on Ethereum?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll find the top liquidity pools on the Ethereum network.",
                    action: "GET_NETWORK_POOLS",
                    network: "ethereum",
                    limit: 5
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Top Liquidity Pools on Ethereum (Page 1 of 15)\nOrdered by: volume usd (highest to lowest)\nTotal pools: 148\n\n1. WETH-USDC (Uniswap V3)\n   Volume: $270,705,394\n   Price: $1,824.32 (24h change: -2.15%)\n{{dynamic}}",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What are the most active pools on Solana?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll check the most active liquidity pools on the Solana network based on transaction count.",
                    action: "GET_NETWORK_POOLS",
                    network: "solana",
                    orderBy: "transactions",
                    limit: 5
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Top Liquidity Pools on Solana (Page 1 of 3)\nOrdered by: transactions (highest to lowest)\nTotal pools: 23\n\n1. SOL-USDC (Jupiter)\n   Volume: $85,304,221\n   Price: $125.65 (24h change: -1.82%)\n{{dynamic}}",
                },
            },
        ],
    ] as ActionExample[][],
} as Action; 