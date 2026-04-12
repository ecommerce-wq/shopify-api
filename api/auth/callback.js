export default async function handler(req, res) {
  const { code, shop } = req.query;

  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      client_id: process.env.e7a2b1dc9172957559f3c094c2191024,
      client_secret: process.env.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,
      code
    })
  });

  const data = await response.json();

  console.log("ACCESS TOKEN:", data.access_token);

  res.status(200).json({
    message: "App conectada",
    token: data.access_token
  });
}
