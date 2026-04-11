export default function handler(req, res) {
  const shop = "xkhkiu-up.myshopify.com";
  const client_id = process.env.e7a2b1dc9172957559f3c094c2191024;
  const redirect_uri = `https://${req.headers.host}/api/auth/callback`;

  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${client_id}&scope=read_products,write_products&redirect_uri=${redirect_uri}`;

  res.redirect(installUrl);
}
