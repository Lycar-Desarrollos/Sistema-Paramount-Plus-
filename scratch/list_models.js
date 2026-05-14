const API_KEY = "AIzaSyDFa24y3wCgxgQ0Z_2uQrssma4CqZx_q3k";

async function list() {
  console.log(`Listing models...`);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const data = await response.json();
    if (response.ok) {
      console.log(`✅ Models found!`);
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ Failed: ${data.error?.message}`);
    }
  } catch (e) {
    console.log(`❌ Error: ${e.message}`);
  }
}

list();
