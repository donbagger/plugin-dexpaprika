// Response types for various API endpoints
export interface Network {
  id: string;
  display_name: string;
  native_asset_ticker: string;
  explorer: string;
}

export interface TokenData {
  id: string;
  name: string;
  symbol: string;
  chain: string;
  decimals: number;
  added_at: string;
}

export interface PoolData {
  id: string;
  dex_id: string;
  dex_name: string;
  chain: string;
  volume_usd: number;
  created_at: string;
  created_at_block_number: number;
  transactions: number;
  price_usd: number;
  last_price_change_usd_5m: number;
  last_price_change_usd_1h: number;
  last_price_change_usd_24h: number;
  fee: number;
  tokens: TokenData[];
}

export interface PageInfo {
  limit: number;
  page: number;
  total_items: number;
  total_pages: number;
}

export interface NetworksResponse {
  networks: Network[];
}

export interface NetworkDexesResponse {
  dexes: {
    dex_name: string;
    chain: string;
    protocol: string;
  }[];
  page_info: PageInfo;
}

export interface PoolsResponse {
  pools: PoolData[];
  page_info: PageInfo;
}

export interface PoolDetailsResponse extends PoolData {
  total_liquidity_usd?: number;
  tvl_usd?: number;
  reserve_usd?: number;
  reserves?: {
    token_address: string;
    amount: number;
    amount_usd: number;
  }[];
  token_price_usd?: {
    [token_address: string]: number;
  };
}

export interface TokenDetailsResponse extends TokenData {
  address: string;
  price_usd: number;
  price_change_24h: number;
  market_cap_usd: number;
  total_supply: number;
  circulating_supply: number;
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  logo_url?: string;
}

export interface SearchResultsResponse {
  tokens?: TokenData[];
  pools?: PoolData[];
  dexes?: {
    dex_name: string;
    chain: string;
    protocol: string;
  }[];
}

export interface StatsResponse {
  networks_count: number;
  dexes_count: number;
  pools_count: number;
  tokens_count: number;
  total_volume_usd: number;
  updated_at: string;
  top_network_by_volume?: string;
  top_dex_by_volume?: string;
}

export interface FormattedPoolData {
  position: number;
  id: string;
  dex: string;
  tokens: string;
  volume: string;
  price: string;
}

export interface FormattedResponse {
  title: string;
  timestamp: string;
  pools: FormattedPoolData[];
  total_pools: number;
  top_pool_summary: {
    name: string;
    dex: string;
    tokens: string;
    volume: string;
    price: string;
  } | null;
}

// Plugin action parameters types
export interface GetNetworksParams {
  random_string?: string;
}

export interface GetNetworkDexesParams {
  network: string;
  page?: number;
  limit?: number;
}

export interface GetTopPoolsParams {
  page?: number;
  limit?: number;
  orderBy?: 'volume_usd' | 'price_usd' | 'transactions' | 'last_price_change_usd_24h' | 'created_at';
  sort?: 'asc' | 'desc';
}

export interface GetNetworkPoolsParams {
  network: string;
  page?: number;
  limit?: number;
  orderBy?: 'volume_usd' | 'price_usd' | 'transactions' | 'last_price_change_usd_24h' | 'created_at';
  sort?: 'asc' | 'desc';
}

export interface GetDexPoolsParams {
  network: string;
  dex: string;
  page?: number;
  limit?: number;
  orderBy?: 'volume_usd' | 'price_usd' | 'transactions' | 'last_price_change_usd_24h' | 'created_at';
  sort?: 'asc' | 'desc';
}

export interface GetPoolDetailsParams {
  network: string;
  poolAddress: string;
  inversed?: boolean;
}

export interface GetTokenDetailsParams {
  network: string;
  tokenAddress: string;
}

export interface SearchParams {
  query: string;
}

export interface GetStatsParams {
  random_string?: string;
}

// ElizaOS action interface
export interface Action {
  name: string;
  description: string;
  parameters: any;
  execute: (params: any, runtime: any) => Promise<any>;
}

// ElizaOS plugin interface
export interface Plugin {
  name: string;
  description: string;
  version?: string;
  actions?: Action[];
  initialize?: (runtime: any) => Promise<void>;
} 