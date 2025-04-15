
/**
 * TransparencyX - GCP Blockchain RPC Integration
 * 
 * This module provides functionality to connect to Google Cloud Platform's 
 * Blockchain RPC service for advanced transaction tracing on Ethereum Sepolia.
 */

const { ethers } = require("ethers");
const { GoogleAuth } = require('google-auth-library');
const { BigQuery } = require('@google-cloud/bigquery');
require('dotenv').config();

// Configuration
const CONFIG = {
  projectId: process.env.GCP_PROJECT_ID || 'transparency-x',
  networkName: 'ethSepolia',
  pyusdContractAddress: process.env.PYUSD_CONTRACT_ADDRESS,
  datasetId: 'blockchain_data',
  traceTableId: 'transaction_traces'
};

/**
 * Creates an Ethereum provider that uses GCP's Blockchain RPC service
 * @returns {Promise<ethers.providers.JsonRpcProvider>} Configured provider
 */
async function createGCPProvider() {
  try {
    // Use application default credentials or the specified key file
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    // Get GCP access token
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    
    // Create Ethereum provider with GCP RPC
    const provider = new ethers.providers.JsonRpcProvider({
      url: `https://blockchainrpc.googleapis.com/v1/projects/${CONFIG.projectId}/${CONFIG.networkName}:getByFilter`,
      headers: {
        Authorization: `Bearer ${accessToken.token}`
      }
    });
    
    console.log("GCP Blockchain RPC provider created successfully");
    return provider;
  } catch (error) {
    console.error("Failed to create GCP Blockchain RPC provider:", error);
    throw error;
  }
}

/**
 * Traces a transaction using debug_traceTransaction RPC method
 * @param {string} txHash - Transaction hash to trace
 * @param {ethers.providers.JsonRpcProvider} provider - RPC provider
 * @returns {Promise<Object>} Transaction trace data
 */
