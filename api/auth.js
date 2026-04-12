// test deploy 

export default function handler(req, res) {
  const shop = process.env.xkhkiu-up.myshopify.com;
  const client_id = process.env.e7a2b1dc9172957559f3c094c2191024;

  if (!shop || !client_id) {
    return res.status(500).json({
      error: "Faltan variables de entorno",
      shop,
      client_id
    });
  }

  const redirect_uri = `https://${req.headers.host}/api/auth/callback`;
  const scope = "read_products,write_products";

  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${client_id}&scope=${scope}&redirect_uri=${redirect_uri}`;

  res.redirect(installUrl);
}
