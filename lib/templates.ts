export type Template = {
  id: string
  name: string
  description: string
  icon: string
  html: string
}

export const templates: Template[] = [
  {
    id: "blank",
    name: "Blank",
    description: "Start with an empty page",
    icon: "✦",
    html: "<p></p>",
  },
  {
    id: "standard",
    name: "Standard Chapter",
    description: "Introduction, body sections, and conclusion",
    icon: "📖",
    html: `<h2>Introduction</h2><p>Begin by introducing the main theme of this chapter and why it matters to your reader.</p><h2>Main Content</h2><p>Develop your core ideas here. Support your points with examples, evidence, and stories that bring the material to life.</p><h2>Going Deeper</h2><p>Explore the nuances and implications of your topic. This is where you can challenge assumptions and offer fresh perspectives.</p><h2>Key Takeaways</h2><p>Summarise the most important lessons from this chapter. What should readers walk away knowing?</p>`,
  },
  {
    id: "howto",
    name: "How-To / Tutorial",
    description: "Clear step-by-step instructional format",
    icon: "🎯",
    html: `<h2>What You'll Learn</h2><p>By the end of this chapter, you'll be able to...</p><h2>What You Need</h2><p>Before we begin, make sure you have:</p><ul><li>Item one</li><li>Item two</li><li>Item three</li></ul><h2>Step 1: Getting Started</h2><p>Begin by setting up your environment. This foundational step ensures everything runs smoothly.</p><h2>Step 2: The Core Process</h2><p>Now we move into the heart of the technique. Take your time here — this is where most of the value lives.</p><h2>Step 3: Refinement</h2><p>Polish and optimise your work. Small adjustments here can make a significant difference in results.</p><h2>Common Mistakes to Avoid</h2><p>Watch out for these pitfalls that trip up most beginners...</p>`,
  },
  {
    id: "listicle",
    name: "List Article",
    description: "Scannable tips, points, or ideas",
    icon: "📋",
    html: `<h2>Introduction</h2><p>Here are the essential things you need to know about this topic. Each point builds on the last.</p><h2>1. The First Big Idea</h2><p>Start with your most compelling point. Readers who only skim will at least absorb this one.</p><h2>2. The Second Big Idea</h2><p>Build momentum. Connect this point back to the first to show how they work together.</p><h2>3. The Third Big Idea</h2><p>By now your reader is engaged. This is a good place for a surprising or counterintuitive insight.</p><h2>4. The Fourth Big Idea</h2><p>Add depth here. A real-world example or case study will make this point stick.</p><h2>5. The Fifth Big Idea</h2><p>End with your most actionable point — the one readers can apply immediately.</p><h2>Putting It Together</h2><p>When you combine all five ideas, the result is...</p>`,
  },
  {
    id: "case-study",
    name: "Case Study",
    description: "Problem → Approach → Results format",
    icon: "🔬",
    html: `<h2>Background</h2><p>Set the scene. Who are the key players, what was the context, and what made this situation worth examining?</p><h2>The Challenge</h2><p>Describe the problem or opportunity in concrete terms. What was at stake? What constraints existed?</p><h2>The Approach</h2><p>Walk through the methodology or strategy that was applied. Why was this approach chosen over alternatives?</p><h2>The Results</h2><p>Share the outcomes with specific numbers where possible. What changed? What improved?</p><h2>Lessons Learned</h2><p>What can readers take from this case and apply in their own context? Be honest about what didn't work too.</p>`,
  },
]
