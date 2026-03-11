import type { Plan } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

export type ImportMethod = "paste" | "url" | "pdf" | "youtube"
export type ExportFormat = "pdf" | "epub"

export interface PlanFeatures {
  maxBooks: number          // -1 = unlimited
  imports: ImportMethod[]
  exports: ExportFormat[]
  aiChat: boolean
  batchGenerate: boolean
  priorityAi: boolean
  customBranding: boolean
  publicProfile: boolean
  teamMembers: number       // 0 = no team
  apiAccess: boolean
  visualEditorFull: boolean
}

export const PLAN_FEATURES: Record<Plan, PlanFeatures> = {
  free: {
    maxBooks: 2,
    imports: ["paste", "url", "pdf", "youtube"],
    exports: ["pdf"],
    aiChat: false,
    batchGenerate: false,
    priorityAi: false,
    customBranding: false,
    publicProfile: false,
    teamMembers: 0,
    apiAccess: false,
    visualEditorFull: false,
  },
  starter: {
    maxBooks: 10,
    imports: ["paste", "url", "pdf", "youtube"],
    exports: ["pdf", "epub"],
    aiChat: true,
    batchGenerate: false,
    priorityAi: false,
    customBranding: false,
    publicProfile: false,
    teamMembers: 0,
    apiAccess: false,
    visualEditorFull: true,
  },
  creator: {
    maxBooks: -1,
    imports: ["paste", "url", "pdf", "youtube"],
    exports: ["pdf", "epub"],
    aiChat: true,
    batchGenerate: true,
    priorityAi: false,
    customBranding: false,
    publicProfile: true,
    teamMembers: 0,
    apiAccess: false,
    visualEditorFull: true,
  },
  pro: {
    maxBooks: -1,
    imports: ["paste", "url", "pdf", "youtube"],
    exports: ["pdf", "epub"],
    aiChat: true,
    batchGenerate: true,
    priorityAi: true,
    customBranding: true,
    publicProfile: true,
    teamMembers: 0,
    apiAccess: false,
    visualEditorFull: true,
  },
  business: {
    maxBooks: -1,
    imports: ["paste", "url", "pdf", "youtube"],
    exports: ["pdf", "epub"],
    aiChat: true,
    batchGenerate: true,
    priorityAi: true,
    customBranding: true,
    publicProfile: true,
    teamMembers: 5,
    apiAccess: true,
    visualEditorFull: true,
  },
}

/**
 * Look up the user's current plan and return their feature flags.
 * Falls back to "free" if no subscription found.
 */
export async function getUserPlanFeatures(
  userId: string
): Promise<{ plan: Plan; features: PlanFeatures }> {
  const supabase = await createClient()
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", userId)
    .single()

  const plan = (sub?.plan ?? "free") as Plan
  return { plan, features: PLAN_FEATURES[plan] }
}

/**
 * Check if a user's email is verified.
 * Supabase sets email_confirmed_at when verified.
 */
export function isEmailVerified(user: { email_confirmed_at?: string | null }): boolean {
  return !!user.email_confirmed_at
}

/**
 * Input length validation limits for AI routes.
 */
export const INPUT_LIMITS = {
  bookTitle: 200,
  chapterTitle: 200,
  description: 1000,
  customPrompt: 500,
  instruction: 500,
  selectedText: 10_000,
  chapterContent: 10_000,
  chatMessageMaxCount: 20,
  chatMessageMaxLength: 5_000,
} as const

/**
 * Validate a string field's length. Returns an error message or null if valid.
 */
export function validateLength(
  value: string | undefined | null,
  fieldName: string,
  maxLength: number
): string | null {
  if (value && value.length > maxLength) {
    return `${fieldName} exceeds maximum length of ${maxLength.toLocaleString()} characters`
  }
  return null
}

/**
 * Sanitize user-provided text before injecting into AI prompts.
 * Strips control sequences and prompt injection patterns.
 */
export function sanitizePromptInput(text: string): string {
  return text
    // Remove null bytes and other control characters (except newlines/tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Remove ANSI escape sequences
    .replace(/\x1B\[[0-9;]*[A-Za-z]/g, "")
    // Remove common prompt injection delimiters that mimic system prompts
    .replace(/<\/?(?:system|assistant|human|user|instructions?)>/gi, "")
    // Remove markdown-style system prompt injections
    .replace(/```(?:system|instructions?)\b/gi, "```text")
    // Strip excessive whitespace that could be used to push content out of view
    .replace(/\n{5,}/g, "\n\n\n")
    .trim()
}

/**
 * Export metering limits per plan (exports per month).
 * -1 = unlimited
 */
export const EXPORT_LIMITS: Record<Plan, number> = {
  free: 2,
  starter: 10,
  creator: -1,
  pro: -1,
  business: -1,
}

/**
 * Check if a user has exceeded their monthly export limit.
 * Returns { allowed: true } or { allowed: false, limit, used }.
 */
export async function checkExportLimit(
  userId: string
): Promise<{ allowed: boolean; limit: number; used: number }> {
  const { plan } = await getUserPlanFeatures(userId)
  const limit = EXPORT_LIMITS[plan]

  // Unlimited
  if (limit === -1) return { allowed: true, limit: -1, used: 0 }

  const supabase = await createClient()

  // Count exports this calendar month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from("export_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonth.toISOString())

  const used = count ?? 0
  return { allowed: used < limit, limit, used }
}

/**
 * Record an export for metering purposes.
 */
export async function recordExport(userId: string, format: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from("export_usage").insert({ user_id: userId, format })
}
