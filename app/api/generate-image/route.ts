import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt gerekli" }, { status: 400 })
    }

    console.log("API: Generating image with DALL-E Mini for stories, prompt:", prompt)

    // DALL-E Mini (Craiyon) ile görsel oluştur - daha stabil endpoint
    const dalleResponse = await fetch("https://backend.craiyon.com/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        model: "art", // art modeli hikayeler için uygun
        negative_prompt: "",
        token: null,
      }),
    })

    console.log("DALL-E Mini response status:", dalleResponse.status)

    if (!dalleResponse.ok) {
      console.error("DALL-E Mini API error:", dalleResponse.status)
      throw new Error(`DALL-E Mini API hatası: ${dalleResponse.status}`)
    }

    // Response'u güvenli şekilde parse et
    const responseText = await dalleResponse.text()

    let dalleData
    try {
      dalleData = JSON.parse(responseText)
    } catch (parseError) {
      console.error("JSON parse error for stories:", parseError)
      console.error("Response preview:", responseText.substring(0, 200))
      throw new Error("API'den geçersiz yanıt alındı")
    }

    if (!dalleData.images || dalleData.images.length === 0) {
      throw new Error("DALL-E Mini'den görsel alınamadı")
    }

    // Base64 görselini data URL'ye çevir
    const base64Image = dalleData.images[0]

    if (!base64Image || typeof base64Image !== "string") {
      throw new Error("Geçersiz görsel formatı")
    }

    const imageUrl = `data:image/png;base64,${base64Image}`

    console.log("API: Image generated successfully with DALL-E Mini for story")

    return NextResponse.json({ imageUrl })
  } catch (error: any) {
    console.error("DALL-E Mini hikaye görseli hatası:", error)

    if (error.message.includes("JSON")) {
      return NextResponse.json({ error: "API'den geçersiz yanıt alındı" }, { status: 500 })
    } else if (error.message.includes("quota") || error.message.includes("limit")) {
      return NextResponse.json({ error: "API kullanım limiti aşıldı" }, { status: 429 })
    } else if (error.message.includes("network")) {
      return NextResponse.json({ error: "Ağ bağlantısı hatası" }, { status: 503 })
    }

    return NextResponse.json(
      {
        error: error.message || "Görsel oluşturulamadı",
      },
      { status: 500 },
    )
  }
}
