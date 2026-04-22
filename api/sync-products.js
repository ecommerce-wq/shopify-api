// 🔥 CONFIG
const USD_RATE = 4000;

// 🚀 HANDLER

export default async function handler(req, res) {
  try {
    const shop = process.env.SHOPIFY_SHOP;
    const token = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!shop || !token) {
      return res.json({ error: "Variables faltantes" });
    }

    // 🔹 PROVEEDOR
    const proveedorResponse = await fetch(
      "https://srv2.best-fashion.net/ApiV3/token/38712c15e4976ba5f4647e891f559271/callType/allStockGroup"
    );

    const proveedorData = await proveedorResponse.json();

    const productosRaw = Array.isArray(proveedorData)
      ? proveedorData
      : proveedorData.data || Object.values(proveedorData || {});

    const resultados = [];

    // 🔥 CREAR DIRECTAMENTE (SIN VALIDACIONES)
    for (let i = 0; i < 20; i++) {
      const p = productosRaw[i] || {};

      try {
        const name = p.name || `Producto Premium ${i + 1}`;
        const price = Number(p.price || 20);
        const sku = p.style_code || `SKU-${Date.now()}-${i}`;

        const finalPrice = ((price + 150 + 60) / USD_RATE * 1.3).toFixed(2);

        const create = await fetch(
          `https://${shop}/admin/api/2024-04/products.json`,
          {
            method: "POST",
            headers: {
              "X-Shopify-Access-Token": token,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              product: {
                title: name,
                body_html: `<p>${name}</p>`,
                tags: "premium",
                variants: [
                  {
                    price: finalPrice,
                    sku: sku,
                    inventory_management: "shopify",
                    inventory_quantity: 0
                  }
                ]
              }
            })
          }
        );

        const created = await create.json();

        resultados.push({
          creado: created?.product?.title || name
        });

      } catch (err) {
        resultados.push({ error: err.message });
      }
    }

    return res.json({
      status: "ok",
      total: resultados.length,
      resultados
    });

  } catch (error) {
    return res.status(500).json({
      error: "Error",
      detalle: error.message
    });
  }
}
