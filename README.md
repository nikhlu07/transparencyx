# TransparencyX: Corruption-Proof Government Procurement with PYUSD

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 Vision: Ending Procurement Corruption Through Blockchain Transparency

**TransparencyX** is a decentralized, AI-enhanced government procurement system built on the Ethereum Sepolia testnet using PYUSD stablecoin. Our mission is to combat public sector corruption through immutable financial transparency, automated fraud detection, and public accountability mechanisms.

![Corruption Stats](demo/images/corruption.png)

### The Problem We're Solving

Corruption in government procurement is a global crisis:

- **$9.5 trillion** lost annually to corruption in developing countries (World Economic Forum)
- Only **14%** of major corruption cases lead to recovery of stolen assets (UN)
- Over **120 journalists** have been killed exposing corruption cases in the last decade

In 2018, Indian journalist Gauri Lankesh was assassinated after investigating a major procurement scandal. Her death inspired this project—creating a system where such investigations would be unnecessary because all transactions would be transparent by design.

## 🔍 System Architecture

TransparencyX provides end-to-end transparency for government procurement:

![System Workflow](demo/images/workflow.png)

1. **Budget Allocation**: Government funds are locked in PYUSD and allocated transparently to departments
2. **Vendor Selection**: All vendor selections are recorded immutably on the blockchain
3. **AI-Verified Claims**: Document AI extracts invoice details and machine learning detects anomalies
4. **Payment Chain Tracking**: All payments to vendors, suppliers, and sub-suppliers are tracked
5. **Public Oversight**: Citizens can challenge suspicious claims by staking PYUSD

## ⚙️ Core Components

### 1. Role-Based Access Control

TransparencyX implements strict role separation to prevent fraud:

![RBAC System](demo/images/rbac.png)

- **Main Government**: Locks budget and approves major transactions
- **State Heads**: Allocate budgets to specific projects
- **Deputies**: Select vendors for projects
- **Vendors**: Submit claims with IPFS-stored invoices
- **Suppliers & Sub-suppliers**: Receive payments in traceable chain
- **Public**: Challenge suspicious claims with PYUSD stakes

### 2. GCP Blockchain RPC Integration (Key Innovation)

Our system leverages Google Cloud Platform's Blockchain RPC service to provide powerful transaction tracing capabilities that would be cost-prohibitive with other providers:

![AI System](demo/images/AI.png)

- **Transaction Tracing**: Using `debug_traceTransaction` to follow PYUSD payment flows through the entire supplier chain
- **Fraud Detection**: Real-time monitoring of transaction patterns that might indicate corruption
- **Event Monitoring**: Capturing all contract events for analytical purposes
- **BigQuery Integration**: All blockchain events are stored in BigQuery for advanced analytics

The GCP Blockchain RPC service is the cornerstone of our solution, providing:

```javascript
// Example of tracing a PYUSD transaction through the supplier chain
async function tracePaymentChain(txHash) {
  const trace = await provider.send("debug_traceTransaction", [txHash, {
    tracer: "callTracer",
    tracerConfig: { onlyTopCall: false }
  }]);
  
  // Extract payment flow data for BigQuery
  const paymentFlow = extractPaymentData(trace);
  await uploadToBigQuery(paymentFlow);
  
  return trace;
}
```

This computationally expensive tracing would typically cost significant gas fees, but GCP's service makes it feasible for government-scale applications.

### 3. AI-Enhanced Verification

Our system uses advanced AI to verify claims:

- **Document AI**: Extracts key information from invoices and procurement documents
- **Anomaly Detection**: Machine learning models identify suspicious patterns in claims
- **IPFS Document Storage**: All documents are stored with immutable IPFS hashes like `QmNzWNidRjhUNbkeXmEzfk2ctuqqdqcAkMTHJzDXYS2tDE`

### 4. BigQuery Data Warehouse

We capture all blockchain transactions in BigQuery for:

- **Transaction Analysis**: Complex queries across the entire procurement chain
- **Visual Dashboards**: Real-time monitoring of government spending
- **Trend Analysis**: Identifying patterns that might indicate corruption

## 🛠️ Technical Implementation

### Smart Contracts

TransparencyX is built on two main smart contracts deployed on the Sepolia testnet:

