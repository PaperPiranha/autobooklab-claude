"use client"

import { Plus, Minus } from "lucide-react"
import type { PageElement } from "@/lib/editor/types"

interface ListElementProps {
  element: PageElement
  onUpdate: (updates: Partial<PageElement>) => void
  isNavigator?: boolean
}

export function ListElement({ element, onUpdate, isNavigator }: ListElementProps) {
  const { content, styles, type } = element
  const items = content.items ?? ["Item 1"]
  const isOrdered = type === "ordered-list"

  const listStyle: React.CSSProperties = {
    fontSize: styles.fontSize ? `${styles.fontSize}px` : "16px",
    color: styles.color ?? "#1a1a1a",
    lineHeight: styles.lineHeight ?? 1.7,
    paddingLeft: "20px",
    margin: 0,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    listStyleType: isOrdered ? "decimal" : "disc",
  }

  function updateItem(index: number, value: string) {
    const newItems = [...items]
    newItems[index] = value
    onUpdate({ content: { ...content, items: newItems } })
  }

  function addItem() {
    onUpdate({ content: { ...content, items: [...items, "New item"] } })
  }

  function removeItem(index: number) {
    if (items.length <= 1) return
    const newItems = items.filter((_, i) => i !== index)
    onUpdate({ content: { ...content, items: newItems } })
  }

  const Tag = isOrdered ? "ol" : "ul"

  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative" }}>
      <Tag style={listStyle}>
        {items.map((item, i) => (
          <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "4px", marginBottom: "2px" }}>
            <span
              contentEditable={!isNavigator}
              suppressContentEditableWarning
              style={{ flex: 1, outline: "none", cursor: isNavigator ? "default" : "text" }}
              onBlur={(e) => updateItem(i, e.currentTarget.textContent ?? "")}
            >
              {item}
            </span>
            {!isNavigator && (
              <button
                type="button"
                onClick={() => removeItem(i)}
                style={{
                  flexShrink: 0,
                  width: 16,
                  height: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 2,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  opacity: 0.4,
                  color: "currentColor",
                }}
                title="Remove item"
              >
                <Minus style={{ width: 10, height: 10 }} />
              </button>
            )}
          </li>
        ))}
      </Tag>
      {!isNavigator && (
        <button
          type="button"
          onClick={addItem}
          style={{
            marginTop: 4,
            marginLeft: 20,
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            color: "#888",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: "2px 4px",
          }}
        >
          <Plus style={{ width: 10, height: 10 }} />
          Add item
        </button>
      )}
    </div>
  )
}
