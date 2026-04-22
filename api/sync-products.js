// 🔥 CONFIG
const USD_RATE = 4000;

const MARCAS_PERMITIDAS = [
  "bottega", "celine", "alaia", "fendi",
  "loewe", "chloe", "valentino",
  "saint laurent", "stella mccartney"
];

// 🔥 FUNCIONES

function esMarcaValida(nombre = "") {
  const n = nombre.toLowerCase();
  return MARCAS_PERMITIDAS.some(m => n.includes(m));
}

function generarNombre(p) {
  return `${p.brand || "Luxury"} ${p.name || "Exclusive Piece"}`;
}

function generarDescripcion(p) {
  return `
  <p><strong>${generarNombre(p)}</strong></p>
  <p>Pieza exclusiva seleccionada de colección internacional.</p>
  <p>Calidad premium • Edición limitada • Importado</p>
  `;
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

    // 🔹 PROVEEDOR
    const proveedorResponse = await fetch(
      "https://srv2.best-fashion.net/ApiV3/token/38712c15e4976ba5f4647e891f559271/callType/allStockGroup"
    );

    const proveedorData = await proveedorResponse.json();

    // 🔹 IMÁGENES BASE
    const imgRes = await fetch(
      "https://srv2.best-fashion.net/ApiV3/token/38712c15e4976ba5f4647e891f559271"
    );

    const imgData = await imgRes.json();
    const imageBase = "https://" + (imgData.image_url || "");

    const productosRaw = Array.isArray(proveedorData)
      ? proveedorData
      : proveedorData.data || Object.values(proveedorData || {});

    const resultados = [];
    let creados = 0;

    for (const p of productosRaw) {
      if (creados >= 15) break;

      try {
        const nombre = p?.name || "";
        const brand = p?.brand || "";
        const price = Number(p?.price || 0);
        const imagen = p?.pic1 ? imageBase + p.pic1 : null;
        const variantes = Array.isArray(p?.available_size) ? p.available_size : [];

        // 🔥 FILTRO LUJO
        if (
          !esMarcaValida(brand + " " + nombre) ||
          !imagen ||
          price <= 0 ||
          !variantes.length ||
          !variantes.some(v => Number(v.qty) > 0)
        ) continue;

        const skuBase = p?.style_code || Math.random().toString(36);

        // 🔍 VALIDAR SI YA EXISTE
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
          (prod?.variants || []).some(v => v?.sku?.includes(skuBase))
        );

        if (existe) continue;

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
                title: generarNombre(p),
                body_html: generarDescripcion(p),
                vendor: p.brand || "Luxury",
                tags: "luxury,premium",
                images: [{ src: imagen }],
                options: [{
                  name: "Size",
                  values: variantes.map(v => v.size)
                }],
                variants: variantes.map(v => ({
                  price: calcularPrecio(price),
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
          creado: created?.product?.title
        });

        creados++;

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
