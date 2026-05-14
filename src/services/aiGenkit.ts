/**
 * NaticBox AI Service — Browser Optimized
 * This version uses a direct fetch or the SDK pattern to avoid Genkit's Node.js dependency hangs.
 */

export interface NaticContext {
  projectCount: number;
  tableCount: number;
  memberCount: number;
  recordCount: number;
  activeProject?: string;
  activeTable?: string;
}

const SYSTEM_PROMPT = (ctx: NaticContext) => `
Eres NaticBox AI, el asistente inteligente privado del administrador.
Contexto:
- Proyectos: ${ctx.projectCount}
- Tablas: ${ctx.tableCount}
- Miembros: ${ctx.memberCount}
- Registros actuales: ${ctx.recordCount}
- Proyecto activo: ${ctx.activeProject || 'ninguno'}
- Tabla activa: ${ctx.activeTable || 'ninguna'}

Responde en español, conciso y profesional.
`.trim();

/**
 * Robust AI Call with Timeout and Error Handling
 */
export async function callGenkitAI(prompt: string, context: NaticContext) {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!API_KEY || API_KEY === 'TU_API_KEY_AQUI') {
    return { text: '⚠️ La API Key no está configurada correctamente en el archivo .env.' };
  }

  console.log('NaticBox AI: Iniciando solicitud...');

  // Create a timeout promise
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('TIMEOUT')), 12000)
  );

  try {
    // We use the Google Generative AI REST API directly for maximum stability in the browser
    const response = await Promise.race([
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: SYSTEM_PROMPT(context) }] },
            { role: 'model', parts: [{ text: 'Entendido. Estoy listo.' }] },
            { role: 'user', parts: [{ text: prompt }] }
          ],
          generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
        })
      }),
      timeout
    ]) as Response;

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Error en la API de Google');
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) throw new Error('Respuesta vacía');

    console.log('NaticBox AI: Respuesta recibida con éxito.');
    return { text: resultText };

  } catch (error: any) {
    console.error('NaticBox AI Error:', error);
    
    if (error.message === 'TIMEOUT') {
      return { text: '❌ La conexión tardó demasiado. Por favor, intenta de nuevo.' };
    }
    
    return { 
      text: `❌ Error: ${error.message || 'No se pudo conectar con la IA.'}` 
    };
  }
}
