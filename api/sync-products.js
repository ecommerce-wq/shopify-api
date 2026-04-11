export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://srv2.best-fashion.net/ApiV3/token/38712c15e4976ba5f4647e891f559271/callType/allStockGroup"
    );

    const data = await response.json();

    if (!data) {
      return res.status(200).json({ message: "No products" });
    }

    const products = Array.isArray(data) ? data.slice(0, 3) : [data];

    for (const item of products) {
      await fetch(
        "https://houseofsartorial.myshopify.com/admin/api/2023-10/products.json",
        {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": "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",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product: {
              title: item.name,
              body_html: item.description,
              vendor: item.brand,
              product_type: item.category,
              variants: [
                {
                  price: item.price,
                },
              ],
            },
          }),
        }
      );
    }

    res.status(200).json({ message: "Products synced" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
