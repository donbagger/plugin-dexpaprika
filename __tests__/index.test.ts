import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dexpaprikaPlugin } from '../src';
import * as axios from 'axios';
import {
  NetworksResponse,
  NetworkDexesResponse,
  PoolsResponse,
  PoolDetailsResponse,
  TokenDetailsResponse,
  SearchResultsResponse,
  StatsResponse
} from '../src/types';

// Mock axios
vi.mock('axios', () => {
  const axiosInstance = {
    get: vi.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: {
        use: vi.fn()
      }
    }
  };
  
  return {
    default: {
      create: vi.fn(() => axiosInstance)
    },
    isAxiosError: vi.fn().mockReturnValue(false)
  };
});

describe('DexPaprika Plugin', () => {
  const mockRuntime = {
    getSetting: vi.fn((key) => {
      if (key === 'DEXPAPRIKA_API_KEY') return 'test-api-key';
      if (key === 'DEXPAPRIKA_API_URL') return 'https://api.dexpaprika.com';
      return null;
    })
  };

  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export the plugin with required properties', () => {
    expect(dexpaprikaPlugin).toBeDefined();
    expect(dexpaprikaPlugin.name).toBe('dexpaprika');
    expect(dexpaprikaPlugin.description).toBeDefined();
    expect(dexpaprikaPlugin.actions).toBeDefined();
    expect(Array.isArray(dexpaprikaPlugin.actions)).toBe(true);
    expect(dexpaprikaPlugin.actions?.length).toBeGreaterThan(0);
  });

  it('should have initialize method', async () => {
    expect(typeof dexpaprikaPlugin.initialize).toBe('function');
    
    // Test initialize method
    const consoleSpy = vi.spyOn(console, 'log');
    await dexpaprikaPlugin.initialize?.(mockRuntime);
    expect(consoleSpy).toHaveBeenCalledWith(
      'DexPaprika plugin initialized with API URL: https://api.dexpaprika.com'
    );
  });

  it('should have actions with required properties', () => {
    const actions = dexpaprikaPlugin.actions || [];
    
    // Check each action has the required properties
    actions.forEach(action => {
      expect(action).toBeDefined();
      expect(action.name).toBeDefined();
      expect(action.description).toBeDefined();
      expect(action.parameters).toBeDefined();
      expect(typeof action.execute).toBe('function');
    });
    
    // Check that all expected actions exist
    const actionNames = actions.map(a => a.name);
    expect(actionNames).toContain('getNetworks');
    expect(actionNames).toContain('getNetworkDexes');
    expect(actionNames).toContain('getTopPools');
    expect(actionNames).toContain('getNetworkPools');
    expect(actionNames).toContain('getDexPools');
    expect(actionNames).toContain('getPoolDetails');
    expect(actionNames).toContain('getTokenDetails');
    expect(actionNames).toContain('search');
    expect(actionNames).toContain('getStats');
  });

  describe('Actions', () => {
    // Helper to find an action by name
    const getAction = (name: string) => {
      return dexpaprikaPlugin.actions?.find(a => a.name === name);
    };

    // Mock responses
    const mockNetworksResponse = {
      networks: [
        { id: 'ethereum', display_name: 'Ethereum', native_asset_ticker: 'ETH', explorer: 'https://etherscan.io' },
        { id: 'solana', display_name: 'Solana', native_asset_ticker: 'SOL', explorer: 'https://solscan.io' }
      ]
    };

    const mockNetworkDexesResponse = {
      dexes: [
        { dex_name: 'Uniswap V3', chain: 'ethereum', protocol: 'uniswapv3' },
        { dex_name: 'SushiSwap', chain: 'ethereum', protocol: 'uniswapv2' }
      ],
      page_info: { limit: 10, page: 1, total_items: 2, total_pages: 1 }
    };

    const mockPoolsResponse = {
      pools: [
        {
          id: 'pool1',
          dex_id: 'uniswap_v3',
          dex_name: 'Uniswap V3',
          chain: 'ethereum',
          volume_usd: 1000000,
          created_at: '2023-01-01T00:00:00Z',
          created_at_block_number: 12345678,
          transactions: 1000,
          price_usd: 1800,
          last_price_change_usd_5m: 0.01,
          last_price_change_usd_1h: 0.05,
          last_price_change_usd_24h: -0.02,
          fee: 0.003,
          tokens: [
            { id: 'eth', name: 'Ethereum', symbol: 'ETH', chain: 'ethereum', decimals: 18, added_at: '2023-01-01T00:00:00Z' },
            { id: 'usdc', name: 'USD Coin', symbol: 'USDC', chain: 'ethereum', decimals: 6, added_at: '2023-01-01T00:00:00Z' }
          ]
        }
      ],
      page_info: { limit: 10, page: 1, total_items: 1, total_pages: 1 }
    };

    const mockPoolDetailsResponse = {
      id: 'pool1',
      dex_id: 'uniswap_v3',
      dex_name: 'Uniswap V3',
      chain: 'ethereum',
      volume_usd: 1000000,
      created_at: '2023-01-01T00:00:00Z',
      created_at_block_number: 12345678,
      transactions: 1000,
      price_usd: 1800,
      last_price_change_usd_5m: 0.01,
      last_price_change_usd_1h: 0.05,
      last_price_change_usd_24h: -0.02,
      fee: 0.003,
      tokens: [
        { id: 'eth', name: 'Ethereum', symbol: 'ETH', chain: 'ethereum', decimals: 18, added_at: '2023-01-01T00:00:00Z' },
        { id: 'usdc', name: 'USD Coin', symbol: 'USDC', chain: 'ethereum', decimals: 6, added_at: '2023-01-01T00:00:00Z' }
      ],
      total_liquidity_usd: 5000000,
      tvl_usd: 5000000,
      reserve_usd: 5000000,
      reserves: [
        { token_address: 'eth', amount: 100, amount_usd: 2500000 },
        { token_address: 'usdc', amount: 2500000, amount_usd: 2500000 }
      ]
    };

    const mockTokenDetailsResponse = {
      id: 'eth',
      name: 'Ethereum',
      symbol: 'ETH',
      chain: 'ethereum',
      decimals: 18,
      added_at: '2023-01-01T00:00:00Z',
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      price_usd: 1800,
      price_change_24h: -0.02,
      market_cap_usd: 200000000000,
      total_supply: 120000000,
      circulating_supply: 110000000,
      description: 'Ethereum is a decentralized platform',
      website: 'https://ethereum.org',
      twitter: '@ethereum',
      telegram: '@ethereum',
      discord: 'ethereum',
      logo_url: 'https://example.com/eth.png'
    };

    const mockSearchResultsResponse = {
      tokens: [
        { id: 'eth', name: 'Ethereum', symbol: 'ETH', chain: 'ethereum', decimals: 18, added_at: '2023-01-01T00:00:00Z' }
      ],
      pools: [
        {
          id: 'pool1',
          dex_id: 'uniswap_v3',
          dex_name: 'Uniswap V3',
          chain: 'ethereum',
          volume_usd: 1000000,
          created_at: '2023-01-01T00:00:00Z',
          created_at_block_number: 12345678,
          transactions: 1000,
          price_usd: 1800,
          last_price_change_usd_5m: 0.01,
          last_price_change_usd_1h: 0.05,
          last_price_change_usd_24h: -0.02,
          fee: 0.003,
          tokens: [
            { id: 'eth', name: 'Ethereum', symbol: 'ETH', chain: 'ethereum', decimals: 18, added_at: '2023-01-01T00:00:00Z' },
            { id: 'usdc', name: 'USD Coin', symbol: 'USDC', chain: 'ethereum', decimals: 6, added_at: '2023-01-01T00:00:00Z' }
          ]
        }
      ],
      dexes: [
        { dex_name: 'Uniswap V3', chain: 'ethereum', protocol: 'uniswapv3' }
      ]
    };

    const mockStatsResponse = {
      networks_count: 10,
      dexes_count: 100,
      pools_count: 5000,
      tokens_count: 10000,
      total_volume_usd: 5000000000,
      updated_at: '2023-01-01T00:00:00Z',
      top_network_by_volume: 'ethereum',
      top_dex_by_volume: 'Uniswap V3'
    };

    describe('getNetworks', () => {
      it('should get networks successfully', async () => {
        const action = getAction('getNetworks');
        expect(action).toBeDefined();

        // Mock axios response
        const axiosCreate = vi.mocked(axios.default.create);
        const mockAxiosGet = vi.fn().mockResolvedValueOnce({ data: mockNetworksResponse });
        axiosCreate.mockReturnValue({ 
          get: mockAxiosGet,
          interceptors: { request: { use: vi.fn() } } 
        } as any);

        // Execute the action
        const result = await action?.execute({ random_string: 'test' }, mockRuntime);
        
        // Verify API call
        expect(mockAxiosGet).toHaveBeenCalledWith('/networks');
        
        // Verify result
        expect(result).toEqual(mockNetworksResponse);
      });

      it('should handle API errors', async () => {
        const action = getAction('getNetworks');
        expect(action).toBeDefined();

        // Mock axios to throw an error
        const axiosCreate = vi.mocked(axios.default.create);
        const mockError = new Error('API error');
        const mockAxiosGet = vi.fn().mockRejectedValue(mockError);
        
        axiosCreate.mockReturnValue({ 
          get: mockAxiosGet,
          interceptors: { request: { use: vi.fn() } } 
        } as any);
        
        // We don't test the exact error message but just that it throws
        await expect(action?.execute({ random_string: 'test' }, mockRuntime)).rejects.toThrow();
      });
    });

    describe('getNetworkDexes', () => {
      it('should get network dexes successfully', async () => {
        const action = getAction('getNetworkDexes');
        expect(action).toBeDefined();

        // Mock axios response
        const axiosCreate = vi.mocked(axios.default.create);
        const mockAxiosGet = vi.fn().mockResolvedValueOnce({ data: mockNetworkDexesResponse });
        axiosCreate.mockReturnValue({ 
          get: mockAxiosGet,
          interceptors: { request: { use: vi.fn() } } 
        } as any);

        // Execute the action
        const result = await action?.execute({ network: 'ethereum' }, mockRuntime);
        
        // Verify API call
        expect(mockAxiosGet).toHaveBeenCalledWith('/networks/ethereum/dexes', {
          params: { page: 0, limit: 10 }
        });
        
        // Verify result
        expect(result).toEqual(mockNetworkDexesResponse);
      });
    });

    describe('getTopPools', () => {
      it('should get top pools successfully', async () => {
        const action = getAction('getTopPools');
        expect(action).toBeDefined();

        // Mock axios response
        const axiosCreate = vi.mocked(axios.default.create);
        const mockAxiosGet = vi.fn().mockResolvedValueOnce({ data: mockPoolsResponse });
        axiosCreate.mockReturnValue({ 
          get: mockAxiosGet,
          interceptors: { request: { use: vi.fn() } } 
        } as any);

        // Execute the action
        const result = await action?.execute({ limit: 10, orderBy: 'volume_usd', sort: 'desc' }, mockRuntime);
        
        // Verify API call
        expect(mockAxiosGet).toHaveBeenCalledWith('/pools', {
          params: { page: 0, limit: 10, order_by: 'volume_usd', sort: 'desc' }
        });
        
        // Verify result has both formatted and raw data
        expect(result).toHaveProperty('formatted_response');
        expect(result).toHaveProperty('raw_data');
        expect(result.formatted_response).toHaveProperty('title');
        expect(result.formatted_response).toHaveProperty('pools');
      });
    });

    describe('getNetworkPools', () => {
      it('should get network pools successfully', async () => {
        const action = getAction('getNetworkPools');
        expect(action).toBeDefined();

        // Mock axios response
        const axiosCreate = vi.mocked(axios.default.create);
        const mockAxiosGet = vi.fn().mockResolvedValueOnce({ data: mockPoolsResponse });
        axiosCreate.mockReturnValue({ 
          get: mockAxiosGet,
          interceptors: { request: { use: vi.fn() } } 
        } as any);

        // Execute the action
        const result = await action?.execute({ 
          network: 'ethereum', 
          limit: 10, 
          orderBy: 'volume_usd', 
          sort: 'desc' 
        }, mockRuntime);
        
        // Verify API call
        expect(mockAxiosGet).toHaveBeenCalledWith('/networks/ethereum/pools', {
          params: { page: 0, limit: 10, order_by: 'volume_usd', sort: 'desc' }
        });
        
        // Verify result
        expect(result).toHaveProperty('formatted_response');
        expect(result.formatted_response.title).toContain('Ethereum');
      });
    });

    describe('getDexPools', () => {
      it('should get dex pools successfully', async () => {
        const action = getAction('getDexPools');
        expect(action).toBeDefined();

        // Mock axios response
        const axiosCreate = vi.mocked(axios.default.create);
        const mockAxiosGet = vi.fn().mockResolvedValueOnce({ data: mockPoolsResponse });
        axiosCreate.mockReturnValue({ 
          get: mockAxiosGet,
          interceptors: { request: { use: vi.fn() } } 
        } as any);

        // Execute the action
        const result = await action?.execute({ 
          network: 'ethereum',
          dex: 'uniswap_v3',
          limit: 10, 
          orderBy: 'volume_usd', 
          sort: 'desc' 
        }, mockRuntime);
        
        // Verify API call
        expect(mockAxiosGet).toHaveBeenCalledWith('/networks/ethereum/dexes/uniswap_v3/pools', {
          params: { page: 0, limit: 10, order_by: 'volume_usd', sort: 'desc' }
        });
        
        // Verify result
        expect(result).toHaveProperty('formatted_response');
        expect(result.formatted_response.title).toContain('Uniswap');
        expect(result.formatted_response.title).toContain('Ethereum');
      });
    });

    describe('getPoolDetails', () => {
      it('should get pool details successfully', async () => {
        const action = getAction('getPoolDetails');
        expect(action).toBeDefined();

        // Mock axios response
        const axiosCreate = vi.mocked(axios.default.create);
        const mockAxiosGet = vi.fn().mockResolvedValueOnce({ data: mockPoolDetailsResponse });
        axiosCreate.mockReturnValue({ 
          get: mockAxiosGet,
          interceptors: { request: { use: vi.fn() } } 
        } as any);

        // Execute the action
        const result = await action?.execute({ 
          network: 'ethereum',
          poolAddress: 'pool1' 
        }, mockRuntime);
        
        // Verify API call
        expect(mockAxiosGet).toHaveBeenCalledWith('/networks/ethereum/pools/pool1', {
          params: { inversed: false }
        });
        
        // Verify result
        expect(result).toHaveProperty('formatted_response');
        expect(result).toHaveProperty('raw_data');
        expect(result.formatted_response.title).toContain('Ethereum (ETH) - USD Coin (USDC)');
      });
    });

    describe('getTokenDetails', () => {
      it('should get token details successfully', async () => {
        const action = getAction('getTokenDetails');
        expect(action).toBeDefined();

        // Mock axios response
        const axiosCreate = vi.mocked(axios.default.create);
        const mockAxiosGet = vi.fn().mockResolvedValueOnce({ data: mockTokenDetailsResponse });
        axiosCreate.mockReturnValue({ 
          get: mockAxiosGet,
          interceptors: { request: { use: vi.fn() } } 
        } as any);

        // Execute the action
        const result = await action?.execute({ 
          network: 'ethereum',
          tokenAddress: 'eth' 
        }, mockRuntime);
        
        // Verify API call
        expect(mockAxiosGet).toHaveBeenCalledWith('/networks/ethereum/tokens/eth');
        
        // Verify result
        expect(result).toHaveProperty('formatted_response');
        expect(result).toHaveProperty('raw_data');
        expect(result.formatted_response.title).toContain('Ethereum (ETH)');
      });
    });

    describe('search', () => {
      it('should search successfully', async () => {
        const action = getAction('search');
        expect(action).toBeDefined();

        // Mock axios response
        const axiosCreate = vi.mocked(axios.default.create);
        const mockAxiosGet = vi.fn().mockResolvedValueOnce({ data: mockSearchResultsResponse });
        axiosCreate.mockReturnValue({ 
          get: mockAxiosGet,
          interceptors: { request: { use: vi.fn() } } 
        } as any);

        // Execute the action
        const result = await action?.execute({ query: 'ethereum' }, mockRuntime);
        
        // Verify API call
        expect(mockAxiosGet).toHaveBeenCalledWith('/search', {
          params: { query: 'ethereum' }
        });
        
        // Verify result
        expect(result).toHaveProperty('formatted_response');
        expect(result).toHaveProperty('raw_data');
        expect(result.formatted_response.title).toContain('ethereum');
      });

      it('should handle empty search results', async () => {
        const action = getAction('search');
        expect(action).toBeDefined();

        // Mock empty response
        const axiosCreate = vi.mocked(axios.default.create);
        const mockAxiosGet = vi.fn().mockResolvedValueOnce({ data: { tokens: [], pools: [], dexes: [] } });
        axiosCreate.mockReturnValue({ 
          get: mockAxiosGet,
          interceptors: { request: { use: vi.fn() } } 
        } as any);

        // Execute the action
        const result = await action?.execute({ query: 'nonexistent' }, mockRuntime);
        
        // Verify result has zero counts
        expect(result.formatted_response.tokens.count).toBe(0);
        expect(result.formatted_response.pools.count).toBe(0);
        expect(result.formatted_response.dexes.count).toBe(0);
      });
    });

    describe('getStats', () => {
      it('should get stats successfully', async () => {
        const action = getAction('getStats');
        expect(action).toBeDefined();

        // Mock axios response
        const axiosCreate = vi.mocked(axios.default.create);
        const mockAxiosGet = vi.fn().mockResolvedValueOnce({ data: mockStatsResponse });
        axiosCreate.mockReturnValue({ 
          get: mockAxiosGet,
          interceptors: { request: { use: vi.fn() } } 
        } as any);

        // Execute the action
        const result = await action?.execute({ random_string: 'test' }, mockRuntime);
        
        // Verify API call
        expect(mockAxiosGet).toHaveBeenCalledWith('/stats');
        
        // Verify result
        expect(result).toHaveProperty('formatted_response');
        expect(result).toHaveProperty('raw_data');
        expect(result.formatted_response.title).toBe('DexPaprika Platform Statistics');
        expect(result.formatted_response.total_networks).toBe(10);
        expect(result.formatted_response.total_dexes).toBe(100);
      });
    });
  });
}); 