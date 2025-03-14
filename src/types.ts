/**
 * DexPaprika Plugin Type Definitions
 * 
 * This file contains the type definitions for the DexPaprika API.
 * These types are structured to make it clear what each function does and
 * help AI agents understand how to properly use the plugin's capabilities.
 */

import { type Action as ElizaAction, type Plugin as ElizaPlugin } from "@elizaos/core";

// Define a type for the old-style actions
export interface OldAction {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (params: any, runtime: any) => Promise<any>;
}

// Define a hybrid interface for both old and new action types
export interface CustomPlugin extends Omit<ElizaPlugin, 'actions'> {
  name: string;
  description: string;
  actions: OldAction[];
  evaluators: any[];
  providers: any[];
  initialize: (runtime: any) => Promise<boolean> | void;
}

// -----------------------------------------------------------------------------
// BASE NETWORK TYPES
// -----------------------------------------------------------------------------

/**
 * Information about a blockchain network supported by DexPaprika.
 * 
 * @example
 * {
 *   "id": "ethereum",
 *   "display_name": "Ethereum",
 *   "native_asset_ticker": "ETH",
 *   "explorer": "https://etherscan.io"
 * }
 */
export interface Network {
  /** Network identifier (e.g., "ethereum", "solana") */
  id: string;
  /** User-friendly network name (e.g., "Ethereum", "Solana") */
  display_name: string;
  /** The native token symbol for this network (e.g., "ETH", "SOL") */
  native_asset_ticker?: string;
  /** URL to the blockchain explorer for this network */
  explorer?: string;
}

/**
 * Response from the getNetworks action, containing a list of supported blockchain networks.
 * 
 * @example
 * {
 *   "networks": [
 *     {
 *       "id": "ethereum",
 *       "display_name": "Ethereum",
 *       "native_asset_ticker": "ETH",
 *       "explorer": "https://etherscan.io"
 *     },
 *     {
 *       "id": "solana",
 *       "display_name": "Solana",
 *       "native_asset_ticker": "SOL",
 *       "explorer": "https://solscan.io"
 *     }
 *   ]
 * }
 */
export interface NetworksResponse {
  /** List of blockchain networks supported by the API */
  networks: Network[];
}

// -----------------------------------------------------------------------------
// DEX TYPES
// -----------------------------------------------------------------------------

/**
 * Information about a decentralized exchange (DEX) on a specific blockchain.
 * 
 * @example
 * {
 *   "dex_id": "raydium",
 *   "dex_name": "Raydium",
 *   "chain": "solana",
 *   "protocol": "raydium"
 * }
 */
export interface Dex {
  /** Internal identifier for the DEX */
  dex_id: string;
  /** Human-readable name of the DEX */
  dex_name: string;
  /** Blockchain network the DEX operates on */
  chain: string;
  /** Protocol type or family the DEX belongs to */
  protocol: string;
}

/**
 * Pagination information for results returned by the API.
 * 
 * @example
 * {
 *   "limit": 10, 
 *   "page": 1,
 *   "total_items": 20,
 *   "total_pages": 2
 * }
 */
export interface PageInfo {
  /** Maximum number of items returned per page */
  limit: number;
  /** Current page number */
  page: number;
  /** Total number of items available */
  total_items: number;
  /** Total number of pages available */
  total_pages: number;
}

/**
 * Response from the getNetworkDexes action, containing DEXes on a specific network.
 * 
 * @example
 * {
 *   "dexes": [
 *     {
 *       "dex_id": "raydium",
 *       "dex_name": "Raydium",
 *       "chain": "solana",
 *       "protocol": "raydium"
 *     }
 *   ],
 *   "page_info": {
 *     "limit": 10,
 *     "page": 1,
 *     "total_items": 5,
 *     "total_pages": 1
 *   }
 * }
 */
export interface NetworkDexesResponse {
  /** List of DEXes on the specified network */
  dexes: Dex[];
  /** Pagination information */
  page_info: PageInfo;
}

// -----------------------------------------------------------------------------
// TOKEN TYPES
// -----------------------------------------------------------------------------

/**
 * Basic information about a token on a blockchain.
 * 
 * @example
 * {
 *   "id": "So11111111111111111111111111111111111111112",
 *   "name": "Wrapped SOL",
 *   "symbol": "SOL",
 *   "chain": "solana",
 *   "decimals": 9,
 *   "added_at": "2024-10-04T08:30:05Z"
 * }
 */
