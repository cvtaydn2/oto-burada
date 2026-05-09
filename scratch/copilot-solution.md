Temel sorun çok net: `callClaudeRaw` içinde oldukça ayrıntılı bir `systemPrompt` hazırlanıyor, ama API isteğine hiç gönderilmiyor. Yani model şu anda “anayasa kuralları”, tool-use formatı, `TASKS.md` / `PROGRESS.md` zorunluluğu, `<write_file>` / `<edit_file>` formatı ve deterministik çalışma beklentilerini hiç görmeden yanıt üretiyor.

Buna ek olarak iki ikincil problem daha var. Birincisi, spinner ilk denemede oluşturuluyor ama retry sonrasında yeniden başlatılmıyor; ilk hata sonrası spinner fiilen ölüyor. İkincisi, `parseAndApplyXmlFiles` import edilmiş ama kullanılmıyor; bu da gereksiz import ve bakım borcu oluşturuyor.

En doğru düzeltme, `systemPrompt`’u `messages` dizisine `role: "system"` olarak eklemek ve spinner’ı her retry denemesi için yeniden başlatmak.

Uygulanabilir çözüm aşağıda.

<edit_file path="scripts/copilot/agent.mjs">
<<<<<<< SEARCH
import { getFilesRecursively, parseAndApplyXmlFiles, executeCommand } from "./tools.mjs";
=======
import { getFilesRecursively, executeCommand } from "./tools.mjs";
>>>>>>> REPLACE
</edit_file>

<edit_file path="scripts/copilot/agent.mjs">
<<<<<<< SEARCH
  const messages = [
    ...conversationHistory,
    { role: "user", content: (extraContext ? extraContext + "\n\n" : "") + prompt }
  ];

  // İstek süresince spinner'ı başlatıyoruz
  const spinner = startSpinner(`${cyan}Claude Netiva zekasını konuşturuyor... Lütfen bekleyin...${reset}`);

  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // Her deneme için 120 saniye sınır (Gelişmiş analizler için ideal)

    try {
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.0, // Tutarlılık ve determinizm için kesinlikle sıfır sıcaklık
          max_tokens: 4000,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      spinner.stop(); // Yanıt başarıyla geldiğinde durdur

      const responseText = await response.text();
      if (!response.ok) {
        let apiErrorMessage = `API Hatası (Durum Kodu: ${response.status})`;
        try {
          const errorJson = JSON.parse(responseText);
          if (errorJson.error?.message) {
            apiErrorMessage += `: ${errorJson.error.message}`;
          }
        } catch {
          apiErrorMessage += ` - Yanıt İçeriği: ${responseText.slice(0, 500)}`;
        }
        throw new Error(apiErrorMessage);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        throw new Error(`API yanıtı JSON olarak ayrıştırılamadı. Durum: ${response.status}, Yanıt: ${responseText.slice(0, 500)}`);
      }

      return data.choices?.[0]?.message?.content || "";
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (attempt < maxRetries) {
        // Üstel geri çekilme (exponential backoff) + jitter (rastgele sapma) ile bağlantı dayanıklılığını artırıyoruz
        const delay = Math.min(10000, Math.pow(2, attempt) * 1000 + Math.random() * 1000);
        spinner.stop();
        process.stdout.write(`\r${yellow}⚠️ Bağlantı sorunu/yoğunluk tespit edildi. ${attempt}/${maxRetries} deneme başarısız. ${(delay / 1000).toFixed(1)}sn sonra tekrar deneniyor... (Hata: ${error.message})${reset}`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        // Spinner'ı bir sonraki deneme için yeniden başlat
        spinner.stop();
        process.stdout.write(`\r\x1b[K`);
        continue;
      }

      spinner.stop(); // Son denemede de başarısız olduysa durdur
      if (error.name === "AbortError") {
        console.log(`${red}❌ İstek zaman aşımına uğradı (120 saniye)!${reset}`);
        console.log(`${gray}Ayrıntı: Netiva API sunucusu istek yükü çok büyük olduğunda veya yoğunluk sırasında yanıt üretmeyi 120 saniye içinde tamamlayamadı.${reset}`);
      } else {
        console.log(`${red}❌ İstek başarısız oldu (Tüm denemeler tükendi): ${error.message}${reset}`);
        if (error.stack) {
          console.log(`${gray}Hata Ayrıntısı: ${error.stack}${reset}`);
        }
      }
      return null;
    }
  }
