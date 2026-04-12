export default async function handler(req, res) {
  try {
    const { shop, code } = req.query;

    if (!shop || !code) {
      return res.status(400).json({
        error: "Faltan parámetros",
        shop,
        code
      });
    }

    const client_id = process.env.SHOPIFY_API_KEY;
    const client_secret = process.env.SHOPIFY_API_SECRET;

    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        client_id,
        client_secret,
        code
      })
    });

    const data = await response.json();

    return res.json({
      message: "App instalada correctamente 🚀",
      data
    });

  } catch (error) {
    return res.status(500).json({
      error: "Crash en callback",
      detalle: error.message
    });
  }
}
