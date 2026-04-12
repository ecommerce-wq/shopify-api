export default async function handler(req, res) {
  const { shop, code } = req.query;

  res.status(200).json({
    message: "Callback funcionando",
    shop,
    code
  });
}
