const { BigQuery } = require('@google-cloud/bigquery');

export default async function handler(req, res) {
  const bigquery = new BigQuery();
  const query = `
    SELECT
      EXTRACT(MONTH FROM timestamp) AS month,
      SUM(CASE WHEN role = 'mainGov' THEN amount ELSE 0 END) AS mainGov,
      SUM(CASE WHEN role = 'stateHead' THEN amount ELSE 0 END) AS stateHead,
      SUM(CASE WHEN role = 'deputy' THEN amount ELSE 0 END) AS deputy,
      SUM(CASE WHEN role = 'vendor' THEN amount ELSE 0 END) AS vendor
    FROM cleargov.transactions
    GROUP BY EXTRACT(MONTH FROM timestamp)
    ORDER BY month
  `;
  const [rows] = await bigquery.query(query);
  const data = rows.map(row => ({
    name: new Date(2025, row.month - 1).toLocaleString('default', { month: 'short' }),
    mainGov: parseFloat(row.mainGov) || 0,
    stateHead: parseFloat(row.stateHead) || 0,
    deputy: parseFloat(row.deputy) || 0,
    vendor: parseFloat(row.vendor) || 0,
  }));
  res.status(200).json(data);
}