# GCP Blockchain RPC Integration

TransparencyX leverages Google Cloud Platform's Blockchain RPC service to perform advanced transaction tracing and analysis on the Ethereum Sepolia network. This document explains how we use these capabilities and how to set up the integration.

## Features Enabled by GCP Blockchain RPC

### 1. Transaction Tracing

We use the `debug_traceTransaction` method to follow PYUSD payments through the entire payment chain:

```javascript
const traceTransaction = async (txHash) => {
  const trace = await rpcProvider.send("debug_traceTransaction", [
    txHash,
    {
      tracer: "callTracer",
      tracerConfig: {
        onlyTopCall: false,
        withLog: true
      }
    }
  ]);
  
  return trace;
};
```

This allows us to:
- Track funds from government to vendor
- Follow vendor payments to suppliers
- Monitor supplier payments to sub-suppliers
- Detect any unauthorized fund diversions

### 2. Block-Level Analysis

We use `trace_block` to monitor all PYUSD transactions within each block:

```javascript
const traceBlock = async (blockNumber) => {
  const blockHex = "0x" + blockNumber.toString(16);
  const traces = await rpcProvider.send("trace_block", [blockHex]);
  
  // Filter for PYUSD transactions
  const pyusdTraces = traces.filter(trace => 
    trace.action.to.toLowerCase() === PYUSD_CONTRACT_ADDRESS.toLowerCase()
  );
  
  return pyusdTraces;
};
```

This enables:
- Real-time monitoring of all PYUSD flows
- Automatic detection of unusual transaction patterns
- Comprehensive transaction history for auditing

### 3. Internal Transaction Monitoring

We track internal contract calls using `trace_transaction`:

```javascript
const getInternalTransactions = async (txHash) => {
  const traces = await rpcProvider.send("trace_transaction", [txHash]);
  
  return traces.filter(trace => 
    trace.action.value !== "0x0" || 
    (trace.action.input && trace.action.input !== "0x")
  );
};
```

This provides:
- Visibility into complex contract interactions
- Detection of potential exploits or manipulations
- Verification of proper contract execution

## Setup Instructions

### 1. Create a GCP Project

```bash
gcloud projects create transparency-x --name="TransparencyX"
gcloud config set project transparency-x
```

### 2. Enable Required APIs

```bash
gcloud services enable blockchainrpc.googleapis.com
gcloud services enable bigquery.googleapis.com
```

### 3. Create Service Account

```bash
gcloud iam service-accounts create blockchain-rpc-sa \
  --display-name="Blockchain RPC Service Account"

gcloud projects add-iam-policy-binding transparency-x \
  --member="serviceAccount:blockchain-rpc-sa@transparency-x.iam.gserviceaccount.com" \
  --role="roles/blockchainrpc.user"

gcloud projects add-iam-policy-binding transparency-x \
  --member="serviceAccount:blockchain-rpc-sa@transparency-x.iam.gserviceaccount.com" \
  --role="roles/bigquery.dataEditor"
```

### 4. Download Credentials

```bash
gcloud iam service-accounts keys create blockchain-rpc-key.json \
  --iam-account=blockchain-rpc-sa@transparency-x.iam.gserviceaccount.com
```

### 5. Configure Node.js Client

```javascript
const { ethers } = require("ethers");
const { GoogleAuth } = require('google-auth-library');

// Load service account credentials
const keyFile = require('./blockchain-rpc-key.json');
const auth = new GoogleAuth({
  credentials: keyFile,
  scopes: ['https://www.googleapis.com/auth/cloud-platform']
});

// Create custom provider with GCP RPC
const GCPProvider = async () => {
  const client = await auth.getClient();
  const projectId = 'transparency-x';

  // Get GCP access token
  const accessToken = await client.getAccessToken();
  
  // Create Ethereum provider with GCP RPC
  const provider = new ethers.providers.JsonRpcProvider({
    url: `https://blockchainrpc.googleapis.com/v1/projects/${projectId}/ethSepolia:getByFilter`,
    headers: {
      Authorization: `Bearer ${accessToken.token}`
    }
  });
  
  return provider;
};