export interface TokenData {
  /** Token identifier (address) */
  id: string;
  /** Human-readable token name */
  name: string;
  /** Token symbol (e.g., "SOL", "ETH") */
  symbol: string;
  /** Blockchain network the token exists on */
  chain: string;
  /** Token precision (number of decimal places) */
  decimals: number;
  /** When the token was added to DexPaprika's database */
  added_at: string;
  /** Token type (optional) */
  type?: string;
  /** Token status (optional) */
  status?: string;
  /** Total supply of the token (optional) */
  total_supply?: number | null;
  /** Token description (optional) */
  description?: string;
  /** Official website of the token (optional) */
  website?: string;
  /** Link to explorer for this token (optional) */
  explorer?: string;
  /** Fully diluted valuation (optional) */
  fdv?: number | null;
  /** Current price in USD (in search results) */
  price_usd?: number;
}

/**
 * Transaction and volume metrics for a specific time interval.
 * 
 * @example
 * {
 *   "volume": 122851769.74866481,
 *   "volume_usd": 84119865.87252772,
 *   "sell": 147309,
 *   "buy": 77615,
 *   "txns": 224924
 * }
 */
export interface TimeIntervalMetrics {
  /** Trading volume in token's native units */
  volume: number;
  /** Trading volume in USD */
  volume_usd: number;
  /** Number of sell transactions */
  sell: number;
  /** Number of buy transactions */
  buy: number;
  /** Total number of transactions */
  txns: number;
}

/**
 * Summary statistics for a token across different time periods.
 * 
 * @example
 * {
 *   "price_usd": 0.6692687725734983,
 *   "fdv": 6692674011.865073,
 *   "liquidity_usd": 25796064.003077608,
 *   "24h": {
 *     "volume": 122851769.74866481,
 *     "volume_usd": 84119865.87252772,
 *     "sell": 147309,
 *     "buy": 77615,
 *     "txns": 224924
 *   }
 * }
 */
export interface TokenSummary {
  /** Current price in USD */
  price_usd: number;
  /** Fully diluted valuation */
  fdv: number;
  /** Total USD liquidity across all pools */
  liquidity_usd: number;
  /** 24-hour metrics */
  "24h": TimeIntervalMetrics;
  /** 6-hour metrics */
  "6h": TimeIntervalMetrics;
  /** 1-hour metrics */
  "1h": TimeIntervalMetrics;
  /** 30-minute metrics */
  "30m": TimeIntervalMetrics;
  /** 15-minute metrics */
  "15m": TimeIntervalMetrics;
  /** 5-minute metrics */
  "5m": TimeIntervalMetrics;
}

/**
 * Detailed information about a token.
 * Extends TokenData with additional statistics.
 * 
 * @example
 * {
 *   "id": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
 *   "name": "USD Coin",
 *   "symbol": "USDC",
 *   "chain": "solana",
 *   "decimals": 6,
 *   "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
 *   "price_usd": 1.0,
 *   "price_change_24h": 0.0001,
 *   "market_cap_usd": 42396531243.42,
 *   "total_supply": 42396531243,
 *   "circulating_supply": 42396531243,
 *   "added_at": "2023-01-01T00:00:00Z",
 *   "summary": {
 *     "price_usd": 1.0,
 *     "fdv": 42396531243.42,
 *     "liquidity_usd": 8942165423.45
 *   }
 * }
 */
export interface TokenDetailsResponse extends TokenData {
  /** Token contract address */
  address?: string;
  /** Current USD price */
  price_usd?: number;
  /** 24-hour price change (percentage) */
  price_change_24h?: number;
  /** Market capitalization in USD */
  market_cap_usd?: number;
  /** Total token supply */
  total_supply?: number;
  /** Circulating supply of tokens */
  circulating_supply?: number;
  /** Token description */
  description?: string;
  /** Official website URL */
  website?: string;
  /** Twitter handle */
  twitter?: string;
  /** Telegram group */
  telegram?: string;
  /** Discord server */
  discord?: string;
  /** URL to token logo */
  logo_url?: string;
  /** Token statistics summary */
  summary?: TokenSummary;
  /** Timestamp of last data update */
  last_updated?: string;
}

// -----------------------------------------------------------------------------
// POOL TYPES
// -----------------------------------------------------------------------------

