# ElizaOS DexPaprika Plugin

A plugin for ElizaOS that provides access to DexPaprika's DeFi analytics platform, allowing AI agents to query real-time data on liquidity pools, DEXes, tokens and market activity across multiple blockchain networks.

![DexPaprika Plugin Banner](./images/banner.jpg)

## Features

- Query information across multiple blockchain networks (Ethereum, Solana, etc.)
- Get real-time data on liquidity pools, including volume, price, and token details
- Filter pools by network, DEX, or specific criteria
- Retrieve token-specific data and market metrics
- Search for tokens, pools, and DEXes
- Formatted responses for easy consumption by LLMs

## No API Key Required ✨

Unlike many blockchain data services, **DexPaprika doesn't require an API key** to access its data. This makes the plugin particularly easy to set up and use immediately without any registration or authentication steps.

## Installation

1. Add the plugin to your project:

```bash
npm install @elizaos/plugin-dexpaprika
```

2. Add the plugin to your ElizaOS character configuration:

```json
{
  "name": "DefiAssistant",
  "plugins": ["@elizaos/plugin-dexpaprika"],
  "settings": {
    "secrets": {
      "DEXPAPRIKA_API_KEY": "your-api-key-if-needed"
    }
  }
}
```

## Configuration

| Parameter | Description | Required | Default |
|-----------|-------------|----------|---------|
| DEXPAPRIKA_API_KEY | API key for DexPaprika service | No | - |
| DEXPAPRIKA_API_URL | Base URL for DexPaprika API | No | https://api.dexpaprika.com |

## Usage

### Example Prompts

The plugin responds to natural language queries about DeFi pools and tokens:

- "What are the top liquidity pools on Solana?"
- "Show me the most active DEXes on Ethereum"
- "What's the trading volume for USDC/ETH pairs?"
- "Get detailed information about the SOL/USDC pool"

### Available Actions

#### getNetworks

Retrieves a list of all supported blockchain networks.

```javascript
const result = await agent.execute('dexpaprika_getNetworks', {});
```

#### getNetworkDexes

Gets a list of available DEXes on a specific network.

```javascript
const result = await agent.execute('dexpaprika_getNetworkDexes', {
  network: 'solana',
  limit: 5
});
```

#### getTopPools

Gets a paginated list of top liquidity pools from all networks.

```javascript
const result = await agent.execute('dexpaprika_getTopPools', {
  limit: 10,
  orderBy: 'volume_usd',
  sort: 'desc'
});
```

#### getNetworkPools

Gets top pools on a specific network.

```javascript
const result = await agent.execute('dexpaprika_getNetworkPools', {
  network: 'ethereum',
  limit: 5
});
```

#### getDexPools

Gets top pools on a specific DEX within a network.

```javascript
const result = await agent.execute('dexpaprika_getDexPools', {
  network: 'ethereum',
  dex: 'uniswap',
  limit: 5
});
```

#### getPoolDetails

Gets detailed information about a specific pool on a network.

```javascript
const result = await agent.execute('dexpaprika_getPoolDetails', {
  network: 'ethereum',
  poolAddress: '0x123abc...',
  inversed: false
});
```

#### getTokenDetails

Gets detailed information about a specific token on a network.

```javascript
const result = await agent.execute('dexpaprika_getTokenDetails', {
  network: 'ethereum',
  tokenAddress: '0x123abc...'
});
```

#### search

Searches for tokens, pools, and DEXes by name or identifier.

```javascript
const result = await agent.execute('dexpaprika_search', {
  query: 'uniswap'
});
```

#### getStats

Gets high-level statistics about the DexPaprika ecosystem.

```javascript
const result = await agent.execute('dexpaprika_getStats', {});
```

## Response Format

Responses are formatted in a structured, LLM-friendly format with both raw data and formatted display elements:

```json
{
  "formatted_response": {
    "title": "Top 5 Pools on Solana",
    "timestamp": "2025-03-12 12:34:56",
    "pools": [
      {
        "position": 1,
        "id": "Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtL4Grryfu44Ze",
        "dex": "Orca",
        "tokens": "Wrapped SOL (SOL) - USD Coin (USDC)",
        "volume": "$270,705,394.04",
        "price": "$125.6453"
      }
    ],
    "total_pools": 121,
    "top_pool_summary": {
      "name": "Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtL4Grryfu44Ze",
      "dex": "Orca",
      "tokens": "Wrapped SOL (SOL) - USD Coin (USDC)",
      "volume": "$270,705,394.04",
      "price": "$125.6453"
    }
  },
  "raw_data": {
    "pools": [],
    "page_info": {}
  }
}
```

## LLM Compatibility

This plugin has been tested with the following LLMs:

- ✅ OpenAI (GPT-3.5, GPT-4)
- ⚠️ Llama (requires implementation of Llama-specific function calling in ElizaOS)
- ⚠️ Anthropic Claude (requires implementation of Claude-specific function calling in ElizaOS)

The plugin's core functionality is model-agnostic, but the integration with function calling depends on the ElizaOS framework's support for different models.

## Development

### Building the plugin

```bash
npm run build
```

### Running tests

```bash
npm test
```

## Links

- [DexPaprika API Documentation](https://docs.dexpaprika.com)
- [ElizaOS Documentation](https://elizaos.com/docs)
- [GitHub Repository](https://github.com/donbagger/plugin-dexpaprika)

## License

MIT 