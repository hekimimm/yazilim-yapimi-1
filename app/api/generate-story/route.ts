import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { words, userId } = await request.json()

    if (!words || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json({ error: "Words array is required" }, { status: 400 })
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

    // Create story prompt
    const wordList = words.map((w) => `${w.eng_word} (${w.tur_word})`).join(", ")
    const storyPrompt = `Create an engaging short story (150-200 words) that naturally incorporates these English vocabulary words: ${wordList}. 
    
    The story should:
    - Be educational and suitable for language learners
    - Use each word in a meaningful context
    - Be interesting and memorable
    - Have a clear beginning, middle, and end
    
    After the story, provide a Turkish translation of the entire story.
    
    Format:
    **English Story:**
    [Your story here]
    
    **Turkish Translation:**
    [Turkish translation here]`

    console.log("Generating story with OpenAI:", { wordCount: words.length })

    // Generate story with OpenAI
    const { text: storyText } = await generateText({
      model: openai("gpt-4o"),
      prompt: storyPrompt,
      maxTokens: 800,
      temperature: 0.7,
    })

    // Split English and Turkish parts
    const parts = storyText.split("**Turkish Translation:**")
    const englishStory = parts[0].replace("**English Story:**", "").trim()
    const turkishStory = parts[1] ? parts[1].trim() : ""

    // Generate image for the story
    const imagePrompt = `Illustration for a story featuring: ${words.map((w) => w.eng_word).join(", ")}. Style: colorful, educational, suitable for language learning, cartoon-like, engaging.`

    let imageUrl = null

    try {
      const openaiApiKey = process.env.OPENAI_API_KEY
      if (openaiApiKey) {
        const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-image-1",
            prompt: imagePrompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            response_format: "url",
          }),
        })

        if (imageResponse.ok) {
          const imageData = await imageResponse.json()
          if (imageData.data && imageData.data[0] && imageData.data[0].url) {
            imageUrl = imageData.data[0].url
          }
        }
      }
    } catch (imageError) {
      console.error("Image generation failed:", imageError)
      // Continue without image
    }

    // Save story to database
    const { data: savedStory, error: saveError } = await supabase
      .from("ai_stories")
      .insert({
        user_id: user.id,
        title: `Story with ${words.length} words`,
        english_content: englishStory,
        turkish_content: turkishStory,
        words_used: words.map((w) => w.eng_word),
        image_url: imageUrl,
        image_prompt: imagePrompt,
      })
      .select()
      .single()

    if (saveError) {
      console.error("Database save error:", saveError)
      return NextResponse.json(
        {
          error: "Failed to save story",
          details: saveError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      story: savedStory,
      englishStory,
      turkishStory,
      imageUrl,
    })
  } catch (error) {
    console.error("Generate story error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
