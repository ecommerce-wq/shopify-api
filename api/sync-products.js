export default async function handler(req, res) {
  try {
    const shop = process.env.SHOPIFY_SHOP;
    const token = process.env.SHOPIFY_ACCESS_TOKEN;

    // // 🔹 1. Traer productos del proveedor REAL
const proveedorResponse = await fetch(
  "https://srv2.best-fashion.net/api/products",
  {
    headers: {
      Authorization: "Bearer 38712c15e4976ba5f4647e891f559271"
    }
  }
);

const proveedorData = await proveedorResponse.json();

// Ajustar según estructura real
const proveedorProductos = proveedorData.products.map(p => ({
  title: p.name,
  price: p.price,
  sku: p.sku,
  stock: p.quantity
}));
      {
        title: "Camisa Premium Blanca",
        price: "120000",
        sku: "CAM-001",
        stock: 10
      },
      {
        title: "Pantalón Elegante Negro",
        price: "180000",
        sku: "PAN-002",
        stock: 5
      }
    ];

    const resultados = [];

    for (const producto of proveedorProductos) {

      // 🔹 2. Buscar si el producto ya existe por SKU
      const search = await fetch(
        `https://${shop}/admin/api/2024-04/products.json?handle=${producto.sku}`,
        {
          headers: {
            "X-Shopify-Access-Token": token,
            "Content-Type": "application/json"
          }
        }
      );

      const searchData = await search.json();

      let productId = null;

      if (searchData.products.length > 0) {
        productId = searchData.products[0].id;
      }

      // 🔹 3. Crear producto si no existe
      if (!productId) {
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
        resultados.push({ creado: created.product.title });

     } else {
  const existingProduct = searchData.products[0];
  const variant = existingProduct.variants[0];

  const inventoryItemId = variant.inventory_item_id;

  // 🔄 ACTUALIZAR INVENTARIO REAL
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
        inventory_item_id: inventoryItemId,
        available: producto.stock
      })
    }
  );

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

  resultados.push({ actualizado: producto.title });
}
    }

    return res.json({
      status: "ok",
      resultados
    });

  } catch (error) {
    return res.status(500).json({
      error: "Error en sync",
      detalle: error.message
    });
  }
}
