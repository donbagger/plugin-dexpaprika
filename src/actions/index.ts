import axios from 'axios';
import { 
  GetNetworksParams, NetworksResponse,
  GetNetworkDexesParams, NetworkDexesResponse,
  GetTopPoolsParams, PoolsResponse,
  GetNetworkPoolsParams,
  GetDexPoolsParams,
  GetPoolDetailsParams,
  GetTokenDetailsParams,
  SearchParams,
  GetStatsParams,
  FormattedPoolData,
  FormattedResponse,
  StatsResponse,
  TokenDetailsResponse,
  PoolDetailsResponse,
  SearchResultsResponse
} from '../types';
import { getConfig } from '../environment';

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

// Format pool data for better presentation
const formatPoolData = (pools: any[], startIndex = 0): FormattedPoolData[] => {
  return pools.map((pool, index) => {
    const volumeFormatted = typeof pool.volume_usd === 'number' 
      ? `$${pool.volume_usd.toLocaleString('en-US', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })}`
      : 'N/A';
      
    const priceFormatted = typeof pool.price_usd === 'number' 
      ? `$${pool.price_usd.toLocaleString('en-US', { 
          minimumFractionDigits: 4, 
          maximumFractionDigits: 4 
        })}`
      : 'N/A';
      
    const tokenSymbols = pool.tokens.map((t: any) => 
      `${t.name} (${t.symbol})`).join(' - ');
      
    return {
      position: startIndex + index + 1,
      id: pool.id,
      dex: pool.dex_name,
      tokens: tokenSymbols,
      volume: volumeFormatted,
      price: priceFormatted
    };
  });
};

/**
 * Returns a list of all blockchain networks supported by DexPaprika.
 * 
 * Use this action to:
 * - Get a complete list of blockchains available for data queries
 * - Find network IDs needed for other actions
 * - Check which networks are supported by the API
 * 
 * @example
 * // Get all supported blockchain networks
 * const networks = await agent.execute('dexpaprika_getNetworks', {});
 * // Example output:
 * // [
 * //   { "id": "ethereum", "display_name": "Ethereum" },
 * //   { "id": "solana", "display_name": "Solana" },
 * //   ...
 * // ]
 * 
 * @param params - Empty object (no parameters required)
 * @param runtime - ElizaOS runtime environment
 * @returns List of supported blockchain networks
 */
export const getNetworks = async (params: GetNetworksParams, runtime: any) => {
  try {
    const config = getConfig(runtime);
    const client = createApiClient(config.DEXPAPRIKA_API_URL, config.DEXPAPRIKA_API_KEY);
    
    const response = await client.get<NetworksResponse>('/networks');
    return response.data;
  } catch (error) {
    console.error('Error fetching networks:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(`DexPaprika API error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
    }
    throw new Error(`Unexpected error: ${(error as Error).message}`);
  }
};

/**
 * Returns a list of available decentralized exchanges (DEXes) on a specific blockchain network.
 * 
 * Use this action to:
 * - Find which DEXes operate on a particular blockchain
 * - Get DEX identifiers for use with the getDexPools action
 * - Compare DEX availability across different networks
 * 
 * @example
 * // Get all DEXes on Solana
 * const dexes = await agent.execute('dexpaprika_getNetworkDexes', {
 *   network: "solana"
 * });
 * // Example output:
 * // {
 * //   "dexes": [
 * //     { "dex_id": "raydium", "dex_name": "Raydium", "chain": "solana", "protocol": "raydium" },
 * //     { "dex_id": "orca", "dex_name": "Orca", "chain": "solana", "protocol": "orca" }
 * //   ]
 * // }
 * 
 * @param params - Parameters specifying the network and pagination options
 * @param runtime - ElizaOS runtime environment
 * @returns List of DEXes on the specified network
 */
