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
 * Proporciona respuestas basadas en el contexto real de la aplicación.
 */
export const processAIMessage = async (message: string): Promise<AIResponse> => {
  const lowerMsg = message.toLowerCase();
  const store = useCampaignStore.getState();
  
  // Datos reales del contexto
  const projectCount = store.projects.length;
  const tableCount = store.tables.length;
  const activeProject = store.projects.find(p => p.id === store.activeProjectId);
  const activeTable = store.tables.find(t => t.id === store.activeTableId);

  // Simulación de "pensamiento" (Latencia natural)
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1000));

  // 1. Lógica de Intenciones de Gestión de Datos
  
  if (lowerMsg.includes('cuantos') || lowerMsg.includes('cuántos') || lowerMsg.includes('resumen')) {
    return {
      text: `Actualmente tienes **${projectCount} proyectos** y **${tableCount} tablas** configuradas en NaticBox. ${activeProject ? `Estás trabajando en el proyecto "${activeProject.name}".` : ''} ¿Te gustaría que analice alguna tabla en específico?`,
      action: { type: 'NONE' }
    };
  }

  if (lowerMsg.includes('analiza') || lowerMsg.includes('datos') || lowerMsg.includes('kpi')) {
    if (!activeTable) {
      return {
        text: "Para analizar datos necesito que selecciones una tabla primero. ¿Quieres que te ayude a crear una nueva?",
        action: { type: 'NONE' }
      };
    }
    return {
      text: `He analizado la tabla **${activeTable.name}**. Veo potencial para automatizar el seguimiento de estos registros. ¿Te gustaría generar un reporte o enviarlos a Slack?`,
      action: { type: 'ANALYZE_DATA' }
    };
  }

  if (lowerMsg.includes('crea') && (lowerMsg.includes('proyecto') || lowerMsg.includes('espacio'))) {
    return {
      text: "¡Excelente! Puedo ayudarte a configurar un nuevo espacio. Solo haz clic en el botón '+' en la parte superior o dime qué nombre quieres ponerle y yo te guiaré.",
      action: { type: 'CREATE_PROJECT' }
    };
  }

  if (lowerMsg.includes('quien eres') || lowerMsg.includes('ayuda') || lowerMsg.includes('hola')) {
    return {
      text: "¡Hola! Soy la IA de NaticBox. Mi objetivo es ayudarte a gestionar tus datos de forma inteligente. Puedo resumir tus proyectos, analizar tendencias en tus tablas o ayudarte a navegar por la interfaz. ¿Qué quieres hacer primero?",
      action: { type: 'NONE' }
    };
  }

  // Respuesta "Inteligente" Genérica
  return {
    text: "Entiendo. Estoy monitoreando tus flujos en NaticBox para sugerirte mejoras. Por ahora, puedo ayudarte con la gestión de tus proyectos o el análisis de las tablas actuales. ¿En qué prefieres enfocarte?",
    action: { type: 'NONE' }
  };
};
