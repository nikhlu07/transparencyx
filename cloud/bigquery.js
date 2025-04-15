
/**
 * TransparencyX - BigQuery Integration
 * 
 * This module handles integration with Google BigQuery for storing and analyzing
 * blockchain transaction data from the TransparencyX platform.
 */

const { BigQuery } = require('@google-cloud/bigquery');
require('dotenv').config();

// Configuration
const CONFIG = {
  projectId: process.env.GCP_PROJECT_ID || 'transparency-x',
  datasetId: 'procurement',
  tables: {
    claims: 'claims',
    supplierPayments: 'supplier_payments',
    subSupplierPayments: 'subsupplier_payments',
    challenges: 'challenges',
    transactionTraces: 'transaction_traces'
  }
};

/**
 * Create a BigQuery client
 * @returns {BigQuery} BigQuery client
 */
function createBigQueryClient() {
  try {
    const bigquery = new BigQuery({
      projectId: CONFIG.projectId
    });
    
    console.log("BigQuery client created successfully");
    return bigquery;
  } catch (error) {
    console.error("Failed to create BigQuery client:", error);
    throw error;
  }
}

/**
 * Initialize BigQuery dataset and tables for TransparencyX
 * @returns {Promise<void>}
 */
async function initializeBigQuery() {
  try {
    const bigquery = createBigQueryClient();
    
    // Create dataset if it doesn't exist
    const [datasets] = await bigquery.getDatasets();
    const datasetExists = datasets.some(dataset => dataset.id === CONFIG.datasetId);
    
    if (!datasetExists) {
      await bigquery.createDataset(CONFIG.datasetId, {
        location: 'US'
      });
      console.log(`Created dataset: ${CONFIG.datasetId}`);
    }
    
    // Create tables if they don't exist
    const dataset = bigquery.dataset(CONFIG.datasetId);
    
    // Claims table
    await createTableIfNotExists(dataset, CONFIG.tables.claims, [
      { name: 'claim_id', type: 'INTEGER' },
      { name: 'tx_hash', type: 'STRING' },
      { name: 'block_timestamp', type: 'TIMESTAMP' },
      { name: 'vendor_address', type: 'STRING' },
      { name: 'department_address', type: 'STRING' },
      { name: 'amount', type: 'NUMERIC' },
      { name: 'description', type: 'STRING' },
      { name: 'ipfs_hash', type: 'STRING' },
      { name: 'status', type: 'STRING' },
      { name: 'ai_approved', type: 'BOOLEAN' },
      { name: 'anomaly_score', type: 'NUMERIC' },
      { name: 'create_time', type: 'TIMESTAMP' }
    ]);
    
    // Supplier payments table
    await createTableIfNotExists(dataset, CONFIG.tables.supplierPayments, [
      { name: 'payment_id', type: 'INTEGER' },
      { name: 'tx_hash', type: 'STRING' },
      { name: 'block_timestamp', type: 'TIMESTAMP' },
      { name: 'claim_id', type: 'INTEGER' },
      { name: 'vendor_address', type: 'STRING' },
      { name: 'supplier_address', type: 'STRING' },
      { name: 'amount', type: 'NUMERIC' },
      { name: 'description', type: 'STRING' },
      { name: 'create_time', type: 'TIMESTAMP' }
    ]);
    
    // Sub-supplier payments table
    await createTableIfNotExists(dataset, CONFIG.tables.subSupplierPayments, [
      { name: 'subpayment_id', type: 'INTEGER' },
      { name: 'tx_hash', type: 'STRING' },
      { name: 'block_timestamp', type: 'TIMESTAMP' },
      { name: 'supplier_payment_id', type: 'INTEGER' },
      { name: 'supplier_address', type: 'STRING' },
      { name: 'subsupplier_address', type: 'STRING' },
      { name: 'amount', type: 'NUMERIC' },
      { name: 'description', type: 'STRING' },
      { name: 'create_time', type: 'TIMESTAMP' }
    ]);
    
    // Challenges table
    await createTableIfNotExists(dataset, CONFIG.tables.challenges, [
      { name: 'challenge_id', type: 'INTEGER' },
      { name: 'tx_hash', type: 'STRING' },
      { name: 'block_timestamp', type: 'TIMESTAMP' },
      { name: 'claim_id', type: 'INTEGER' },
      { name: 'challenger_address', type: 'STRING' },
      { name: 'reason', type: 'STRING' },
      { name: 'resolved', type: 'BOOLEAN' },
      { name: 'valid', type: 'BOOLEAN' },
      { name: 'create_time', type: 'TIMESTAMP' },
      { name: 'resolve_time', type: 'TIMESTAMP' }
    ]);
    
    // Transaction traces table
    await createTableIfNotExists(dataset, CONFIG.tables.transactionTraces, [
      { name: 'tx_hash', type: 'STRING' },
      { name: 'timestamp', type: 'TIMESTAMP' },
      { name: 'origin_address', type: 'STRING' },
      { name: 'total_value', type: 'NUMERIC' },
      { name: 'payment_chain', type: 'RECORD', mode: 'REPEATED', fields: [
        { name: 'address', type: 'STRING' },
        { name: 'value', type: 'NUMERIC' },
        { name: 'depth', type: 'INTEGER' },
        { name: 'method_id', type: 'STRING' }
      ]}
    ]);
    
    console.log("BigQuery setup completed successfully");
  } catch (error) {
    console.error("Error initializing BigQuery:", error);
    throw error;
  }
}

