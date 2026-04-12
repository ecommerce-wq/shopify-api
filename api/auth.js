export default function handler(req, res) {
  try {
    const shop = process.env.xkhkiu-up.myshopify.com;
    const client_id = process.env.e7a2b1dc9172957559f3c094c2191024;

    if (!shop || !client_id) {
      return res.status(500).json({
        error: "Variables faltantes",
        shop,
        client_id
      });
    }

    const redirect_uri = "https://shopify-api-tlow.vercel.app/api/auth/callback";
    const scope = "read_products,write_products";

    const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${client_id}&scope=${scope}&redirect_uri=${redirect_uri}`;

    return res.redirect(installUrl);

  } catch (error) {
    return res.status(500).json({
      error: "Crash en auth",
      detalle: error.message
    });
  }
}
