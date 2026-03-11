"use client"

import type { PageElement } from "@/lib/editor/types"

interface BlockquoteElementProps {
  element: PageElement
  onUpdate: (updates: Partial<PageElement>) => void
  isNavigator?: boolean
}

export function BlockquoteElement({ element, onUpdate, isNavigator }: BlockquoteElementProps) {
  const { content, styles } = element

  const containerStyle: React.CSSProperties = {
    borderLeft: `${styles.borderWidth ?? 4}px solid ${styles.borderColor ?? "#F97316"}`,
    padding: styles.padding ? `${styles.padding}px` : "20px",
    backgroundColor: styles.backgroundColor,
    borderRadius: styles.borderRadius ? `${styles.borderRadius}px` : undefined,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    overflow: "hidden",
  }

  const textStyle: React.CSSProperties = {
    fontSize: styles.fontSize ? `${styles.fontSize}px` : "22px",
    color: styles.color ?? "#1a1a1a",
    fontStyle: "italic",
    lineHeight: styles.lineHeight ?? 1.5,
    textAlign: styles.textAlign,
  }

  const attributionStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "#888888",
    marginTop: "8px",
    fontStyle: "normal",
    fontWeight: 500,
  }

  return (
    <div style={containerStyle}>
      <div style={{ position: "relative" }}>
        <span
          style={{
            position: "absolute",
            top: "-8px",
            left: "-4px",
            fontSize: "48px",
            color: styles.borderColor ?? "#F97316",
            opacity: 0.3,
            lineHeight: 1,
            fontFamily: "Georgia, serif",
            userSelect: "none",
          }}
        >
          &ldquo;
        </span>
        <div
          style={{ ...textStyle, paddingLeft: "12px" }}
          contentEditable={!isNavigator}
          suppressContentEditableWarning
          onBlur={(e) =>
            onUpdate({ content: { ...content, text: e.currentTarget.textContent ?? "" } })
          }
        >
          {content.text}
        </div>
      </div>
      {content.attribution !== undefined && (
        <div
          style={{ ...attributionStyle, paddingLeft: "12px" }}
          contentEditable={!isNavigator}
          suppressContentEditableWarning
          onBlur={(e) =>
            onUpdate({ content: { ...content, attribution: e.currentTarget.textContent ?? "" } })
          }
        >
          {content.attribution || (isNavigator ? "" : "— Attribution")}
        </div>
      )}
    </div>
  )
}
