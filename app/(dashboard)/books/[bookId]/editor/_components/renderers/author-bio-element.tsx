"use client"

import { User } from "lucide-react"
import type { PageElement } from "@/lib/editor/types"

interface AuthorBioElementProps {
  element: PageElement
  onUpdate: (updates: Partial<PageElement>) => void
  isNavigator?: boolean
}

export function AuthorBioElement({ element, onUpdate, isNavigator }: AuthorBioElementProps) {
  const { content, styles } = element

  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    gap: 16,
    backgroundColor: styles.backgroundColor ?? "#f9f9f9",
    padding: styles.padding ? `${styles.padding}px` : "16px",
    borderRadius: styles.borderRadius ? `${styles.borderRadius}px` : "8px",
    overflow: "hidden",
  }

  const textStyle: React.CSSProperties = {
    fontSize: styles.fontSize ? `${styles.fontSize}px` : "14px",
    color: styles.color ?? "#1a1a1a",
  }

  return (
    <div style={containerStyle}>
      {/* Avatar */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          overflow: "hidden",
          flexShrink: 0,
          background: "#e0e0e0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {content.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={content.src}
            alt={content.name ?? "Author"}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            draggable={false}
          />
        ) : (
          <User style={{ width: 28, height: 28, color: "#aaa" }} />
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          contentEditable={!isNavigator}
          suppressContentEditableWarning
          style={{ ...textStyle, fontWeight: 700, outline: "none", marginBottom: 4 }}
          onBlur={(e) =>
            onUpdate({ content: { ...content, name: e.currentTarget.textContent ?? "" } })
          }
        >
          {content.name || "Author Name"}
        </div>
        <div
          contentEditable={!isNavigator}
          suppressContentEditableWarning
          style={{ ...textStyle, color: "#666", outline: "none", lineHeight: 1.5 }}
          onBlur={(e) =>
            onUpdate({ content: { ...content, bio: e.currentTarget.textContent ?? "" } })
          }
        >
          {content.bio || "Short author bio goes here."}
        </div>
      </div>
    </div>
  )
}
