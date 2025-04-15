const { BigQuery } = require('@google-cloud/bigquery');

export default async function handler(req, res) {
  const bigquery = new BigQuery();
  const query = `
    SELECT status, COUNT(*) as count
    FROM cleargov.transactions
    GROUP BY status
  `;
  const [rows] = await bigquery.query(query);
  res.status(200).json(rows);
}