/**
 * Information about a liquidity pool, including price data.
 * 
 * @example
 * {
 *   "id": "Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtL4Grryfu44Ze",
 *   "dex_id": "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",
 *   "dex_name": "Orca",
 *   "chain": "solana",
 *   "volume_usd": 165779480.23224467,
 *   "created_at": "2023-06-30T06:20:58Z",
 *   "created_at_block_number": 202532154,
 *   "transactions": 50154,
 *   "price_usd": 126.12479901641304,
 *   "tokens": [
 *     {
 *       "id": "So11111111111111111111111111111111111111112",
 *       "name": "Wrapped SOL",
 *       "symbol": "SOL",
 *       "chain": "solana",
 *       "decimals": 9
 *     },
 *     {
 *       "id": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
 *       "name": "USD Coin",
 *       "symbol": "USDC",
 *       "chain": "solana",
 *       "decimals": 6
 *     }
 *   ]
 * }
 */
export interface PoolData {
  /** Pool identifier (address) */
  id: string;
  /** Internal DEX identifier */
  dex_id: string;
  /** Human-readable DEX name */
  dex_name: string;
  /** Blockchain network this pool exists on */
  chain: string;
  /** 24-hour trading volume in USD */
  volume_usd: number;
  /** When the pool was created */
  created_at: string;
  /** Block number when the pool was created */
  created_at_block_number: number;
  /** Number of transactions for this pool */
  transactions: number;
  /** Current pool price in USD */
  price_usd: number;
  /** 5-minute price change (percentage) */
  last_price_change_usd_5m?: number;
  /** 1-hour price change (percentage) */
  last_price_change_usd_1h?: number;
  /** 24-hour price change (percentage) */
  last_price_change_usd_24h?: number;
  /** Pool trading fee (e.g., 0.003 for 0.3%) */
  fee: number | null;
  /** Tokens in this pool */
  tokens: TokenData[];
}

/**
 * Response for actions that return lists of pools.
 * 
 * @example
 * {
 *   "pools": [
 *     {
 *       "id": "Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtL4Grryfu44Ze",
 *       "dex_name": "Orca",
 *       "chain": "solana",
 *       "volume_usd": 165779480.23,
 *       "tokens": [
 *         {"id": "So11111111111111111111111111111111111111112", "name": "Wrapped SOL", "symbol": "SOL"},
 *         {"id": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "name": "USD Coin", "symbol": "USDC"}
 *       ]
 *     }
 *   ],
 *   "page_info": {
 *     "limit": 10,
 *     "page": 1,
 *     "total_items": 100,
 *     "total_pages": 10
 *   }
 * }
 */
export interface PoolsResponse {
  /** List of liquidity pools */
  pools: PoolData[];
  /** Pagination information */
  page_info: PageInfo;
}

/**
 * Reserve information for a token in a pool.
 * 
 * @example
 * {
 *   "token_id": "So11111111111111111111111111111111111111112",
 *   "reserve": 176046443936867,
 *   "reserve_usd": 175976.41730786228
 * }
 */
export interface TokenReserve {
  /** Token identifier */
  token_id: string;
  /** Token amount in the pool */
  reserve: number;
  /** USD value of the token reserves */
  reserve_usd: number;
}

/**
 * Time-specific metrics for a pool.
 * 
 * @example
 * {
 *   "last_price_usd_change": -0.10318415832528585,
 *   "volume": 165774348.22537813,
 *   "volume_usd": 165769550.66110465,
 *   "sell": 50143,
 *   "buy": 1,
 *   "txns": 50157
 * }
 */
export interface PoolTimeMetrics {
  /** Price change during this time period (percentage) */
  last_price_usd_change: number;
  /** Trading volume in token units */
  volume: number;
  /** Trading volume in USD */
  volume_usd: number;
  /** Number of sell transactions */
  sell: number;
  /** Number of buy transactions */
  buy: number;
  /** Total number of transactions */
  txns: number;
}

/**
 * Detailed information about a specific pool.
 * 
 * @example
 * {
 *   "id": "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",
 *   "dex_id": "uniswap_v3",
 *   "dex_name": "Uniswap V3",
 *   "chain": "ethereum",
 *   "tokens": [
 *     {
 *       "id": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
 *       "name": "USD Coin",
 *       "symbol": "USDC", 
 *       "chain": "ethereum",
 *       "decimals": 6
 *     },
 *     {
 *       "id": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
 *       "name": "Wrapped Ether",
 *       "symbol": "WETH",
 *       "chain": "ethereum",
 *       "decimals": 18
 *     }
 *   ],
 *   "fee": 0.003,
 *   "created_at": "2021-05-05T21:42:11Z",
 *   "created_at_block_number": 12376729
 * }
 */
