import type { PageElement } from "./types"
import { PAGE_W, PAGE_H } from "./types"

/**
 * Smart element placement — avoids overlapping existing elements.
 * Cascades +30px down and +20px right until a free spot is found.
 */
export function findOpenPosition(
  elements: PageElement[],
  newEl: Pick<PageElement, "x" | "y" | "w" | "h">
): { x: number; y: number } {
  let { x, y } = newEl
  const { w, h } = newEl

  const MAX_ATTEMPTS = 50

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const hasOverlap = elements.some((el) => rectsOverlap(x, y, w, h, el))
    if (!hasOverlap) return { x, y }

    // Cascade: shift down and right
    x += 20
    y += 30

    // Wrap if exceeding page bounds
    if (x + w > PAGE_W) x = 20 + (i % 5) * 15
    if (y + h > PAGE_H) y = 20 + (i % 5) * 15
  }

  // Fallback: center of page
  return {
    x: Math.max(0, Math.round((PAGE_W - w) / 2)),
    y: Math.max(0, Math.round((PAGE_H - h) / 2)),
  }
}

function rectsOverlap(
  x: number, y: number, w: number, h: number,
  el: PageElement
): boolean {
  return !(
    x + w <= el.x ||
    el.x + el.w <= x ||
    y + h <= el.y ||
    el.y + el.h <= y
  )
}
