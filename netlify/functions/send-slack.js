exports.handler = async (event, context) => {
  // Solo permitir peticiones POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { webhookUrl, payload } = JSON.parse(event.body);

    if (!webhookUrl || !payload) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: "Faltan datos requeridos (webhookUrl o payload)" }) 
      };
    }

    // Enviar a Slack usando fetch (disponible en Node 18+)
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { 
        statusCode: response.status, 
        body: JSON.stringify({ error: "Error en Slack", details: errorText }) 
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Permitir CORS para desarrollo
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ message: "Notificación enviada con éxito" }),
    };
  } catch (error) {
    console.error("Error en send-slack:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: "Internal Server Error", details: error.message }) 
    };
  }
};
