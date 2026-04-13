export default async function handler(req, res) {
  try {
    const shop = process.env.SHOPIFY_SHOP;
    const token = process.env.SHOPIFY_ACCESS_TOKEN;

    return res.json({
      shop,
      token
    });

  } catch (error) {
    return res.status(500).json({
      error: "Crash total",
      detalle: error.message
    });
  }
}
