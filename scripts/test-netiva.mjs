import { Agent } from 'undici';
import { apiKey, baseUrl, model } from './copilot/config.mjs';

const dispatcher = new Agent({
  bodyTimeout: 0,
  headersTimeout: 0,
  keepAliveTimeout: 300000,
});

async function test() {
  console.log('--- NETIVA LLM API REAL TEST ---');
  const start = Date.now();
  
  try {
    console.log(`Model: ${model}, URL: ${baseUrl}`);
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'Sadece "OK" de.' }],
        max_tokens: 10,
        stream: true
      }),
      dispatcher
    });

    console.log(`Header alindi! Sure: ${Date.now() - start}ms. Status: ${response.status}`);
    
    if (!response.ok) {
      const txt = await response.text();
      console.error(`Hata Detayi: ${txt}`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    process.stdout.write('Veri: ');
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      process.stdout.write('#'); 
    }
    
    console.log(`\n✅ BASARILI! Toplam Sure: ${Date.now() - start}ms`);
  } catch (err) {
    console.error(`🛑 KRITIK SISTEM HATASI: ${err.message}`);
  }
}

test();
