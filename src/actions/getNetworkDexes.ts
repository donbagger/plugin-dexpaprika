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

// Define the schema for the GET_NETWORK_DEXES action
export const GetNetworkDexesSchema = z.object({
    network: z.string().min(1).describe('Network ID (e.g., ethereum, solana)'),
    page: z.number().optional().default(0).describe('Page number for pagination'),
    limit: z.number().optional().default(10).describe('Number of items per page')
});

export type GetNetworkDexesContent = z.infer<typeof GetNetworkDexesSchema> & Content;

export const isGetNetworkDexesContent = (obj: unknown): obj is GetNetworkDexesContent => {
    return GetNetworkDexesSchema.safeParse(obj).success;
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
    name: "GET_NETWORK_DEXES",
    similes: [
        "LIST_DEXES",
        "SHOW_DEXES",
        "EXCHANGES_ON_NETWORK",
        "FIND_DEXES_BY_NETWORK",
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const content = message.content;
        return isGetNetworkDexesContent(content);
    },
    description: "Get a list of available decentralized exchanges on a specific network",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.log("Starting DexPaprika GET_NETWORK_DEXES handler...");

        // Initialize or update state
        let currentState = state;
        if (!currentState) {
            currentState = (await runtime.composeState(message)) as State;
        } else {
            currentState = await runtime.updateRecentMessageState(currentState);
        }

        try {
            const content = message.content as GetNetworkDexesContent;
            const { network, page = 0, limit = 10 } = content;
            
            // Get configuration
            const config = getConfig(runtime);
            const client = createApiClient(config.DEXPAPRIKA_API_URL, config.DEXPAPRIKA_API_KEY);
            
            elizaLogger.log(`Fetching DEXes for network: ${network}...`);
            const response = await client.get(`/networks/${network}/dexes`, {
                params: { page, limit }
            });

            if (!response.data) {
                throw new Error("No data received from DexPaprika API");
            }

            const { dexes, page_info } = response.data;
            const networkName = network.charAt(0).toUpperCase() + network.slice(1);
            
            // Format the response for better readability
            const responseText = [
                `DEXes on ${networkName} (Page ${page_info.page + 1} of ${page_info.total_pages}):`,
                `Found ${page_info.total_items} DEXes.`,
                '',
                ...dexes.map((dex, index) => {
                    return `${index + 1}. ${dex.dex_name} (Protocol: ${dex.protocol})`;
                })
            ].join('\n');

            elizaLogger.success(`Successfully retrieved ${dexes.length} DEXes for ${networkName}!`);

            if (callback) {
                callback({
                    text: responseText,
                    content: {
                        network: networkName,
                        dexes: dexes,
                        page_info: page_info,
                        timestamp: new Date().toISOString()
                    }
                });
            }

            return true;
        } catch (error) {
            elizaLogger.error("Error in GET_NETWORK_DEXES handler:", error);

            // Enhanced error handling
            let errorMessage = "Error fetching DEX data";
            
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
                    text: "What DEXes are available on Ethereum?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll find the decentralized exchanges available on Ethereum.",
                    action: "GET_NETWORK_DEXES",
                    network: "ethereum"
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "DEXes on Ethereum (Page 1 of 4):\nFound 38 DEXes.\n\n1. Uniswap V3 (Protocol: uniswapv3)\n2. Uniswap V2 (Protocol: uniswapv2)\n{{dynamic}}",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Show me exchanges on Solana",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll check what decentralized exchanges are available on Solana.",
                    action: "GET_NETWORK_DEXES",
                    network: "solana"
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "DEXes on Solana (Page 1 of 1):\nFound 4 DEXes.\n\n1. Jupiter (Protocol: jupiter)\n{{dynamic}}",
                },
            },
        ],
    ] as ActionExample[][],
} as Action; 