export const getNetworkDexes = async (params: GetNetworkDexesParams, runtime: any) => {
  try {
    const { network, page = 0, limit = 10 } = params;
    const config = getConfig(runtime);
    const client = createApiClient(config.DEXPAPRIKA_API_URL, config.DEXPAPRIKA_API_KEY);
    
    const response = await client.get<NetworkDexesResponse>(`/networks/${network}/dexes`, {
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
};

/**
 * Returns a paginated list of top liquidity pools from all networks.
 * 
 * Use this action to:
 * - Find the most active pools across all blockchains
 * - Track global trading volume and activity
 * - Compare performance between different tokens and pools
 * 
 * @example
 * // Get top 5 pools across all networks by volume
 * const topPools = await agent.execute('dexpaprika_getTopPools', {
 *   limit: 5,
 *   orderBy: "volume_usd",
 *   sort: "desc"
 * });
 * 
 * @param params - Parameters for pagination and sorting
 * @param runtime - ElizaOS runtime environment
 * @returns List of top pools across all networks
 */
export const getTopPools = async (params: GetTopPoolsParams, runtime: any) => {
  try {
    const { page = 0, limit = 10, orderBy = 'volume_usd', sort = 'desc' } = params;
    const config = getConfig(runtime);
    const client = createApiClient(config.DEXPAPRIKA_API_URL, config.DEXPAPRIKA_API_KEY);
    
    const response = await client.get<PoolsResponse>('/pools', {
      params: { page, limit, order_by: orderBy, sort }
    });
    
    // Format pools for better presentation
    if (response.data.pools && Array.isArray(response.data.pools)) {
      const topPools = response.data.pools.slice(0, 5);
      const formattedPools = formatPoolData(topPools);
      const networkName = 'All networks';
      const timestamp = new Date().toISOString().replace('T', ' at ').substring(0, 19);
      
      // Structure the response in a bullet-point friendly format
      const formattedResponse: FormattedResponse = {
        title: `Top ${formattedPools.length} Pools on ${networkName}`,
        timestamp: timestamp,
        pools: formattedPools,
        total_pools: response.data.pools.length,
        top_pool_summary: formattedPools.length > 0 ? {
          name: formattedPools[0].id,
          dex: formattedPools[0].dex,
          tokens: formattedPools[0].tokens,
          volume: formattedPools[0].volume,
          price: formattedPools[0].price
        } : null
      };
      
      return {
        formatted_response: formattedResponse,
        raw_data: {
          pools: topPools,
          page_info: response.data.page_info
        }
      };
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching top pools:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(`DexPaprika API error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
    }
    throw new Error(`Unexpected error: ${(error as Error).message}`);
  }
};

export const getNetworkPools = async (params: GetNetworkPoolsParams, runtime: any) => {
  try {
    const { network, page = 0, limit = 10, orderBy = 'volume_usd', sort = 'desc' } = params;
    const config = getConfig(runtime);
    const client = createApiClient(config.DEXPAPRIKA_API_URL, config.DEXPAPRIKA_API_KEY);
    
    const response = await client.get<PoolsResponse>(`/networks/${network}/pools`, {
      params: { page, limit, order_by: orderBy, sort }
    });
    
    // Format pools for better presentation
    if (response.data.pools && Array.isArray(response.data.pools)) {
      const topPools = response.data.pools.slice(0, 5);
      const formattedPools = formatPoolData(topPools);
      const networkName = network.charAt(0).toUpperCase() + network.slice(1);
      const timestamp = new Date().toISOString().replace('T', ' at ').substring(0, 19);
      
      // Structure the response in a bullet-point friendly format
      const formattedResponse: FormattedResponse = {
        title: `Top ${formattedPools.length} Pools on ${networkName}`,
        timestamp: timestamp,
        pools: formattedPools,
        total_pools: response.data.pools.length,
        top_pool_summary: formattedPools.length > 0 ? {
          name: formattedPools[0].id,
          dex: formattedPools[0].dex,
          tokens: formattedPools[0].tokens,
          volume: formattedPools[0].volume,
          price: formattedPools[0].price
        } : null
      };
      
      return {
        formatted_response: formattedResponse,
        raw_data: {
          pools: topPools,
          page_info: response.data.page_info
        }
      };
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching network pools:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(`DexPaprika API error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
    }
    throw new Error(`Unexpected error: ${(error as Error).message}`);
  }
};

export const getDexPools = async (params: GetDexPoolsParams, runtime: any) => {
  try {
    const { network, dex, page = 0, limit = 10, orderBy = 'volume_usd', sort = 'desc' } = params;
    const config = getConfig(runtime);
    const client = createApiClient(config.DEXPAPRIKA_API_URL, config.DEXPAPRIKA_API_KEY);
    
    const response = await client.get<PoolsResponse>(`/networks/${network}/dexes/${dex}/pools`, {
      params: { page, limit, order_by: orderBy, sort }
    });
    
    // Format pools for better presentation
    if (response.data.pools && Array.isArray(response.data.pools)) {
      const topPools = response.data.pools.slice(0, 5);
      const formattedPools = formatPoolData(topPools);
      const dexName = dex.charAt(0).toUpperCase() + dex.slice(1);
      const networkName = network.charAt(0).toUpperCase() + network.slice(1);
      const timestamp = new Date().toISOString().replace('T', ' at ').substring(0, 19);
      
      // Structure the response in a bullet-point friendly format
      const formattedResponse: FormattedResponse = {
        title: `Top ${formattedPools.length} Pools on ${dexName} (${networkName})`,
        timestamp: timestamp,
        pools: formattedPools,
        total_pools: response.data.pools.length,
        top_pool_summary: formattedPools.length > 0 ? {
          name: formattedPools[0].id,
          dex: formattedPools[0].dex,
          tokens: formattedPools[0].tokens,
          volume: formattedPools[0].volume,
          price: formattedPools[0].price
        } : null
      };
      
      return {
        formatted_response: formattedResponse,
        raw_data: {
          pools: topPools,
          page_info: response.data.page_info
        }
      };
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching DEX pools:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(`DexPaprika API error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
    }
    throw new Error(`Unexpected error: ${(error as Error).message}`);
  }
};

export const getPoolDetails = async (params: GetPoolDetailsParams, runtime: any) => {
  try {
    const { network, poolAddress, inversed = false } = params;
    const config = getConfig(runtime);
    const client = createApiClient(config.DEXPAPRIKA_API_URL, config.DEXPAPRIKA_API_KEY);
    
    const response = await client.get<PoolDetailsResponse>(`/networks/${network}/pools/${poolAddress}`, {
      params: { inversed }
    });

    // Format the response for better readability
    if (response.data) {
      const pool = response.data;
      const timestamp = new Date().toISOString().replace('T', ' at ').substring(0, 19);
      
      // Create a formatted summary
      const tokenSymbols = pool.tokens?.map(t => `${t.name} (${t.symbol})`).join(' - ') || 'Unknown';
      const volumeFormatted = typeof pool.volume_usd === 'number' 
        ? `$${pool.volume_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
        : 'N/A';
      const priceFormatted = typeof pool.price_usd === 'number' 
        ? `$${pool.price_usd.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}` 
        : 'N/A';
      
      return {
        formatted_response: {
          title: `Pool Details: ${tokenSymbols}`,
          timestamp: timestamp,
          pool_id: pool.id,
          network: network.charAt(0).toUpperCase() + network.slice(1),
          dex: pool.dex_name,
          tokens: tokenSymbols,
          price: priceFormatted,
          volume_24h: volumeFormatted,
          created_at: pool.created_at,
          fee: pool.fee !== null ? `${pool.fee * 100}%` : 'N/A',
          price_change_24h: pool.last_price_change_usd_24h ? 
            `${pool.last_price_change_usd_24h > 0 ? '+' : ''}${(pool.last_price_change_usd_24h * 100).toFixed(2)}%` : 
            'N/A',
          total_transactions: pool.transactions?.toLocaleString() || 'N/A'
        },
        raw_data: response.data
      };
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching pool details:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(`DexPaprika API error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
    }
    throw new Error(`Unexpected error: ${(error as Error).message}`);
  }
};

export const getTokenDetails = async (params: GetTokenDetailsParams, runtime: any) => {
  try {
    const { network, tokenAddress } = params;
    const config = getConfig(runtime);
    const client = createApiClient(config.DEXPAPRIKA_API_URL, config.DEXPAPRIKA_API_KEY);
    
    const response = await client.get<TokenDetailsResponse>(`/networks/${network}/tokens/${tokenAddress}`);

    // Format the response for better readability
    if (response.data) {
      const token = response.data;
      const timestamp = new Date().toISOString().replace('T', ' at ').substring(0, 19);
      
      // Create a formatted summary
      const priceFormatted = typeof token.price_usd === 'number' 
        ? `$${token.price_usd.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}` 
        : 'N/A';
      const marketCapFormatted = typeof token.market_cap_usd === 'number' 
        ? `$${token.market_cap_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
        : 'N/A';
      
      return {
        formatted_response: {
          title: `Token Details: ${token.name} (${token.symbol})`,
          timestamp: timestamp,
          token_id: token.id,
          network: network.charAt(0).toUpperCase() + network.slice(1),
          name: token.name,
          symbol: token.symbol,
          price: priceFormatted,
          market_cap: marketCapFormatted,
          total_supply: token.total_supply?.toLocaleString() || 'N/A',
          circulating_supply: token.circulating_supply?.toLocaleString() || 'N/A',
          price_change_24h: token.price_change_24h ? 
            `${token.price_change_24h > 0 ? '+' : ''}${(token.price_change_24h * 100).toFixed(2)}%` : 
            'N/A',
          added_at: token.added_at
        },
        raw_data: response.data
      };
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching token details:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(`DexPaprika API error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
    }
    throw new Error(`Unexpected error: ${(error as Error).message}`);
  }
};

export const search = async (params: SearchParams, runtime: any) => {
  try {
    const { query } = params;
    
    // Validate query parameter
    if (!query || query.trim() === '') {
      throw new Error('Search query cannot be empty');
    }
    
    // Check if the query is too short (DexPaprika API requires at least 3 characters)
    if (query.trim().length < 3) {
      throw new Error('Search query must be at least 3 characters long');
    }
    
    const config = getConfig(runtime);
    const client = createApiClient(config.DEXPAPRIKA_API_URL, config.DEXPAPRIKA_API_KEY);
    
    // Debug log the request details
    console.log('Making search request:');
    console.log(`- Base URL: ${config.DEXPAPRIKA_API_URL}`);
    console.log(`- Endpoint: /search`);
    console.log(`- Query: ${query}`);
    console.log(`- Full URL: ${config.DEXPAPRIKA_API_URL}/search?query=${encodeURIComponent(query)}`);
    
    // Try making a direct axios call outside the client to compare
    console.log('\nTrying direct axios call:');
    try {
      const directResult = await axios.get(`${config.DEXPAPRIKA_API_URL}/search?query=${encodeURIComponent(query)}`);
      console.log(`- Direct call success: ${directResult.status}`);
    } catch (directError: unknown) {
      console.error(`- Direct call failed:`, directError instanceof Error ? directError.message : 'Unknown error');
      if (axios.isAxiosError(directError)) {
        console.error(`  - Status: ${directError.response?.status}`);
        console.error(`  - Data: ${JSON.stringify(directError.response?.data)}`);
      }
    }
    
    try {
      console.log('\nTrying client call:');
      const response = await client.get<SearchResultsResponse>('/search', {
        params: { query }
      });

      // Debug log the response status and data
      console.log(`- Client call success: ${response.status}`);
      console.log(`- Headers: ${JSON.stringify(response.headers)}`);
      console.log(`- Data sample: ${JSON.stringify(response.data).substring(0, 100)}...`);

      // Format the response for better readability
      if (response.data) {
        const { tokens, pools, dexes } = response.data;
        const timestamp = new Date().toISOString().replace('T', ' at ').substring(0, 19);
        
        // Format top results from each category
        const topTokens = tokens?.slice(0, 3).map(token => ({
          id: token.id,
          name: token.name,
          symbol: token.symbol,
          network: token.chain,
          price: token.price_usd ? `$${token.price_usd.toLocaleString('en-US', { 
            minimumFractionDigits: 6, 
            maximumFractionDigits: 6 
          })}` : 'N/A'
        })) || [];
        
        const topPools = pools?.slice(0, 3).map((pool, index) => ({
          position: index + 1,
          id: pool.id,
          dex: pool.dex_name,
          tokens: pool.tokens.map(t => `${t.name} (${t.symbol})`).join(' - '),
          volume: pool.volume_usd ? `$${pool.volume_usd.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })}` : 'N/A',
          network: pool.chain
        })) || [];
        
        const topDexes = dexes?.slice(0, 3).map(dex => ({
          name: dex.dex_name,
          network: dex.chain,
          protocol: dex.protocol
        })) || [];
        
        return {
          formatted_response: {
            title: `Search Results for "${query}"`,
            timestamp: timestamp,
            tokens: {
              count: tokens?.length || 0,
              top_results: topTokens
            },
            pools: {
              count: pools?.length || 0,
              top_results: topPools
            },
            dexes: {
              count: dexes?.length || 0,
              top_results: topDexes
            }
          },
          raw_data: response.data
        };
      }
      
      return response.data;
    } catch (innerError) {
      // Debug log any error details
      console.error(`\nClient call failed:`);
      if (axios.isAxiosError(innerError)) {
        console.error(`- Status: ${innerError.response?.status}`);
        console.error(`- Status text: ${innerError.response?.statusText}`);
        console.error(`- Response data: ${JSON.stringify(innerError.response?.data)}`);
        console.error(`- Request URL: ${innerError.config?.url}`);
        console.error(`- Request method: ${innerError.config?.method}`);
        console.error(`- Request params: ${JSON.stringify(innerError.config?.params)}`);
        console.error(`- Request headers: ${JSON.stringify(innerError.config?.headers)}`);
        
        // Try again with direct URL to see if query parameter is the issue
        try {
          console.log('\nTrying fallback direct URL call:');
          const fallbackResult = await axios.get(`${config.DEXPAPRIKA_API_URL}/search?query=${encodeURIComponent(query)}`);
          console.log(`- Fallback call success: ${fallbackResult.status}`);
          
          // If this worked, return the fallback result
          console.log('Using fallback result');
          return fallbackResult.data;
        } catch (fallbackError: unknown) {
          console.error(`- Fallback call also failed:`, fallbackError instanceof Error ? fallbackError.message : 'Unknown error');
        }
      } else {
        console.error(`- Non-Axios error: ${(innerError as Error).message}`);
        console.error(`- Stack: ${(innerError as Error).stack}`);
      }
      throw innerError; // Re-throw to be caught by outer catch block
    }
  } catch (error) {
    console.error('Error searching DexPaprika:', error);
    if (axios.isAxiosError(error)) {
      // Handle common API errors specifically for search
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error || 'The search query is invalid or too short (min 3 characters required)';
        throw new Error(`DexPaprika search error: ${errorMessage} - To search DexPaprika, try using a more specific query with at least 3 characters. For tokens, try including the full name or symbol.`);
      }
      throw new Error(`DexPaprika API error: ${error.response?.status} - ${error.response?.data?.error || error.message}. Please try a different search term or check your network connection.`);
    }
    throw new Error(`Unexpected error: ${(error as Error).message}. Please try again with a different search term.`);
  }
};

export const getStats = async (params: GetStatsParams, runtime: any) => {
  try {
    const config = getConfig(runtime);
    const client = createApiClient(config.DEXPAPRIKA_API_URL, config.DEXPAPRIKA_API_KEY);
    
    const response = await client.get<StatsResponse>('/stats');

    // Format the response for better readability
    if (response.data) {
      const stats = response.data;
      const timestamp = new Date().toISOString().replace('T', ' at ').substring(0, 19);
      
      // Format volume and other numerical data
      const totalVolumeFormatted = typeof stats.total_volume_usd === 'number' 
        ? `$${stats.total_volume_usd.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })}` 
        : 'N/A';
      
      return {
        formatted_response: {
          title: "DexPaprika Platform Statistics",
          timestamp: timestamp,
          total_networks: stats.networks_count || 0,
          total_dexes: stats.dexes_count || 0,
          total_pools: stats.pools_count || 0,
          total_tokens: stats.tokens_count || 0,
          total_volume_24h: totalVolumeFormatted,
          top_network_by_volume: stats.top_network_by_volume || 'N/A',
          top_dex_by_volume: stats.top_dex_by_volume || 'N/A'
        },
        raw_data: response.data
      };
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching DexPaprika stats:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(`DexPaprika API error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
    }
    throw new Error(`Unexpected error: ${(error as Error).message}`);
  }
};

// Export actions
export const actions = [
  {
    name: 'getNetworks',
    description: 'Retrieve a list of all supported blockchain networks',
    parameters: {
      type: 'object',
      properties: {
        random_string: {
          type: 'string',
          description: 'Dummy parameter for no-parameter tools'
        }
      }
    },
    execute: getNetworks
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
    execute: getNetworkDexes
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
    execute: getTopPools
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
    execute: getNetworkPools
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
    execute: getDexPools
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
    execute: getPoolDetails
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
    execute: getTokenDetails
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
    execute: search
  },
  {
    name: 'getStats',
    description: 'Get high-level statistics about the DexPaprika ecosystem',
    parameters: {
      type: 'object',
      properties: {
        random_string: {
          type: 'string',
          description: 'Dummy parameter for no-parameter tools'
        }
      }
    },
    execute: getStats
  }
]; 