export default async function handler(req, res) {
  try {
    const shop = process.env.SHOPIFY_SHOP;
    const token = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!shop || !token) {
      return res.json({
        error: "Variables no definidas",
        shop,
        token
      });
    }

    const response = await fetch(
      `https://${shop}/admin/api/2024-04/products.json`,
      {
        headers: {
          "X-Shopify-Access-Token": token
        }
      }
    );

    const text = await response.text();

    return res.json({
      status: response.status,
      debug: text
    });

  } catch (error) {
    return res.status(500).json({
      error: "Crash real",
      detalle: error.message
    });
  }
}
