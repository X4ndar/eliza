import type { IAgentRuntime, State, Memory } from "./types.ts";

/**
 * Helper to safely convert potential objects to strings for templates
 * @param value The value to stringify
 * @returns A string representation of the value, or empty string for objects
 */
function safeStringify(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'object' && value !== null) {
    try {
      // For objects, attempt to JSON.stringify them 
      const result = JSON.stringify(value);
      // If it would return [object Object], return empty string instead
      return result === '[object Object]' ? '' : result;
    } catch (error) {
      return '';
    }
  }
  
  return String(value);
}

/**
 * Formats provider outputs into a string which can be injected into the context.
 * @param runtime The AgentRuntime object.
 * @param message The incoming message object.
 * @param state The current state object.
 * @returns A string that concatenates the outputs of each provider.
 */
export async function getProviders(
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
) {
    const providerResults = (
        await Promise.all(
            runtime.providers.map(async (provider) => {
                const result = await provider.get(runtime, message, state);
                
                // Special handling for the course provider object
                if (result && typeof result === 'object') {
                    // Check if this is the course data (has hasCourseData property)
                    if ('hasCourseData' in result) {
                        // This is likely course data and should be passed through to the template
                        // The template has conditional rendering for these properties
                        return result; 
                    }
                    
                    // For other objects, safely stringify them
                    try {
                        const stringified = safeStringify(result);
                        return stringified || '';
                    } catch (error) {
                        return '';
                    }
                }
                
                return result;
            })
        )
    ).filter((result) => result != null && result !== "");

    return providerResults.join("\n");
}
