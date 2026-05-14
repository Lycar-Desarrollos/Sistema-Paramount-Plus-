/**
 * Google Gemini AI Service — NaticBox Admin Intelligence
 * Uses Gemini 1.5 Flash for fast, contextual responses.
 * This service is ADMIN-ONLY. Never expose this to collaborators.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const MODEL = 'gemini-1.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface NaticContext {
  projectCount: number;
  tableCount: number;
  memberCount: number;
  recordCount: number;
  activeProject?: string;
  activeTable?: string;
}

const SYSTEM_PROMPT = (ctx: NaticContext) => `
Eres NaticBox AI, el asistente inteligente privado del administrador de la plataforma NaticBox.
NaticBox es un sistema de gestión de datos tipo Airtable con colaboradores, workspaces, tablas y registros.

Contexto actual del sistema:
- Proyectos activos: ${ctx.projectCount}
- Tablas totales: ${ctx.tableCount}
- Miembros del equipo: ${ctx.memberCount}
- Registros en la tabla actual: ${ctx.recordCount}
- Proyecto activo: ${ctx.activeProject || 'ninguno'}
- Tabla activa: ${ctx.activeTable || 'ninguna'}

Eres exclusivo para el administrador. Nadie más sabe que existes.
Responde siempre en español, de forma concisa y directa.
Puedes ayudar con: análisis de datos, sugerencias de estructura, automatizaciones, gestión del equipo, y consultas sobre la plataforma.
Cuando no tengas datos específicos, sugiere acciones concretas que el admin puede hacer en NaticBox.
`.trim();

/**
 * Send a message to Gemini with full conversation history.
 * @param userMessage - The user's latest message
 * @param history - Previous conversation messages
 * @param context - Current NaticBox app context (projects, tables, etc.)
 */
export async function sendToGemini(
  userMessage: string,
  history: GeminiMessage[],
  context: NaticContext
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('VITE_GEMINI_API_KEY no está configurada en el archivo .env');
  }

  const contents: GeminiMessage[] = [
    // Inject context as first system turn
    {
      role: 'user',
      parts: [{ text: SYSTEM_PROMPT(context) }]
    },
    {
      role: 'model',
      parts: [{ text: 'Entendido. Estoy listo para asistirte como administrador de NaticBox.' }]
    },
    ...history,
    {
      role: 'user',
      parts: [{ text: userMessage }]
    }
  ];

  const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        topP: 0.9,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      ]
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini no devolvió una respuesta válida.');
  }

  return text;
}
