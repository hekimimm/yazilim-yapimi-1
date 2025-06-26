import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { prompt, userId } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
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

    // OpenAI API configuration
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    console.log("Generating general image with OpenAI GPT-Image-1:", { prompt })

    // Generate image with OpenAI GPT-Image-1
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
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

    // Save to database (general images table)
    const { data: savedImage, error: saveError } = await supabase
      .from("images")
      .insert({
        user_id: user.id,
        prompt: prompt,
        image_url: imageUrl,
        generation_type: "general",
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
      imageUrl: imageUrl,
      data: savedImage,
    })
  } catch (error) {
    console.error("Generate image error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