/**
 * Create a table if it doesn't exist
 * @param {Dataset} dataset - BigQuery dataset
 * @param {string} tableId - Table ID
 * @param {Array} schema - Table schema
 * @returns {Promise<void>}
 */
async function createTableIfNotExists(dataset, tableId, schema) {
  try {
    const [tables] = await dataset.getTables();
    const tableExists = tables.some(table => table.id === tableId);
    
    if (!tableExists) {
      await dataset.createTable(tableId, { schema });
      console.log(`Created table: ${tableId}`);
    } else {
      console.log(`Table ${tableId} already exists`);
    }
  } catch (error) {
    console.error(`Error creating table ${tableId}:`, error);
    throw error;
  }
}

/**
 * Insert claim data into BigQuery
 * @param {Object} claimData - Claim data to insert
 * @returns {Promise<void>}
 */
async function insertClaim(claimData) {
  try {
    const bigquery = createBigQueryClient();
    const dataset = bigquery.dataset(CONFIG.datasetId);
    const table = dataset.table(CONFIG.tables.claims);
    
    await table.insert([claimData]);
    console.log(`Claim inserted successfully: ${claimData.claim_id}`);
  } catch (error) {
    console.error("Error inserting claim:", error);
    throw error;
  }
}

/**
 * Insert supplier payment data into BigQuery
 * @param {Object} paymentData - Supplier payment data
 * @returns {Promise<void>}
 */
async function insertSupplierPayment(paymentData) {
  try {
    const bigquery = createBigQueryClient();
    const dataset = bigquery.dataset(CONFIG.datasetId);
    const table = dataset.table(CONFIG.tables.supplierPayments);
    
    await table.insert([paymentData]);
    console.log(`Supplier payment inserted successfully: ${paymentData.payment_id}`);
  } catch (error) {
    console.error("Error inserting supplier payment:", error);
    throw error;
  }
}

/**
 * Insert sub-supplier payment data into BigQuery
 * @param {Object} paymentData - Sub-supplier payment data
 * @returns {Promise<void>}
 */
async function insertSubSupplierPayment(paymentData) {
  try {
    const bigquery = createBigQueryClient();
    const dataset = bigquery.dataset(CONFIG.datasetId);
    const table = dataset.table(CONFIG.tables.subSupplierPayments);
    
    await table.insert([paymentData]);
    console.log(`Sub-supplier payment inserted successfully: ${paymentData.subpayment_id}`);
  } catch (error) {
    console.error("Error inserting sub-supplier payment:", error);
    throw error;
  }
}

/**
 * Insert challenge data into BigQuery
 * @param {Object} challengeData - Challenge data
 * @returns {Promise<void>}
 */
async function insertChallenge(challengeData) {
  try {
    const bigquery = createBigQueryClient();
    const dataset = bigquery.dataset(CONFIG.datasetId);
    const table = dataset.table(CONFIG.tables.challenges);
    
    await table.insert([challengeData]);
    console.log(`Challenge inserted successfully: ${challengeData.challenge_id}`);
  } catch (error) {
    console.error("Error inserting challenge:", error);
    throw error;
  }
}

/**
 * Find departments with high anomaly scores
 * @returns {Promise<Array>} Results of the query
 */
async function findSuspiciousDepartments() {
  try {
    const bigquery = createBigQueryClient();
    
    const query = `
      SELECT
        department_address,
        COUNT(*) as total_claims,
        AVG(anomaly_score) as avg_anomaly_score,
        SUM(amount) as total_amount
      FROM
        \`${CONFIG.projectId}.${CONFIG.datasetId}.${CONFIG.tables.claims}\`
      GROUP BY
        department_address
      HAVING
        AVG(anomaly_score) > 50
      ORDER BY
        avg_anomaly_score DESC
    `;
    
    const [rows] = await bigquery.query(query);
    return rows;
  } catch (error) {
    console.error("Error querying suspicious departments:", error);
    throw error;
  }
}

/**
 * Track payment chain completeness
 * @returns {Promise<Array>} Results of the query
 */
