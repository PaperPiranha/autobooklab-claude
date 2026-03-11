"use client"

import { useState } from "react"
import {
  LayoutGrid,
  Type,
  Image as ImageIcon,
  Shapes,
  Columns,
  Star,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ElementsTab } from "./panels/elements-tab"
import { TextTab } from "./panels/text-tab"
import { ImagesTab } from "./panels/images-tab"
import { ShapesTab } from "./panels/shapes-tab"
import { LayoutsTab } from "./panels/layouts-tab"
import { FavouritesTab } from "./panels/favourites-tab"
import { AiChatTab } from "./panels/ai-chat-tab"
import type { ElementType } from "@/lib/editor/types"

type TabId = "elements" | "text" | "images" | "shapes" | "layouts" | "favourites" | "ai"

interface Tab {
  id: TabId
  icon: React.ReactNode
  label: string
}

const TABS: Tab[] = [
  { id: "elements", icon: <LayoutGrid className="h-4 w-4" />, label: "Elements" },
  { id: "text", icon: <Type className="h-4 w-4" />, label: "Text" },
  { id: "images", icon: <ImageIcon className="h-4 w-4" />, label: "Images" },
  { id: "shapes", icon: <Shapes className="h-4 w-4" />, label: "Shapes" },
  { id: "layouts", icon: <Columns className="h-4 w-4" />, label: "Layouts" },
  { id: "favourites", icon: <Star className="h-4 w-4" />, label: "Favourites" },
  { id: "ai", icon: <Sparkles className="h-4 w-4" />, label: "AI Chat" },
]

interface LeftPanelProps {
  onAddElement: (type: ElementType, variant?: string) => void
  bookId: string
  bookTitle: string
  bookGenre: string
  bookDescription: string
  userId?: string
}

export function LeftPanel({
  onAddElement,
  bookId,
  bookTitle,
  bookGenre,
  bookDescription,
  userId,
}: LeftPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("elements")

  return (
    <aside className="flex shrink-0 bg-sidebar border-r border-border h-full">
      {/* Tab strip — 52px */}
      <div className="w-[52px] flex flex-col items-center py-2 gap-1 border-r border-border shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-10 h-12 rounded-md transition-colors",
              activeTab === tab.id
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            {tab.icon}
            <span className="text-[8px] leading-none font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content area — 260px */}
      <div className="w-[260px] flex flex-col min-h-0 overflow-hidden">
        {/* Panel header */}
        <div className="px-3 pt-3 pb-2 border-b border-border shrink-0">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {TABS.find((t) => t.id === activeTab)?.label}
          </h2>
        </div>

        {/* Panel content */}
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {activeTab === "elements" && (
            <ElementsTab onAddElement={onAddElement} />
          )}
          {activeTab === "text" && <TextTab />}
          {activeTab === "images" && (
            <ImagesTab bookId={bookId} bookTitle={bookTitle} bookGenre={bookGenre} />
          )}
          {activeTab === "shapes" && <ShapesTab />}
          {activeTab === "layouts" && <LayoutsTab />}
          {activeTab === "favourites" && <FavouritesTab userId={userId} />}
          {activeTab === "ai" && (
            <AiChatTab
              bookTitle={bookTitle}
              bookGenre={bookGenre}
              bookDescription={bookDescription}
            />
          )}
        </div>
      </div>
    </aside>
  )
}
