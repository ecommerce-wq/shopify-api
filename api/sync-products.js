export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://srv2.best-fashion.net/ApiV3/token/38712c15e4976ba5f4647e891f559271/callType/allStockGroup"
    );

    const data = await response.json();

    const products = Array.isArray(data) ? data.slice(0, 1) : [data];

    const results = [];

    for (const item of products) {
      const productData = {
        title: item?.name || "Producto sin nombre",
        body_html: item?.description || "Sin descripción",
        vendor: item?.brand || "Proveedor",
        product_type: item?.category || "General",
        variants: [
          {
            price: item?.price ? String(item.price) : "10.00",
          },
        ],
      };

      try {
        const shopifyResponse = await fetch(
          "https://xkhkiu-up.myshopify.com/admin/api/2023-10/products.json",
          {
            method: "POST",
            headers: {
              "X-Shopify-Access-Token": "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",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ product: productData }),
          }
        );

        const result = await shopifyResponse.json();

        results.push(result);

      } catch (err) {
        results.push({ error: err.message });
      }
    }

    res.status(200).json({
      message: "Proceso terminado",
      resultados: results,
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
}
