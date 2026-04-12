export default async function handler(req, res) {
  try {
    const shop = process.env.SHOPIFY_SHOP;
    const token = process.env.SHOPIFY_ACCESS_TOKEN;

    // 🔹 1. Simulación proveedor (luego lo conectamos real)
    const proveedorProductos = [
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
        resultados.push({ existente: producto.title });
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
