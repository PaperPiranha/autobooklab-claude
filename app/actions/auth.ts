"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  })

  if (error) {
    redirect(`/sign-in?error=${encodeURIComponent(error.message)}`)
  }

  redirect("/dashboard")
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  })

  if (error) {
    redirect(`/sign-up?error=${encodeURIComponent(error.message)}`)
  }

  redirect("/sign-up?message=Check your email to confirm your account")
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/sign-in")
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(
    formData.get("email") as string,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/reset-password`,
    }
  )

  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`)
  }

  redirect("/forgot-password?message=Check your email for a reset link")
}
