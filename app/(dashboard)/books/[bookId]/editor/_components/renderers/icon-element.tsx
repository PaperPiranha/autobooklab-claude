"use client"

import * as LucideIcons from "lucide-react"
import type { PageElement } from "@/lib/editor/types"

interface IconElementProps {
  element: PageElement
}

export function IconElement({ element }: IconElementProps) {
  const { content, styles } = element

  const iconName = content.iconName ?? "Star"
  const color = content.color ?? styles.color ?? "#F97316"
  const size = Math.min(element.w, element.h) * 0.75

  // Dynamic icon lookup
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string; style?: React.CSSProperties }>>)[iconName]

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: styles.opacity != null ? styles.opacity / 100 : 1,
      }}
    >
      {IconComponent ? (
        <IconComponent size={size} color={color} />
      ) : (
        <LucideIcons.Star size={size} color={color} />
      )}
    </div>
  )
}
