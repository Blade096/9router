// Default pricing rates for AI models
// All rates are in dollars per million tokens ($/1M tokens)
// Based on user-provided pricing for Antigravity models and industry standards for others

export const DEFAULT_PRICING = {
  // OAuth Providers (using aliases)

  // Claude Code (cc) - Source: https://claude.com/pricing#api
  // Opus 4.6: Input $5, Output $25, Cache Read $0.50, Cache Write $6.25
  // Sonnet 4.5: Input $3, Output $15, Cache Read $0.30, Cache Write $3.75
  // Haiku 4.5: Input $1, Output $5, Cache Read $0.10, Cache Write $1.25
  cc: {
    "claude-opus-4-6": {
      input: 5.00,
      output: 25.00,
      cached: 0.50,
      reasoning: 37.50,
      cache_creation: 6.25
    },
    "claude-opus-4-5-20251101": {
      input: 5.00,
      output: 25.00,
      cached: 0.50,
      reasoning: 37.50,
      cache_creation: 6.25
    },
    "claude-sonnet-4-5-20250929": {
      input: 3.00,
      output: 15.00,
      cached: 0.30,
      reasoning: 22.50,
      cache_creation: 3.75
    },
    "claude-haiku-4-5-20251001": {
      input: 1.00,
      output: 5.00,
      cached: 0.10,
      reasoning: 7.50,
      cache_creation: 1.25
    }
  },

  // OpenAI Codex (cx) - Source: https://developers.openai.com/api/docs/pricing
  // Standard tier pricing
  cx: {
    "gpt-5.3-codex": {
      input: 1.75,
      output: 14.00,
      cached: 0.175,
      reasoning: 21.00,
      cache_creation: 1.75
    },
    "gpt-5.3-codex-xhigh": {
      input: 2.10,
      output: 16.80,
      cached: 0.21,
      reasoning: 25.20,
      cache_creation: 2.10
    },
    "gpt-5.3-codex-high": {
      input: 1.93,
      output: 15.40,
      cached: 0.193,
      reasoning: 23.10,
      cache_creation: 1.93
    },
    "gpt-5.3-codex-low": {
      input: 1.58,
      output: 12.60,
      cached: 0.158,
      reasoning: 18.90,
      cache_creation: 1.58
    },
    "gpt-5.3-codex-none": {
      input: 1.40,
      output: 11.20,
      cached: 0.14,
      reasoning: 16.80,
      cache_creation: 1.40
    },
    "gpt-5.2-codex": {
      input: 1.75,
      output: 14.00,
      cached: 0.175,
      reasoning: 21.00,
      cache_creation: 1.75
    },
    "gpt-5.2": {
      input: 1.75,
      output: 14.00,
      cached: 0.175,
      reasoning: 21.00,
      cache_creation: 1.75
    },
    "gpt-5.1-codex-max": {
      input: 1.25,
      output: 10.00,
      cached: 0.125,
      reasoning: 15.00,
      cache_creation: 1.25
    },
    "gpt-5.1-codex": {
      input: 1.25,
      output: 10.00,
      cached: 0.125,
      reasoning: 15.00,
      cache_creation: 1.25
    },
    "gpt-5.1-codex-mini": {
      input: 0.25,
      output: 2.00,
      cached: 0.025,
      reasoning: 3.00,
      cache_creation: 0.25
    },
    "gpt-5.1-codex-mini-high": {
      input: 0.30,
      output: 2.40,
      cached: 0.03,
      reasoning: 3.60,
      cache_creation: 0.30
    },
    "gpt-5.1": {
      input: 1.25,
      output: 10.00,
      cached: 0.125,
      reasoning: 15.00,
      cache_creation: 1.25
    },
    "gpt-5-codex": {
      input: 1.25,
      output: 10.00,
      cached: 0.125,
      reasoning: 15.00,
      cache_creation: 1.25
    },
    "gpt-5-codex-mini": {
      input: 0.25,
      output: 2.00,
      cached: 0.025,
      reasoning: 3.00,
      cache_creation: 0.25
    }
  },

  // Gemini CLI (gc)
  gc: {
    "gemini-3-flash-preview": {
      input: 0.50,
      output: 3.00,
      cached: 0.03,
      reasoning: 4.50,
      cache_creation: 0.50
    },
    "gemini-3-pro-preview": {
      input: 2.00,
      output: 12.00,
      cached: 0.25,
      reasoning: 18.00,
      cache_creation: 2.00
    },
    "gemini-2.5-pro": {
      input: 2.00,
      output: 12.00,
      cached: 0.25,
      reasoning: 18.00,
      cache_creation: 2.00
    },
    "gemini-2.5-flash": {
      input: 0.30,
      output: 2.50,
      cached: 0.03,
      reasoning: 3.75,
      cache_creation: 0.30
    },
    "gemini-2.5-flash-lite": {
      input: 0.15,
      output: 1.25,
      cached: 0.015,
      reasoning: 1.875,
      cache_creation: 0.15
    }
  },

  // Qwen Code (qw)
  qw: {
    "qwen3-coder-plus": {
      input: 1.00,
      output: 4.00,
      cached: 0.50,
      reasoning: 6.00,
      cache_creation: 1.00
    },
    "qwen3-coder-flash": {
      input: 0.50,
      output: 2.00,
      cached: 0.25,
      reasoning: 3.00,
      cache_creation: 0.50
    },
    "vision-model": {
      input: 1.50,
      output: 6.00,
      cached: 0.75,
      reasoning: 9.00,
      cache_creation: 1.50
    }
  },

  // iFlow AI (if)
  if: {
    "qwen3-coder-plus": {
      input: 1.00,
      output: 4.00,
      cached: 0.50,
      reasoning: 6.00,
      cache_creation: 1.00
    },
    "kimi-k2": {
      input: 1.00,
      output: 4.00,
      cached: 0.50,
      reasoning: 6.00,
      cache_creation: 1.00
    },
    "kimi-k2-thinking": {
      input: 1.50,
      output: 6.00,
      cached: 0.75,
      reasoning: 9.00,
      cache_creation: 1.50
    },
    "deepseek-r1": {
      input: 0.75,
      output: 3.00,
      cached: 0.375,
      reasoning: 4.50,
      cache_creation: 0.75
    },
    "deepseek-v3.2-chat": {
      input: 0.50,
      output: 2.00,
      cached: 0.25,
      reasoning: 3.00,
      cache_creation: 0.50
    },
    "deepseek-v3.2-reasoner": {
      input: 0.75,
      output: 3.00,
      cached: 0.375,
      reasoning: 4.50,
      cache_creation: 0.75
    },
    "minimax-m2": {
      input: 0.50,
      output: 2.00,
      cached: 0.25,
      reasoning: 3.00,
      cache_creation: 0.50
    },
    "glm-4.6": {
      input: 0.50,
      output: 2.00,
      cached: 0.25,
      reasoning: 3.00,
      cache_creation: 0.50
    },
    "glm-4.7": {
      input: 0.75,
      output: 3.00,
      cached: 0.375,
      reasoning: 4.50,
      cache_creation: 0.75
    }
  },

  // Antigravity (ag) - User-provided pricing
  ag: {
    "claude-opus-4-6-thinking": {
      input: 5.00,
      output: 25.00,
      cached: 0.50,
      reasoning: 37.50,
      cache_creation: 6.25
    },
    "gemini-3-pro-low": {
      input: 2.00,
      output: 12.00,
      cached: 0.25,
      reasoning: 18.00,
      cache_creation: 2.00
    },
    "gemini-3-pro-high": {
      input: 4.00,
      output: 18.00,
      cached: 0.50,
      reasoning: 27.00,
      cache_creation: 4.00
    },
    "gemini-3-flash": {
      input: 0.50,
      output: 3.00,
      cached: 0.03,
      reasoning: 4.50,
      cache_creation: 0.50
    },
    "gemini-2.5-flash": {
      input: 0.30,
      output: 2.50,
      cached: 0.03,
      reasoning: 3.75,
      cache_creation: 0.30
    },
    "claude-sonnet-4-5": {
      input: 3.00,
      output: 15.00,
      cached: 0.30,
      reasoning: 22.50,
      cache_creation: 3.75
    },
    "claude-sonnet-4-5-thinking": {
      input: 3.00,
      output: 15.00,
      cached: 0.30,
      reasoning: 22.50,
      cache_creation: 3.75
    },
    "claude-opus-4-5-thinking": {
      input: 5.00,
      output: 25.00,
      cached: 0.50,
      reasoning: 37.50,
      cache_creation: 6.25
    }
  },

  // GitHub Copilot (gh) - Source: https://developers.openai.com/api/docs/pricing
  // Standard tier pricing
  gh: {
    "gpt-4o": {
      input: 2.50,
      output: 10.00,
      cached: 1.25,
      reasoning: 15.00,
      cache_creation: 2.50
    },
    "gpt-5": {
      input: 1.25,
      output: 10.00,
      cached: 0.125,
      reasoning: 15.00,
      cache_creation: 1.25
    },
    "gpt-5-mini": {
      input: 0.25,
      output: 2.00,
      cached: 0.025,
      reasoning: 3.00,
      cache_creation: 0.25
    },
    "gpt-5-codex": {
      input: 1.25,
      output: 10.00,
      cached: 0.125,
      reasoning: 15.00,
      cache_creation: 1.25
    },
    "gpt-5.1": {
      input: 1.25,
      output: 10.00,
      cached: 0.125,
      reasoning: 15.00,
      cache_creation: 1.25
    },
    "gpt-5.1-codex-mini": {
      input: 0.25,
      output: 2.00,
      cached: 0.025,
      reasoning: 3.00,
      cache_creation: 0.25
    },
    "gpt-5.1-codex": {
      input: 1.25,
      output: 10.00,
      cached: 0.125,
      reasoning: 15.00,
      cache_creation: 1.25
    },
    "gpt-5.1-codex-max": {
      input: 1.25,
      output: 10.00,
      cached: 0.125,
      reasoning: 15.00,
      cache_creation: 1.25
    },
    "gpt-5.2": {
      input: 1.75,
      output: 14.00,
      cached: 0.175,
      reasoning: 21.00,
      cache_creation: 1.75
    },
    "gpt-5.2-codex": {
      input: 1.75,
      output: 14.00,
      cached: 0.175,
      reasoning: 21.00,
      cache_creation: 1.75
    },
    "gpt-4.1": {
      input: 2.00,
      output: 8.00,
      cached: 0.50,
      reasoning: 12.00,
      cache_creation: 2.00
    },
    "claude-haiku-4.5": {
      input: 1.00,
      output: 5.00,
      cached: 0.10,
      reasoning: 7.50,
      cache_creation: 1.25
    },
    "claude-opus-4.1": {
      input: 15.00,
      output: 75.00,
      cached: 1.50,
      reasoning: 112.50,
      cache_creation: 18.75
    },
    "claude-opus-4.5": {
      input: 5.00,
      output: 25.00,
      cached: 0.50,
      reasoning: 37.50,
      cache_creation: 6.25
    },
    "claude-sonnet-4": {
      input: 3.00,
      output: 15.00,
      cached: 0.30,
      reasoning: 22.50,
      cache_creation: 3.75
    },
    "claude-sonnet-4.5": {
      input: 3.00,
      output: 15.00,
      cached: 0.30,
      reasoning: 22.50,
      cache_creation: 3.75
    },
    "claude-opus-4.6": {
      input: 5.00,
      output: 25.00,
      cached: 0.50,
      reasoning: 37.50,
      cache_creation: 6.25
    },
    "claude-4.5-sonnet": {
      input: 3.00,
      output: 15.00,
      cached: 0.30,
      reasoning: 22.50,
      cache_creation: 3.75
    },
    "claude-4.5-opus": {
      input: 5.00,
      output: 25.00,
      cached: 0.50,
      reasoning: 37.50,
      cache_creation: 6.25
    },
    "claude-4.5-haiku": {
      input: 1.00,
      output: 5.00,
      cached: 0.10,
      reasoning: 7.50,
      cache_creation: 1.25
    },
    "gemini-3-pro": {
      input: 2.00,
      output: 12.00,
      cached: 0.25,
      reasoning: 18.00,
      cache_creation: 2.00
    },
    "gemini-3-pro-preview": {
      input: 2.00,
      output: 12.00,
      cached: 0.25,
      reasoning: 18.00,
      cache_creation: 2.00
    },
    "gemini-3-flash": {
      input: 0.50,
      output: 3.00,
      cached: 0.03,
      reasoning: 4.50,
      cache_creation: 0.50
    },
    "gemini-2.5-pro": {
      input: 2.00,
      output: 12.00,
      cached: 0.25,
      reasoning: 18.00,
      cache_creation: 2.00
    },
    "grok-code-fast-1": {
      input: 0.50,
      output: 2.00,
      cached: 0.25,
      reasoning: 3.00,
      cache_creation: 0.50
    },
    "oswe-vscode-prime": {
      input: 1.00,
      output: 4.00,
      cached: 0.50,
      reasoning: 6.00,
      cache_creation: 1.00
    }
  },

  // API Key Providers (alias = id)

  // OpenAI - Source: https://developers.openai.com/api/docs/pricing
  // Standard tier pricing
  openai: {
    "gpt-4o": {
      input: 2.50,
      output: 10.00,
      cached: 1.25,
      reasoning: 15.00,
      cache_creation: 2.50
    },
    "gpt-4o-mini": {
      input: 0.15,
      output: 0.60,
      cached: 0.075,
      reasoning: 0.90,
      cache_creation: 0.15
    },
    "gpt-4-turbo": {
      input: 10.00,
      output: 30.00,
      cached: 5.00,
      reasoning: 45.00,
      cache_creation: 10.00
    },
    "o1": {
      input: 15.00,
      output: 60.00,
      cached: 7.50,
      reasoning: 90.00,
      cache_creation: 15.00
    },
    "o1-mini": {
      input: 1.10,
      output: 4.40,
      cached: 0.55,
      reasoning: 6.60,
      cache_creation: 1.10
    }
  },

  // Anthropic - Source: https://claude.com/pricing#api
  anthropic: {
    "claude-sonnet-4-20250514": {
      input: 3.00,
      output: 15.00,
      cached: 0.30,
      reasoning: 22.50,
      cache_creation: 3.75
    },
    "claude-opus-4-20250514": {
      input: 5.00,
      output: 25.00,
      cached: 0.50,
      reasoning: 37.50,
      cache_creation: 6.25
    },
    "claude-3-5-sonnet-20241022": {
      input: 3.00,
      output: 15.00,
      cached: 0.30,
      reasoning: 22.50,
      cache_creation: 3.75
    }
  },

  // Gemini
  gemini: {
    "gemini-3-pro-preview": {
      input: 2.00,
      output: 12.00,
      cached: 0.25,
      reasoning: 18.00,
      cache_creation: 2.00
    },
    "gemini-2.5-pro": {
      input: 2.00,
      output: 12.00,
      cached: 0.25,
      reasoning: 18.00,
      cache_creation: 2.00
    },
    "gemini-2.5-flash": {
      input: 0.30,
      output: 2.50,
      cached: 0.03,
      reasoning: 3.75,
      cache_creation: 0.30
    },
    "gemini-2.5-flash-lite": {
      input: 0.15,
      output: 1.25,
      cached: 0.015,
      reasoning: 1.875,
      cache_creation: 0.15
    }
  },

  // OpenRouter
  openrouter: {
    "auto": {
      input: 2.00,
      output: 8.00,
      cached: 1.00,
      reasoning: 12.00,
      cache_creation: 2.00
    }
  },

  // GLM - Source: https://docs.z.ai/guides/overview/pricing
  glm: {
    "glm-4.7": {
      input: 0.60,
      output: 2.20,
      cached: 0.11,
      reasoning: 3.30,
      cache_creation: 0.60
    },
    "glm-4.6": {
      input: 0.60,
      output: 2.20,
      cached: 0.11,
      reasoning: 3.30,
      cache_creation: 0.60
    },
    "glm-4.6v": {
      input: 0.30,
      output: 0.90,
      cached: 0.05,
      reasoning: 1.35,
      cache_creation: 0.30
    }
  },

  // Kimi - Source: https://platform.moonshot.ai/docs/pricing/chat
  // Kimi K2.5: Input $0.60/1M (Cache Hit $0.10), Output $3.00/1M, Context 262K
  kimi: {
    "kimi-latest": {
      input: 0.60,
      output: 3.00,
      cached: 0.10,
      reasoning: 4.50,
      cache_creation: 0.60
    },
    "kimi-k2.5": {
      input: 0.60,
      output: 3.00,
      cached: 0.10,
      reasoning: 4.50,
      cache_creation: 0.60
    },
    "kimi-k2.5-thinking": {
      input: 0.90,
      output: 4.50,
      cached: 0.15,
      reasoning: 6.75,
      cache_creation: 0.90
    }
  },

  // Kiro (kr)
  kr: {
    "claude-sonnet-4.5": {
      input: 3.00,
      output: 15.00,
      cached: 0.30,
      reasoning: 22.50,
      cache_creation: 3.75
    },
    "claude-haiku-4.5": {
      input: 1.00,
      output: 5.00,
      cached: 0.10,
      reasoning: 7.50,
      cache_creation: 1.25
    }
  },

  // Cursor (cu)
  cu: {
    "default": {
      input: 3.00,
      output: 15.00,
      cached: 0.30,
      reasoning: 22.50,
      cache_creation: 3.75
    },
    "claude-4.5-opus-high-thinking": {
      input: 5.00,
      output: 25.00,
      cached: 0.50,
      reasoning: 37.50,
      cache_creation: 6.25
    },
    "claude-4.5-opus-high": {
      input: 5.00,
      output: 25.00,
      cached: 0.50,
      reasoning: 37.50,
      cache_creation: 6.25
    },
    "claude-4.5-opus": {
      input: 5.00,
      output: 25.00,
      cached: 0.50,
      reasoning: 37.50,
      cache_creation: 6.25
    },
    "claude-4.5-sonnet-thinking": {
      input: 3.00,
      output: 15.00,
      cached: 0.30,
      reasoning: 22.50,
      cache_creation: 3.75
    },
    "claude-4.5-sonnet": {
      input: 3.00,
      output: 15.00,
      cached: 0.30,
      reasoning: 22.50,
      cache_creation: 3.75
    },
    "claude-4.5-haiku": {
      input: 1.00,
      output: 5.00,
      cached: 0.10,
      reasoning: 7.50,
      cache_creation: 1.25
    },
    "gpt-5.2-codex": {
      input: 5.00,
      output: 20.00,
      cached: 2.50,
      reasoning: 30.00,
      cache_creation: 5.00
    }
  },

  // GLM China (glm-cn) - Source: https://docs.z.ai/guides/overview/pricing
  "glm-cn": {
    "glm-4.7": {
      input: 0.60,
      output: 2.20,
      cached: 0.11,
      reasoning: 3.30,
      cache_creation: 0.60
    },
    "glm-4.6": {
      input: 0.60,
      output: 2.20,
      cached: 0.11,
      reasoning: 3.30,
      cache_creation: 0.60
    },
    "glm-4.5": {
      input: 0.60,
      output: 2.20,
      cached: 0.11,
      reasoning: 3.30,
      cache_creation: 0.60
    },
    "glm-4.5-air": {
      input: 0.20,
      output: 1.10,
      cached: 0.03,
      reasoning: 1.65,
      cache_creation: 0.20
    }
  },

  // MiniMax
  minimax: {
    "MiniMax-M2.1": {
      input: 0.50,
      output: 2.00,
      cached: 0.25,
      reasoning: 3.00,
      cache_creation: 0.50
    }
  }
};

