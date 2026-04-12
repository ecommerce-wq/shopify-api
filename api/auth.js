export default function handler(req, res) {
  try {
    const shop = process.env.SHOP;
    const client_id = process.env.SHOPIFY_API_KEY;

    if (!shop || !client_id) {
      return res.status(500).json({
        error: "Variables faltantes",
        shop,
        client_id
      });
    }

    const redirect_uri = "https://shopify-api-tlow.vercel.app/api/auth/callback";
    const scope = "read_products,write_products,read_inventory,write_inventory";

    // 🔥 GENERAR STATE (MUY IMPORTANTE)
    const state = Math.random().toString(36).substring(2);

    const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${client_id}&scope=${scope}&redirect_uri=${redirect_uri}&state=${state}`;

    return res.redirect(installUrl);

  } catch (error) {
    return res.status(500).json({
      error: "Crash en auth",
      detalle: error.message
    });
  }
}
