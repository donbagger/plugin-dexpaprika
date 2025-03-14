import {
    type ActionExample,
    composeContext,
    type Content,
    elizaLogger,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
    type Action,
    type ActionHandler,
    type CallbackFn
} from "@elizaos/core";
import axios, { AxiosInstance } from "axios";
import { z } from "zod";
import { getConfig } from "../config.js";

// Define the schema for this action
const GET_NETWORKS_SCHEMA = z.object({
    random_string: z.string().optional().describe("Dummy parameter for no-parameter tools"),
});

// Infer the type from the schema
type GetNetworksContent = z.infer<typeof GET_NETWORKS_SCHEMA>;

// Type guard for content
function isGetNetworksContent(content: unknown): content is GetNetworksContent {
    return GET_NETWORKS_SCHEMA.safeParse(content).success;
}

// Create API client
const createApiClient = (baseURL: string, apiKey?: string): AxiosInstance => {
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

// Export the action
const GET_NETWORKS: Action = {
    name: "GET_NETWORKS",
    similes: ["get blockchain networks", "list supported networks", "show available chains", "display blockchain networks"],
    validate: (content): content is GetNetworksContent => isGetNetworksContent(content),
    description: "Retrieve a list of all supported blockchain networks and their metadata",
    schema: GET_NETWORKS_SCHEMA,
    handler: (async (content, state, context, callback) => {
        state.log("Getting networks");
        state.updatePartialResponse("Retrieving list of supported blockchain networks...");
        
        const { DEXPAPRIKA_API_URL, DEXPAPRIKA_API_KEY } = getConfig(context);
        const client = createApiClient(DEXPAPRIKA_API_URL, DEXPAPRIKA_API_KEY);
        
        try {
            const response = await client.get('/networks');
            const networks = response.data;
            
            // Format the response for better readability
            const formattedNetworks = networks.map((network: any) => ({
                id: network.id,
                name: network.name,
                chainId: network.chain_id,
                dexCount: network.dex_count,
                poolCount: network.pool_count,
                tokenCount: network.token_count,
                volumeUSD: `$${Number(network.volume_usd).toLocaleString()}`
            }));
            
            // Create a formatted text response
            const formattedText = `
# Supported Blockchain Networks
Here are the blockchain networks supported by DexPaprika:

${formattedNetworks.map((network: any) => `
## ${network.name} (${network.id})
- Chain ID: ${network.chainId}
- DEXes: ${network.dexCount}
- Pools: ${network.poolCount}
- Tokens: ${network.tokenCount}
- Volume: ${network.volumeUSD}
`).join('')}
`;
            
            return callback({
                type: "success",
                content: formattedText,
                data: {
                    formatted_networks: formattedNetworks,
                    raw_networks: networks
                }
            });
        } catch (error) {
            state.log(`Error fetching networks: ${error}`);
            
            // Handle different types of errors
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    return callback({
                        type: "error",
                        content: "The networks endpoint could not be found. The API might be down or the endpoint has changed.",
                    });
                } else if (error.response?.status === 429) {
                    return callback({
                        type: "error",
                        content: "Rate limit exceeded. Please try again later or consider using an API key.",
                    });
                } else {
                    return callback({
                        type: "error",
                        content: `API error: ${error.response?.status} - ${error.response?.data?.error || error.message}`,
                    });
                }
            }
            
            return callback({
                type: "error",
                content: `Unexpected error while fetching networks: ${(error as Error).message}`,
            });
        }
    }) as ActionHandler,
    
    // Examples of user inputs that would trigger this action
    examples: [
        {
            user: "What blockchain networks are supported?",
            agent: "Let me fetch the list of supported blockchain networks for you. This will show you all the networks that DexPaprika provides data for."
        },
        {
            user: "Show me all the available networks",
            agent: "I'll retrieve the complete list of blockchain networks supported by DexPaprika, including their statistics."
        },
        {
            user: "Which chains can I get data for?",
            agent: "Let me check which blockchain networks are available in DexPaprika. This will provide information about each supported chain."
        }
    ]
};

export default GET_NETWORKS; 