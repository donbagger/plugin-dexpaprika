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

// Define the schema for the GET_TOP_POOLS action
export const GetTopPoolsSchema = z.object({
    page: z.number().optional().default(0).describe('Page number for pagination'),
    limit: z.number().optional().default(10).describe('Number of items per page'),
    orderBy: z.enum(['volume_usd', 'price_usd', 'transactions', 'last_price_change_usd_24h', 'created_at'])
        .optional().default('volume_usd').describe('Field to order by'),
    sort: z.enum(['asc', 'desc']).optional().default('desc').describe('Sort order')
});

export type GetTopPoolsContent = z.infer<typeof GetTopPoolsSchema> & Content;

export const isGetTopPoolsContent = (obj: unknown): obj is GetTopPoolsContent => {
    return GetTopPoolsSchema.safeParse(obj).success;
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
    name: "GET_TOP_POOLS",
    similes: [
        "TOP_LIQUIDITY_POOLS",
        "LIST_BEST_POOLS",
        "HIGHEST_VOLUME_POOLS",
        "MOST_ACTIVE_POOLS",
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const content = message.content;
        return isGetTopPoolsContent(content);
    },
    description: "Get a paginated list of top liquidity pools from all networks",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.log("Starting DexPaprika GET_TOP_POOLS handler...");

        // Initialize or update state
        let currentState = state;
        if (!currentState) {
            currentState = (await runtime.composeState(message)) as State;
        } else {
            currentState = await runtime.updateRecentMessageState(currentState);
        }

        try {
            const content = message.content as GetTopPoolsContent;
            const { 
                page = 0, 
                limit = 10, 
                orderBy = 'volume_usd', 
                sort = 'desc' 
            } = content;
            
            // Get configuration
            const config = getConfig(runtime);
            const client = createApiClient(config.DEXPAPRIKA_API_URL, config.DEXPAPRIKA_API_KEY);
            
            elizaLogger.log(`Fetching top ${limit} pools ordered by ${orderBy} ${sort}...`);
            const response = await client.get('/pools', {
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
                    network: pool.chain,
                    volume: volumeFormatted,
                    price: priceFormatted,
                    price_change_24h: priceChange
                };
            });
            
            // Create a readable text response
            const orderingText = `${orderBy.replace('_', ' ')} (${sort === 'desc' ? 'highest to lowest' : 'lowest to highest'})`;
            
            const responseText = [
                `Top Liquidity Pools Across All Networks (Page ${page_info.page + 1} of ${page_info.total_pages})`,
                `Ordered by: ${orderingText}`,
                `Total pools: ${page_info.total_items}`,
                '',
                ...formattedPools.map(pool => {
                    return [
                        `${pool.position}. ${pool.name} (${pool.dex} on ${pool.network})`,
                        `   Volume: ${pool.volume}`,
                        `   Price: ${pool.price} (24h change: ${pool.price_change_24h})`,
                    ].join('\n');
                })
            ].join('\n');

            elizaLogger.success(`Successfully retrieved ${pools.length} top pools!`);

            if (callback) {
                callback({
                    text: responseText,
                    content: {
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
            elizaLogger.error("Error in GET_TOP_POOLS handler:", error);

            // Enhanced error handling
            let errorMessage = "Error fetching top pools";
            
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
                    text: "What are the top liquidity pools across all networks?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll find the top liquidity pools across all blockchain networks.",
                    action: "GET_TOP_POOLS",
                    limit: 5
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Top Liquidity Pools Across All Networks (Page 1 of 20)\nOrdered by: volume usd (highest to lowest)\nTotal pools: 192\n\n1. WETH-USDC (Uniswap V3 on ethereum)\n   Volume: $270,705,394\n   Price: $1,824.32 (24h change: -2.15%)\n{{dynamic}}",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Show me liquidity pools with highest price change",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll find the liquidity pools with the highest price changes in the last 24 hours.",
                    action: "GET_TOP_POOLS",
                    orderBy: "last_price_change_usd_24h",
                    sort: "desc",
                    limit: 5
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Top Liquidity Pools Across All Networks (Page 1 of 20)\nOrdered by: last price change usd 24h (highest to lowest)\nTotal pools: 192\n\n1. ETH-USDT (SushiSwap on ethereum)\n   Volume: $15,305,224\n   Price: $1,821.54 (24h change: 8.32%)\n{{dynamic}}",
                },
            },
        ],
    ] as ActionExample[][],
} as Action; 