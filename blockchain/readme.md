ClearGov.sol Technical Documentation
Overview
ClearGov.sol is the backbone of TransparencyX, a corruption-proof government procurement system developed for the PYUSD ClearGov Hackathon. Deployed on Ethereum’s Sepolia testnet with PYUSD stablecoin, it ensures transparent budget management, claim processing, and payments across government, vendors, suppliers, sub-suppliers, and the public. The contract integrates AI for fraud detection and Google Cloud Platform (GCP) Blockchain RPC for transaction tracing, tackling global corruption (e.g., $2T annual losses per UN).
Figure 1: TransparencyX system integrating ClearGov.sol with AI and GCP.
Contract Architecture
The contract uses Role-Based Access Control (RBAC) with a hierarchical structure to enforce permissions and prevent fraud. Below is the role hierarchy:
Figure 2: Role-based hierarchy in ClearGov.sol.
Role Definitions

MainGovernment: Locks budgets, approves claims, assigns roles.
StateHeads: Allocates budgets to departments.
Deputies: Selects vendors for projects.
Vendors: Submits claims, pays suppliers.
Suppliers: Pays sub-suppliers.
SubSuppliers: Receives payments.
Public: Challenges suspicious claims for accountability.

State Variables
// Role management
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

// Sub-supplier payment tracking
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

lockBudget(uint256 amount, string memory fiscalYear):

Role: onlyMainGovernment.
Transfers PYUSD to the contract, locking it for a fiscal year.
Updates totalBudget and fiscalYearBudgets.
Emits BudgetLocked.


allocateBudget(address department, uint256 amount, string memory description):

Role: onlyMainGovernment.
Allocates budget to a department, reducing totalBudget.
Updates departmentBudgets.
Emits BudgetAllocated.



Claim Processing

submitClaim(uint256 amount, string memory description, string memory ipfsDocumentHash):

Role: onlyVendor.
Creates a claim with an IPFS hash (e.g., QmNzWNidRjhUNbkeXmEzfk2ctuqqdqcAkMTHJzDXYS2tDE).
Stores in claims and vendorClaims.
Emits ClaimSubmitted.


approveClaimByAI(uint256 claimId, bool isApproved, uint256 anomalyScore):

Role: Restricted to aiSystemAddress.
Updates claim approval and anomaly score.
Emits ClaimAIReviewed.


payClaim(uint256 claimId):

Role: onlyMainGovernment.
Transfers PYUSD to the vendor if approved.
Marks claim as paid.
Emits ClaimPaid.



Supplier Payment Chain

paySupplier(uint256 claimId, address supplier, uint256 amount):

Role: onlyVendor.
Transfers PYUSD to supplier post-claim payment.
Stores in supplierPayments.
Emits SupplierPaid.


paySubSupplier(uint256 supplierPaymentId, address subSupplier, uint256 amount):

Role: onlySupplier.
Transfers PYUSD to sub-supplier.
Stores in subSupplierPayments.
Emits SubSupplierPaid.



Public Challenge System

stakeChallenge(uint256 claimId, string memory reason):

Stakes 1 PYUSD to challenge a claim.
Stores in challenges.
Emits ChallengeStaked.


resolveChallenge(uint256 challengeId, bool isValid):

Role: onlyMainGovernment.
Resolves challenge:
Valid: Returns stake + 5 PYUSD; flags claim as unapproved.
Invalid: Retains stake.


Emits ChallengeResolved.



View Functions

getClaim(uint256 claimId): Returns claim details.
getVendorClaimCount(address vendor): Returns vendor’s claim count.
getSupplierPayments(uint256 claimId): Returns supplier payments.
getSubSupplierPayments(uint256 supplierPaymentId): Returns sub-supplier payments.
getChallenges(uint256 claimId): Returns challenges for a claim.

Events
event BudgetLocked(uint256 amount, string fiscalYear, address indexed locker);
event BudgetAllocated(address indexed department, uint256 amount, string description, address indexed allocator);
event ClaimSubmitted(uint256 indexed claimId, address indexed vendor, uint256 amount, string description, string ipfsDocumentHash);
event ClaimAIReviewed(uint256 indexed claimId, bool approved, uint256 anomalyScore);
event ClaimPaid(uint256 indexed claimId, address indexed vendor, uint256 amount);
event SupplierPaid(uint256 indexed paymentId, uint256 indexed claimId, address indexed supplier, uint256 amount);
event SubSupplierPaid(uint256 indexed subPaymentId, uint256 indexed supplierPaymentId, address indexed subSupplier, uint256 amount);
event ChallengeStaked(uint256 indexed challengeId, uint256 indexed claimId, address indexed challenger, string reason);
event ChallengeResolved(uint256 indexed challengeId, uint256 indexed claimId, bool valid);

Security Considerations

RBAC: Strict modifiers prevent unauthorized access.
Reentrancy: State updates precede external calls.
Input Validation: Validates amounts, roles, and statuses.
Budget Integrity: Prevents double-spending.
Payment Protection: Verifies PYUSD transfers.
Challenge System: Stake deters spam; rewards incentivize scrutiny.

Repository Structure
The blockchain-related files are organized by network:
blockchain/
├── holesky/
│   ├── ClearGov.sol
│   └── MockPYUSD.sol
├── sepolia/
│   ├── ClearGov.sol
│   └── PYUSD.json


Holesky: Includes MockPYUSD.sol for testing since Paxos doesn’t provide PYUSD tokens.
Sepolia: Uses official PYUSD ABI (PYUSD.json) for real token interactions.

Deployment Instructions
Figure 3: Deployment process for ClearGov.sol on Sepolia and Holesky.
Sepolia Deployment

Obtain PYUSD from Paxos faucet (0xYourWallet).
Deploy ClearGov.sol with Sepolia PYUSD address via Hardhat/Remix.
Assign MainGovernment role to deployer.
MainGovernment assigns StateHead, Deputy, Vendor, Supplier, SubSupplier roles.

Holesky Deployment

Deploy MockPYUSD.sol (ERC20 mock) to simulate PYUSD.
Deploy ClearGov.sol with MockPYUSD address.
Follow same role assignment as Sepolia.

Role Setup

MainGovernment: Locks budget via lockBudget.
StateHeads: Allocates budgets.
Deputies: Registers vendors.
Vendors: Registers suppliers.
Suppliers: Registers sub-suppliers.

Integration with TransparencyX

AI: approveClaimByAI links to Document AI and scikit-learn.
GCP RPC: Traces transactions (debug_traceTransaction) for auditing.
BigQuery: Logs claims and payments.
Web: Interacts with contract functions.

Hackathon Alignment

Innovation: Integrates PYUSD, AI, and public oversight.
GCP Advantage: Uses free RPC for transaction tracing.
Functionality: Tracks payment chains transparently.
Accessibility: Public view functions ensure openness.
