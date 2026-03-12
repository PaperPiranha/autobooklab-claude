import type { PageElement } from "./types"
import { PAGE_W, PAGE_H } from "./types"

export interface AlignmentGuide {
  orientation: "horizontal" | "vertical"
  position: number // px from left (vertical) or top (horizontal)
}

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

const PAGE_CENTER_X = PAGE_W / 2 // 397
const PAGE_CENTER_Y = PAGE_H / 2 // 561.5
const PAGE_MARGIN = 72

/**
 * Finds alignment guides when the dragging element's edges/center
 * align with other elements, page center, or margins.
 */
export function findAlignmentGuides(
  dragging: Rect,
  others: PageElement[],
  threshold = 5
): AlignmentGuide[] {
  const guides: AlignmentGuide[] = []
  const dragCx = dragging.x + dragging.w / 2
  const dragCy = dragging.y + dragging.h / 2
  const dragRight = dragging.x + dragging.w
  const dragBottom = dragging.y + dragging.h

  // Vertical snap targets (x positions)
  const vTargets: number[] = [PAGE_CENTER_X, PAGE_MARGIN, PAGE_W - PAGE_MARGIN]
  // Horizontal snap targets (y positions)
  const hTargets: number[] = [PAGE_CENTER_Y, PAGE_MARGIN, PAGE_H - PAGE_MARGIN]

  for (const el of others) {
    const elCx = el.x + el.w / 2
    const elCy = el.y + el.h / 2
    // Element edges and centers
    vTargets.push(el.x, el.x + el.w, elCx)
    hTargets.push(el.y, el.y + el.h, elCy)
  }

  // Check dragging element's left, right, center against vertical targets
  const dragVEdges = [dragging.x, dragRight, dragCx]
  for (const target of vTargets) {
    for (const edge of dragVEdges) {
      if (Math.abs(edge - target) <= threshold) {
        if (!guides.some((g) => g.orientation === "vertical" && g.position === target)) {
          guides.push({ orientation: "vertical", position: target })
        }
      }
    }
  }

  // Check dragging element's top, bottom, center against horizontal targets
  const dragHEdges = [dragging.y, dragBottom, dragCy]
  for (const target of hTargets) {
    for (const edge of dragHEdges) {
      if (Math.abs(edge - target) <= threshold) {
        if (!guides.some((g) => g.orientation === "horizontal" && g.position === target)) {
          guides.push({ orientation: "horizontal", position: target })
        }
      }
    }
  }

  return guides
}

/**
 * Snap a position to the nearest guide within threshold.
 */
export function applySnap(
  pos: { x: number; y: number },
  w: number,
  h: number,
  guides: AlignmentGuide[],
  threshold = 5
): { x: number; y: number } {
  let { x, y } = pos
  const cx = x + w / 2
  const right = x + w
  const cy = y + h / 2
  const bottom = y + h

  for (const guide of guides) {
    if (guide.orientation === "vertical") {
      const t = guide.position
      // Snap left edge
      if (Math.abs(x - t) <= threshold) x = t
      // Snap right edge
      else if (Math.abs(right - t) <= threshold) x = t - w
      // Snap center
      else if (Math.abs(cx - t) <= threshold) x = t - w / 2
    } else {
      const t = guide.position
      if (Math.abs(y - t) <= threshold) y = t
      else if (Math.abs(bottom - t) <= threshold) y = t - h
      else if (Math.abs(cy - t) <= threshold) y = t - h / 2
    }
  }

  return { x, y }
}
