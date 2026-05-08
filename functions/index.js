const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch"); // Require node-fetch v2 in package.json
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();

// Accede a la API Key de forma segura
const geminiApiKey = functions.config().gemini.api_key;
const genAI = new GoogleGenerativeAI(geminiApiKey);

// Cloud Function para enviar notificación a Slack cuando se crea o actualiza una campaña
exports.notifySlackOnCampaignWrite = functions.firestore
  .document("campaigns/{campaignId}")
  .onWrite(async (change, context) => {
    // Si el documento fue borrado, no hacemos nada.
    if (!change.after.exists) {
      return null;
    }

    const data = change.after.data();
    
    // El dueño de la campaña o el usuario que la creó
    const ownerId = data.owner || data.createdBy || context.auth?.uid;
    
    const campaignName = data.title || "Nueva Campaña";
    const status = data.status || "Actualizada";

    if (!ownerId) {
      console.log(`No ownerId found for campaign ${context.params.campaignId}`);
      // Si no tenemos forma de saber quién es el dueño, intentamos notificar a todos los admins? 
      // Para esta integración asumiremos que necesitamos el ownerId para buscar el webhook
      return null;
    }

    try {
      // Obtenemos el perfil del usuario para sacar el slack_webhook
      const userDoc = await admin.firestore().collection("users").doc(ownerId).get();
      
      if (!userDoc.exists) {
        console.log(`Usuario no encontrado: ${ownerId}`);
        return null;
      }

      const userData = userDoc.data();
      const slackWebhookUrl = userData.slack_webhook;

      if (!slackWebhookUrl) {
        console.log(`El usuario ${ownerId} no tiene configurado un slack_webhook`);
        return null;
      }

      // Mensaje para Slack usando Webhooks
      const message = {
        text: `🚀 La campaña *${campaignName}* ha sido ${status}.`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `✨ Se ha registrado una actualización en la campaña: *${campaignName}*\n*Categoría*: ${data.category || 'N/A'}`,
            },
          },
        ],
      };

      // Enviar a Slack
      const response = await fetch(slackWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        console.error(`Error de Slack HTTP Status: ${response.status}`);
      } else {
        console.log(`Notificación enviada a Slack webhook exitosamente.`);
      }

    } catch (error) {
      console.error("Error al ejecutar notifySlackOnCampaignWrite:", error);
    }

    return null;
  });

// Nueva Cloud Function para chatear con la IA
exports.askAI = functions.https.onCall(async (data, context) => {
  // Asegurarnos de que el usuario está autenticado (opcional pero recomendado)
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Debes estar autenticado para usar esta función.');
  }

  const userQuery = data.query;
  if (!userQuery) {
    throw new functions.https.HttpsError('invalid-argument', 'La consulta no puede estar vacía.');
  }

  try {
    // --- ¡AQUÍ ESTÁ LA MAGIA! ---
    // Este es el paso más importante y específico para tu app.
    // Necesitamos decidir qué información de Firestore es útil para la IA.
    // Por ejemplo, si el usuario pregunta "cuántas campañas hay", buscamos en la colección 'campaigns'.
    
    const campaignsSnapshot = await admin.firestore().collection('campaigns').limit(50).get();
    const campaigns = campaignsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Podríamos añadir más colecciones: usuarios, tareas, etc.
    // const usersSnapshot = await admin.firestore().collection('users').limit(10).get();
    // const users = usersSnapshot.docs.map(doc => doc.data());

    // Formateamos los datos para que la IA los entienda.
    const contextData = {
      campaigns: campaigns,
      // users: users,
    };

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Eres "Natic AI", un asistente inteligente para la aplicación Natic.
      Tu propósito es responder preguntas sobre los datos de la aplicación.
      Sé conciso y amigable.

      Aquí tienes un extracto de los datos actuales de la aplicación en formato JSON:
      ${JSON.stringify(contextData, null, 2)}

      Basándote únicamente en esos datos, responde a la siguiente pregunta del usuario:
      "${userQuery}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return { reply: text };

  } catch (error) {
    console.error("Error al contactar con la API de Gemini:", error);
    throw new functions.https.HttpsError('internal', 'No se pudo procesar tu solicitud.');
  }
});
