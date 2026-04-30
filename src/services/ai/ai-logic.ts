import { logger } from "@/lib/logging/logger";

/**
 * AI Logic for generating car descriptions.
 * Designed for ZERO COST / FREE TIER ONLY.
 *
 * Strategy:
 * 1. Try Gemini API (Free Tier: 15 RPM, zero cost)
 * 2. Fallback to OpenAI (if key provided and quota exists)
 * 3. Final Fallback: High-quality Deterministic Template (Zero cost, infinite quota)
 */

export interface ListingSpecs {
  brand: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  condition?: string;
}

export async function generateListingDescription(specs: ListingSpecs): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // 1. Try Google Gemini (Free Tier)
  if (geminiKey) {
    try {
      const result = await tryGemini(specs, geminiKey);
      if (result) return result;
    } catch (e) {
      logger.api.warn("AI: Gemini failed, trying next tier", { error: e });
    }
  }

  // 2. Try OpenAI (Usage-based)
  if (openaiKey) {
    try {
      const result = await tryOpenAI(specs, openaiKey);
      if (result) return result;
    } catch (e) {
      logger.api.warn("AI: OpenAI failed, falling back to template", { error: e });
    }
  }

  // 3. Final Fallback: Zero-Cost Template
  logger.api.info("AI: Using zero-cost template generator");
  return generateTemplateDescription(specs);
}

async function tryGemini(specs: ListingSpecs, apiKey: string): Promise<string | null> {
  const prompt = constructPrompt(specs);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

async function tryOpenAI(specs: ListingSpecs, apiKey: string): Promise<string | null> {
  const prompt = constructPrompt(specs);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Sen profesyonel bir otomobil satış danışmanısın." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data.choices?.[0]?.message?.content || null;
}

function constructPrompt(specs: ListingSpecs): string {
  return `
    Aşağıdaki araç özelliklerine sahip bir araba ilanı için profesyonel, ilgi çekici ve samimi bir Türkçe açıklama yaz.
    Araba: ${specs.year} ${specs.brand} ${specs.model}
    Kilometre: ${specs.mileage} km
    Yakıt: ${specs.fuelType}
    Vites: ${specs.transmission}
    ${specs.condition ? `Durum: ${specs.condition}` : ""}

    Lütfen şunlara dikkat et:
    - Teknik özellikleri belirt.
    - Aracın avantajlarını öne çıkar.
    - Madde işaretleri (bullet points) kullan.
    - Sadece açıklamayı döndür.
  `.trim();
}

function generateTemplateDescription(specs: ListingSpecs): string {
  const { brand, model, year, mileage, fuelType, transmission, condition } = specs;
  const km = mileage.toLocaleString("tr-TR");

  return `
${year} model ${brand} ${model} aracım, ${km} kilometrede olup titizlikle kullanılmıştır.

Aracın öne çıkan özellikleri:
• **Model:** ${brand} ${model}
• **Yıl:** ${year}
• **Kilometre:** ${km} km
• **Yakıt:** ${fuelType}
• **Vites:** ${transmission}
${condition ? `• **Kondisyon:** ${condition}` : ""}

Bakımları düzenli yapılmış, masrafsız bir araçtır. Yakıt cimrisi ve konforlu bir sürüşe sahiptir.

Alıcısına şimdiden hayırlı uğurlu olmasını dilerim. Detaylı bilgi için iletişime geçebilirsiniz.
  `.trim();
}
