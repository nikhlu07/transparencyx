// pages/api/bigquery/log.js
export default function handler(req, res) {
    if (req.method === "POST") {
      console.log("Mock BigQuery log:", req.body);
      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  }