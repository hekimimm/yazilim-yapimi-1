import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { wordId, prompt, quality = "standard" } = await request.json()

    if (!wordId || !prompt) {
      return NextResponse.json({ error: "Word ID and prompt are required" }, { status: 400 })
    }

    // Get user from auth header
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""))

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid authorization" }, { status: 401 })
    }

    // Get word details
    const { data: word, error: wordError } = await supabase.from("words").select("*").eq("id", wordId).single()

    if (wordError || !word) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 })
    }

    // Enhance prompt for vocabulary learning
    const enhancedPrompt = `Educational illustration for learning English vocabulary: "${word.eng_word}" (Turkish: "${word.tur_word}"). ${prompt}. Style: clean, simple, educational, suitable for language learning, high quality, clear details, colorful but not overwhelming.`

    // OpenAI API configuration
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    // Quality settings for image size
    const sizeSettings = {
      simple: "512x512",
      standard: "1024x1024",
      advanced: "1024x1024",
    }

    const imageSize = sizeSettings[quality as keyof typeof sizeSettings] || sizeSettings.standard

    console.log("Generating image with OpenAI GPT-Image-1:", {
      wordId,
      word: word.eng_word,
      prompt: enhancedPrompt,
      size: imageSize,
    })

    // Generate image with OpenAI GPT-Image-1
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: enhancedPrompt,
        n: 1,
        size: imageSize,
        quality: quality === "advanced" ? "hd" : "standard",
        response_format: "url",
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("OpenAI API error:", errorData)
      return NextResponse.json(
        {
          error: "Image generation failed",
          details: errorData,
        },
        { status: 500 },
      )
    }

    const data = await response.json()

    if (!data.data || !data.data[0] || !data.data[0].url) {
      return NextResponse.json(
        {
          error: "Invalid response from OpenAI",
          details: "No image URL in response",
        },
        { status: 500 },
      )
    }

    const imageUrl = data.data[0].url

    // Save to database
    const { data: savedImage, error: saveError } = await supabase
      .from("word_images")
      .insert({
        word_id: wordId,
        user_id: user.id,
        prompt: enhancedPrompt,
        image_url: imageUrl,
      })
      .select()
      .single()

    if (saveError) {
      console.error("Database save error:", saveError)
      return NextResponse.json(
        {
          error: "Failed to save image",
          details: saveError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      image: savedImage,
      imageUrl: imageUrl,
      word: word,
    })
  } catch (error) {
    console.error("Generate word image error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
