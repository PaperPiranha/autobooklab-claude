"use client"

import { useState } from "react"
import {
  Download,
  FileText,
  BookOpen,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ExportRecord {
  id: string
  format: "pdf" | "epub"
  status: string
  created_at: string
}

interface ExportPanelProps {
  bookId: string
  bookTitle: string
  initialExports: ExportRecord[]
}

type ExportStatus = "idle" | "loading" | "done" | "error"

export function ExportPanel({ bookId, bookTitle, initialExports }: ExportPanelProps) {
  const [exports, setExports] = useState(initialExports)
  const [pdfStatus, setPdfStatus] = useState<ExportStatus>("idle")
  const [epubStatus, setEpubStatus] = useState<ExportStatus>("idle")
  const [pdfUrl, setPdfUrl] = useState("")
  const [epubUrl, setEpubUrl] = useState("")
  const [error, setError] = useState("")

  async function handleExport(format: "pdf" | "epub") {
    const setStatus = format === "pdf" ? setPdfStatus : setEpubStatus
    const setUrl = format === "pdf" ? setPdfUrl : setEpubUrl

    setStatus("loading")
    setError("")
    setUrl("")

    try {
      const res = await fetch(`/api/export/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? "Export failed")

      setUrl(data.url)
      setStatus("done")

      // Prepend to export history
      if (data.exportId) {
        setExports((prev) => [
          {
            id: data.exportId,
            format,
            status: "ready",
            created_at: new Date().toISOString(),
          },
          ...prev,
        ])
      }

      // Auto-trigger download
      const a = document.createElement("a")
      a.href = data.url
      a.download = data.fileName
      a.click()
    } catch (e) {
      setStatus("error")
      setError(e instanceof Error ? e.message : "Export failed")
    }
  }

  const FormatButton = ({
    format,
    status,
    url,
  }: {
    format: "pdf" | "epub"
    status: ExportStatus
    url: string
  }) => {
    const isPdf = format === "pdf"
    const Icon = isPdf ? FileText : BookOpen
    const label = isPdf ? "PDF" : "EPUB"
    const mime = isPdf ? "PDF document" : "EPUB eBook"

    return (
      <div className="flex flex-col gap-2 flex-1">
        <Button
          variant="outline"
          className={cn(
            "h-auto flex-col gap-2 py-4 px-4 text-left items-start transition-colors",
            status === "done" && "border-primary/40 bg-primary/5",
            status === "error" && "border-destructive/40 bg-destructive/5"
          )}
          onClick={() => handleExport(format)}
          disabled={status === "loading"}
        >
          <div className="flex items-center gap-2 w-full">
            {status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
            ) : status === "done" ? (
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            ) : status === "error" ? (
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
            ) : (
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className="font-medium text-sm">Export {label}</span>
          </div>
          <span className="text-[11px] text-muted-foreground pl-6">
            {status === "loading"
              ? "Generating…"
              : status === "done"
              ? "Done — downloading"
              : status === "error"
              ? "Export failed"
              : mime}
          </span>
        </Button>

        {status === "done" && url && (
          <a
            href={url}
            download={`${bookTitle}.${format}`}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline pl-1"
          >
            <Download className="h-3 w-3" />
            Download again
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Export buttons */}
      <div className="flex gap-3">
        <FormatButton format="pdf" status={pdfStatus} url={pdfUrl} />
        <FormatButton format="epub" status={epubStatus} url={epubUrl} />
      </div>

      {error && (
        <p className="text-xs text-destructive flex items-center gap-1.5">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}

      {/* Recent exports */}
      {exports.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Recent exports
          </p>
          <div className="space-y-1">
            {exports.slice(0, 5).map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-secondary/50 group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {exp.format === "pdf" ? (
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  ) : (
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {exp.format.toUpperCase()} ·{" "}
                    {new Date(exp.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {exp.status === "ready" && (
                  <a
                    href={`/api/export/download/${exp.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