1. **ClearGov.sol**: Our core governance contract that manages:
   - Role-based permissions
   - Budget allocation and tracking
   - Claim submission, verification, and payment
   - Supplier/sub-supplier payment chains
   - Public challenge mechanism

2. **PYUSD Integration**: Direct integration with the PYUSD stablecoin for all financial transactions

### Sample Code: Claim Verification Flow

```solidity
// Submit claim with IPFS document hash
function submitClaim(
    uint256 amount,
    string memory description,
    string memory ipfsHash
) public onlyVendor returns (uint256) {
    require(amount > 0, "Amount must be greater than 0");
    
    uint256 claimId = nextClaimId++;
    claims[claimId] = Claim({
        vendor: msg.sender,
        amount: amount,
        description: description,
        ipfsHash: ipfsHash,
        status: ClaimStatus.Pending,
        aiApproved: false,
        anomalyScore: 0,
        createTime: block.timestamp
    });
    
    emit ClaimSubmitted(claimId, msg.sender, amount, description, ipfsHash);
    return claimId;
}

// AI system reviews and approves/flags claim
function approveClaimByAI(
    uint256 claimId,
    bool approved,
    uint256 anomalyScore
) public onlyAISystem {
    require(claims[claimId].status == ClaimStatus.Pending, "Claim not pending");
    
    claims[claimId].aiApproved = approved;
    claims[claimId].anomalyScore = anomalyScore;
    
    // Auto-approve claims with low anomaly scores
    if (approved && anomalyScore < 20) {
        claims[claimId].status = ClaimStatus.Approved;
    } else if (anomalyScore >= 70) {
        claims[claimId].status = ClaimStatus.Flagged;
    }
    
    emit ClaimAIReviewed(claimId, approved, anomalyScore);
}
```

## 🚀 Installation and Setup

### Prerequisites

- Node.js v16+
- Python 3.8+
- Google Cloud Platform account
- MetaMask or another Ethereum wallet with Sepolia testnet ETH and PYUSD

### Smart Contract Deployment

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/TransparencyX.git
   cd TransparencyX/blockchain
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Deploy contracts (requires Sepolia testnet ETH and PYUSD):
   ```
   npx hardhat run scripts/deploy.js --network sepolia
   ```

### Web Interface Setup

1. Navigate to the web directory:
   ```
   cd ../web
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

### GCP Blockchain RPC Setup

1. Set up GCP Blockchain RPC service:
   ```
   cd ../cloud
   ./setup.sh
   ```

2. Configure BigQuery integration:
   ```
   python setup_bigquery.py
   ```

> **Note**: While our current implementation is on the Sepolia testnet, which has some restrictions, the system is designed to work seamlessly on mainnet where even more powerful tracing and analysis would be possible.

## 📱 Future Development

### Mobile Application for Vendors

We're developing a mobile application for vendors to:
- Submit claims directly from their phones
- Upload invoice photos that are automatically processed by our AI
- Receive PYUSD payments and manage their transaction history
- Pay suppliers and sub-suppliers through a simple interface

### Enhanced AI Fraud Detection

Future versions will include:
- More sophisticated machine learning models for fraud detection
- Pattern recognition across multiple claims and vendors
- Automatic investigation triggers for suspicious patterns

### Cross-Border Procurement

We plan to expand TransparencyX to support:
- International procurement processes
- Multi-currency support through stablecoin integrations
- Cross-border payment tracking and verification

## 🌐 Impact and Conclusion

TransparencyX demonstrates how blockchain technology, specifically PYUSD on Ethereum, can transform government procurement by:

1. **Eliminating opportunities for corruption** through immutable transaction records
2. **Reducing investigation costs** through AI-powered automatic verification
3. **Increasing public trust** through stakeholder participation in the verification process
4. **Creating accountability** throughout the entire payment chain

By leveraging GCP's Blockchain RPC service for transaction tracing, we've created a system that would be prohibitively expensive to implement with traditional blockchain methods, making it feasible for government-scale applications.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Paxos for PYUSD integration
- Google Cloud Platform for Blockchain RPC services
- The memory of Gauri Lankesh and all journalists who risked their lives exposing corruption
