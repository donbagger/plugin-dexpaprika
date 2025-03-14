# DexPaprika Plugin for ElizaOS

This plugin integrates DexPaprika's DeFi analytics API with ElizaOS, providing real-time information about blockchain networks, decentralized exchanges (DEXes), liquidity pools, and tokens. With this plugin, users can access comprehensive DeFi data to make informed decisions about cryptocurrency trading and investing.

## Features

The DexPaprika plugin offers the following capabilities (these are the ONLY available functions):

- **GET_NETWORKS** - Retrieve a list of all supported blockchain networks and their metadata
- **GET_NETWORK_DEXES** - Get a list of available decentralized exchanges on a specific network
- **GET_TOP_POOLS** - Get a paginated list of top liquidity pools from all networks
- **GET_NETWORK_POOLS** - Get a list of top liquidity pools on a specific network
- **GET_DEX_POOLS** - Get top pools on a specific DEX within a network
- **GET_POOL_DETAILS** - Get detailed information about a specific pool on a network
- **GET_TOKEN_DETAILS** - Get detailed information about a specific token on a network
- **SEARCH** - Search for tokens, pools, and DEXes by name or identifier

## ⚠️ Important: Available Functions

**WARNING**: Only the functions listed above are implemented and available in this plugin. Do not attempt to call any other functions (such as `getTokenPrice`, etc.) as they do not exist and will result in errors.

When using this plugin with AI systems like Eliza, ensure that only these specific functions are being called with their exact names.

## Installation

To use this plugin with ElizaOS:

1. Clone the repository:
```bash
git clone https://github.com/donbagger/plugin-dexpaprika.git
```

2. Install dependencies:
```bash
cd plugin-dexpaprika
npm install
```

3. Build the plugin:
```bash
npm run build
```

4. Link the plugin to your ElizaOS instance.

## Configuration

The plugin accepts the following configuration parameters:

- **DEXPAPRIKA_API_URL** - The base URL for the DexPaprika API (default: `https://api.dexpaprika.com`)
- **DEXPAPRIKA_API_KEY** - (Optional) Your DexPaprika API key for increased rate limits

You can configure these in your ElizaOS settings.

## Usage Examples

Here are some examples of how to use the plugin:

### Get Supported Networks

```
What blockchain networks are supported by DexPaprika?
```

### Search for a Token

```
Search for PENGU on DexPaprika
```

### View Pool Details

```
Get details for the ETH-USDC pool on Uniswap
```

## Development

To develop this plugin:

1. Clone the repository
2. Install dependencies with `npm install`
3. Make changes to the source code
4. Build the plugin with `npm run build`
5. Run tests with `npm test`

## License

[MIT License](LICENSE)

## Credits

This plugin was developed for ElizaOS and utilizes the DexPaprika API for DeFi data.

- [ElizaOS](https://github.com/elizaOS/eliza)
- [DexPaprika](https://dexpaprika.com/)
- [DexPaprika Documenation](https://docs.dexpaprika.com)
- [GitHub Repository](https://github.com/donbagger/plugin-dexpaprika) 
