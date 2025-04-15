# TransparencyX Cloud Integration

This repository contains the cloud integrations for the TransparencyX project, specifically the Google Cloud Platform services that power our blockchain analytics capabilities for tracking government procurement funds.

## Directory Structure

- **blockchain_rpc/** - Google Cloud Blockchain RPC integration for transaction tracing
- **bigquery/** - BigQuery integration for storing and analyzing blockchain data
- **images/** - Diagrams and screenshots for documentation

## GCP Blockchain RPC Integration

TransparencyX leverages Google Cloud Platform's Blockchain RPC service to perform advanced transaction tracing and analysis on the Ethereum Sepolia network. This integration enables deep visibility into the payment chain from government to sub-suppliers.

### Features Enabled by GCP Blockchain RPC

#### 1. Transaction Tracing
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

#### 2. Block-Level Analysis
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

#### 3. Internal Transaction Monitoring
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

### Setup Instructions

#### 1. Create a GCP Project
```bash
gcloud projects create transparency-x --name="TransparencyX"
gcloud config set project transparency-x
```

#### 2. Enable Required APIs
```bash
gcloud services enable blockchainrpc.googleapis.com
gcloud services enable bigquery.googleapis.com
```

#### 3. Create Service Account
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

#### 4. Download Credentials
```bash
gcloud iam service-accounts keys create blockchain-rpc-key.json \
  --iam-account=blockchain-rpc-sa@transparency-x.iam.gserviceaccount.com
```

## BigQuery Integration

Our BigQuery integration allows us to store, analyze, and derive insights from blockchain transaction data. The integration supports advanced analytics for fraud detection.

### Schema Overview

The BigQuery integration uses the following tables to track procurement data and detect fraudulent patterns:

#### Claims Table - Tracks all procurement claims
| Field | Type | Description |
|-------|------|-------------|
| claim_id | INT64 | Unique identifier for the claim |
| tx_hash | STRING | Transaction hash for the claim submission |
| block_timestamp | TIMESTAMP | When the claim was recorded on-chain |
| vendor_address | STRING | Ethereum address of the vendor |
| department_address | STRING | Ethereum address of the department |
| amount | NUMERIC | Claim amount in PYUSD |
| description | STRING | Claim details |
| ipfs_hash | STRING | IPFS hash of the invoice |
| status | STRING | Claim status (Pending, Approved, Rejected, Flagged) |
| ai_approved | BOOLEAN | Whether AI approved the claim |
| anomaly_score | NUMERIC | AI-generated fraud risk score |
| create_time | TIMESTAMP | When the claim was submitted |

#### Supplier Payments Table - Records payments from vendors to suppliers
| Field | Type | Description |
|-------|------|-------------|
| payment_id | INT64 | Unique identifier for the payment |
| tx_hash | STRING | Transaction hash for the payment |
| block_timestamp | TIMESTAMP | When the payment was recorded |
| claim_id | INT64 | Associated claim ID |
| vendor_address | STRING | Vendor's Ethereum address |
| supplier_address | STRING | Supplier's Ethereum address |
| amount | NUMERIC | Payment amount in PYUSD |
| description | STRING | Payment details |
| create_time | TIMESTAMP | When the payment was made |

#### Sub-supplier Payments Table - Tracks payments from suppliers to sub-suppliers
| Field | Type | Description |
|-------|------|-------------|
| sub_payment_id | INT64 | Unique identifier for the sub-supplier payment |
| tx_hash | STRING | Transaction hash for the payment |
| block_timestamp | TIMESTAMP | When the payment was recorded |
| payment_id | INT64 | Associated supplier payment ID |
| supplier_address | STRING | Supplier's Ethereum address |
| subsupplier_address | STRING | Sub-supplier's Ethereum address |
| amount | NUMERIC | Payment amount in PYUSD |
| description | STRING | Payment details |
| create_time | TIMESTAMP | When the payment was made |

#### Challenges Table - Tracks public challenges to suspicious claims
| Field | Type | Description |
|-------|------|-------------|
| challenge_id | INT64 | Unique identifier for the challenge |
| tx_hash | STRING | Transaction hash for the challenge submission |
| block_timestamp | TIMESTAMP | When the challenge was recorded |
| claim_id | INT64 | Associated claim ID |
| challenger_address | STRING | Ethereum address of the challenger |
| reason | STRING | Stated reason for the challenge |
| resolved | BOOLEAN | Whether the challenge has been resolved |
| valid | BOOLEAN | Whether the challenge was valid |
| create_time | TIMESTAMP | When the challenge was submitted |
| resolve_time | TIMESTAMP | When the challenge was resolved (if applicable) |

#### Transaction Traces Table - Stores detailed blockchain transaction traces
| Field | Type | Description |
|-------|------|-------------|
| tx_hash | STRING | Transaction hash |
| from_address | STRING | Sender's Ethereum address |
| to_address | STRING | Recipient's Ethereum address |
| value | STRING | Amount transferred (in wei) |
| input | STRING | Transaction input data |
| type | STRING | Type of trace (e.g., transaction_trace) |
| timestamp | TIMESTAMP | When the trace was recorded |
| trace_data | STRING | JSON string of the full trace |

### Setup Instructions

#### 1. Create BigQuery Dataset
Create a dataset to store procurement data:
```bash
bq mk --dataset transparency-x:procurement
```

#### 2. Create Tables
Tables are created programmatically via the Node.js client to ensure schema consistency. Example setup:

```javascript
const { BigQuery } = require('@google-cloud/bigquery');

const bigquery = new BigQuery({
  projectId: 'transparency-x',
  keyFilename: './blockchain-rpc-key.json'
});

const createTables = async () => {
  const dataset = bigquery.dataset('procurement');
  
  // Claims Table
  await dataset.createTable('claims', {
    schema: [
      { name: 'claim_id', type: 'INT64' },
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
    ]
  });

  // Supplier Payments Table
  await dataset.createTable('supplier_payments', {
    schema: [
      { name: 'payment_id', type: 'INT64' },
      { name: 'tx_hash', type: 'STRING' },
      { name: 'block_timestamp', type: 'TIMESTAMP' },
      { name: 'claim_id', type: 'INT64' },
      { name: 'vendor_address', type: 'STRING' },
      { name: 'supplier_address', type: 'STRING' },
      { name: 'amount', type: 'NUMERIC' },
      { name: 'description', type: 'STRING' },
      { name: 'create_time', type: 'TIMESTAMP' }
    ]
  });

  // Sub-supplier Payments Table
  await dataset.createTable('subsupplier_payments', {
    schema: [
      { name: 'sub_payment_id', type: 'INT64' },
      { name: 'tx_hash', type: 'STRING' },
      { name: 'block_timestamp', type: 'TIMESTAMP' },
      { name: 'payment_id', type: 'INT64' },
      { name: 'supplier_address', type: 'STRING' },
      { name: 'subsupplier_address', type: 'STRING' },
      { name: 'amount', type: 'NUMERIC' },
      { name: 'description', type: 'STRING' },
      { name: 'create_time', type: 'TIMESTAMP' }
    ]
  });

  // Challenges Table
  await dataset.createTable('challenges', {
    schema: [
      { name: 'challenge_id', type: 'INT64' },
      { name: 'tx_hash', type: 'STRING' },
      { name: 'block_timestamp', type: 'TIMESTAMP' },
      { name: 'claim_id', type: 'INT64' },
      { name: 'challenger_address', type: 'STRING' },
      { name: 'reason', type: 'STRING' },
      { name: 'resolved', type: 'BOOLEAN' },
      { name: 'valid', type: 'BOOLEAN' },
      { name: 'create_time', type: 'TIMESTAMP' },
      { name: 'resolve_time', type: 'TIMESTAMP' }
    ]
  });

  // Transaction Traces Table
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

  console.log('BigQuery tables created successfully');
};
```

#### 3. Store Transaction Data
Integrate with Blockchain RPC to store traces:

```javascript
const storeTransactionTrace = async (txHash, trace) => {
  const dataset = bigquery.dataset('procurement');
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

#### 4. Secure Credentials

- Store blockchain-rpc-key.json securely, not in version control.
- Add to .gitignore: `blockchain-rpc-key.json`

## Example Queries for Fraud Detection

BigQuery enables advanced analytics to identify suspicious patterns in procurement data.

### 1. High Anomaly Score Claims
Identify claims with high AI-generated fraud risk:

```sql
SELECT
  claim_id,
  vendor_address,
  amount,
  anomaly_score,
  description
FROM
  `transparency-x.procurement.claims`
WHERE
  anomaly_score > 50
ORDER BY
  anomaly_score DESC
LIMIT 10;
```

### 2. Vendor Retention Analysis
Detect vendors retaining excessive funds (less than 70% paid to suppliers):

```sql
SELECT
  c.claim_id,
  c.vendor_address,
  c.amount AS claim_amount,
  COALESCE(SUM(sp.amount), 0) AS supplier_payments,
  (c.amount - COALESCE(SUM(sp.amount), 0)) / c.amount AS retention_rate
FROM
  `transparency-x.procurement.claims` c
LEFT JOIN
  `transparency-x.procurement.supplier_payments` sp
  ON c.claim_id = sp.claim_id
GROUP BY
  c.claim_id, c.vendor_address, c.amount
HAVING
  retention_rate > 0.3
ORDER BY
  retention_rate DESC;
```

### 3. Suspicious Payment Timing
Flag rapid payments (less than 60 seconds between claim and supplier payment):

```sql
SELECT
  c.claim_id,
  c.vendor_address,
  sp.supplier_address,
  TIMESTAMP_DIFF(sp.create_time, c.create_time, SECOND) AS payment_delay_seconds
FROM
  `transparency-x.procurement.claims` c
JOIN
  `transparency-x.procurement.supplier_payments` sp
  ON c.claim_id = sp.claim_id
WHERE
  TIMESTAMP_DIFF(sp.create_time, c.create_time, SECOND) < 60
ORDER BY
  payment_delay_seconds;
```

### 4. Challenge Success Rate
Analyze the effectiveness of public challenges:

```sql
SELECT
  COUNT(*) AS total_challenges,
  SUM(CASE WHEN valid THEN 1 ELSE 0 END) AS valid_challenges,
  SAFE_DIVIDE(SUM(CASE WHEN valid THEN 1 ELSE 0 END), COUNT(*)) * 100 AS success_rate
FROM
  `transparency-x.procurement.challenges`
WHERE
  resolved = TRUE;
```

### 5. Payment Chain Completeness
Verify funds flow from vendors to sub-suppliers:

```sql
SELECT
  c.claim_id,
  c.amount AS claim_amount,
  COALESCE(SUM(sp.amount), 0) AS supplier_payments,
  COALESCE(SUM(ssp.amount), 0) AS subsupplier_payments,
  CASE
    WHEN COALESCE(SUM(ssp.amount), 0) < 0.5 * c.amount THEN 'Incomplete Chain'
    ELSE 'Complete Chain'
  END AS chain_status
FROM
  `transparency-x.procurement.claims` c
LEFT JOIN
  `transparency-x.procurement.supplier_payments` sp
  ON c.claim_id = sp.claim_id
LEFT JOIN
  `transparency-x.procurement.subsupplier_payments` ssp
  ON sp.payment_id = ssp.payment_id
GROUP BY
  c.claim_id, c.amount
ORDER BY
  claim_amount DESC;
```
