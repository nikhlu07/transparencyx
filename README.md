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

ClearGov Smart Contract Technical Documentation
Overview
ClearGov.sol is the core smart contract for the TransparencyX system, implementing a corruption-proof government procurement system using PYUSD stablecoin on the Ethereum Sepolia testnet.
Contract Architecture
The contract follows a role-based access control (RBAC) pattern with hierarchical permissions:
MainGovernment
├── StateHeads
│   └── Deputies
│       └── Vendors
│           └── Suppliers
│               └── SubSuppliers
Additionally, the general public can interact with the contract in limited ways to provide oversight.
Role Definitions

MainGovernment: Central authority that manages the overall budget
StateHeads: Regional authorities that allocate budgets to specific departments
Deputies: Department officials who select vendors for specific projects
Vendors: Companies that receive payments and distribute to suppliers
Suppliers: Sub-contractors that receive payments from vendors
SubSuppliers: Tertiary contractors that receive payments from suppliers
Public: General citizens who can view transactions and challenge suspicious claims

State Variables
solidity// Role management
mapping(address => bool) public isMainGovernment;
mapping(address => bool) public isStateHead;
mapping(address => bool) public isDeputy;
mapping(address => bool) public isVendor;
mapping(address => bool) public isSupplier;
mapping(address => bool) public isSubSupplier;

// PYUSD token interface
IERC20 public pyusd;

// Budget tracking
uint256 public totalBudget;
mapping(address => uint256) public departmentBudgets;
mapping(string => uint256) public fiscalYearBudgets;

// Claim management
struct Claim {
    uint256 id;
    address vendor;
    uint256 amount;
    string description;
    string ipfsDocumentHash;
    bool approved;
    bool paid;
    uint256 timestamp;
    uint256 anomalyScore;
}

uint256 public nextClaimId;
mapping(uint256 => Claim) public claims;
mapping(address => uint256[]) public vendorClaims;

// Supplier payment tracking
struct SupplierPayment {
    uint256 claimId;
    address supplier;
    uint256 amount;
    bool paid;
    uint256 timestamp;
}

uint256 public nextSupplierPaymentId;
mapping(uint256 => SupplierPayment) public supplierPayments;
mapping(address => uint256[]) public vendorSupplierPayments;

// SubSupplier payment tracking
struct SubSupplierPayment {
    uint256 supplierPaymentId;
    address subSupplier;
    uint256 amount;
    bool paid;
    uint256 timestamp;
}

uint256 public nextSubSupplierPaymentId;
mapping(uint256 => SubSupplierPayment) public subSupplierPayments;
mapping(address => uint256[]) public supplierSubPayments;

// Challenge system
struct Challenge {
    uint256 id;
    uint256 claimId;
    address challenger;
    string reason;
    bool resolved;
    bool valid;
    uint256 timestamp;
}

uint256 public nextChallengeId;
mapping(uint256 => Challenge) public challenges;
mapping(uint256 => uint256[]) public claimChallenges;
Core Functions
Budget Management
solidityfunction lockBudget(uint256 amount, string memory fiscalYear) external onlyMainGovernment {
    require(pyusd.transferFrom(msg.sender, address(this), amount), "Budget transfer failed");
    fiscalYearBudgets[fiscalYear] += amount;
    totalBudget += amount;
    emit BudgetLocked(amount, fiscalYear, msg.sender);
}

function allocateBudget(address department, uint256 amount, string memory description) external onlyMainGovernment {
    require(amount <= totalBudget, "Insufficient total budget");
    totalBudget -= amount;
    departmentBudgets[department] += amount;
    emit BudgetAllocated(department, amount, description, msg.sender);
}
Claim Processing
solidityfunction submitClaim(uint256 amount, string memory description, string memory ipfsDocumentHash) external onlyVendor {
    uint256 claimId = nextClaimId++;
    claims[claimId] = Claim({
        id: claimId,
        vendor: msg.sender,
        amount: amount,
        description: description,
        ipfsDocumentHash: ipfsDocumentHash,
        approved: false,
        paid: false,
        timestamp: block.timestamp,
        anomalyScore: 0
    });
    vendorClaims[msg.sender].push(claimId);
    emit ClaimSubmitted(claimId, msg.sender, amount, description, ipfsDocumentHash);
}

