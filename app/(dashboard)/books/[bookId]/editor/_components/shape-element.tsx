"use client"

import type { ElementStyles } from "@/lib/editor/types"

interface ShapeElementProps {
  w: number
  h: number
  shapeType: "rect" | "circle" | "line"
  styles: ElementStyles
}

export function ShapeElement({ w, h, shapeType, styles }: ShapeElementProps) {
  const fill = styles.backgroundColor || "#F97316"
  const stroke = styles.strokeColor || "transparent"
  const strokeWidth = styles.strokeWidth ?? 0

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {shapeType === "rect" && (
        <rect
          width={w}
          height={h}
          rx={styles.borderRadius ?? 0}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      )}
      {shapeType === "circle" && (
        <ellipse
          cx={w / 2}
          cy={h / 2}
          rx={w / 2}
          ry={h / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      )}
      {shapeType === "line" && (
        <line
          x1={0}
          y1={h / 2}
          x2={w}
          y2={h / 2}
          stroke={stroke !== "transparent" ? stroke : fill !== "#F97316" ? fill : "#1a1a1a"}
          strokeWidth={strokeWidth || 4}
        />
      )}
    </svg>
  )
}
