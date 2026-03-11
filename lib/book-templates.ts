export interface BookTemplate {
  id: string
  name: string
  tagline: string
  genre: string
  accentColor: string
  chapters: string[]
}

export const BOOK_TEMPLATES: BookTemplate[] = [
  {
    id: "business-guide",
    name: "Business Strategy Guide",
    tagline: "A structured framework for planning and executing business strategy",
    genre: "Business",
    accentColor: "#3B82F6",
    chapters: [
      "Executive Summary",
      "Market Analysis",
      "Value Proposition",
      "Competitive Landscape",
      "Go-to-Market Strategy",
      "Operations Plan",
      "Financial Projections",
      "Conclusion",
    ],
  },
  {
    id: "how-to",
    name: "Step-by-Step How-To",
    tagline: "A practical guide that walks readers through a process from start to finish",
    genre: "Non-Fiction",
    accentColor: "#10B981",
    chapters: [
      "Introduction",
      "What You'll Need",
      "Step 1: Getting Started",
      "Step 2: The Core Process",
      "Step 3: Finishing Up",
      "Common Mistakes to Avoid",
      "Next Steps",
    ],
  },
  {
    id: "self-help",
    name: "Self-Help Framework",
    tagline: "A transformational roadmap to help readers achieve lasting change",
    genre: "Self-Help",
    accentColor: "#8B5CF6",
    chapters: [
      "The Problem",
      "Why It Matters",
      "The Framework",
      "Pillar 1: Mindset",
      "Pillar 2: Action",
      "Pillar 3: Habits",
      "Your Action Plan",
    ],
  },
  {
    id: "marketing-playbook",
    name: "Marketing Playbook",
    tagline: "A comprehensive guide to building and executing a winning marketing strategy",
    genre: "Business",
    accentColor: "#F59E0B",
    chapters: [
      "Brand Story",
      "Target Audience",
      "Content Strategy",
      "SEO & Organic Growth",
      "Social Media",
      "Email Marketing",
      "Paid Advertising",
      "Measuring Results",
    ],
  },
  {
    id: "fiction-novella",
    name: "Fiction Novella",
    tagline: "A compact story structure with a compelling three-act arc",
    genre: "Fiction",
    accentColor: "#EC4899",
    chapters: [
      "Act 1: Setup",
      "Act 1: Inciting Incident",
      "Act 2: Rising Action",
      "Act 2: Midpoint",
      "Act 3: Climax",
      "Act 3: Resolution",
    ],
  },
  {
    id: "childrens-book",
    name: "Children's Picture Book",
    tagline: "A simple, joyful story structure perfect for young readers",
    genre: "Children's",
    accentColor: "#EF4444",
    chapters: [
      "The Beginning",
      "The Problem",
      "The Journey",
      "The Resolution",
      "The End",
    ],
  },
]
