// 🔥 CONFIGURACIÓN
const USD_RATE = 4000; // 💰 Ajusta (COP ≈ USD)

// 🔥 MARCAS PERMITIDAS
const MARCAS_PERMITIDAS = [
  "bottega veneta",
  "celine",
  "alaia",
  "fendi",
  "loewe",
  "chloe",
  "valentino",
  "saint laurent",
  "stella mccartney"
];

// 🔥 FUNCIONES

function generarDescripcion(nombre) {
  return `
  <p><strong>${nombre}</strong></p>
  <p>Prenda de lujo seleccionada cuidadosamente para un estilo sofisticado y exclusivo.</p>
  `;
}

function calcularPrecio(costoProveedor) {
  const costoTotal = Number(costoProveedor || 0) + 150 + 60; // + costos
  const precioUSD = costoTotal / USD_RATE;
  const precioFinal = precioUSD * 1.3; // +30% ganancia
  return precioFinal.toFixed(2);
}

function nombrePremium(nombre) {
  return nombre || "Prenda Exclusiva de Alta Gama";
}

function detectarColeccion(nombre) {
  const base = (nombre || "").toLowerCase();

  if (base.includes("shirt")) return "Camisas Premium";
  if (base.includes("pants")) return "Pantalones Elegantes";
  if (base.includes("sweater")) return "Sweaters de Lujo";
  if (base.includes("jacket") || base.includes("coat")) return "Chaquetas y Abrigos";
  if (base.includes("blazer")) return "Blazers Exclusivos";

  return "Colección Premium";
}

function esMarcaValida(nombre) {
  const base = (nombre || "").toLowerCase();
  return MARCAS_PERMITIDAS.some(marca => base.includes(marca));
}

// 🚀 HANDLER

export default async function handler(req, res) {
  try {
    const shop = process.env.SHOPIFY_SHOP;
    const token = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!shop || !token) {
      return res.json({ error: "Variables faltantes", shop, token });
    }

    // 🔹 FETCH PROVEEDOR
    const proveedorResponse = await fetch(
      "https://srv2.best-fashion.net/ApiV3/token/38712c15e4976ba5f4647e891f559271/callType/allStockGroup"
    );

    const proveedorData = await proveedorResponse.json();

    // 🔹 BASE IMÁGENES
    const imageBaseResponse = await fetch(
      "https://srv2.best-fashion.net/ApiV3/token/38712c15e4976ba5f4647e891f559271"
    );

    const imageBaseData = await imageBaseResponse.json();
    const imageBase = "https://" + imageBaseData.image_url;

    // 🔥 ADAPTAR DATOS (ANTI ERROR)
    const productosRaw = Array.isArray(proveedorData)
      ? proveedorData
      : proveedorData.data || Object.values(proveedorData || {});

    const productos = productosRaw.map(p => ({
      name: p.name || "",
      price: Number(p.price || 0),
      sku: p.style_code || Math.random().toString(36),
      images: p.pic1 ? [imageBase + p.pic1] : [],
      variants: p.available_size || []
    }));

    // 🔥 FILTRO PREMIUM + MARCAS
    const productosFiltrados = productos.filter(p => {
      return (
        p.price > 0 &&
        p.images.length > 0 &&
        p.variants.length > 0 &&
        esMarcaValida(p.name) &&
        p.variants.some(v => Number(v.qty) > 0)
      );
    });

    const resultados = [];

    for (const p of productosFiltrados) {

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

      const existingProduct = productosShopify.find(prod =>
        (prod.variants || []).some(v => v.sku === p.sku)
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
                product_type: detectarColeccion(p.name),
                tags: "lujo, premium, diseñador",
                images: p.images.map(img => ({ src: img })),
                options: [
                  {
                    name: "Talla",
                    values: (p.variants || []).map(v => v.size)
                  }
                ],
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
                price: calcularPrecio(p.price)
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