async function traceTransaction(txHash, provider) {
  try {
    console.log(`Tracing transaction: ${txHash}`);
    const trace = await provider.send("debug_traceTransaction", [
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
  } catch (error) {
    console.error(`Error tracing transaction ${txHash}:`, error);
    throw error;
  }
}

/**
 * Traces all transactions in a block
 * @param {number} blockNumber - Block number to trace
 * @param {ethers.providers.JsonRpcProvider} provider - RPC provider
 * @returns {Promise<Array>} Array of transaction traces
 */
async function traceBlock(blockNumber, provider) {
  try {
    console.log(`Tracing block: ${blockNumber}`);
    const blockHex = "0x" + blockNumber.toString(16);
    const traces = await provider.send("trace_block", [blockHex]);
    
    // Filter for PYUSD transactions if contract address is provided
    if (CONFIG.pyusdContractAddress) {
      return traces.filter(trace => 
        trace.action.to && trace.action.to.toLowerCase() === CONFIG.pyusdContractAddress.toLowerCase()
      );
    }
    
    return traces;
  } catch (error) {
    console.error(`Error tracing block ${blockNumber}:`, error);
    throw error;
  }
}

/**
 * Get internal transactions for a transaction hash
 * @param {string} txHash - Transaction hash
 * @param {ethers.providers.JsonRpcProvider} provider - RPC provider
 * @returns {Promise<Array>} Array of internal transactions
 */
async function getInternalTransactions(txHash, provider) {
  try {
    console.log(`Getting internal transactions for: ${txHash}`);
    const traces = await provider.send("trace_transaction", [txHash]);
    
    // Filter for value transfers or contract calls
    return traces.filter(trace => 
      trace.action.value !== "0x0" || 
      (trace.action.input && trace.action.input !== "0x")
    );
  } catch (error) {
    console.error(`Error getting internal transactions for ${txHash}:`, error);
    throw error;
  }
}

/**
 * Trace a complete payment chain from government to all sub-suppliers
 * @param {string} txHash - Initial transaction hash
 * @param {ethers.providers.JsonRpcProvider} provider - RPC provider
 * @returns {Promise<Object>} Complete payment flow data
 */
async function tracePaymentChain(txHash, provider) {
  try {
    // Get the transaction trace with full call data
    const trace = await traceTransaction(txHash, provider);
    
    // Extract the complete payment flow data
    const paymentFlow = {
      txHash: txHash,
      origin: trace.from,
      timestamp: new Date().toISOString(),
      value: trace.value,
      participants: []
    };
    
    // Process all internal calls recursively
    function processInternalCalls(call, depth = 0) {
      if (call.type === "CALL" && call.value && call.value !== "0x0") {
        paymentFlow.participants.push({
          address: call.to,
          value: call.value,
          depth: depth,
          methodId: call.input && call.input.substring(0, 10) || "0x"
        });
      }
      
      // Process recursive calls
      if (call.calls && call.calls.length > 0) {
        call.calls.forEach(subcall => processInternalCalls(subcall, depth + 1));
      }
    }
    
    // Process the trace data
    processInternalCalls(trace);
    
    // Upload the complete payment flow to BigQuery
    await uploadPaymentFlowToBigQuery(paymentFlow);
    
    return paymentFlow;
  } catch (error) {
    console.error(`Error tracing payment chain for ${txHash}:`, error);
    throw error;
  }
}

/**
 * Upload payment flow data to BigQuery for analysis
 * @param {Object} paymentData - Payment flow data
 * @returns {Promise<void>}
 */
async function uploadPaymentFlowToBigQuery(paymentData) {
  try {
    console.log(`Uploading payment flow data to BigQuery: ${paymentData.txHash}`);
    
    // Create a BigQuery client
    const bigquery = new BigQuery({
      projectId: CONFIG.projectId
    });
    
    // Format data for BigQuery
    const row = {
      txHash: paymentData.txHash,
      timestamp: paymentData.timestamp,
      originAddress: paymentData.origin,
      totalValue: paymentData.value,
      paymentChain: paymentData.participants.map(p => ({
        address: p.address,
        value: p.value,
        depth: p.depth,
        methodId: p.methodId
      }))
    };
    
    // Insert the data
    await bigquery
      .dataset(CONFIG.datasetId)
      .table(CONFIG.traceTableId)
      .insert([row]);
      
    console.log(`Payment flow data uploaded successfully for: ${paymentData.txHash}`);
  } catch (error) {
    console.error("Error uploading to BigQuery:", error);
    throw error;
  }
}

/**
 * Store full transaction trace in BigQuery
 * @param {string} txHash - Transaction hash
 * @param {Object} trace - Trace data
 * @returns {Promise<void>}
 */
async function storeTransactionTrace(txHash, trace) {
  try {
    console.log(`Storing transaction trace in BigQuery: ${txHash}`);
    
    // Create a BigQuery client
    const bigquery = new BigQuery({
      projectId: CONFIG.projectId
    });
    
    // Create dataset if it doesn't exist
    const [datasets] = await bigquery.getDatasets();
    const datasetExists = datasets.some(dataset => dataset.id === CONFIG.datasetId);
    
    if (!datasetExists) {
      await bigquery.createDataset(CONFIG.datasetId);
      console.log(`Created dataset: ${CONFIG.datasetId}`);
    }
    
    // Create table if it doesn't exist
    const dataset = bigquery.dataset(CONFIG.datasetId);
    const [tables] = await dataset.getTables();
    const tableExists = tables.some(table => table.id === CONFIG.traceTableId);
    
    if (!tableExists) {
      await dataset.createTable(CONFIG.traceTableId, {
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
      console.log(`Created table: ${CONFIG.traceTableId}`);
    }
    
    // Insert trace data
    const table = dataset.table(CONFIG.traceTableId);
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
    
    console.log(`Transaction trace stored successfully for: ${txHash}`);
  } catch (error) {
    console.error("Error storing transaction trace:", error);
    throw error;
  }
}

module.exports = {
  createGCPProvider,
  traceTransaction,
  traceBlock,
  getInternalTransactions,
  tracePaymentChain,
  storeTransactionTrace,
  uploadPaymentFlowToBigQuery
};
