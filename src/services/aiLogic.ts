import { useCampaignStore } from '../store/useCampaignStore';

interface AIAction {
  type: 'CREATE_PROJECT' | 'DELETE_PROJECT' | 'ANALYZE_DATA' | 'NONE';
  params?: any;
}

interface AIResponse {
  text: string;
  action: AIAction;
}

/**
 * Servicio centralizado para la lógica de la IA.
 * En el futuro, aquí es donde se conectará con Gemini/OpenAI.
 */
export const processAIMessage = async (message: string): Promise<AIResponse> => {
  const lowerMsg = message.toLowerCase();
  const store = useCampaignStore.getState();

  // 1. Simulación de procesamiento (Latencia natural)
  await new Promise(resolve => setTimeout(resolve, 1500));

  // 2. Lógica de intención (Pattern Matching básico para empezar)
  
  // Intención: Crear Proyecto
  if (lowerMsg.includes('crea') && (lowerMsg.includes('proyecto') || lowerMsg.includes('espacio'))) {
    return {
      text: "¡Claro! Puedo ayudarte a crear un nuevo espacio de trabajo. ¿Qué nombre te gustaría ponerle y qué tipo de datos vas a manejar?",
      action: { type: 'NONE' } // Esperamos más info o abrimos el modal
    };
  }

  // Intención: Analizar Datos
  if (lowerMsg.includes('analiza') || lowerMsg.includes('resumen') || lowerMsg.includes('kpi')) {
    const projectCount = store.projects.length;
    const tableCount = store.tables.length;
    
    return {
      text: `He analizado tu espacio de trabajo actual. Tienes ${projectCount} proyectos activos y ${tableCount} tablas de datos. Basado en esto, puedo sugerirte optimizaciones en tus flujos de marketing.`,
      action: { type: 'ANALYZE_DATA' }
    };
  }

  // Intención: Ayuda General
  if (lowerMsg.includes('hola') || lowerMsg.includes('quien eres') || lowerMsg.includes('ayuda')) {
    return {
      text: "Soy tu asistente inteligente de NaticBox. Puedo ayudarte a organizar tus proyectos, analizar tablas de datos o automatizar tareas repetitivas. ¿En qué trabajamos hoy?",
      action: { type: 'NONE' }
    };
  }

  // Respuesta por defecto (Cerebro simulado)
  return {
    text: "Entiendo lo que necesitas. Estoy procesando tu solicitud para darte la mejor solución dentro de NaticBox. ¿Quieres que ejecute alguna acción específica sobre tus datos?",
    action: { type: 'NONE' }
  };
};
