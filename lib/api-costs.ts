/**
 * Estimated API cost per action (USD).
 * These are rough averages based on typical token usage per call.
 * Update these as models/pricing change.
 */
export const API_COST_PER_ACTION: Record<string, number> = {
  generate: 0.035, // Claude Sonnet 4.6 — ~2K in, ~3K out
  rewrite: 0.025, // Claude Sonnet 4.6 — ~1.5K in, ~2K out
  chat: 0.02, // Claude Sonnet 4.6 — ~1K in, ~1.5K out
  outline: 0.005, // Claude Haiku 4.5 — ~500 in, ~1K out
  "seed-pages": 0.008, // Claude Haiku 4.5 — ~1K in, ~2K out
  "generate-image": 0.04, // OpenAI DALL-E 3 standard
}

/** Calculate total API cost from an array of transactions */
export function calculateApiCost(
  transactions: { action: string; amount: number }[]
): number {
  return transactions.reduce((total, tx) => {
    const cost = API_COST_PER_ACTION[tx.action] ?? 0
    // Each transaction is one API call (amount is negative for spends)
    const calls = tx.amount < 0 ? 1 : 0
    return total + cost * calls
  }, 0)
}

/** Calculate cost from action counts */
export function calculateCostFromCounts(
  counts: Record<string, number>
): number {
  return Object.entries(counts).reduce((total, [action, count]) => {
    return total + (API_COST_PER_ACTION[action] ?? 0) * count
  }, 0)
}
