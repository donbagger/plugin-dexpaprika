import { z } from 'zod';

// Define schema for plugin configuration
export const ConfigSchema = z.object({
  DEXPAPRIKA_API_KEY: z.string().optional(),
  DEXPAPRIKA_API_URL: z.string().default('https://api.dexpaprika.com')
});

// Type for the validated config
export type DexPaprikaConfig = z.infer<typeof ConfigSchema>;

// Function to get settings from runtime
export function getConfig(runtime: any): DexPaprikaConfig {
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