import { NextResponse } from 'next/server'

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`

export async function POST(request) {
  try {
    const { title, notes, imageBase64 } = await request.json()

    const textPrompt = imageBase64
      ? `This screenshot has been saved with the title "${title}".${notes ? ` Notes: ${notes}` : ''} Write a clear, specific 1-2 sentence summary of what this idea is about and why it could be useful. Return only the summary, no preamble.`
      : `Idea title: "${title}"${notes ? `\nDetails: ${notes}` : ''}\n\nWrite a clear, specific 1-2 sentence summary of what this idea is about and why it could be useful. Return only the summary, no preamble.`

    const parts = imageBase64
      ? [{ inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }, { text: textPrompt }]
      : [{ text: textPrompt }]

    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { maxOutputTokens: 150, temperature: 0.6 },
      }),
    })

    if (!res.ok) {
      console.error('Gemini error:', await res.text())
      return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
    }

    const data = await res.json()
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
    return NextResponse.json({ summary })
  } catch (err) {
    console.error('Analyze error:', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
