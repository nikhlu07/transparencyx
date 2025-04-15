const { BigQuery } = require('@google-cloud/bigquery');

export default async function handler(req, res) {
  const bigquery = new BigQuery();
  const query = `
    SELECT
      id,
      invoiceHash,
      staker,
      amount,
      claimId,
      status,
      timestamp
    FROM cleargov.challenges
    ORDER BY timestamp DESC
    LIMIT 5
  `;
  const [rows] = await bigquery.query(query);
  res.status(200).json(rows);
}