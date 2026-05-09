import { callClaudeRaw } from "./agent.mjs";
import { reset, bold, blue, purple, green, cyan, yellow, red, gray } from "./colors.mjs";
import { executeCommand } from "./tools.mjs";

// Specialist Agent Profiles with customized strict system behaviors
export const SPECIALISTS = {
  FRONTEND: {
    name: "Frontend Specialist Agent (Aria)",
    emoji: "🎨",
    color: cyan,
    systemPrompt: `Sen OtoBurada projesinin seçkin Frontend Sistem Mimarı ve UX Tasarımcısısın.
Görevin: Kullanıcı arayüzü, mobil öncelikli tasarımlar, Tailwind, shadcn/ui, Radix erişilebilirliği (WCAG) ve form validasyonları (React Hook Form + Zod) konularında kusursuz frontend kodları üretmek.
Her zaman FRONTEND CONSTITUTION ve UI/UX RULES kurallarına bağlı kalmalısın. Asla standardın dışına çıkma.`,
  },
  BACKEND: {
    name: "Backend & Database Specialist Agent (Atlas)",
    emoji: "💾",
    color: purple,
    systemPrompt: `Sen OtoBurada projesinin Baş Veritabanı Yöneticisi ve Güvenlik Uzmanısın.
Görevin: Supabase PostgreSQL şemaları, Row Level Security (RLS) politikaları, veritabanı performans indexleri, migration dosyaları, Server Actions ve asenkron Outbox/Fulfillment kuyruk mantığı üretmek.
Her zaman DATABASE RULES ve SECURITY RULES kurallarına bağlı kalmalısın. RLS politikası olmayan tek bir tablo bile üretemezsin.`,
  },
  QA: {
    name: "Quality Assurance & Verifier Agent (Vera)",
    emoji: "🛡️",
    color: yellow,
    systemPrompt: `Sen OtoBurada projesinin kıdemli QA ve Kod Denetim Uzmanısın.
Görevin: Diğer uzman ajanların yazdığı kodlardaki TypeScript tip uyuşmazlıklarını, ESLint açıklarını, mantıksal bugları ve performans darboğazlarını tespit edip raporlamak.
Kodları doğrudan çalıştırmadan veya onaylamadan önce her zaman en ince ayrıntısına kadar statik analize tabi tutmalısın.`,
  },
};

// Sıralı Uzman Ajan Çağrısı (Sequential Pipeline Dispatch - DAG Architecture)
export async function runSpecialistsInPipeline(prompt, context = "") {
  console.log(`\n${cyan}⚡ Uzman Ajanlar sıralı boru hattı (Pipeline) analizine başladı... Lütfen bekleyin...${reset}`);
  const startTime = Date.now();

  // Adım 1: Backend ve Veritabanı mimariyi belirler (Contracts, Schema, RLS)
  console.log(`\n   ${bold}>>> Adım 1: Veri ve Mimarinin Belirlenmesi (Atlas)${reset}`);
  const atlasStart = Date.now();
  const backendResponse = await callClaudeRaw(
    `Aşağıdaki görevi sadece BACKEND, VERİTABANI ve GÜVENLİK açısından analiz et ve çözümünü üret:\n\n${prompt}`,
    `${context}\n\n=== SPECIALIST SYSTEM ROLE ===\n${SPECIALISTS.BACKEND.systemPrompt}`
  );
  const atlasDuration = ((Date.now() - atlasStart) / 1000).toFixed(2);
  console.log(`   ${purple}💾 Atlas (Backend) analizini tamamladı (${atlasDuration}s)${reset}`);

  // Adım 2: Frontend bu kontratları alarak UI ve Arayüzü üretir
  console.log(`\n   ${bold}>>> Adım 2: Arayüz ve Kullanıcı Deneyiminin Üretilmesi (Aria)${reset}`);
  const ariaStart = Date.now();
  
  // Backend çıktısını context'e dahil et ki UI kontrata uysun
  const enrichedContext = `${context}\n\n=== PREVIOUS STEP OUTPUT: BACKEND ARCHITECTURE ===\n${backendResponse}`;

const frontendResponse = await callClaudeRaw(
     `Aşağıdaki görevi sadece FRONTEND açısından analiz et ve çözümünü üret. \nÖNEMLİ: Bir önceki adımda oluşturulan Backend mimarisi, veri şeması ve API kontratlarına TAM UYUMLU frontend kodu yazmalısın!\n\n${prompt}`,
     `${enrichedContext}\n\n=== SPECIALIST SYSTEM ROLE ===\n${SPECIALISTS.FRONTEND.systemPrompt}`,
     null,
     { temperature: 0.1 } // Frontend için yaratıcılık
   );
  const ariaDuration = ((Date.now() - ariaStart) / 1000).toFixed(2);
  console.log(`   ${cyan}🎨 Aria (Frontend) analizini tamamladı (${ariaDuration}s)${reset}`);

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`${green}✓ Sıralı boru hattı analizi tamamlandı! (Toplam: ${totalDuration}s)${reset}\n`);

  return {
    frontend: frontendResponse,
    backend: backendResponse,
  };
}

