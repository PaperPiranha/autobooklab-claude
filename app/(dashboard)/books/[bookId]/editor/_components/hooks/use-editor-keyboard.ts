import { useEffect, useCallback } from "react"
import { useEditor, makeDefaultElement } from "../editor-context"

export function useEditorKeyboard(onShowShortcuts?: () => void) {
  const { state, dispatch } = useEditor()
  const { selectedElementId, activePageId, pages } = state

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase()
      const isEditable = tag === "input" || tag === "textarea" || (e.target as HTMLElement).isContentEditable
      const mod = e.metaKey || e.ctrlKey

      // Zoom shortcuts (work even in editable fields)
      if (mod && (e.key === "=" || e.key === "+")) {
        e.preventDefault()
        dispatch({ type: "SET_ZOOM", zoom: Math.min(1.5, (state.zoom ?? 1) + 0.25) })
        return
      }
      if (mod && e.key === "-") {
        e.preventDefault()
        dispatch({ type: "SET_ZOOM", zoom: Math.max(0.5, (state.zoom ?? 1) - 0.25) })
        return
      }
      if (mod && e.key === "0") {
        e.preventDefault()
        dispatch({ type: "SET_ZOOM", zoom: 1 })
        return
      }

      // Undo/Redo (work everywhere)
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault()
        dispatch({ type: "UNDO" })
        return
      }
      if (mod && e.key === "z" && e.shiftKey) {
        e.preventDefault()
        dispatch({ type: "REDO" })
        return
      }

      // Don't intercept keys when editing text
      if (isEditable) return

      // Shortcuts dialog
      if (e.key === "?") {
        e.preventDefault()
        onShowShortcuts?.()
        return
      }

      // Escape — deselect
      if (e.key === "Escape") {
        dispatch({ type: "SET_SELECTED_ELEMENT", elementId: null })
        return
      }

      if (!selectedElementId) return

      const activePage = pages.find((p) => p.id === activePageId)
      const selectedEl = activePage?.elements.find((el) => el.id === selectedElementId)
      if (!selectedEl) return

      // Delete/Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault()
        dispatch({ type: "DELETE_ELEMENT", elementId: selectedElementId })
        return
      }

      // Arrow nudge
      const nudgeAmount = e.shiftKey ? 10 : 1
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        dispatch({ type: "UPDATE_ELEMENT", elementId: selectedElementId, updates: { x: Math.max(0, selectedEl.x - nudgeAmount) } })
        return
      }
      if (e.key === "ArrowRight") {
        e.preventDefault()
        dispatch({ type: "UPDATE_ELEMENT", elementId: selectedElementId, updates: { x: Math.min(794 - selectedEl.w, selectedEl.x + nudgeAmount) } })
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        dispatch({ type: "UPDATE_ELEMENT", elementId: selectedElementId, updates: { y: Math.max(0, selectedEl.y - nudgeAmount) } })
        return
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        dispatch({ type: "UPDATE_ELEMENT", elementId: selectedElementId, updates: { y: Math.min(1123 - selectedEl.h, selectedEl.y + nudgeAmount) } })
        return
      }

      // Cmd+D — duplicate
      if (mod && e.key === "d") {
        e.preventDefault()
        dispatch({ type: "DUPLICATE_ELEMENT", elementId: selectedElementId })
        return
      }

      // Cmd+] — bring forward
      if (mod && e.key === "]") {
        e.preventDefault()
        dispatch({ type: "BRING_FORWARD", elementId: selectedElementId })
        return
      }
      // Cmd+[ — send backward
      if (mod && e.key === "[") {
        e.preventDefault()
        dispatch({ type: "SEND_BACKWARD", elementId: selectedElementId })
        return
      }

      // Cmd+L — toggle lock
      if (mod && e.key === "l") {
        e.preventDefault()
        dispatch({ type: "UPDATE_ELEMENT", elementId: selectedElementId, updates: { locked: !selectedEl.locked } })
        return
      }
    },
    [state, selectedElementId, activePageId, pages, dispatch, onShowShortcuts]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])
}
