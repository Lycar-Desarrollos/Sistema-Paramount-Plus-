const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch"); // Require node-fetch v2 in package.json

admin.initializeApp();

// Cloud Function para enviar notificación a Slack cuando se crea o actualiza un registro
exports.notifySlackOnRecordWrite = functions.firestore
  .document("records/{recordId}")
  .onWrite(async (change, context) => {
    // Si el documento fue borrado, no hacemos nada.
    if (!change.after.exists) {
      return null;
    }

    const data = change.after.data();
    const ownerId = data.owner_id;
    
    // El campo principal de la tabla normalmente se define dinámicamente, usaremos el primero como ejemplo
    const recordName = data.fields ? Object.values(data.fields)[0] : "Nuevo Registro";
    
    // Obtenemos la URL de Cloudinary si existe (suponiendo que es un campo de tipo 'image')
    let cloudinaryUrl = "";
    if (data.fields) {
      for (const [key, value] of Object.entries(data.fields)) {
        if (typeof value === "string" && value.includes("cloudinary.com")) {
          cloudinaryUrl = value;
          break;
        }
      }
    }

    try {
      // Obtenemos el perfil del usuario para sacar el slack_channel_id
      const userDoc = await admin.firestore().collection("users").doc(ownerId).get();
      
      if (!userDoc.exists) {
        console.log(`Usuario no encontrado: ${ownerId}`);
        return null;
      }

      const userData = userDoc.data();
      const slackChannelId = userData.slack_channel_id;

      if (!slackChannelId) {
        console.log(`El usuario ${ownerId} no tiene configurado un slack_channel_id`);
        return null;
      }

      // Slack API token debe estar guardado en secrets o variables de entorno
      // Ej: firebase functions:secrets:set SLACK_BOT_TOKEN
      const slackToken = process.env.SLACK_BOT_TOKEN || functions.config().slack.token;

      if (!slackToken) {
        console.error("No se ha configurado SLACK_BOT_TOKEN");
        return null;
      }

      // Mensaje para Slack
      const message = {
        channel: slackChannelId,
        text: `El registro *${recordName}* ha sido actualizado.`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `✨ El registro *${recordName}* ha sido creado/actualizado.`,
            },
          },
        ],
      };

      if (cloudinaryUrl) {
        message.blocks.push({
          type: "image",
          title: {
            type: "plain_text",
            text: "Archivo Adjunto",
          },
          image_url: cloudinaryUrl,
          alt_text: "cloudinary_image",
        });
      }

      // Enviar a Slack
      const response = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${slackToken}`,
        },
        body: JSON.stringify(message),
      });

      const json = await response.json();
      if (!json.ok) {
        console.error(`Error de Slack: ${json.error}`);
      } else {
        console.log(`Notificación enviada a Slack exitosamente al canal ${slackChannelId}`);
      }

    } catch (error) {
      console.error("Error al ejecutar notifySlackOnRecordWrite:", error);
    }

    return null;
  });
