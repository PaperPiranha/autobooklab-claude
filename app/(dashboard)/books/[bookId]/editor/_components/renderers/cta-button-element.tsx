"use client"

import type { PageElement } from "@/lib/editor/types"

interface CtaButtonElementProps {
  element: PageElement
  onUpdate: (updates: Partial<PageElement>) => void
  isNavigator?: boolean
}

export function CtaButtonElement({ element, onUpdate, isNavigator }: CtaButtonElementProps) {
  const { content, styles } = element

  const buttonStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: styles.backgroundColor ?? "#F97316",
    color: styles.color ?? "#ffffff",
    fontSize: styles.fontSize ? `${styles.fontSize}px` : "16px",
    fontWeight: styles.fontWeight ?? 700,
    borderRadius: styles.borderRadius ? `${styles.borderRadius}px` : "8px",
    cursor: isNavigator ? "default" : "text",
    border: "none",
    textAlign: "center",
  }

  return (
    <div style={buttonStyle}>
      <span
        contentEditable={!isNavigator}
        suppressContentEditableWarning
        style={{ outline: "none", padding: "0 12px" }}
        onBlur={(e) =>
          onUpdate({ content: { ...content, text: e.currentTarget.textContent ?? "" } })
        }
      >
        {content.text || "Get Started Now"}
      </span>
    </div>
  )
}
