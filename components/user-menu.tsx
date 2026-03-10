"use client"

import { LogOut, Settings, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { signOut } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"

interface UserMenuProps {
  email: string
  avatarUrl?: string
}

export function UserMenu({ email, avatarUrl }: UserMenuProps) {
  const initials = email
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto w-full justify-start gap-2.5 px-3 py-2 hover:bg-secondary"
        >
          <Avatar className="h-7 w-7">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={email} />}
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start min-w-0">
            <span className="text-xs font-medium truncate max-w-[140px] text-foreground">
              {email}
            </span>
            <span className="text-[10px] text-muted-foreground">Free plan</span>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="top"
        align="start"
        className="w-52"
        sideOffset={8}
      >
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={signOut} className="w-full">
            <button
              type="submit"
              className="flex w-full items-center text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
