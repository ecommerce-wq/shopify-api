// 🔥 FUNCIONES PRO (ARRIBA DE TODO)

function generarDescripcion(nombre) {
  return `
  <p><strong>${nombre}</strong></p>
  <p>Diseñada para quienes buscan elegancia y distinción en cada detalle.</p>
  <ul>
    <li>✔ Diseño exclusivo</li>
    <li>✔ Materiales de alta calidad</li>
    <li>✔ Corte moderno y sofisticado</li>
    <li>✔ Ideal para ocasiones formales o casuales</li>
  </ul>
  <p>Eleva tu estilo con una prenda que refleja personalidad y buen gusto.</p>
  `;
}

function calcularPrecio(costo) {
  if (costo < 20000) return costo * 2.5;
  if (costo < 50000) return costo * 2.2;
  return costo * 2;
}

function nombrePremium(nombre) {
  return nombre
    .replace(/camisa/i, "Camisa Premium")
    .replace(/pantalon/i, "Pantalón Elegante")
    .replace(/blusa/i, "Blusa Sofisticada");
}

// 🚀 HANDLER PRINCIPAL

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

    // 🔹 PRODUCTOS TEMPORALES (luego reemplazamos por proveedor)
    const productos = [
      {
        name: "camisa blanca elegante",
        price: 25000,
        sku: "CAM-001",
        quantity: 10,
        images: [
          "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf"
        ]
      },
      {
        name: "pantalon negro clasico",
        price: 40000,
        sku: "PAN-001",
        quantity: 5,
        images: [
          "https://images.unsplash.com/photo-1593032465171-8f5c1c1a5f0c"
        ]
      }
    ];

    // 🔥 FILTRO PREMIUM
    const productosFiltrados = productos.filter(p =>
      p.price > 15000 &&
      p.name &&
      p.images &&
      p.images.length > 0
    );

    const resultados = [];

    for (const p of productosFiltrados) {

      // 🔍 Buscar producto existente por SKU
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
                title: nombrePremium(p.name),
                body_html: generarDescripcion(p.name),
                images: p.images.map(img => ({ src: img })),
                variants: [
                  {
                    price: calcularPrecio(p.price).toFixed(0),
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
                price: calcularPrecio(p.price).toFixed(0)
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

        resultados.push({
          actualizado: existingProduct.title
        });
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
