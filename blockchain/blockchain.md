ClearGov.sol Technical Documentation
Overview
ClearGov.sol is the core smart contract powering TransparencyX, a corruption-proof government procurement system built for the PYUSD ClearGov Hackathon. Deployed on the Ethereum Sepolia testnet, it uses PYUSD stablecoin to ensure transparent budget management, claim processing, and payment flows across government, vendors, suppliers, sub-suppliers, and the public. The contract integrates with AI for automated fraud detection and Google Cloud Platform (GCP) Blockchain RPC for transaction tracing, addressing global corruption issues (e.g., $2T annual losses per UN estimates).
Contract Architecture
The contract employs Role-Based Access Control (RBAC) with a hierarchical structure to enforce permissions and prevent fraud:
MainGovernment
├── StateHeads
│   └── Deputies
│       └── Vendors
│           └── Suppliers
│               └── SubSuppliers
└── Public (limited oversight)

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
Transfers PYUSD from the caller to the contract, locking it for a fiscal year.
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
Updates claim approval status and anomaly score based on AI analysis.
Emits ClaimAIReviewed.


payClaim(uint256 claimId):

Role: onlyMainGovernment.
Transfers PYUSD to the vendor if the claim is approved and budget exists.
Marks claim as paid.
Emits ClaimPaid.



Supplier Payment Chain

paySupplier(uint256 claimId, address supplier, uint256 amount):

Role: onlyVendor.
Transfers PYUSD from vendor to supplier post-claim payment.
Stores in supplierPayments and vendorSupplierPayments.
Emits SupplierPaid.


paySubSupplier(uint256 supplierPaymentId, address subSupplier, uint256 amount):

Role: onlySupplier.
Transfers PYUSD from supplier to sub-supplier.
Stores in subSupplierPayments and supplierSubPayments.
Emits SubSupplierPaid.



Public Challenge System

stakeChallenge(uint256 claimId, string memory reason):

Stakes 1 PYUSD (6 decimals) to challenge an approved claim.
Stores in challenges and claimChallenges.
Emits ChallengeStaked.


resolveChallenge(uint256 challengeId, bool isValid):

Role: onlyMainGovernment.
Resolves a challenge:
If valid: Returns stake + 5 PYUSD reward; flags claim as unapproved.
If invalid: Stake is retained by the contract.


Emits ChallengeResolved.



View Functions

getClaim(uint256 claimId): Returns claim details (vendor, amount, IPFS hash, etc.).
getVendorClaimCount(address vendor): Returns number of claims by a vendor.
getSupplierPayments(uint256 claimId): Returns payment details for suppliers.
getSubSupplierPayments(uint256 supplierPaymentId): Returns sub-supplier payment details.
getChallenges(uint256 claimId): Returns challenge details for a claim.

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

RBAC: Strict modifiers (onlyMainGovernment, etc.) prevent unauthorized access.
Reentrancy: State updates occur before external calls (e.g., pyusd.transfer).
Input Validation: Checks for valid amounts, roles, and claim statuses.
Budget Integrity: Prevents double-spending via departmentBudgets and totalBudget checks.
Payment Protection: Verifies PYUSD transfers with return values.
Challenge System: 1 PYUSD stake deters spam; rewards incentivize valid challenges.

Deployment Instructions

Sepolia Deployment:

Obtain PYUSD from the Paxos faucet (0xYourWallet).
Deploy ClearGov.sol using Hardhat/Remix, passing the Sepolia PYUSD address as a constructor parameter.
Assign MainGovernment role to the deployer.
MainGovernment assigns StateHead roles, who assign Deputy, Vendor, Supplier, and SubSupplier roles.


Holesky Deployment:

Paxos does not provide PYUSD tokens on Holesky.
Deploy MockPYUSD.sol (ERC20 mock) to simulate PYUSD.
Deploy ClearGov.sol with the MockPYUSD address.
Follow the same role assignment process as Sepolia.


Role Setup:

MainGovernment: Locks initial budget via lockBudget.
StateHeads: Allocates budgets to departments.
Deputies: Registers vendors.
Vendors: Registers suppliers.
Suppliers: Registers sub-suppliers.



Integration with TransparencyX

AI: approveClaimByAI connects to Google Document AI and scikit-learn for invoice validation and anomaly detection.
GCP Blockchain RPC: Uses debug_traceTransaction and trace_block to audit PYUSD flows (e.g., paySupplier, stakeChallenge).
BigQuery: Logs claims, payments, and challenges for analytics.
Web Interface: Interacts with submitClaim, paySupplier, and stakeChallenge via a frontend.

Hackathon Alignment

Innovation: Combines PYUSD, RBAC, and public challenges for transparent procurement.
GCP Advantage: Leverages free RPC calls for deep transaction tracing.
Functionality: Tracks full payment chains, addressing corruption.
Accessibility: Public view functions (getClaim, getSupplierPayments) ensure transparency.

