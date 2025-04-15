# TransparencyX Cloud Integration

This directory contains the cloud integrations for the TransparencyX project, specifically the Google Cloud Platform services that power our blockchain analytics capabilities.

## Directory Structure

- `blockchain_rpc/` - Google Cloud Blockchain RPC integration for transaction tracing
- `bigquery/` - BigQuery integration for storing and analyzing blockchain data
- `images/` - Diagrams and screenshots for documentation

## GCP Blockchain RPC Integration

TransparencyX leverages Google Cloud Platform's Blockchain RPC service to perform advanced transaction tracing and analysis on the Ethereum Sepolia network. This integration enables deep visibility into the payment chain from government to sub-suppliers.

![Transaction Tracing Architecture](images/transaction_tracing.png)

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

![BigQuery Analytics Flow](images/bigquery_analytics.png)

### Schema Overview

The BigQuery integration uses the following tables:

1. **Claims Table** - Tracks all procurement claims
2. **Supplier Payments Table** - Records payments from vendors to suppliers
3. **Sub-supplier Payments Table** - Tracks payments from suppliers to sub-suppliers
4. **Challenges Table
