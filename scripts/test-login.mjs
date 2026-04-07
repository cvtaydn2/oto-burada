import fetch from "node-fetch";

const url = "https://yagcxhrhtfhwaxzhyrkj.supabase.co";
const key = "sb_publishable_mCD2p3EALEO77pJH5mqFBw_aIghE08o";

async function test() {
  console.log("Testing login with new key...");
  
  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": key,
      "Authorization": `Bearer ${key}`
    },
    body: JSON.stringify({
      email: "admin@otoburada.demo",
      password: "demo123"
    })
  });
  
  const data = await res.json();
  
  if (data.access_token) {
    console.log("✅ Login SUCCESS!");
    console.log("Token:", data.access_token.substring(0, 30) + "...");
  } else {
    console.log("❌ Login FAILED");
    console.log(data);
  }
}

test();