// 🔥 CONFIG
const USD_RATE = 4000;

// 🔥 FUNCIONES

function generarDescripcion(nombre) {
  return `<p><strong>${nombre || "Producto Premium"}</strong></p>`;
}

function calcularPrecio(costo) {
  const total = Number(costo || 0) + 150 + 60;
  const usd = total / USD_RATE;
  return (usd * 1.3).toFixed(2);
}

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

    // 🔹 IMÁGENES
    const imgRes = await fetch(
      "https://srv2.best-fashion.net/ApiV3/token/38712c15e4976ba5f4647e891f559271"
    );

    const imgData = await imgRes.json();
    const imageBase = "https://" + (imgData.image_url || "");

    // 🔥 NORMALIZAR
    const productosRaw = Array.isArray(proveedorData)
      ? proveedorData
      : proveedorData.data || Object.values(proveedorData || {});

    const productos = productosRaw.map(p => ({
      name: p?.name || "Producto Premium",
      price: Number(p?.price || 10),
      sku: p?.style_code || Math.random().toString(36),
      image: p?.pic1 ? imageBase + p.pic1 : null
    }));

    // 🔥 TRAER MÁS PRODUCTOS
    const filtrados = productos.slice(0, 30);

    const resultados = [];

    for (const p of filtrados) {
      try {

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
        const productosShopify = data?.products || [];

        const existe = productosShopify.find(prod =>
          (prod?.variants || []).some(v => v?.sku === p.sku)
        );

        if (!existe) {

          // 🆕 CREAR (SIN VARIANTES COMPLEJAS)
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
                  tags: "premium",
                  images: p.image ? [{ src: p.image }] : [],
                  variants: [
                    {
                      price: calcularPrecio(p.price),
                      sku: p.sku,
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
            creado: created?.product?.title || "ok"
          });

        } else {
          resultados.push({
            existente: existe.title
          });
        }

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
