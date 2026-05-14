import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/google-genai';
import { useCampaignStore } from '../store/useCampaignStore';

// 1. Configuración de Genkit
const ai = genkit({
  plugins: [googleAI()], // Aquí se añadiría la API Key en el entorno
  model: gemini15Flash,
});

/**
 * Flow principal de NaticBox para procesar mensajes de usuario.
 * Este flujo es el "corazón" de la IA y puede ser llamado desde el chat.
 */
export const naticAiFlow = ai.defineFlow(
  {
    name: 'naticAiFlow',
    inputSchema: ai.z.string(),
    outputSchema: ai.z.object({
      text: ai.z.string(),
      suggestedAction: ai.z.string().optional(),
    }),
  },
  async (userInput) => {
    // Aquí es donde Genkit brilla:
    // Podemos inyectar el estado real de la app como "contexto"
    const store = useCampaignStore.getState();
    const context = `
      El usuario está en NaticBox.
      Proyectos actuales: ${store.projects.map(p => p.name).join(', ')}
      Tablas activas: ${store.tables.map(t => t.name).join(', ')}
    `;

    // 2. Llamada al modelo con contexto
    const { text } = await ai.generate({
      prompt: `Eres el orquestador inteligente de NaticBox. 
      Contexto actual: ${context}
      Mensaje del usuario: ${userInput}
      
      Responde de forma proactiva, profesional y sugiriendo acciones si es necesario.`,
    });

    return {
      text,
      suggestedAction: text.toLowerCase().includes('crear') ? 'CREATE_PROJECT' : undefined,
    };
  }
);

/**
 * Función puente para usar Genkit desde la UI de React.
 */
export const callGenkitAI = async (message: string) => {
  try {
    // En producción esto llamaría a una Cloud Function
    // Por ahora, ejecutamos el flujo localmente (necesita API KEY en env)
    const response = await naticAiFlow(message);
    return response;
  } catch (error) {
    console.error('Error calling Genkit:', error);
    return {
      text: "Hola! Estoy configurando mi conexión con Genkit. Por ahora puedo ayudarte con tareas básicas. ¿En qué trabajamos?",
      suggestedAction: undefined
    };
  }
};
