import { generateText } from "ai"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { prompt, systemPrompt } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "Prompt is required" },
        { status: 400 }
      )
    }

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      system: systemPrompt || "Sei un assistente fitness esperto in allenamento e nutrizione. Rispondi in italiano.",
      prompt: prompt,
    })

    return NextResponse.json({ success: true, text })
  } catch (error) {
    console.error("[v0] AI generation error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to generate text" },
      { status: 500 }
    )
  }
}