export interface PoolDetailsResponse {
  /** Pool identifier/address */
  id: string;
  /** DEX identifier */
  dex_id: string;
  /** DEX name */
  dex_name: string;
  /** Blockchain network */
  chain: string;
  /** Tokens in the pool */
  tokens: TokenData[];
  /** Pool fee as a decimal (e.g., 0.003 for 0.3%) */
  fee: number | null;
  /** When the pool was created */
  created_at: string;
  /** Block number when the pool was created */
  created_at_block_number: number;
  /** Volume in USD */
  volume_usd?: number;
  /** Current price in USD */
  price_usd?: number;
  /** Price change in the last 24 hours (as a decimal) */
  last_price_change_usd_24h?: number;
  /** Total number of transactions */
  transactions?: number;
}

// -----------------------------------------------------------------------------
// SEARCH TYPES
// -----------------------------------------------------------------------------

/**
 * Response from the search action, containing matching tokens, pools, and DEXes.
 * 
 * @example
 * {
 *   "tokens": [
 *     {"id": "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", "name": "Jupiter", "symbol": "JUP"}
 *   ],
 *   "pools": [
 *     {
 *       "id": "C1MgLojNLWBKADvu9BHdtgzz1oZX4dZ5zGdGcgvvW8Wz",
 *       "dex_name": "Orca",
 *       "chain": "solana",
 *       "tokens": [
 *         {"id": "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", "name": "Jupiter", "symbol": "JUP"},
 *         {"id": "So11111111111111111111111111111111111111112", "name": "Wrapped SOL", "symbol": "SOL"}
 *       ]
 *     }
 *   ],
 *   "dexes": [
 *     {"dex_name": "Jupiter", "chain": "solana", "protocol": "jupiter"}
 *   ]
 * }
 */
export interface SearchResultsResponse {
  /** Matching tokens */
  tokens?: TokenData[];
  /** Matching pools */
  pools?: PoolData[];
  /** Matching DEXes */
  dexes?: {
    /** Internal DEX identifier */
    dex_id?: string;
    /** Human-readable DEX name */
    dex_name: string;
    /** Blockchain network */
    chain: string;
    /** 24-hour volume in USD */
    volume_usd_24h?: number;
    /** Number of transactions in 24 hours */
    txns_24h?: number;
    /** Number of pools on this DEX */
    pools_count?: number;
    /** DEX protocol type */
    protocol: string;
    /** When the DEX was created */
    created_at?: string;
  }[];
}

// -----------------------------------------------------------------------------
// FORMATTED OUTPUT TYPES
// -----------------------------------------------------------------------------

/**
 * A human-readable representation of pool data, suitable for display to users.
 * 
 * @example
 * {
 *   "position": 1,
 *   "id": "Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtL4Grryfu44Ze",
 *   "dex": "Orca",
 *   "tokens": "Wrapped SOL (SOL) - USD Coin (USDC)",
 *   "volume": "$270,705,394.04",
 *   "price": "$125.65"
 * }
 */
export interface FormattedPoolData {
  /** Position in the result set (1-based) */
  position: number;
  /** Pool identifier */
  id: string;
  /** DEX name */
  dex: string;
  /** Token names and symbols */
  tokens: string;
  /** Formatted volume in USD */
  volume: string;
  /** Formatted price in USD */
  price: string;
}

/**
 * A user-friendly summary of pool data, formatted for easy reading.
 * 
 * @example
 * {
 *   "title": "Top 5 Pools on Solana",
 *   "timestamp": "2025-03-12 12:34:56",
 *   "pools": [
 *     {
 *       "position": 1,
 *       "id": "Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtL4Grryfu44Ze",
 *       "dex": "Orca",
 *       "tokens": "Wrapped SOL (SOL) - USD Coin (USDC)",
 *       "volume": "$270,705,394.04",
 *       "price": "$125.65"
 *     }
 *   ],
 *   "total_pools": 121,
 *   "top_pool_summary": {
 *     "name": "Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtL4Grryfu44Ze",
 *     "dex": "Orca",
 *     "tokens": "Wrapped SOL (SOL) - USD Coin (USDC)",
 *     "volume": "$270,705,394.04",
 *     "price": "$125.65"
 *   }
 * }
 */
