"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Loader2, Copy, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useEditor } from "../editor-context"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface AiChatTabProps {
  bookTitle: string
  bookGenre: string
  bookDescription: string
}

const QUICK_ACTIONS = [
  "Write an intro paragraph for this page",
  "Suggest a compelling chapter title",
  "Rewrite the selected text to be more engaging",
  "Add 3 bullet points about the current topic",
]

export function AiChatTab({ bookTitle, bookGenre, bookDescription }: AiChatTabProps) {
  const { state } = useEditor()
  const { selectedElementId, pages, activePageId } = state

  const activePage = pages.find((p) => p.id === activePageId)
  const selectedElement = activePage?.elements.find((e) => e.id === selectedElementId) ?? null

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState("")
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || isStreaming) return
    setError("")
    setInput("")

    const userMessage: Message = { role: "user", content: text }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)

    const assistantMessage: Message = { role: "assistant", content: "" }
    setMessages([...newMessages, assistantMessage])
    setIsStreaming(true)

    abortRef.current = new AbortController()

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          context: {
            bookTitle,
            genre: bookGenre,
            description: bookDescription,
            currentPageName: activePage?.name ?? "",
            selectedElementContent: selectedElement?.content.text
              ? selectedElement.content.text.replace(/<[^>]+>/g, "").slice(0, 200)
              : "",
          },
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Request failed")
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error("No response stream")

      let fullContent = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullContent += decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: "assistant", content: fullContent }
          return updated
        })
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return
      const msg = e instanceof Error ? e.message : "Failed to send message"
      setError(msg)
      setMessages((prev) => prev.slice(0, -1)) // remove empty assistant message
    } finally {
      setIsStreaming(false)
    }
  }

  function handleCopy(content: string, index: number) {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    })
  }

  function stopStreaming() {
    abortRef.current?.abort()
    setIsStreaming(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="py-4">
            <p className="text-xs text-muted-foreground text-center mb-4">
              Ask anything about your eBook content
            </p>
            <div className="space-y-1.5">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  onClick={() => sendMessage(action)}
                  className="w-full text-left text-xs rounded-md border border-border px-3 py-2 hover:bg-muted/60 hover:border-primary/40 transition-colors text-muted-foreground"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={cn("flex flex-col gap-1", msg.role === "user" && "items-end")}>
              <div
                className={cn(
                  "max-w-[90%] rounded-lg px-3 py-2 text-xs leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-foreground"
                )}
              >
                {msg.content || (isStreaming && i === messages.length - 1 ? (
                  <span className="inline-block h-3 w-0.5 animate-pulse bg-current" />
                ) : "")}
              </div>
              {msg.role === "assistant" && msg.content && (
                <button
                  onClick={() => handleCopy(msg.content, i)}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors self-start"
                >
                  {copiedIndex === i ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                  {copiedIndex === i ? "Copied" : "Copy"}
                </button>
              )}
            </div>
          ))
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 space-y-2">
        {selectedElement?.content.text && (
          <p className="text-[10px] text-muted-foreground bg-secondary/50 rounded px-2 py-1">
            Context: <span className="text-foreground">Selected element</span>
          </p>
        )}
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the AI assistant…"
            rows={2}
            className="text-xs resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                sendMessage(input)
              }
            }}
          />
          <div className="flex flex-col gap-1">
            <Button
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => (isStreaming ? stopStreaming() : sendMessage(input))}
              disabled={!input.trim() && !isStreaming}
              title={isStreaming ? "Stop" : "Send"}
            >
              {isStreaming ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
