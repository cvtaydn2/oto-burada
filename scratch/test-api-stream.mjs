import { apiKey, baseUrl, model } from "../scripts/copilot/config.mjs";

async function testLiveStream() {
  console.log("Connecting to Live API Stream endpoint...");
  try {
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Hello, please reply with exactly 5 words to test the stream connection." }],
        temperature: 0.0,
        stream: true,
      }),
    });

    if (!response.ok) {
      const txt = await response.text();
      throw new Error(`Response not OK: ${response.status} - ${txt}`);
    }

    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    
    // response.body in Node fetch implements Symbol.asyncIterator
    for await (const chunk of response.body) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed === "data: [DONE]") {
           console.log("\n[STREAM DONE]");
           return;
        }
        if (trimmed.startsWith("data: ")) {
          try {
            const json = JSON.parse(trimmed.slice(5).trim());
            const content = json.choices?.[0]?.delta?.content;
            if (content) {
               process.stdout.write(content);
            }
          } catch (e) {
            // skip invalid partial json
          }
        }
      }
    }
    console.log("\n[STREAM ENDED]");
  } catch (err) {
    console.error("\nStream Error:", err.message);
  }
}

testLiveStream();
