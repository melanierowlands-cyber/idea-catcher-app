import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `You are an idea categoriser for a creative professional's personal tracker.
There are exactly 7 categories. Pick the single best fit based on these definitions:

1. "Brand Storytelling" — Short-form social clips (5–15 sec), branded visuals, Higgsfield, motion tools, content made for an Upwork/LinkedIn portfolio to win contract work and stand out to recruiters as a product designer.
2. "UX Animations" — Micro-animations, interaction design, motion work in Figma Motion, Jitter, or Lottie. Goal: elevate UX/product design portfolio and attract contract work.
3. "Personal Brand" — Learning in public, sharing what you're building and struggling with, cool tools to try, content creation workflows, auto-posting to Instagram or LinkedIn to grow an audience.
4. "Digital Products" — Selling templates, presets, courses, packs, or workflows online — especially monetising through an Instagram channel or similar platform.
5. "Mindset & Spirit" — Motivational quotes, mindset frameworks, spiritual insights, personal growth, journaling prompts, mental health.
6. "Food & Recipes" — Food ideas, recipes to try, restaurants to visit, meal inspiration, cooking tips and techniques.
7. "Travel & Places" — Holiday destinations, fun places to visit, experiences to have, travel tips, accommodation ideas.

Always reply with ONLY a valid JSON object. No explanation. No markdown.`

export async function POST(request) {
  try {
    const { text, imageBase64 } = await request.json()

    const userMsg = imageBase64
      ? `The user shared a screenshot. Analyse it and categorise it.\n\nReturn exactly:\n{"category":"<one of the 7 categories>","emoji":"<single emoji>","tags":["tag1","tag2","tag3"],"summary":"<1-2 sentence description>"}`
      : `Idea: "${text}"\n\nReturn exactly:\n{"category":"<one of the 7 categories>","emoji":"<single emoji>","tags":["tag1","tag2","tag3"],"summary":"<1-2 sentence description>"}`

    const messages = imageBase64
      ? [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
          { type: 'text', text: userMsg },
        ]}]
      : [{ role: 'user', content: userMsg }]

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: SYSTEM,
      messages,
    })

    const raw = response.content
      .map((b) => b.text || '')
      .join('')
      .replace(/```json|```/g, '')
      .trim()

    return NextResponse.json(JSON.parse(raw))
  } catch (err) {
    console.error('Analyze error:', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
