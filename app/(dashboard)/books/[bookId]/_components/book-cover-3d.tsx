"use client"

import type { Book } from "@/lib/types"

const GENRE_COLORS: Record<string, [string, string]> = {
  Business:         ["#1D4ED8", "#3B82F6"],
  "Self-Help":      ["#6D28D9", "#8B5CF6"],
  "Non-Fiction":    ["#065F46", "#10B981"],
  Fiction:          ["#9D174D", "#EC4899"],
  Technology:       ["#0E7490", "#06B6D4"],
  Science:          ["#0F766E", "#14B8A6"],
  Biography:        ["#92400E", "#F59E0B"],
  History:          ["#991B1B", "#EF4444"],
  "Health & Wellness": ["#166534", "#22C55E"],
  "Children's":     ["#C2410C", "#F97316"],
  Poetry:           ["#7E22CE", "#A855F7"],
  Other:            ["#374151", "#6B7280"],
}

const DEFAULT_COLORS: [string, string] = ["#C2410C", "#F97316"]

interface BookCover3DProps {
  book: Book
}

export function BookCover3D({ book }: BookCover3DProps) {
  const [dark, light] = GENRE_COLORS[book.genre] ?? DEFAULT_COLORS

  // Truncate title for cover display
  const displayTitle = book.title.length > 40 ? book.title.slice(0, 37) + "…" : book.title

  const COVER_W = 128  // px
  const COVER_H = 176  // px
  const SPINE_W = 22   // px

  return (
    <div
      aria-hidden="true"
      style={{ perspective: "900px", perspectiveOrigin: "40% 50%", display: "inline-block" }}
    >
      <div
        style={{
          position: "relative",
          width: COVER_W,
          height: COVER_H,
          transformStyle: "preserve-3d",
          transform: "rotateY(-28deg) rotateX(4deg)",
        }}
      >
        {/* ── Front cover ───────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "0 3px 3px 0",
            background: `linear-gradient(150deg, ${light} 0%, ${dark} 100%)`,
            boxShadow: "6px 8px 28px rgba(0,0,0,0.45)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "14px 12px",
            overflow: "hidden",
          }}
        >
          {/* Top decoration */}
          <div>
            {book.genre && (
              <span
                style={{
                  fontSize: 8,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.65)",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                {book.genre}
              </span>
            )}
            {/* Decorative line */}
            <div style={{ width: 24, height: 1.5, backgroundColor: "rgba(255,255,255,0.4)", borderRadius: 2 }} />
          </div>

          {/* Title */}
          <div>
            <p
              style={{
                fontSize: displayTitle.length > 25 ? 10 : 12,
                fontWeight: 700,
                color: "white",
                lineHeight: 1.3,
                wordBreak: "break-word",
              }}
            >
              {displayTitle}
            </p>
          </div>

          {/* Bottom shimmer stripe */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 28,
              background: "linear-gradient(to top, rgba(0,0,0,0.25), transparent)",
            }}
          />
        </div>

        {/* ── Spine ─────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: SPINE_W,
            height: COVER_H,
            background: `linear-gradient(to right, ${dark}, ${dark}cc)`,
            borderRadius: "3px 0 0 3px",
            transform: `rotateY(-90deg) translateX(${-SPINE_W / 2}px) translateZ(${SPINE_W / 2}px)`,
            transformOrigin: "right center",
            boxShadow: "inset -4px 0 8px rgba(0,0,0,0.2)",
          }}
        />

        {/* ── Page stack (right edge) ────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: 2,
            right: 0,
            width: 6,
            height: COVER_H - 4,
            background: "linear-gradient(to right, #d1d5db, #f9fafb, #d1d5db)",
            transform: `rotateY(90deg) translateX(3px) translateZ(${COVER_W - 3}px)`,
            transformOrigin: "left center",
          }}
        />

        {/* ── Back cover ────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: dark,
            borderRadius: "0 3px 3px 0",
            transform: `rotateY(180deg)`,
            backfaceVisibility: "hidden",
          }}
        />
      </div>
    </div>
  )
}
