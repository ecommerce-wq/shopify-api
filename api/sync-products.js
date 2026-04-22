// 🔥 CONFIG
const USD_RATE = 4000;

// 🔥 FUNCIONES

function generarDescripcion(nombre) {
  return `<p><strong>${nombre || "Producto Premium"}</strong></p>`;
}

function calcularPrecio(costo) {
  const total = Number(costo || 10) + 150 + 60;
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

    const resultados = [];
    let creados = 0;

    // 🔥 RECORRER MUCHOS PRODUCTOS (CLAVE)
    for (const p of productosRaw) {
      if (creados >= 20) break; // máximo 20 productos

      try {
        const name = p?.name || "Producto Premium";
        const price = Number(p?.price || 10);
        const sku = p?.style_code || Math.random().toString(36);
        const image = p?.pic1 ? imageBase + p.pic1 : null;

        // 🔥 VALIDACIÓN MÍNIMA
        if (!name || price <= 0) continue;

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
          (prod?.variants || []).some(v => v?.sku === sku)
        );

        if (!existe) {

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
                  title: name,
                  body_html: generarDescripcion(name),
                  tags: "premium",
                  images: image ? [{ src: image }] : [],
                  variants: [
                    {
                      price: calcularPrecio(price),
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
            creado: created?.product?.title || "ok"
          });

          creados++;

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
      total: creados,
      resultados
    });

  } catch (error) {
    return res.status(500).json({
      error: "Error",
      detalle: error.message
    });
  }
}
