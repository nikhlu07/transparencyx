# TransparencyX: Corruption-Proof Government Procurement with PYUSD

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 Vision: Ending Procurement Corruption Through Blockchain Transparency

**TransparencyX** is a decentralized, AI-enhanced government procurement system built on the Ethereum Sepolia testnet using PYUSD stablecoin. Our mission is to combat public sector corruption through immutable financial transparency, automated fraud detection, and public accountability mechanisms.

### The Problem We're Solving

Corruption in government procurement is a global crisis:

- **$9.5 trillion** lost annually to corruption in developing countries (World Economic Forum)
- Only **14%** of major corruption cases lead to recovery of stolen assets (UN)
- Over **120 journalists** have been killed exposing corruption cases in the last decade

In 2018, Indian journalist Gauri Lankesh was assassinated after investigating a major procurement scandal. Her death inspired this project—creating a system where such investigations would be unnecessary because all transactions would be transparent by design.

## 🛠️ How TransparencyX Works

TransparencyX creates an end-to-end solution for corruption-free government procurement:

1. **Budget Allocation**: Government funds are locked in PYUSD and allocated transparently to departments
2. **Vendor Selection**: All vendor selections are recorded immutably on the blockchain
3. **AI-Verified Claims**: Document AI extracts invoice details and machine learning detects anomalies
4. **Payment Chain Tracking**: All payments to vendors, suppliers, and sub-suppliers are tracked
5. **Public Oversight**: Citizens can challenge suspicious claims by staking PYUSD

### Key Features

- **Role-Based Access Control**: Clear separation of duties between government roles
- **Complete Payment Chain**: Tracking from initial allocation to the last sub-supplier
- **AI Anomaly Detection**: Automatic flagging of suspicious claims
- **Public Challenge System**: Crowdsourced oversight with PYUSD incentives
- **Immutable Audit Trail**: Every action recorded on Sepolia blockchain
- **BigQuery Analytics**: Real-time monitoring and advanced fraud detection

## 🔍 Technical Implementation

### Smart Contracts

TransparencyX is built on two main smart contracts deployed on the Sepolia testnet:

1. **ClearGov.sol**: Our core governance contract that manages:
   - Role-based permissions (government, departments, deputies, vendors)
   - Budget allocation and tracking
   - Claim submission, verification, and payment
   - Supplier/sub-supplier payment chains
   - Public challenge mechanism

2. **PYUSD Integration**: Direct integration with the PYUSD stablecoin for all financial transactions

### Google Cloud Platform Integration

We leverage GCP's Blockchain RPC service for:

- **Transaction Tracing**: Using `debug_traceTransaction` to follow payment flows
- **Block Analysis**: Monitoring claim submissions and challenges in real-time
- **Event Logging**: Capturing all contract events for analytical purposes

### AI Components

Our AI system enhances fraud detection through:

- **Document AI**: Extracts key information from invoices and procurement documents
- **Anomaly Detection**: Machine learning models identify suspicious patterns in claims
- **IPFS Document Storage**: All documents are stored with immutable IPFS hashes

### BigQuery Data Warehouse

We capture all blockchain transactions in BigQuery for:

- **Transaction Analysis**: Complex queries across the entire procurement chain
- **Visual Dashboards**: Real-time monitoring of government spending
- **Trend Analysis**: Identifying patterns that might indicate corruption

## 🚀 Installation and Setup

### Prerequisites

- Node.js v16+
- Python 3.8+
- Google Cloud Platform account
- MetaMask or another Ethereum wallet

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

### AI System Setup

1. Install Python requirements:
   ```
   cd ../ai
   pip install -r requirements.txt
   ```

2. Configure the AI service:
   ```
   python setup.py
   ```

### GCP Setup

1. Set up GCP Blockchain RPC service:
   ```
   cd ../cloud
   ./setup.sh
   ```

2. Configure BigQuery integration:
   ```
   python setup_bigquery.py
   ```

## 📊 Usage Examples

### Government Budget Allocation

```javascript
// Lock budget for fiscal year
await clearGov.lockBudget(
  ethers.utils.parseUnits("10000000", 6), // 10M PYUSD
  "FY2025",
  { from: mainGovernmentAddress }
);

// Allocate budget to education department
await clearGov.allocateBudget(
  educationDeptAddress,
  ethers.utils.parseUnits("2000000", 6), // 2M PYUSD
  "Education FY2025",
  { from: mainGovernmentAddress }
);
```

### Vendor Claim Submission

```javascript
// Submit claim with IPFS document hash
await clearGov.submitClaim(
  ethers.utils.parseUnits("50000", 6), // 50K PYUSD
  "School Supplies Procurement Q1",
  "QmNzWNidRjhUNbkeXmEzfk2ctuqqdqcAkMTHJzDXYS2tDE", // IPFS hash of invoice
  { from: vendorAddress }
);
```

### AI Claim Approval

```javascript
// AI system reviews claim and approves or flags
const claimId = 123;
const isApproved = true;
const anomalyScore = 0.15; // Low risk
await clearGov.approveClaimByAI(
  claimId,
  isApproved,
  anomalyScore,
  { from: aiSystemAddress }
);
```

### Public Challenge

```javascript
// Citizen challenges suspicious claim
await clearGov.stakeChallenge(
  claimId,
  "Suspicious pricing compared to market rates",
  { from: citizenAddress, value: ethers.utils.parseUnits("1", 6) } // Stake 1 PYUSD
);
```

## 🌐 Future Roadmap

1. **Multi-chain Deployment**: Expand beyond Sepolia to mainnet deployment
2. **Enhanced AI**: More sophisticated fraud detection models
3. **Mobile App**: Citizen-friendly interface for public oversight
4. **Integration with Government Systems**: Connect with existing procurement systems
5. **Cross-border Procurement**: Supporting international procurement transparency

## 👥 Team

- Lead Developer: Nikhil Sharma


## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Paxos for PYUSD integration
- Google Cloud Platform for Blockchain RPC services
- The memory of Gauri Lankesh and all journalists who risked their lives exposing corruption


