const API_KEY = "AIzaSyDFa24y3wCgxgQ0Z_2uQrssma4CqZx_q3k";
const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro", "gemini-1.0-pro"];

async function test() {
  for (const model of models) {
    console.log(`Testing ${model}...`);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Hola" }] }]
        })
      });
      const data = await response.json();
      if (response.ok) {
        console.log(`✅ ${model} WORKS!`);
        console.log(JSON.stringify(data, null, 2));
        return model;
      } else {
        console.log(`❌ ${model} failed: ${data.error?.message}`);
      }
    } catch (e) {
      console.log(`❌ ${model} error: ${e.message}`);
    }
  }
}

test();
