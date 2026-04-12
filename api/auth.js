// test deploy 

export default function handler(req, res) {
  const shop = process.env.https://houseofsartorial.com;
  const client_id = process.env.e7a2b1dc9172957559f3c094c2191024;
  const redirect_uri = `https://${req.headers.host}/api/auth/callback`;
  const scope = "read_products,write_products";

  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${client_id}&scope=${scope}&redirect_uri=${redirect_uri}`;

  res.redirect(installUrl);
}