// Paralel Uzman Ajan Çağrısı (Parallel Specialist Dispatch) - Rate Limited
export async function runSpecialistsInParallel(prompt, context = "") {
  console.log(`\n${cyan}⚡ Uzman Ajanlar paralel analize başladı... Lütfen bekleyin...${reset}`);
  
  const startTime = Date.now();

  // Basit concurrency kontrolü: Max 2 eşzamanlı istek (Rate limit koruması)
  const results = [];
  const promises = [
    (async () => {
      const start = Date.now();
      const res = await callClaudeRaw(
        `Aşağıdaki görevi sadece FRONTEND açısından analiz et ve çözümünü üret:\n\n${prompt}`,
        `${context}\n\n=== SPECIALIST SYSTEM ROLE ===\n${SPECIALISTS.FRONTEND.systemPrompt}`
      );
      const duration = ((Date.now() - start) / 1000).toFixed(2);
      console.log(`   ${cyan}🎨 Aria (Frontend) analizini tamamladı (${duration}s)${reset}`);
      return { specialist: "FRONTEND", response: res };
    })(),
    (async () => {
      const start = Date.now();
      const res = await callClaudeRaw(
        `Aşağıdaki görevi sadece BACKEND, VERİTABANI ve GÜVENLİK açısından analiz et ve çözümünü üret:\n\n${prompt}`,
        `${context}\n\n=== SPECIALIST SYSTEM ROLE ===\n${SPECIALISTS.BACKEND.systemPrompt}`
      );
      const duration = ((Date.now() - start) / 1000).toFixed(2);
      console.log(`   ${purple}💾 Atlas (Backend) analizini tamamladı (${duration}s)${reset}`);
      return { specialist: "BACKEND", response: res };
    })(),
  ];

  // Sırayla değil, ama Promise.all ile max 2 istek (düşük concurrency)
  const parallelResults = await Promise.all(promises);
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`${green}✓ Tüm paralel uzman analizleri tamamlandı! (Toplam: ${totalDuration}s)${reset}\n`);

  return {
    frontend: parallelResults.find(r => r.specialist === "FRONTEND").response,
    backend: parallelResults.find(r => r.specialist === "BACKEND").response,
  };
}

// Son Kontrolcü & İyileştirici Ajan (QA & Self-Healing Swarm Loop)
export async function runSwarmVerification(frontendSol, backendSol, originalPrompt) {
  console.log(`\n${yellow}🛡️  QA Ajanı (Vera) çözümleri denetliyor...${reset}`);

  const qaPrompt = `Sen QA Ajanısın. Aşağıda Frontend ve Backend uzmanlarının ürettiği çözümleri incele.
1. Mimari Kontrol: Monolitik dosyalar canonical katmanlara (*-records.ts, *-logic.ts, *-actions.ts) düzgün bölündü mü?
2. Veri Bütünlüğü: Supabase inner join'leri sonrasında oluşabilecek Array yapıları için normalizasyon yapıldı mı? (örn: if(Array.isArray(r)) formatı)
3. Tip Güvenliği: TypeScript implicit any kullanılmıyor değil mi?
4. Uyum: Frontend ve Backend arasında kontrat çakışması var mı?

Cevabını SADECE şu formatta ver:
<verdict>APPROVED</verdict>
<feedback>null</feedback>

Eğer REJECTED ise:
<verdict>REJECTED</verdict>
<feedback>Eksik/hatalı maddeleri belirt</feedback>

Orijinal Görev:
${originalPrompt}

Frontend Çözümü:
${frontendSol}

Backend Çözümü:
${backendSol}`;

  const qaAssessment = await callClaudeRaw(qaPrompt, `=== SPECIALIST SYSTEM ROLE ===\n${SPECIALISTS.QA.systemPrompt}`);
  console.log(`\n${bold}========== QA DEĞERLENDİRME RAPORU ========== ${reset}`);
  console.log(qaAssessment);
  console.log(`${bold}===============================================${reset}\n`);

  let verdict = "REJECTED";
  let feedback = qaAssessment;

  try {
    const verdictMatch = qaAssessment.match(/<verdict>(APPROVED|REJECTED)<\/verdict>/);
    const feedbackMatch = qaAssessment.match(/<feedback>([\s\S]*?)<\/feedback>/);
    if (verdictMatch) {
      verdict = verdictMatch[1];
      feedback = feedbackMatch ? feedbackMatch[1].trim() : null;
    } else {
      // Fallback: eski JSON formatı desteği
      const match = qaAssessment.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        verdict = parsed.verdict === "APPROVED" ? "APPROVED" : "REJECTED";
        feedback = parsed.feedback || qaAssessment;
      } else if (qaAssessment.toUpperCase().includes("APPROVED") && !qaAssessment.toUpperCase().includes("REJECTED")) {
        verdict = "APPROVED";
      }
    }
  } catch (err) {
    if (qaAssessment.toUpperCase().includes("APPROVED") && !qaAssessment.toUpperCase().includes("REJECTED")) {
      verdict = "APPROVED";
    }
  }

  if (verdict === "APPROVED") {
    console.log(`${green}✓ QA Ajanı Vera çözümleri onayladı!${reset}`);
    return { status: "APPROVED", feedback: null };
  } else {
    console.log(`${red}⚠️ QA Ajanı Vera bazı sorunlar tespit etti. Düzeltme döngüsü başlatılıyor...${reset}`);
    return { status: "REJECTED", feedback };
  }
}
