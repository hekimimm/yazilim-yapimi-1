import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"

// Gemini AI istemcisi
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt gerekli" }, { status: 400 })
    }

    // Kullanıcı kontrolü
    const { user } = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Giriş yapmanız gerekli" }, { status: 401 })
    }

    console.log("API: Generating image with Starry AI, prompt:", prompt)

    // 1. Gemini ile prompt'u iyileştir ve İngilizce'ye çevir
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" })

    const enhancePrompt = `
    Aşağıdaki Türkçe görsel oluşturma prompt'unu İngilizce'ye çevir ve görsel oluşturma AI'ları için optimize et. 
    Detaylı, yaratıcı ve teknik terimler içeren profesyonel bir prompt oluştur.
    Sadece optimize edilmiş İngilizce prompt'u döndür, başka açıklama yapma.
    
    Türkçe Prompt: "${prompt}"
    `

    const enhanceResult = await model.generateContent(enhancePrompt)
    const enhancedPrompt = enhanceResult.response.text().trim()

    console.log("Enhanced prompt:", enhancedPrompt)

    // 2. Starry AI ile görsel oluştur
    const starryResponse = await fetch("https://api.starryai.com/creations/", {
      method: "POST",
      headers: {
        "X-API-Key": process.env.STARRY_AI_API_KEY!,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        text: enhancedPrompt,
        model: "lyra", // Starry AI'ın varsayılan modeli
        aspectRatio: "square",
        highResolution: true,
        steps: 20,
        initialImageMode: "color_sketch",
      }),
    })

    if (!starryResponse.ok) {
      const errorText = await starryResponse.text()
      console.error("Starry AI error response:", errorText)
      throw new Error(`Starry AI request failed: ${starryResponse.status} - ${errorText}`)
    }

    const starryData = await starryResponse.json()
    console.log("Starry AI response:", starryData)

    // Starry AI creation ID'sini al
    const creationId = starryData.id

    if (!creationId) {
      throw new Error("Starry AI creation ID alınamadı")
    }

    // 3. Görsel oluşturulana kadar bekle (polling)
    let imageUrl = null
    let attempts = 0
    const maxAttempts = 30 // 5 dakika bekle (10 saniye * 30)

    while (!imageUrl && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 10000)) // 10 saniye bekle

      const statusResponse = await fetch(`https://api.starryai.com/creations/${creationId}/`, {
        headers: {
          "X-API-Key": process.env.STARRY_AI_API_KEY!,
          accept: "application/json",
        },
      })

      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        console.log(`Attempt ${attempts + 1}: Status:`, statusData.status)

        if (statusData.status === "completed" && statusData.images && statusData.images.length > 0) {
          imageUrl = statusData.images[0].url
          break
        } else if (statusData.status === "failed") {
          throw new Error("Starry AI görsel oluşturma başarısız")
        }
      }

      attempts++
    }

    if (!imageUrl) {
      throw new Error("Görsel oluşturma zaman aşımına uğradı")
    }

    // 4. Görseli Supabase Storage'a kaydet
    const imageResponse = await fetch(imageUrl)
    const imageBuffer = await imageResponse.arrayBuffer()

    const fileName = `${user.id}/${Date.now()}.png`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("generated-images")
      .upload(fileName, imageBuffer, {
        contentType: "image/png",
        cacheControl: "3600",
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      throw new Error("Görsel kaydedilemedi")
    }

    // 5. Public URL al
    const {
      data: { publicUrl },
    } = supabase.storage.from("generated-images").getPublicUrl(fileName)

    // 6. Veritabanına kaydet
    const { data: imageRecord, error: dbError } = await supabase
      .from("images")
      .insert({
        user_id: user.id,
        prompt: prompt,
        enhanced_prompt: enhancedPrompt,
        image_url: publicUrl,
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database insert error:", dbError)
      throw new Error("Görsel kaydı başarısız")
    }

    console.log("API: Image generated with Starry AI and saved successfully")

    return NextResponse.json({
      imageUrl: publicUrl,
      enhancedPrompt: enhancedPrompt,
      id: imageRecord.id,
      starryCreationId: creationId,
    })
  } catch (error: any) {
    console.error("Starry AI görsel oluşturma hatası:", error)

    if (error.message.includes("API key")) {
      return NextResponse.json({ error: "API yapılandırma hatası" }, { status: 500 })
    } else if (error.message.includes("quota") || error.message.includes("limit")) {
      return NextResponse.json({ error: "API kullanım limiti aşıldı" }, { status: 429 })
    } else if (error.message.includes("network") || error.message.includes("timeout")) {
      return NextResponse.json({ error: "Ağ bağlantısı hatası veya zaman aşımı" }, { status: 503 })
    }

    return NextResponse.json(
      {
        error: error.message || "Görsel oluşturulamadı",
      },
      { status: 500 },
    )
  }
}
