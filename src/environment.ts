import { z } from 'zod';
import { elizaLogger, type IAgentRuntime } from "@elizaos/core";

// Define schema for plugin configuration
export const ConfigSchema = z.object({
  DEXPAPRIKA_API_KEY: z.string().optional(),
  DEXPAPRIKA_API_URL: z.string().default('https://api.dexpaprika.com')
});

// Type for the validated config
export type DexPaprikaConfig = z.infer<typeof ConfigSchema>;

// Function to get settings from runtime
export function getConfig(runtime: IAgentRuntime): DexPaprikaConfig {
  try {
    const config = {
      DEXPAPRIKA_API_KEY: runtime.getSetting('DEXPAPRIKA_API_KEY'),
      DEXPAPRIKA_API_URL: runtime.getSetting('DEXPAPRIKA_API_URL') || 'https://api.dexpaprika.com'
    };

    // Validate config against schema
    return ConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`DexPaprika plugin configuration error: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

// Function to validate DexPaprika configuration
export async function validateDexPaprikaConfig(runtime: IAgentRuntime): Promise<DexPaprikaConfig> {
  elizaLogger.log("Validating DexPaprika configuration...");
  const config = getConfig(runtime);
  
  if (!config.DEXPAPRIKA_API_URL) {
    elizaLogger.warn("DexPaprika API URL not provided, using default: https://api.dexpaprika.com");
  }
  
  elizaLogger.success("DexPaprika configuration validated successfully");
  return config;
}

// Function to get API configuration
export function getApiConfig(config: DexPaprikaConfig) {
  return {
    baseUrl: config.DEXPAPRIKA_API_URL,
    apiKey: config.DEXPAPRIKA_API_KEY || '',
    headerKey: 'Authorization'
  };
} 