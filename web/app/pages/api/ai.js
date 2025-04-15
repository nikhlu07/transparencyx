const { BigQuery } = require('@google-cloud/bigquery');

export default async function handler(req, res) {
  const bigquery = new BigQuery();
  // Simplified market average (replace with real API or BigQuery historical data)
  const marketAvgQuery = `SELECT AVG(amount) as avgAmount FROM cleargov.transactions WHERE timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)`;
  const [avgResult] = await bigquery.query(marketAvgQuery);
  const marketAvg = avgResult[0]?.avgAmount || 10000; // Default $10,000 if no data

  const query = `
    SELECT user, amount, status, timestamp
    FROM cleargov.transactions
    WHERE amount > ${marketAvg * 2} OR timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
    ORDER BY timestamp DESC
    LIMIT 5
  `;
  const [rows] = await bigquery.query(query);

  const fraudAlerts = rows.map(row => ({
    message: `HIGH Suspicious Claim by ${row.user}: $${row.amount} (>${marketAvg * 2} market avg) - Investigate`,
    time: row.timestamp.toISOString(),
  }));

  res.status(200).json({ alerts: fraudAlerts });
}