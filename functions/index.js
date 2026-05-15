const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch"); // Require node-fetch v2 in package.json
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();

// Accede a la API Key de forma segura
const geminiApiKey = functions.config().gemini.api_key;
const genAI = new GoogleGenerativeAI(geminiApiKey);

// Cloud Function para enviar notificación a Slack cuando se crea un registro en una tabla
exports.notifySlackOnRecordWrite = functions.firestore
  .document("tables/{tableId}/records/{recordId}")
  .onCreate(async (snapshot, context) => {
    const recordData = snapshot.data();
    const { tableId } = context.params;

    try {
      // 1. Obtener datos de la tabla para saber a qué proyecto pertenece
      const tableDoc = await admin.firestore().collection("tables").doc(tableId).get();
      if (!tableDoc.exists) return null;
      
      const tableData = tableDoc.data();
      const projectId = tableData.projectId;

      // 2. Obtener datos del proyecto para saber quién es el dueño
      const projectDoc = await admin.firestore().collection("projects").doc(projectId).get();
      if (!projectDoc.exists) return null;

      const projectData = projectDoc.data();
      const ownerId = projectData.userId;

      // 3. Obtener el Slack Webhook del dueño
      const userDoc = await admin.firestore().collection("users").doc(ownerId).get();
      if (!userDoc.exists) return null;

      const slackWebhookUrl = userDoc.data().slack_webhook;
      if (!slackWebhookUrl) return null;

      // 4. Construir el mensaje enriquecido
      const folio = recordData.values.folio || recordData.id.slice(-6);
      const email = recordData.values.email || "No proporcionado";
      
      const fieldsSummary = tableData.columnDefinitions
        .filter(c => !c.hiddenInForm && c.id !== 'folio')
        .map(col => {
          const val = recordData.values[col.id];
          if (val === undefined || val === null || val === '') return null;
          let displayVal = String(val);
          if (Array.isArray(val)) displayVal = val.map(v => v.name || v.displayValue || v).join(', ');
          return `• *${col.name}:* ${displayVal}`;
        })
        .filter(Boolean)
        .join('\n');

      const message = {
        blocks: [
          {
            type: "header",
            text: { type: "plain_text", text: "🚀 Nueva Solicitud en NaticBox", emoji: true }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Proyecto:* ${projectData.name}\n*Tabla:* ${tableData.name}\n*Folio:* \`${folio}\`\n*Cliente:* ${email}`
            }
          },
          { type: "divider" },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Detalles:*\n${fieldsSummary || '_Sin detalles adicionales_'}`
            }
          },
          {
            type: "context",
            elements: [{ type: "mrkdwn", text: "⚡ Enviado por Cloud Functions" }]
          }
        ]
      };

      await fetch(slackWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message)
      });

    } catch (error) {
      console.error("Error en notifySlackOnRecordWrite:", error);
    }
    return null;
  });

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
