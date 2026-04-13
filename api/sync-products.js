export default async function handler(req, res) {
  try {
    const shop = process.env.SHOPIFY_SHOP;
    const token = process.env.SHOPIFY_ACCESS_TOKEN;

    // 🔹 TEST SHOPIFY
    const test = await fetch(
      `https://${shop}/admin/api/2024-04/products.json`,
      {
        headers: {
          "X-Shopify-Access-Token": token
        }
      }
    );

    if (!test.ok) {
      const errorText = await test.text();
      return res.json({
        error: "Shopify error",
        detalle: errorText
      });
    }

    // 🔹 PRODUCTOS TEMPORALES (mientras responde proveedor)
    const productos = [
      {
        name: "Camisa Elegante Blanca",
        price: 50000,
        sku: "CAM-001",
        quantity: 10,
        images: [
          "https://cdn.shopify.com/s/files/1/0070/7032/products/white-shirt.jpg"
        ]
      }
    ];

    const resultados = [];

    for (const p of productos) {

      // 🔍 buscar producto por SKU
      const search = await fetch(
        `https://${shop}/admin/api/2024-04/products.json?limit=1`,
        {
          headers: {
            "X-Shopify-Access-Token": token
          }
        }
      );

      const searchData = await search.json();

      // 🆕 CREAR PRODUCTO
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
              title: p.name,
              images: p.images.map(img => ({ src: img })),
              variants: [
                {
                  price: (p.price * 2).toString(),
                  sku: p.sku,
                  inventory_management: "shopify",
                  inventory_quantity: p.quantity
                }
              ]
            }
          })
        }
      );

      const created = await create.json();

      resultados.push({
        creado: created.product?.title || "error"
      });
    }

    return res.json({
      status: "ok",
      resultados
    });

  } catch (error) {
    return res.status(500).json({
      error: "Error real",
      detalle: error.message
    });
  }
}