/**
 * Get pricing for a specific provider and model
 * @param {string} provider - Provider ID (e.g., "openai", "cc", "gc")
 * @param {string} model - Model ID
 * @returns {object|null} Pricing object or null if not found
 */
export function getPricingForModel(provider, model) {
  if (!provider || !model) return null;

  const providerPricing = DEFAULT_PRICING[provider];
  if (!providerPricing) return null;

  return providerPricing[model] || null;
}

/**
 * Get all pricing data
 * @returns {object} All default pricing
 */
export function getDefaultPricing() {
  return DEFAULT_PRICING;
}

/**
 * Format cost for display
 * @param {number} cost - Cost in dollars
 * @returns {string} Formatted cost string
 */
export function formatCost(cost) {
  if (cost === null || cost === undefined || isNaN(cost)) return "$0.00";
  return `$${cost.toFixed(2)}`;
}

/**
 * Calculate cost from tokens and pricing
 * @param {object} tokens - Token counts
 * @param {object} pricing - Pricing object
 * @returns {number} Cost in dollars
 */
export function calculateCostFromTokens(tokens, pricing) {
  if (!tokens || !pricing) return 0;

  let cost = 0;

  // Input tokens (non-cached)
  const inputTokens = tokens.prompt_tokens || tokens.input_tokens || 0;
  const cachedTokens = tokens.cached_tokens || tokens.cache_read_input_tokens || 0;
  const nonCachedInput = Math.max(0, inputTokens - cachedTokens);

  cost += (nonCachedInput * (pricing.input / 1000000));

  // Cached tokens
  if (cachedTokens > 0) {
    const cachedRate = pricing.cached || pricing.input; // Fallback to input rate
    cost += (cachedTokens * (cachedRate / 1000000));
  }

  // Output tokens
  const outputTokens = tokens.completion_tokens || tokens.output_tokens || 0;
  cost += (outputTokens * (pricing.output / 1000000));

  // Reasoning tokens
  const reasoningTokens = tokens.reasoning_tokens || 0;
  if (reasoningTokens > 0) {
    const reasoningRate = pricing.reasoning || pricing.output; // Fallback to output rate
    cost += (reasoningTokens * (reasoningRate / 1000000));
  }

  // Cache creation tokens
  const cacheCreationTokens = tokens.cache_creation_input_tokens || 0;
  if (cacheCreationTokens > 0) {
    const cacheCreationRate = pricing.cache_creation || pricing.input; // Fallback to input rate
    cost += (cacheCreationTokens * (cacheCreationRate / 1000000));
  }

  return cost;
}