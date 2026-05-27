import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Fast & cheap model — used for Q&A (fortune route) and post / article drafting.
// Override via env if you ever want to swap to Sonnet/Opus for specific routes.
export const CLAUDE_FAST_MODEL =
  process.env.ANTHROPIC_FAST_MODEL || "claude-haiku-4-5-20251001";

// Default model. Kept as a separate alias so we can later raise this to Sonnet/Opus
// for higher-quality flows without touching Q&A and post generation.
export const CLAUDE_MODEL =
  process.env.ANTHROPIC_MODEL || CLAUDE_FAST_MODEL;

export const MAX_TOKENS = 1024;
