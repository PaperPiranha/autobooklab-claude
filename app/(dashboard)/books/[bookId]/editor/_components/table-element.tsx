"use client"

import type { ElementStyles } from "@/lib/editor/types"

interface TableElementProps {
  rows: string[][]
  styles: ElementStyles
  isSelected: boolean
  onUpdate: (rows: string[][]) => void
}

export function TableElement({ rows, styles, isSelected, onUpdate }: TableElementProps) {
  const borderColor = styles.borderColor || "#e0e0e0"
  const fontSize = styles.fontSize ?? 14
  const headerBg = styles.backgroundColor ?? "#f5f5f5"

  function handleCellBlur(rowIdx: number, colIdx: number, value: string) {
    const newRows = rows.map((row, ri) =>
      row.map((cell, ci) => (ri === rowIdx && ci === colIdx ? value : cell))
    )
    onUpdate(newRows)
  }

  function addRow() {
    const cols = rows[0]?.length ?? 1
    const newRows = [...rows, Array(cols).fill("Cell")]
    onUpdate(newRows)
  }

  function addCol() {
    const newRows = rows.map((row) => [...row, "Cell"])
    onUpdate(newRows)
  }

  function removeRow() {
    if (rows.length <= 1) return
    const newRows = rows.slice(0, -1)
    onUpdate(newRows)
  }

  function removeCol() {
    if ((rows[0]?.length ?? 0) <= 1) return
    const newRows = rows.map((row) => row.slice(0, -1))
    onUpdate(newRows)
  }

  return (
    <div className="relative w-full h-full overflow-auto">
      {/* Table controls shown when selected */}
      {isSelected && (
        <div
          className="absolute flex gap-1"
          style={{ top: -36, left: 0, zIndex: 1000 }}
        >
          {[
            { label: "+ Row", fn: addRow },
            { label: "+ Col", fn: addCol },
            { label: "- Row", fn: removeRow },
            { label: "- Col", fn: removeCol },
          ].map(({ label, fn }) => (
            <button
              key={label}
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                fn()
              }}
              className="px-2 py-0.5 text-[10px] bg-primary text-primary-foreground rounded font-medium hover:bg-primary/80 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <table
        className="w-full h-full border-collapse table-fixed"
        style={{ fontSize: `${fontSize}px`, color: styles.color ?? "#1a1a1a" }}
      >
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {row.map((cell, colIdx) => {
                const isHeader = rowIdx === 0
                return (
                  <td
                    key={colIdx}
                    style={{
                      border: `1px solid ${borderColor}`,
                      padding: "8px",
                      fontWeight: isHeader ? 600 : undefined,
                      backgroundColor: isHeader ? headerBg : "#ffffff",
                      verticalAlign: "middle",
                    }}
                  >
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleCellBlur(rowIdx, colIdx, e.currentTarget.textContent ?? "")}
                      className="outline-none min-h-[1em]"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      {cell}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export { TableElement as TableControls }
