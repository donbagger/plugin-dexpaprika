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

// Define the schema for the GET_POOL_DETAILS action
export const GetPoolDetailsSchema = z.object({
    network: z.string().min(1).describe('Network ID (e.g., ethereum, solana)'),
    poolAddress: z.string().min(1).describe('Pool address or identifier'),
    inversed: z.boolean().optional().default(false).describe('Whether to invert the price ratio')
});

export type GetPoolDetailsContent = z.infer<typeof GetPoolDetailsSchema> & Content;

export const isGetPoolDetailsContent = (obj: unknown): obj is GetPoolDetailsContent => {
    return GetPoolDetailsSchema.safeParse(obj).success;
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
    name: "GET_POOL_DETAILS",
    similes: [
        "POOL_INFO",
        "LIQUIDITY_POOL_DETAILS",
        "DETAILED_POOL_INFO",
        "VIEW_POOL",
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const content = message.content;
        return isGetPoolDetailsContent(content);
    },
    description: "Get detailed information about a specific pool on a network",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.log("Starting DexPaprika GET_POOL_DETAILS handler...");

        // Initialize or update state
        let currentState = state;
        if (!currentState) {
            currentState = (await runtime.composeState(message)) as State;
        } else {
            currentState = await runtime.updateRecentMessageState(currentState);
        }

        try {
            const content = message.content as GetPoolDetailsContent;
            const { network, poolAddress, inversed = false } = content;
            
            // Get configuration
            const config = getConfig(runtime);
            const client = createApiClient(config.DEXPAPRIKA_API_URL, config.DEXPAPRIKA_API_KEY);
            
            const networkName = network.charAt(0).toUpperCase() + network.slice(1);
            elizaLogger.log(`Fetching details for pool ${poolAddress} on ${networkName}...`);
            const response = await client.get(`/networks/${network}/pools/${poolAddress}`, {
                params: { inversed }
            });

            if (!response.data) {
                throw new Error("No data received from DexPaprika API");
            }

            const pool = response.data;
            const timestamp = new Date().toISOString().replace('T', ' at ').substring(0, 19);
            
            // Format pool data for display
            const token0 = pool.tokens?.[0];
            const token1 = pool.tokens?.[1];
            
            const volumeFormatted = pool.volume_usd ? `$${Number(pool.volume_usd).toLocaleString()}` : 'N/A';
            const priceFormatted = pool.price_usd ? `$${Number(pool.price_usd).toLocaleString()}` : 'N/A';
            const priceChange = pool.last_price_change_usd_24h ? 
                `${(pool.last_price_change_usd_24h * 100).toFixed(2)}%` : 
                'N/A';
            const feeFormatted = pool.fee ? `${(pool.fee * 100).toFixed(3)}%` : 'N/A';
            const tvlFormatted = pool.tvl_usd || pool.total_liquidity_usd ? 
                `$${Number(pool.tvl_usd || pool.total_liquidity_usd).toLocaleString()}` : 
                'N/A';
            
            // Create a readable text response
            const poolTitle = `${token0?.name} (${token0?.symbol}) - ${token1?.name} (${token1?.symbol})`;
            
            const responseText = [
                `Pool Details: ${poolTitle}`,
                `Network: ${networkName}`,
                `DEX: ${pool.dex_name}`,
                `Address: ${poolAddress}`,
                '',
                'Market Information:',
                `Price: ${priceFormatted}`,
                `24h Price Change: ${priceChange}`,
                `Volume: ${volumeFormatted}`,
                `TVL: ${tvlFormatted}`,
                `Fee: ${feeFormatted}`,
                `Transactions: ${pool.transactions?.toLocaleString() || 'N/A'}`,
                '',
                'Pool Tokens:',
                ...pool.tokens.map((token, i) => {
                    return [
                        `Token ${i+1}: ${token.name} (${token.symbol})`,
                        `  Address: ${token.id}`,
                        `  Decimals: ${token.decimals}`,
                    ].join('\n');
                }),
                '',
                `Created: ${new Date(pool.created_at).toLocaleString()}`,
                `Block Number: ${pool.created_at_block_number}`,
            ].join('\n');

            elizaLogger.success(`Successfully retrieved pool details for ${poolAddress}!`);

            if (callback) {
                callback({
                    text: responseText,
                    content: {
                        network: networkName,
                        timestamp,
                        pool_address: poolAddress,
                        dex: pool.dex_name,
                        formatted_response: {
                            title: poolTitle,
                            network: networkName,
                            dex: pool.dex_name,
                            address: poolAddress,
                            created_at: pool.created_at,
                            price: priceFormatted,
                            price_change_24h: priceChange,
                            volume_usd: volumeFormatted,
                            tvl_usd: tvlFormatted,
                            fee: feeFormatted,
                            transactions: pool.transactions?.toLocaleString() || 'N/A',
                            tokens: [
                                {
                                    name: token0?.name,
                                    symbol: token0?.symbol,
                                    address: token0?.id,
                                    decimals: token0?.decimals
                                },
                                {
                                    name: token1?.name,
                                    symbol: token1?.symbol,
                                    address: token1?.id,
                                    decimals: token1?.decimals
                                }
                            ]
                        },
                        raw_data: pool
                    }
                });
            }

            return true;
        } catch (error) {
            elizaLogger.error("Error in GET_POOL_DETAILS handler:", error);

            // Enhanced error handling
            let errorMessage = "Error fetching pool details";
            
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    errorMessage = "Pool not found. Please check the network and pool address and try again.";
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
                    text: "Can you get me details for the ETH-USDC pool on Ethereum?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll get the detailed information for the ETH-USDC pool on Ethereum. I need the specific pool address to look it up. Let me find a popular ETH-USDC pool.",
                    action: "GET_POOL_DETAILS",
                    network: "ethereum",
                    poolAddress: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640" // Uniswap v3 ETH-USDC pool
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Pool Details: Wrapped Ether (WETH) - USD Coin (USDC)\nNetwork: Ethereum\nDEX: Uniswap V3\nAddress: 0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640\n\nMarket Information:\nPrice: $1,824.32\n24h Price Change: -2.15%\nVolume: $270,705,394\nTVL: $531,245,982\nFee: 0.300%\nTransactions: 45,302\n{{dynamic}}",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What are the details of SOL-USDC pool on Jupiter?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll find information about the SOL-USDC pool on Jupiter exchange on Solana.",
                    action: "GET_POOL_DETAILS",
                    network: "solana",
                    poolAddress: "Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtL4Grryfu44Ze" // Jupiter SOL-USDC pool
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Pool Details: Wrapped SOL (SOL) - USD Coin (USDC)\nNetwork: Solana\nDEX: Jupiter\nAddress: Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtL4Grryfu44Ze\n\nMarket Information:\nPrice: $125.65\n24h Price Change: -1.82%\nVolume: $85,304,221\nTVL: $154,872,345\nFee: 0.200%\nTransactions: 32,458\n{{dynamic}}",
                },
            },
        ],
    ] as ActionExample[][],
} as Action; 