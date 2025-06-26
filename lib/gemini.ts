import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI("AIzaSyDE-ToWmX5xvI3ix_IyZ8tQF5Xl41puDiw")

export async function generateStory(words: string[], difficulty = 1) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const prompt = `
    Bu kelimeleri kullanarak ${difficulty === 1 ? "basit" : difficulty === 2 ? "orta" : "ileri"} seviyede bir hikaye yaz:
    Kelimeler: ${words.join(", ")}
    
    Hikaye hem İngilizce hem de Türkçe olsun.
    Format:
    
    **English Story:**
    [İngilizce hikaye buraya]
    
    **Turkish Story:**
    [Türkçe hikaye buraya]
    
    Hikaye ${difficulty === 1 ? "100-150" : difficulty === 2 ? "150-250" : "250-350"} kelime olsun.
    Verilen kelimeleri hikayede kalın harflerle vurgula.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return {
      success: true,
      content: text,
      wordsUsed: words,
    }
  } catch (error) {
    console.error("Gemini API hatası:", error)
    return {
      success: false,
      error: "Hikaye oluşturma başarısız",
    }
  }
}

export async function generateImagePrompt(turkishPrompt: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const prompt = `
    Bu Türkçe açıklamayı İngilizce'ye çevir ve görsel oluşturma için optimize et:
    "${turkishPrompt}"
    
    Sadece optimize edilmiş İngilizce prompt'u döndür, başka açıklama yapma.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text().trim()

    return {
      success: true,
      enhancedPrompt: text,
    }
  } catch (error) {
    console.error("Gemini prompt optimizasyon hatası:", error)
    return {
      success: false,
      enhancedPrompt: turkishPrompt,
    }
  }
}
