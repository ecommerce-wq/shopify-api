// 🔥 CONFIG
const USD_RATE = 4000;

// 🔥 FUNCIONES

function generarDescripcion(nombre) {
  return `<p><strong>${nombre}</strong></p>
  <p>Producto de lujo seleccionado cuidadosamente.</p>`;
}

function calcularPrecio(costo) {
  const total = Number(costo || 0) + 150 + 60;
  const usd = total / USD_RATE;
  return (usd * 1.3).toFixed(2);
}

function detectarColeccion(nombre) {
  const base = (nombre || "").toLowerCase();

  if (base.includes("shirt")) return "Camisas Premium";
  if (base.includes("pants")) return "Pantalones";
  if (base.includes("sweater")) return "Sweaters";
  if (base.includes("jacket") || base.includes("coat")) return "Chaquetas";
  if (base.includes("blazer")) return "Blazers";

  return "Colección Premium";
}

// 🚀 HANDLER

export default async function handler(req, res) {
  try {
    const shop = process.env.SHOPIFY_SHOP;
    const token = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!shop || !token) {
      return res.json({ error: "Variables faltantes", shop, token });
    }

    // 🔹 PROVEEDOR
    const proveedorResponse = await fetch(
      "https://srv2.best-fashion.net/ApiV3/token/38712c15e4976ba5f4647e891f559271/callType/allStockGroup"
    );

    const proveedorData = await proveedorResponse.json();

    // 🔹 IMÁGENES
    const imgRes = await fetch(
      "https://srv2.best-fashion.net/ApiV3/token/38712c15e4976ba5f4647e891f559271"
    );

    const imgData = await imgRes.json();
    const imageBase = "https://" + imgData.image_url;

    // 🔥 NORMALIZAR DATOS
    const productosRaw = Array.isArray(proveedorData)
      ? proveedorData
      : proveedorData.data || Object.values(proveedorData || {});

    const productos = productosRaw.map(p => ({
      name: p.name || "Producto Premium",
      price: Number(p.price || 0),
      sku: p.style_code || Math.random().toString(36),
      images: p.pic1 ? [imageBase + p.pic1] : [],
      variants: p.available_size || []
    }));

    // 🔥 🔥 🔥 IMPORTANTE
    // SIN FILTRO PARA VALIDAR QUE TODO FUNCIONA
    const filtrados = productos.slice(0, 10);

    const resultados = [];

    for (const p of filtrados) {

      // 🔍 BUSCAR EN SHOPIFY
      const search = await fetch(
        `https://${shop}/admin/api/2024-04/products.json?limit=50`,
        {
          headers: {
            "X-Shopify-Access-Token": token
          }
        }
      );

      const data = await search.json();
      const productosShopify = data.products || [];

      const existente = productosShopify.find(prod =>
        (prod.variants || []).some(v => v.sku === p.sku)
      );

      if (!existente) {

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
                body_html: generarDescripcion(p.name),
                product_type: detectarColeccion(p.name),
                tags: "premium",
                images: p.images.map(img => ({ src: img })),
                options: [{
                  name: "Talla",
                  values: (p.variants || []).map(v => v.size)
                }],
                variants: (p.variants || []).map(v => ({
                  price: calcularPrecio(p.price),
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

        const variant = existente.variants[0];

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
                price: calcularPrecio(p.price)
              }
            })
          }
        );

        resultados.push({
          actualizado: existente.title
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