module.exports = { GCPProvider };
```

### 6. Setup BigQuery Integration

```javascript
const { BigQuery } = require('@google-cloud/bigquery');

const bigquery = new BigQuery({
  projectId: 'transparency-x',
  keyFilename: './blockchain-rpc-key.json'
});

const storeTransactionTrace = async (txHash, trace) => {
  // Create dataset if it doesn't exist
  const [datasets] = await bigquery.getDatasets();
  const datasetExists = datasets.some(dataset => dataset.id === 'blockchain_data');
  
  if (!datasetExists) {
    await bigquery.createDataset('blockchain_data');
  }
  
  // Create table if it doesn't exist
  const dataset = bigquery.dataset('blockchain_data');
  const [tables] = await dataset.getTables();
  const tableExists = tables.some(table => table.id === 'transaction_traces');
  
  if (!tableExists) {
    await dataset.createTable('transaction_traces', {
      schema: [
        { name: 'tx_hash', type: 'STRING' },
        { name: 'from_address', type: 'STRING' },
        { name: 'to_address', type: 'STRING' },
        { name: 'value', type: 'STRING' },
        { name: 'input', type: 'STRING' },
        { name: 'type', type: 'STRING' },
        { name: 'timestamp', type: 'TIMESTAMP' },
        { name: 'trace_data', type: 'STRING' }
      ]
    });
  }
  
  // Insert trace data
  const table = dataset.table('transaction_traces');
  await table.insert({
    tx_hash: txHash,
    from_address: trace.from || '',
    to_address: trace.to || '',
    value: trace.value || '0x0',
    input: trace.input || '',
    type: 'transaction_trace',
    timestamp: new Date(),
    trace_data: JSON.stringify(trace)
  });
};
```

## Testnet Limitations and Mainnet Possibilities

While our implementation on the Sepolia testnet demonstrates the core functionality, there are some limitations compared to what would be possible on mainnet:

### Current Limitations on Sepolia

- **Transaction Volume**: Lower transaction volumes make pattern detection less reliable
- **Historical Data**: Limited historical data for long-term trend analysis
- **Network Support**: Some advanced tracing methods have limited support on testnets
- **Performance**: Testnet nodes may have slower response times for trace methods

### Enhanced Capabilities on Mainnet

With a mainnet deployment, TransparencyX would gain:

- **Comprehensive Historical Analysis**: Years of transaction data for stronger pattern recognition
- **Higher Transaction Volume**: Better statistical models for anomaly detection
- **Enhanced Performance**: Faster response times for real-time monitoring
- **Full Method Support**: Access to all tracing methods with robust node infrastructure
- **Integration with Real Financial Systems**: Direct connections to banking and payment systems

## Query Examples

### 1. Tracking Payment Chain

```sql
SELECT 
  t1.tx_hash as gov_payment_tx,
  t1.to_address as vendor,
  t2.tx_hash as vendor_payment_tx,
  t2.to_address as supplier,
  t3.tx_hash as supplier_payment_tx,
  t3.to_address as subsupplier
FROM 
  `transparency-x.blockchain_data.transaction_traces` t1
JOIN 
  `transparency-x.blockchain_data.transaction_traces` t2
  ON t1.to_address = t2.from_address
JOIN 
  `transparency-x.blockchain_data.transaction_traces` t3
  ON t2.to_address = t3.from_address
WHERE
  t1.from_address = '[GOVERNMENT_ADDRESS]'
  AND t1.timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
ORDER BY
  t1.timestamp DESC
```

### 2. Detecting Anomalous Payment Patterns

```sql
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
    `transparency-x.blockchain_data.transaction_traces` t1
  JOIN 
    `transparency-x.blockchain_data.transaction_traces` t2
    ON t1.to_address = t2.from_address
  JOIN 
    `transparency-x.blockchain_data.transaction_traces` t3
    ON t2.to_address = t3.from_address
  WHERE
    t1.from_address = '[GOVERNMENT_ADDRESS]'
)
GROUP BY
  vendor
HAVING
  avg_payment_delay_seconds < 60  -- Suspicious if payment forwarded in less than 60 seconds
```
