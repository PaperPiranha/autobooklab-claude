"use client"

import { Turnstile } from "@marsidev/react-turnstile"

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void
}

export function TurnstileWidget({ onSuccess }: TurnstileWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  if (!siteKey) return null

  return (
    <Turnstile
      siteKey={siteKey}
      onSuccess={onSuccess}
      options={{
        theme: "dark",
        size: "flexible",
      }}
    />
  )
}
