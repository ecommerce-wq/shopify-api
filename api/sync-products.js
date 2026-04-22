// 🔥 FUNCIONES PRO

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
    .replace(/sweater/i, "Sweater Exclusivo");
}

// 🚀 HANDLER

export default async function handler(req, res) {
  try {
    const shop = process.env.SHOPIFY_SHOP;
    const token = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!shop || !token) {
      return res.json({ error: "Variables faltantes", shop, token });
    }

    // 🔹 TRAER PRODUCTOS DEL PROVEEDOR
    const proveedorResponse = await fetch(
      "https://srv2.best-fashion.net/ApiV3/token/38712c15e4976ba5f4647e891f559271/callType/allStockGroup"
    );

    const proveedorData = await proveedorResponse.json();

    // 🔹 BASE DE IMÁGENES
    const imageBaseResponse = await fetch(
      "https://srv2.best-fashion.net/ApiV3/token/38712c15e4976ba5f4647e891f559271"
    );

    const imageBaseData = await imageBaseResponse.json();
    const imageBase = "https://" + imageBaseData.image_url;

    // 🔥 ADAPTAR PRODUCTOS
    const productos = proveedorData.map(p => ({
      name: p.name,
      price: Number(p.price),
      sku: p.style_code,
      description: p.description,
      images: p.pic1 ? [imageBase + p.pic1] : [],
      variants: p.available_size || []
    }));

    // 🔥 FILTRO PREMIUM
    const productosFiltrados = productos.filter(p =>
      p.price > 20 &&
      p.name &&
      p.images.length > 0 &&
      p.variants.length > 0
    );

    const resultados = [];

    for (const p of productosFiltrados) {

      // 🔍 BUSCAR EXISTENTE
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
                options: [
                  {
                    name: "Talla",
                    values: p.variants.map(v => v.size)
                  }
                ],
                variants: p.variants.map(v => ({
                  price: calcularPrecio(p.price).toFixed(0),
                  sku: v.stock_id,
                  option1: v.size,
                  inventory_management: "shopify",
                  inventory_quantity: Number(v.qty)
                }))
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
