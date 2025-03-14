import { type RuntimeContext } from "@elizaos/core";

/**
 * Gets the configuration from the runtime context
 * @param context The runtime context
 * @returns Configuration object with API URL and optional API key
 */
export function getConfig(context: RuntimeContext) {
  return {
    DEXPAPRIKA_API_URL: context.getSetting('DEXPAPRIKA_API_URL') || 'https://api.dexpaprika.com',
    DEXPAPRIKA_API_KEY: context.getSetting('DEXPAPRIKA_API_KEY')
  };
} 