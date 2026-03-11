"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TurnstileWidget } from "@/components/turnstile-widget"
import { signUpWithTurnstile } from "@/app/actions/auth"

export function SignUpForm() {
  const [turnstileToken, setTurnstileToken] = useState("")
  const hasTurnstile = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  async function handleSubmit(formData: FormData) {
    formData.set("turnstileToken", turnstileToken)
    await signUpWithTurnstile(formData)
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Min. 8 characters"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      {hasTurnstile && (
        <div className="flex justify-center">
          <TurnstileWidget onSuccess={setTurnstileToken} />
        </div>
      )}

      <Button
        type="submit"
        className="w-full font-medium"
        disabled={hasTurnstile && !turnstileToken}
      >
        Create account
      </Button>
    </form>
  )
}
