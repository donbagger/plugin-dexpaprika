import { type Action as ElizaAction } from "@elizaos/core";
import axios from "axios";
import GET_NETWORKS from "./getNetworks.js";
import GET_NETWORK_DEXES from "./getNetworkDexes.js";
import GET_TOP_POOLS from "./getTopPools.js";
import GET_NETWORK_POOLS from "./getNetworkPools.js";
import GET_DEX_POOLS from "./getDexPools.js";
import GET_POOL_DETAILS from "./getPoolDetails.js";
import GET_TOKEN_DETAILS from "./getTokenDetails.js";
import SEARCH from "./search.js";

// Define a type for the old-style actions
interface OldAction {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (params: any, runtime: any) => Promise<any>;
}

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

// Export actions in the format expected by the tests
export const actions: OldAction[] = [
  {
    name: 'getNetworks',
    description: 'Get a list of all supported blockchain networks and their metadata',
    parameters: {
      type: 'object',
      properties: {
        random_string: {
          type: 'string',
          description: 'Dummy parameter for no-parameter tools'
        }
      }
    },
    execute: async (params: any, runtime: any) => {
      try {
        const config = {
          DEXPAPRIKA_API_URL: runtime.getSetting('DEXPAPRIKA_API_URL') || 'https://api.dexpaprika.com',
          DEXPAPRIKA_API_KEY: runtime.getSetting('DEXPAPRIKA_API_KEY')
        };
        const client = createApiClient(config.DEXPAPRIKA_API_URL, config.DEXPAPRIKA_API_KEY);
        
        const response = await client.get('/networks');
        return response.data;
      } catch (error) {
        console.error('Error fetching networks:', error);
        if (axios.isAxiosError(error)) {
          throw new Error(`DexPaprika API error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
        }
        throw new Error(`Unexpected error: ${(error as Error).message}`);
      }
    }
  },
  {
    name: 'getNetworkDexes',
    description: 'Get a list of available decentralized exchanges on a specific network',
    parameters: {
      type: 'object',
      properties: {
        network: {
          type: 'string',
          description: 'Network ID (e.g., ethereum, solana)'
        },
        page: {
          type: 'number',
          description: 'Page number for pagination',
          default: 0
        },
        limit: {
          type: 'number',
          description: 'Number of items per page',
          default: 10
        }
      },
      required: ['network']
    },
    execute: async (params: any, runtime: any) => {
      try {
        const { network, page = 0, limit = 10 } = params;
        const config = {
          DEXPAPRIKA_API_URL: runtime.getSetting('DEXPAPRIKA_API_URL') || 'https://api.dexpaprika.com',
          DEXPAPRIKA_API_KEY: runtime.getSetting('DEXPAPRIKA_API_KEY')
        };
        const client = createApiClient(config.DEXPAPRIKA_API_URL, config.DEXPAPRIKA_API_KEY);
        
        const response = await client.get(`/networks/${network}/dexes`, {
          params: { page, limit }
        });
        return response.data;
      } catch (error) {
        console.error('Error fetching network dexes:', error);
        if (axios.isAxiosError(error)) {
          throw new Error(`DexPaprika API error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
        }
        throw new Error(`Unexpected error: ${(error as Error).message}`);
      }
    }
  },
  {
    name: 'getTopPools',
    description: 'Get a paginated list of top liquidity pools from all networks',
    parameters: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Page number for pagination',
          default: 0
        },
        limit: {
          type: 'number',
          description: 'Number of items per page',
          default: 10
        },
        orderBy: {
          type: 'string',
          enum: ['volume_usd', 'price_usd', 'transactions', 'last_price_change_usd_24h', 'created_at'],
          description: 'Field to order by',
          default: 'volume_usd'
        },
        sort: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort order',
          default: 'desc'
        }
      }
    },
    execute: async (params: any, runtime: any) => {
      try {
        const { page = 0, limit = 10, orderBy = 'volume_usd', sort = 'desc' } = params;
        const config = {
          DEXPAPRIKA_API_URL: runtime.getSetting('DEXPAPRIKA_API_URL') || 'https://api.dexpaprika.com',
          DEXPAPRIKA_API_KEY: runtime.getSetting('DEXPAPRIKA_API_KEY')
        };
        const client = createApiClient(config.DEXPAPRIKA_API_URL, config.DEXPAPRIKA_API_KEY);
        
        const response = await client.get('/pools', {
          params: { page, limit, order_by: orderBy, sort }
        });
        
        const timestamp = new Date().toISOString().replace('T', ' at ').substring(0, 19);
        
        return {
          formatted_response: {
            title: `Top Liquidity Pools Across All Networks`,
            timestamp: timestamp,
            pools: response.data.pools?.map((pool: any) => ({
              name: `${pool.tokens?.[0]?.symbol || 'Token1'} - ${pool.tokens?.[1]?.symbol || 'Token2'}`,
              dex: pool.dex_name,
              network: pool.chain,
              volume_usd: `$${Number(pool.volume_usd).toLocaleString()}`,
              price_usd: `$${Number(pool.price_usd).toLocaleString()}`,
              price_change_24h: `${(pool.last_price_change_usd_24h * 100).toFixed(2)}%`
            })) || [],
            page_info: response.data.page_info
          },
          raw_data: response.data
        };
      } catch (error) {
        console.error('Error fetching top pools:', error);
        if (axios.isAxiosError(error)) {
          throw new Error(`DexPaprika API error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
        }
        throw new Error(`Unexpected error: ${(error as Error).message}`);
      }
    }
  },
  {
    name: 'getNetworkPools',
    description: 'Get a list of top liquidity pools on a specific network',
    parameters: {
      type: 'object',
      properties: {
        network: {
          type: 'string',
          description: 'Network ID (e.g., ethereum, solana)'
        },
        page: {
          type: 'number',
          description: 'Page number for pagination',
          default: 0
        },
        limit: {
          type: 'number',
          description: 'Number of items per page',
          default: 10
        },
        orderBy: {
          type: 'string',
          enum: ['volume_usd', 'price_usd', 'transactions', 'last_price_change_usd_24h', 'created_at'],
          description: 'Field to order by',
          default: 'volume_usd'
        },
        sort: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort order',
          default: 'desc'
        }
      },
      required: ['network']
    },
    execute: async (params: any, runtime: any) => {
      try {
        const { network, page = 0, limit = 10, orderBy = 'volume_usd', sort = 'desc' } = params;
        const config = {
          DEXPAPRIKA_API_URL: runtime.getSetting('DEXPAPRIKA_API_URL') || 'https://api.dexpaprika.com',
          DEXPAPRIKA_API_KEY: runtime.getSetting('DEXPAPRIKA_API_KEY')
        };
        const client = createApiClient(config.DEXPAPRIKA_API_URL, config.DEXPAPRIKA_API_KEY);
        
        const response = await client.get(`/networks/${network}/pools`, {
          params: { page, limit, order_by: orderBy, sort }
        });
        
        const timestamp = new Date().toISOString().replace('T', ' at ').substring(0, 19);
        const networkName = network.charAt(0).toUpperCase() + network.slice(1);
        
        return {
          formatted_response: {
            title: `Top Liquidity Pools on ${networkName}`,
            timestamp: timestamp,
            network: networkName,
            pools: response.data.pools?.map((pool: any) => ({
              name: `${pool.tokens?.[0]?.symbol || 'Token1'} - ${pool.tokens?.[1]?.symbol || 'Token2'}`,
              dex: pool.dex_name,
              volume_usd: `$${Number(pool.volume_usd).toLocaleString()}`,
              price_usd: `$${Number(pool.price_usd).toLocaleString()}`,
              price_change_24h: `${(pool.last_price_change_usd_24h * 100).toFixed(2)}%`
            })) || [],
            page_info: response.data.page_info
          },
          raw_data: response.data
        };
      } catch (error) {
        console.error('Error fetching network pools:', error);
        if (axios.isAxiosError(error)) {
          throw new Error(`DexPaprika API error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
        }
        throw new Error(`Unexpected error: ${(error as Error).message}`);
      }
    }
  },
  {
    name: 'getDexPools',
    description: 'Get top pools on a specific DEX within a network',
    parameters: {
      type: 'object',
      properties: {
        network: {
          type: 'string',
          description: 'Network ID (e.g., ethereum, solana)'
        },
        dex: {
          type: 'string',
          description: 'DEX identifier'
        },
        page: {
          type: 'number',
          description: 'Page number for pagination',
          default: 0
        },
        limit: {
          type: 'number',
          description: 'Number of items per page',
          default: 10
        },
        orderBy: {
          type: 'string',
          enum: ['volume_usd', 'price_usd', 'transactions', 'last_price_change_usd_24h', 'created_at'],
          description: 'Field to order by',
          default: 'volume_usd'
        },
        sort: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort order',
          default: 'desc'
        }
      },
      required: ['network', 'dex']
    },
    execute: async (params: any, runtime: any) => {
      try {
        const { network, dex, page = 0, limit = 10, orderBy = 'volume_usd', sort = 'desc' } = params;
        const config = {
          DEXPAPRIKA_API_URL: runtime.getSetting('DEXPAPRIKA_API_URL') || 'https://api.dexpaprika.com',
          DEXPAPRIKA_API_KEY: runtime.getSetting('DEXPAPRIKA_API_KEY')
        };
        const client = createApiClient(config.DEXPAPRIKA_API_URL, config.DEXPAPRIKA_API_KEY);
        
        const response = await client.get(`/networks/${network}/dexes/${dex}/pools`, {
          params: { page, limit, order_by: orderBy, sort }
        });
        
        const timestamp = new Date().toISOString().replace('T', ' at ').substring(0, 19);
        const networkName = network.charAt(0).toUpperCase() + network.slice(1);
        const dexName = dex.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        
        return {
          formatted_response: {
            title: `${dexName} Pools on ${networkName}`,
            timestamp: timestamp,
            network: networkName,
            dex: dexName,
            pools: response.data.pools?.map((pool: any) => ({
              name: `${pool.tokens?.[0]?.symbol || 'Token1'} - ${pool.tokens?.[1]?.symbol || 'Token2'}`,
              volume_usd: `$${Number(pool.volume_usd).toLocaleString()}`,
              price_usd: `$${Number(pool.price_usd).toLocaleString()}`,
              price_change_24h: `${(pool.last_price_change_usd_24h * 100).toFixed(2)}%`
            })) || [],
            page_info: response.data.page_info
          },
          raw_data: response.data
        };
      } catch (error) {
        console.error('Error fetching DEX pools:', error);
        if (axios.isAxiosError(error)) {
          throw new Error(`DexPaprika API error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
        }
        throw new Error(`Unexpected error: ${(error as Error).message}`);
      }
    }
  },
  {
    name: 'getPoolDetails',
    description: 'Get detailed information about a specific pool on a network',
    parameters: {
      type: 'object',
      properties: {
        network: {
          type: 'string',
          description: 'Network ID (e.g., ethereum, solana)'
        },
        poolAddress: {
          type: 'string',
          description: 'Pool address or identifier'
        },
        inversed: {
          type: 'boolean',
          description: 'Whether to invert the price ratio',
          default: false
        }
      },
      required: ['network', 'poolAddress']
    },
    execute: async (params: any, runtime: any) => {
      try {
        const { network, poolAddress, inversed = false } = params;
        const config = {
          DEXPAPRIKA_API_URL: runtime.getSetting('DEXPAPRIKA_API_URL') || 'https://api.dexpaprika.com',
          DEXPAPRIKA_API_KEY: runtime.getSetting('DEXPAPRIKA_API_KEY')
        };
        const client = createApiClient(config.DEXPAPRIKA_API_URL, config.DEXPAPRIKA_API_KEY);
        
        const response = await client.get(`/networks/${network}/pools/${poolAddress}`, {
          params: { inversed }
        });
        
        const pool = response.data;
        const timestamp = new Date().toISOString().replace('T', ' at ').substring(0, 19);
        const token0 = pool.tokens?.[0];
        const token1 = pool.tokens?.[1];
        
        return {
          formatted_response: {
            title: `${token0?.name} (${token0?.symbol}) - ${token1?.name} (${token1?.symbol})`,
            timestamp: timestamp,
            network: network.charAt(0).toUpperCase() + network.slice(1),
            dex: pool.dex_name,
            created_at: pool.created_at,
            price: `$${Number(pool.price_usd).toLocaleString()}`,
            price_change_24h: `${(pool.last_price_change_usd_24h * 100).toFixed(2)}%`,
            volume_usd: `$${Number(pool.volume_usd).toLocaleString()}`,
            tvl_usd: `$${Number(pool.tvl_usd || pool.total_liquidity_usd).toLocaleString()}`,
            fee: `${(pool.fee * 100).toFixed(2)}%`,
            transactions: pool.transactions.toLocaleString(),
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
          raw_data: response.data
        };
      } catch (error) {
        console.error('Error fetching pool details:', error);
        if (axios.isAxiosError(error)) {
          throw new Error(`DexPaprika API error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
        }
        throw new Error(`Unexpected error: ${(error as Error).message}`);
      }
    }
  },
  {
    name: 'getTokenDetails',
    description: 'Get detailed information about a specific token on a network',
    parameters: {
      type: 'object',
      properties: {
        network: {
          type: 'string',
          description: 'Network ID (e.g., ethereum, solana)'
        },
        tokenAddress: {
          type: 'string',
          description: 'Token address or identifier'
        }
      },
      required: ['network', 'tokenAddress']
    },
    execute: async (params: any, runtime: any) => {
      try {
        const { network, tokenAddress } = params;
        const config = {
          DEXPAPRIKA_API_URL: runtime.getSetting('DEXPAPRIKA_API_URL') || 'https://api.dexpaprika.com',
          DEXPAPRIKA_API_KEY: runtime.getSetting('DEXPAPRIKA_API_KEY')
        };
        const client = createApiClient(config.DEXPAPRIKA_API_URL, config.DEXPAPRIKA_API_KEY);
        
        const response = await client.get(`/networks/${network}/tokens/${tokenAddress}`);
        
        const token = response.data;
        const timestamp = new Date().toISOString().replace('T', ' at ').substring(0, 19);
        
        return {
          formatted_response: {
            title: `${token.name} (${token.symbol})`,
            timestamp: timestamp,
            network: network.charAt(0).toUpperCase() + network.slice(1),
            address: token.address || token.id,
            price_usd: `$${Number(token.price_usd).toLocaleString()}`,
            price_change_24h: `${(token.price_change_24h * 100).toFixed(2)}%`,
            market_cap: `$${Number(token.market_cap_usd).toLocaleString()}`,
            total_supply: Number(token.total_supply).toLocaleString(),
            circulating_supply: Number(token.circulating_supply).toLocaleString(),
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
          raw_data: response.data
        };
      } catch (error) {
        console.error('Error fetching token details:', error);
        if (axios.isAxiosError(error)) {
          throw new Error(`DexPaprika API error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
        }
        throw new Error(`Unexpected error: ${(error as Error).message}`);
      }
    }
  },
  {
    name: 'search',
    description: 'Search for tokens, pools, and DEXes by name or identifier',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term (e.g., "uniswap", "bitcoin", or a token address)'
        }
      },
      required: ['query']
    },
    execute: async (params: any, runtime: any) => {
      try {
        const { query } = params;
        const config = {
          DEXPAPRIKA_API_URL: runtime.getSetting('DEXPAPRIKA_API_URL') || 'https://api.dexpaprika.com',
          DEXPAPRIKA_API_KEY: runtime.getSetting('DEXPAPRIKA_API_KEY')
        };
        const client = createApiClient(config.DEXPAPRIKA_API_URL, config.DEXPAPRIKA_API_KEY);
        
        const response = await client.get('/search', {
          params: { query }
        });
        
        // Format the response for better readability
        if (response.data) {
          const { tokens, pools, dexes } = response.data;
          const timestamp = new Date().toISOString().replace('T', ' at ').substring(0, 19);
          
          return {
            formatted_response: {
              title: `Search Results for "${query}"`,
              timestamp: timestamp,
              tokens: {
                count: tokens?.length || 0,
                top_results: tokens?.slice(0, 3) || []
              },
              pools: {
                count: pools?.length || 0,
                top_results: pools?.slice(0, 3) || []
              },
              dexes: {
                count: dexes?.length || 0,
                top_results: dexes?.slice(0, 3) || []
              }
            },
            raw_data: response.data
          };
        }
        
        return response.data;
      } catch (error) {
        console.error('Error searching DexPaprika:', error);
        if (axios.isAxiosError(error)) {
          throw new Error(`DexPaprika API error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
        }
        throw new Error(`Unexpected error: ${(error as Error).message}`);
      }
    }
  }
];

// Export the new format actions for the new plugin structure
export const newActions: ElizaAction[] = [
  GET_NETWORKS,
  GET_NETWORK_DEXES,
  GET_TOP_POOLS,
  GET_NETWORK_POOLS,
  GET_DEX_POOLS,
  GET_POOL_DETAILS,
  GET_TOKEN_DETAILS,
  SEARCH,
];

// Export both for backward compatibility
export default [...actions, ...newActions.map(action => ({
  ...action,
  // Keep the original name for backward compatibility with ElizaOS
  name: action.name.toLowerCase().replace(/_/g, ''),
}))]; 