async function trackPaymentChainCompleteness() {
  try {
    const bigquery = createBigQueryClient();
    
    const query = `
      SELECT
        c.claim_id,
        c.amount as claim_amount,
        SUM(IFNULL(sp.amount, 0)) as supplier_payments,
        SUM(IFNULL(ssp.amount, 0)) as subsupplier_payments,
        c.amount - SUM(IFNULL(sp.amount, 0)) as vendor_kept,
        CASE
          WHEN SUM(IFNULL(sp.amount, 0)) < 0.7 * c.amount THEN 'High Vendor Retention'
          ELSE 'Normal Flow'
        END as flow_classification
      FROM
        \`${CONFIG.projectId}.${CONFIG.datasetId}.${CONFIG.tables.claims}\` c
      LEFT JOIN
        \`${CONFIG.projectId}.${CONFIG.datasetId}.${CONFIG.tables.supplierPayments}\` sp
        ON c.claim_id = sp.claim_id
      LEFT JOIN
        \`${CONFIG.projectId}.${CONFIG.datasetId}.${CONFIG.tables.subSupplierPayments}\` ssp
        ON sp.payment_id = ssp.supplier_payment_id
      GROUP BY
        c.claim_id, c.amount
      ORDER BY
        vendor_kept DESC
    `;
    
    const [rows] = await bigquery.query(query);
    return rows;
  } catch (error) {
    console.error("Error tracking payment chain completeness:", error);
    throw error;
  }
}

/**
 * Trace a complete payment chain
 * @param {string} governmentAddress - Starting address (government)
 * @param {number} daysBack - Number of days to look back
 * @returns {Promise<Array>} Results of the query
 */
async function tracePaymentChain(governmentAddress, daysBack = 30) {
  try {
    const bigquery = createBigQueryClient();
    
    const query = `
      SELECT 
        t1.tx_hash as gov_payment_tx,
        t1.to_address as vendor,
        t2.tx_hash as vendor_payment_tx,
        t2.to_address as supplier,
        t3.tx_hash as supplier_payment_tx,
        t3.to_address as subsupplier
      FROM 
        \`${CONFIG.projectId}.blockchain_data.transaction_traces\` t1
      JOIN 
        \`${CONFIG.projectId}.blockchain_data.transaction_traces\` t2
        ON t1.to_address = t2.from_address
      JOIN 
        \`${CONFIG.projectId}.blockchain_data.transaction_traces\` t3
        ON t2.to_address = t3.from_address
      WHERE
        t1.from_address = '${governmentAddress}'
        AND t1.timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${daysBack} DAY)
      ORDER BY
        t1.timestamp DESC
    `;
    
    const [rows] = await bigquery.query(query);
    return rows;
  } catch (error) {
    console.error("Error tracing payment chain:", error);
    throw error;
  }
}

/**
 * Detect anomalous payment patterns
 * @param {string} governmentAddress - Government address
 * @returns {Promise<Array>} Results of the query
 */
async function detectAnomalousPaymentPatterns(governmentAddress) {
  try {
    const bigquery = createBigQueryClient();
    
    const query = `
      SELECT
        vendor,
        COUNT(DISTINCT supplier) as supplier_count,
        COUNT(DISTINCT subsupplier) as subsupplier_count,
        AVG(TIME_DIFF(vendor_payment_time, gov_payment_time, SECOND)) as avg_payment_delay_seconds
      FROM (
        SELECT 
          t1.to_address as vendor,
          t2.to_address as supplier,
          t3.to_address as subsupplier,
          t1.timestamp as gov_payment_time,
          t2.timestamp as vendor_payment_time
        FROM 
          \`${CONFIG.projectId}.blockchain_data.transaction_traces\` t1
        JOIN 
          \`${CONFIG.projectId}.blockchain_data.transaction_traces\` t2
          ON t1.to_address = t2.from_address
        JOIN 
          \`${CONFIG.projectId}.blockchain_data.transaction_traces\` t3
          ON t2.to_address = t3.from_address
        WHERE
          t1.from_address = '${governmentAddress}'
      )
      GROUP BY
        vendor
      HAVING
        avg_payment_delay_seconds < 60  -- Suspicious if payment forwarded in less than 60 seconds
    `;
    
    const [rows] = await bigquery.query(query);
    return rows;
  } catch (error) {
    console.error("Error detecting anomalous payment patterns:", error);
    throw error;
  }
}

module.exports = {
  createBigQueryClient,
  initializeBigQuery,
  insertClaim,
  insertSupplierPayment,
  insertSubSupplierPayment,
  insertChallenge,
  findSuspiciousDepartments,
  trackPaymentChainCompleteness,
  tracePaymentChain,
  detectAnomalousPaymentPatterns
};