=======
  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory,
    { role: "user", content: (extraContext ? extraContext + "\n\n" : "") + prompt }
  ];

  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    const spinner = startSpinner(`${cyan}Claude Netiva zekasını konuşturuyor... Lütfen bekleyin...${reset}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // Her deneme için 120 saniye sınır (Gelişmiş analizler için ideal)

    try {
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.0, // Tutarlılık ve determinizm için kesinlikle sıfır sıcaklık
          max_tokens: 4000,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      spinner.stop();

      const responseText = await response.text();
      if (!response.ok) {
        let apiErrorMessage = `API Hatası (Durum Kodu: ${response.status})`;
        try {
          const errorJson = JSON.parse(responseText);
          if (errorJson.error?.message) {
            apiErrorMessage += `: ${errorJson.error.message}`;
          }
        } catch {
          apiErrorMessage += ` - Yanıt İçeriği: ${responseText.slice(0, 500)}`;
        }
        throw new Error(apiErrorMessage);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(`API yanıtı JSON olarak ayrıştırılamadı. Durum: ${response.status}, Yanıt: ${responseText.slice(0, 500)}`);
      }

      return data.choices?.[0]?.message?.content || "";
    } catch (error) {
      clearTimeout(timeoutId);
      spinner.stop();

      if (attempt < maxRetries) {
        const delay = Math.min(10000, Math.pow(2, attempt) * 1000 + Math.random() * 1000);
        process.stdout.write(`\r${yellow}⚠️ Bağlantı sorunu/yoğunluk tespit edildi. ${attempt}/${maxRetries} deneme başarısız. ${(delay / 1000).toFixed(1)}sn sonra tekrar deneniyor... (Hata: ${error.message})${reset}`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        process.stdout.write(`\r\x1b[K`);
        continue;
      }

      if (error.name === "AbortError") {
        console.log(`${red}❌ İstek zaman aşımına uğradı (120 saniye)!${reset}`);
        console.log(`${gray}Ayrıntı: Netiva API sunucusu istek yükü çok büyük olduğunda veya yoğunluk sırasında yanıt üretmeyi 120 saniye içinde tamamlayamadı.${reset}`);
      } else {
        console.log(`${red}❌ İstek başarısız oldu (Tüm denemeler tükendi): ${error.message}${reset}`);
        if (error.stack) {
          console.log(`${gray}Hata Ayrıntısı: ${error.stack}${reset}`);
        }
      }
      return null;
    }
  }

  return null;
>>>>>>> REPLACE
</edit_file>

Bu değişiklikten sonra ajan gerçekten tanımladığınız kurallarla çalışmaya başlayacak. Şu anki davranıştaki “tool çağrılarını bazen beklenen formatta üretmeme”, “TASKS/PROGRESS güncellememesi”, “anayasaya tam uymaması” ve “rastgele kalite sapmaları” büyük olasılıkla doğrudan bu eksikten kaynaklanıyor.

Kısa etki özeti şöyle:

`systemPrompt` eklenince model:
proje anayasasını görür, tool kullanım kontratını görür, nihai rapor formatını görür, `TASKS.md` ve `PROGRESS.md` güncelleme zorunluluğunu görür.

Spinner değişikliğiyle de retry UX düzelir; her denemede tekrar canlı spinner görünür.

İstersen bir sonraki adımda `scripts/copilot/tools.mjs` ve `config.mjs` tarafını da inceleyip bu ajan akışında başka mimari kusur var mı, onu da çıkarabilirim.