export interface FormattedResponse {
  /** Title describing the content */
  title: string;
  /** Timestamp of when the data was retrieved */
  timestamp: string;
  /** Formatted pool data */
  pools: FormattedPoolData[];
  /** Total number of pools matching the query */
  total_pools: number;
  /** Summary of the top pool */
  top_pool_summary: {
    /** Pool identifier or name */
    name: string;
    /** DEX name */
    dex: string;
    /** Token names and symbols */
    tokens: string;
    /** Formatted volume in USD */
    volume: string;
    /** Formatted price in USD */
    price: string;
  } | null;
}

// -----------------------------------------------------------------------------
// ACTION PARAMETER TYPES
// -----------------------------------------------------------------------------

/**
 * Parameters for the getNetworks action.
 * 
 * Used to retrieve a list of all supported blockchain networks.
 * 
 * @example
 * { "random_string": "any_value" }
 */
export interface GetNetworksParams {
  /** Dummy parameter (not used) */
  random_string?: string;
}

/**
 * Parameters for the getNetworkDexes action.
 * 
 * Used to retrieve a list of DEXes on a specific blockchain network.
 * 
 * @example
 * { "network": "solana", "page": 0, "limit": 10 }
 */
export interface GetNetworkDexesParams {
  /** Network identifier (e.g., "ethereum", "solana") */
  network: string;
  /** Page number for pagination (0-indexed) */
  page?: number;
  /** Number of results per page */
  limit?: number;
}

/**
 * Valid order by fields for pool queries.
 */
export type PoolOrderByField = 'volume_usd' | 'price_usd' | 'transactions' | 'last_price_change_usd_24h' | 'created_at';

/**
 * Valid sort directions.
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Parameters for the getTopPools action.
 * 
 * Used to retrieve the top pools from all networks, sorted by various criteria.
 * 
 * @example
 * { "page": 0, "limit": 10, "orderBy": "volume_usd", "sort": "desc" }
 */
export interface GetTopPoolsParams {
  /** Page number for pagination (0-indexed) */
  page?: number;
  /** Number of results per page */
  limit?: number;
  /** Field to order by */
  orderBy?: PoolOrderByField;
  /** Sort direction */
  sort?: SortDirection;
}

/**
 * Parameters for the getNetworkPools action.
 * 
 * Used to retrieve the top pools on a specific network.
 * 
 * @example
 * { "network": "solana", "page": 0, "limit": 10, "orderBy": "volume_usd", "sort": "desc" }
 */
export interface GetNetworkPoolsParams {
  /** Network identifier (e.g., "ethereum", "solana") */
  network: string;
  /** Page number for pagination (0-indexed) */
  page?: number;
  /** Number of results per page */
  limit?: number;
  /** Field to order by */
  orderBy?: PoolOrderByField;
  /** Sort direction */
  sort?: SortDirection;
}

/**
 * Parameters for the getDexPools action.
 * 
 * Used to retrieve the top pools on a specific DEX within a network.
 * 
 * @example
 * { "network": "ethereum", "dex": "uniswap_v3", "page": 0, "limit": 10, "orderBy": "volume_usd", "sort": "desc" }
 */
export interface GetDexPoolsParams {
  /** Network identifier (e.g., "ethereum", "solana") */
  network: string;
  /** DEX identifier */
  dex: string;
  /** Page number for pagination (0-indexed) */
  page?: number;
  /** Number of results per page */
  limit?: number;
  /** Field to order by */
  orderBy?: PoolOrderByField;
  /** Sort direction */
  sort?: SortDirection;
}

/**
 * Parameters for the getPoolDetails action.
 * 
 * Used to retrieve detailed information about a specific pool.
 * 
 * @example
 * { "network": "solana", "poolAddress": "Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtL4Grryfu44Ze", "inversed": false }
 */
export interface GetPoolDetailsParams {
  /** Network identifier (e.g., "ethereum", "solana") */
  network: string;
  /** Pool address or identifier */
  poolAddress: string;
  /** Whether to invert the price ratio */
  inversed?: boolean;
}

/**
 * Parameters for the getTokenDetails action.
 * 
 * Used to retrieve detailed information about a specific token.
 * 
 * @example
 * { "network": "solana", "tokenAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" }
 */
export interface GetTokenDetailsParams {
  /** Network identifier (e.g., "ethereum", "solana") */
  network: string;
  /** Token address or identifier */
  tokenAddress: string;
}

/**
 * Parameters for the search action.
 * 
 * Used to search for tokens, pools, and DEXes by name or identifier.
 * 
 * @example
 * { "query": "bitcoin" }
 */
export interface SearchParams {
  /** Search term (e.g., "uniswap", "bitcoin", or a token address) */
  query: string;
} 