function approveClaimByAI(uint256 claimId, bool isApproved, uint256 anomalyScore) external {
    require(msg.sender == aiSystemAddress, "Only AI system can approve claims");
    Claim storage claim = claims[claimId];
    require(!claim.approved, "Claim already approved");
    
    claim.approved = isApproved;
    claim.anomalyScore = anomalyScore;
    
    emit ClaimAIReviewed(claimId, isApproved, anomalyScore);
}

function payClaim(uint256 claimId) external onlyMainGovernment {
    Claim storage claim = claims[claimId];
    require(claim.approved, "Claim not approved");
    require(!claim.paid, "Claim already paid");
    require(departmentBudgets[claim.vendor] >= claim.amount, "Insufficient department budget");
    
    departmentBudgets[claim.vendor] -= claim.amount;
    claim.paid = true;
    
    require(pyusd.transfer(claim.vendor, claim.amount), "Payment failed");
    
    emit ClaimPaid(claimId, claim.vendor, claim.amount);
}
Supplier Payment Chain
solidityfunction paySupplier(uint256 claimId, address supplier, uint256 amount) external onlyVendor {
    require(claims[claimId].vendor == msg.sender, "Not the claim vendor");
    require(claims[claimId].paid, "Claim not paid yet");
    require(isSupplier[supplier], "Not a registered supplier");
    require(amount <= claims[claimId].amount, "Amount exceeds claim amount");
    
    uint256 paymentId = nextSupplierPaymentId++;
    supplierPayments[paymentId] = SupplierPayment({
        claimId: claimId,
        supplier: supplier,
        amount: amount,
        paid: true,
        timestamp: block.timestamp
    });
    
    vendorSupplierPayments[msg.sender].push(paymentId);
    
    require(pyusd.transferFrom(msg.sender, supplier, amount), "Supplier payment failed");
    
    emit SupplierPaid(paymentId, claimId, supplier, amount);
}

function paySubSupplier(uint256 supplierPaymentId, address subSupplier, uint256 amount) external onlySupplier {
    require(supplierPayments[supplierPaymentId].supplier == msg.sender, "Not the payment supplier");
    require(isSubSupplier[subSupplier], "Not a registered sub-supplier");
    require(amount <= supplierPayments[supplierPaymentId].amount, "Amount exceeds supplier payment");
    
    uint256 subPaymentId = nextSubSupplierPaymentId++;
    subSupplierPayments[subPaymentId] = SubSupplierPayment({
        supplierPaymentId: supplierPaymentId,
        subSupplier: subSupplier,
        amount: amount,
        paid: true,
        timestamp: block.timestamp
    });
    
    supplierSubPayments[msg.sender].push(subPaymentId);
    
    require(pyusd.transferFrom(msg.sender, subSupplier, amount), "Sub-supplier payment failed");
    
    emit SubSupplierPaid(subPaymentId, supplierPaymentId, subSupplier, amount);
}
Public Challenge System
solidityfunction stakeChallenge(uint256 claimId, string memory reason) external {
    require(claims[claimId].approved, "Can only challenge approved claims");
    require(pyusd.transferFrom(msg.sender, address(this), 1 * 10**6), "Must stake 1 PYUSD");
    
    uint256 challengeId = nextChallengeId++;
    challenges[challengeId] = Challenge({
        id: challengeId,
        claimId: claimId,
        challenger: msg.sender,
        reason: reason,
        resolved: false,
        valid: false,
        timestamp: block.timestamp
    });
    
    claimChallenges[claimId].push(challengeId);
    
    emit ChallengeStaked(challengeId, claimId, msg.sender, reason);
}

