import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { loadLocalEnv } from "../scripts/load-local-env.mjs";

console.log("Loading environment variables...");
loadLocalEnv();

const apiKey = process.env.CLAUDE_NETIVA_KEY;
const baseUrl = process.env.CLAUDE_NETIVA_URL || "https://apiv3.netiva.com.tr";
const model = "claude-opus-4-6";

console.log(`Base URL: ${baseUrl}`);
console.log(`API Key: ${apiKey ? "PRESENT" : "MISSING"}`);
console.log(`Model: ${model}`);

if (!apiKey) {
  console.error("Error: CLAUDE_NETIVA_KEY is missing in your environment.");
  process.exit(1);
}

async function testEndpoint() {
  console.log("\nSending test request to endpoint...");
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "user", content: "Hi! Output only the word 'OK' if you can read this." }
        ],
        temperature: 0.0,
        max_tokens: 50,
      }),
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Status Code: ${response.status}`);
    console.log(`Response Time: ${duration}s`);

    const data = await response.json();
    if (!response.ok) {
      console.error("API returned error:", data);
      process.exit(1);
    }

    console.log("\nParsed JSON Response structure:");
    console.log(JSON.stringify(data, null, 2));

    const content = data.choices?.[0]?.message?.content;
    console.log(`\nExtracted content: "${content}"`);
    if (content && content.includes("OK")) {
      console.log("\nSUCCESS: Request successfully went to endpoint and response was correctly handled!");
    } else {
      console.log("\nWARNING: Connection successful but content was unexpected.");
    }
  } catch (error) {
    console.error("Network or parsing error occurred during test:", error);
  }
}

testEndpoint();
