const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch"); // Require node-fetch v2 in package.json

admin.initializeApp();

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