function resolveChallenge(uint256 challengeId, bool isValid) external onlyMainGovernment {
    Challenge storage challenge = challenges[challengeId];
    require(!challenge.resolved, "Challenge already resolved");
    
    challenge.resolved = true;
    challenge.valid = isValid;
    
    if (isValid) {
        // Return stake and reward challenger
        require(pyusd.transfer(challenge.challenger, 6 * 10**6), "Reward transfer failed"); // 1 PYUSD stake + 5 PYUSD reward
        
        // Flag the claim as fraudulent
        claims[challenge.claimId].approved = false;
    } else {
        // Challenger loses stake
        // Stake already transferred to contract
    }
    
    emit ChallengeResolved(challengeId, challenge.claimId, isValid);
}
View Functions
solidityfunction getClaim(uint256 claimId) external view returns (
    address vendor,
    uint256 amount,
    string memory description,
    string memory ipfsDocumentHash,
    bool approved,
    bool paid,
    uint256 timestamp,
    uint256 anomalyScore
) {
    Claim storage claim = claims[claimId];
    return (
        claim.vendor,
        claim.amount,
        claim.description,
        claim.ipfsDocumentHash,
        claim.approved,
        claim.paid,
        claim.timestamp,
        claim.anomalyScore
    );
}

function getVendorClaimCount(address vendor) external view returns (uint256) {
    return vendorClaims[vendor].length;
}

function getSupplierPayments(uint256 claimId) external view returns (
    uint256[] memory paymentIds,
    address[] memory suppliers,
    uint256[] memory amounts
) {
    // Implementation details omitted for brevity
}

function getSubSupplierPayments(uint256 supplierPaymentId) external view returns (
    uint256[] memory subPaymentIds,
    address[] memory subSuppliers,
    uint256[] memory amounts
) {
    // Implementation details omitted for brevity
}

function getChallenges(uint256 claimId) external view returns (
    uint256[] memory challengeIds,
    address[] memory challengers,
    string[] memory reasons,
    bool[] memory resolved,
    bool[] memory valid
) {
    // Implementation details omitted for brevity
}
Events
solidityevent BudgetLocked(uint256 amount, string fiscalYear, address indexed locker);
event BudgetAllocated(address indexed department, uint256 amount, string description, address indexed allocator);
event ClaimSubmitted(uint256 indexed claimId, address indexed vendor, uint256 amount, string description, string ipfsDocumentHash);
event ClaimAIReviewed(uint256 indexed claimId, bool approved, uint256 anomalyScore);
event ClaimPaid(uint256 indexed claimId, address indexed vendor, uint256 amount);
event SupplierPaid(uint256 indexed paymentId, uint256 indexed claimId, address indexed supplier, uint256 amount);
event SubSupplierPaid(uint256 indexed subPaymentId, uint256 indexed supplierPaymentId, address indexed subSupplier, uint256 amount);
event ChallengeStaked(uint256 indexed challengeId, uint256 indexed claimId, address indexed challenger, string reason);
event ChallengeResolved(uint256 indexed challengeId, uint256 indexed claimId, bool valid);
Security Considerations

Role Management: All role assignments are managed by MainGovernment with strict access controls
Reentrancy Protection: All state changes occur before external calls
Input Validation: All function inputs are validated before processing
Budget Integrity: Budget calculations prevent double-spending or overpayment
Payment Protection: All PYUSD transfers are verified with return value checks
Challenge Protection: Stake requirements prevent frivolous challenges

Deployment Instructions

Deploy PYUSD contract (or use existing one on Sepolia)
Deploy ClearGov contract with PYUSD address as constructor parameter
Assign MainGovernment role to deployer address
MainGovernment assigns StateHead roles
StateHeads assign Deputy roles
Deputies register Vendors
Vendors register Suppliers
Suppliers register SubSuppliers
