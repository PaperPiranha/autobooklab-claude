"use client"

import { Video } from "lucide-react"
import type { PageElement } from "@/lib/editor/types"

interface VideoEmbedElementProps {
  element: PageElement
  onUpdate: (updates: Partial<PageElement>) => void
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function VideoEmbedElement({ element, onUpdate }: VideoEmbedElementProps) {
  const { content, styles } = element

  const videoId = content.videoId || (content.url ? extractYouTubeId(content.url) : null)
  const thumbUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : null

  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    borderRadius: styles.borderRadius ? `${styles.borderRadius}px` : "8px",
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#000",
  }

  return (
    <div style={containerStyle}>
      {thumbUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbUrl}
            alt="Video thumbnail"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            draggable={false}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderStyle: "solid",
                  borderWidth: "12px 0 12px 24px",
                  borderColor: "transparent transparent transparent #1a1a1a",
                  marginLeft: 4,
                }}
              />
            </div>
          </div>
        </>
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            color: "#888",
            background: "#1a1a1a",
          }}
        >
          <Video style={{ width: 32, height: 32, opacity: 0.5 }} />
          <span style={{ fontSize: 12, opacity: 0.7 }}>Paste YouTube URL in Properties</span>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          bottom: 4,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 10,
          color: "rgba(255,255,255,0.6)",
          pointerEvents: "none",
        }}
      >
        Video embeds appear in web preview only, not in PDF export
      </div>
    </div>
  )
}

export { extractYouTubeId }
