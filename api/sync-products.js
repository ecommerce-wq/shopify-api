export default async function handler(req, res) {
  try {
    const shop = process.env.SHOPIFY_SHOP;
    const token = process.env.SHOPIFY_ACCESS_TOKEN;

    const productos = [
      {
        name: "Camisa Elegante Blanca",
        price: 50000,
        sku: "CAM-001",
        quantity: 10,
        images: [
          "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf"
        ]
      }
    ];

    const resultados = [];

    for (const p of productos) {

      // 🔍 Buscar producto existente
      const search = await fetch(
        `https://${shop}/admin/api/2024-04/products.json?limit=50`,
        {
          headers: {
            "X-Shopify-Access-Token": token
          }
        }
      );

      const data = await search.json();

      const existingProduct = data.products.find(prod =>
        prod.variants.some(v => v.sku === p.sku)
      );

      if (!existingProduct) {
        // 🆕 CREAR
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

        resultados.push({ creado: created.product.title });

      } else {

        const variant = existingProduct.variants[0];

        // 🔄 ACTUALIZAR PRECIO
        await fetch(
          `https://${shop}/admin/api/2024-04/variants/${variant.id}.json`,
          {
            method: "PUT",
            headers: {
              "X-Shopify-Access-Token": token,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              variant: {
                id: variant.id,
                price: (p.price * 2).toString()
              }
            })
          }
        );

        // 🔄 ACTUALIZAR INVENTARIO
        await fetch(
          `https://${shop}/admin/api/2024-04/inventory_levels/set.json`,
          {
            method: "POST",
            headers: {
              "X-Shopify-Access-Token": token,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              location_id: 1,
              inventory_item_id: variant.inventory_item_id,
              available: p.quantity
            })
          }
        );

        resultados.push({ actualizado: existingProduct.title });
      }
    }

    return res.json({
      status: "ok",
      resultados
    });

  } catch (error) {
    return res.status(500).json({
      error: "Error",
      detalle: error.message
    });
  }
}
