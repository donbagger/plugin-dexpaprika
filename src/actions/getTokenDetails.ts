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

// Define the schema for the GET_TOKEN_DETAILS action
export const GetTokenDetailsSchema = z.object({
    network: z.string().min(1).describe('Network ID (e.g., ethereum, solana)'),
    tokenAddress: z.string().min(1).describe('Token address or identifier')
});

export type GetTokenDetailsContent = z.infer<typeof GetTokenDetailsSchema> & Content;

export const isGetTokenDetailsContent = (obj: unknown): obj is GetTokenDetailsContent => {
    return GetTokenDetailsSchema.safeParse(obj).success;
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
    name: "GET_TOKEN_DETAILS",
    similes: [
        "TOKEN_INFO",
        "GET_CRYPTO_DETAILS",
        "DETAILED_TOKEN_INFO",
        "VIEW_TOKEN",
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const content = message.content;
        return isGetTokenDetailsContent(content);
    },
    description: "Get detailed information about a specific token on a network",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.log("Starting DexPaprika GET_TOKEN_DETAILS handler...");

        // Initialize or update state
        let currentState = state;
        if (!currentState) {
            currentState = (await runtime.composeState(message)) as State;
        } else {
            currentState = await runtime.updateRecentMessageState(currentState);
        }

        try {
            const content = message.content as GetTokenDetailsContent;
            const { network, tokenAddress } = content;
            
            // Get configuration
            const config = getConfig(runtime);
            const client = createApiClient(config.DEXPAPRIKA_API_URL, config.DEXPAPRIKA_API_KEY);
            
            const networkName = network.charAt(0).toUpperCase() + network.slice(1);
            elizaLogger.log(`Fetching details for token ${tokenAddress} on ${networkName}...`);
            const response = await client.get(`/networks/${network}/tokens/${tokenAddress}`);

            if (!response.data) {
                throw new Error("No data received from DexPaprika API");
            }

            const token = response.data;
            const timestamp = new Date().toISOString().replace('T', ' at ').substring(0, 19);
            
            // Format token data for display
            const priceFormatted = token.price_usd ? `$${Number(token.price_usd).toLocaleString()}` : 'N/A';
            const priceChange = token.price_change_24h ? 
                `${(token.price_change_24h * 100).toFixed(2)}%` : 
                'N/A';
            const marketCap = token.market_cap_usd ? 
                `$${Number(token.market_cap_usd).toLocaleString()}` : 
                'N/A';
            const totalSupply = token.total_supply ? 
                Number(token.total_supply).toLocaleString() : 
                'N/A';
            const circulatingSupply = token.circulating_supply ? 
                Number(token.circulating_supply).toLocaleString() : 
                'N/A';
            
            // Create a readable text response
            const tokenTitle = `${token.name} (${token.symbol})`;
            
            const responseText = [
                `Token Details: ${tokenTitle}`,
                `Network: ${networkName}`,
                `Address: ${token.address || token.id}`,
                '',
                'Market Information:',
                `Price: ${priceFormatted}`,
                `24h Price Change: ${priceChange}`,
                `Market Cap: ${marketCap}`,
                `Total Supply: ${totalSupply}`,
                `Circulating Supply: ${circulatingSupply}`,
                `Decimals: ${token.decimals}`,
                '',
                token.description ? `Description: ${token.description}` : '',
                '',
                'Links:',
                token.website ? `Website: ${token.website}` : '',
                token.twitter ? `Twitter: ${token.twitter}` : '',
                token.telegram ? `Telegram: ${token.telegram}` : '',
                token.discord ? `Discord: ${token.discord}` : '',
                '',
                `Added to DexPaprika: ${new Date(token.added_at).toLocaleDateString()}`,
            ].filter(line => line !== '').join('\n');

            elizaLogger.success(`Successfully retrieved token details for ${tokenAddress}!`);

            if (callback) {
                callback({
                    text: responseText,
                    content: {
                        network: networkName,
                        timestamp,
                        token_address: tokenAddress,
                        formatted_response: {
                            title: tokenTitle,
                            network: networkName,
                            address: token.address || token.id,
                            price_usd: priceFormatted,
                            price_change_24h: priceChange,
                            market_cap: marketCap,
                            total_supply: totalSupply,
                            circulating_supply: circulatingSupply,
                            decimals: token.decimals,
                            added_at: token.added_at,
                            links: {
                                website: token.website,
                                twitter: token.twitter,
                                telegram: token.telegram,
                                discord: token.discord
                            },
                            description: token.description
                        },
                        raw_data: token
                    }
                });
            }

            return true;
        } catch (error) {
            elizaLogger.error("Error in GET_TOKEN_DETAILS handler:", error);

            // Enhanced error handling
            let errorMessage = "Error fetching token details";
            
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    errorMessage = "Token not found. Please check the network and token address and try again.";
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
                    text: "What are the details of Ethereum token?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll fetch the details for the Ethereum token.",
                    action: "GET_TOKEN_DETAILS",
                    network: "ethereum",
                    tokenAddress: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" // WETH address
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Token Details: Wrapped Ether (WETH)\nNetwork: Ethereum\nAddress: 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2\n\nMarket Information:\nPrice: $1,824.32\n24h Price Change: -2.15%\nMarket Cap: $220,742,581,452\nTotal Supply: 120,950,243\nCirculating Supply: 120,210,584\nDecimals: 18\n\nDescription: Wrapped Ether (WETH) is a tokenized version of Ether\n\nLinks:\nWebsite: https://ethereum.org\nTwitter: @ethereum\n{{dynamic}}",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Tell me about USDC token on Solana",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll get the information about USD Coin (USDC) on the Solana network.",
                    action: "GET_TOKEN_DETAILS",
                    network: "solana",
                    tokenAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" // USDC on Solana
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Token Details: USD Coin (USDC)\nNetwork: Solana\nAddress: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v\n\nMarket Information:\nPrice: $1.00\n24h Price Change: 0.01%\nMarket Cap: $28,355,824,052\nTotal Supply: 28,355,824,052\nCirculating Supply: 28,355,824,052\nDecimals: 6\n\nDescription: USD Coin (USDC) is a fully collateralized US dollar stablecoin\n\nLinks:\nWebsite: https://www.circle.com/usdc\nTwitter: @circle\n{{dynamic}}",
                },
            },
        ],
    ] as ActionExample[][],
} as Action; 