export default async function handler(req, res) {
  try {
    const shop = process.env.SHOPIFY_SHOP;
    const token = process.env.SHOPIFY_ACCESS_TOKEN;

    // 🔹 TRAER PRODUCTOS DEL PROVEEDOR
    const proveedorResponse = await fetch(
      "https://srv2.best-fashion.net/api/products",
      {
        headers: {
          Authorization: "Bearer 38712c15e4976ba5f4647e891f559271"
        }
      }
    );

    const proveedorData = await proveedorResponse.json();

    const productos = proveedorData.products;

    const resultados = [];

    for (const p of productos) {

      const producto = {
        title: p.name,
        body_html: p.description || "",
        images: p.images?.map(img => ({ src: img })) || [],
        price: (p.price * 2).toString(), // margen x2
        sku: p.sku,
        stock: p.quantity
      };

      // 🔍 BUSCAR SI EXISTE
      const search = await fetch(
        `https://${shop}/admin/api/2024-04/products.json?title=${encodeURIComponent(producto.title)}`,
        {
          headers: {
            "X-Shopify-Access-Token": token
          }
        }
      );

      const searchData = await search.json();

      if (searchData.products.length === 0) {

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
                title: producto.title,
                body_html: producto.body_html,
                images: producto.images,
                variants: [
                  {
                    price: producto.price,
                    sku: producto.sku,
                    inventory_management: "shopify",
                    inventory_quantity: producto.stock
                  }
                ]
              }
            })
          }
        );

        const created = await create.json();

        resultados.push({ creado: producto.title });

      } else {

        const existing = searchData.products[0];
        const variant = existing.variants[0];

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
                price: producto.price
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
              available: producto.stock
            })
          }
        );

        resultados.push({ actualizado: producto.title });
      }
    }

    return res.json({
      status: "ok",
      total: resultados.length,
      resultados
    });

  } catch (error) {
    return res.status(500).json({
      error: "Error en sync",
      detalle: error.message
    });
  }
}
