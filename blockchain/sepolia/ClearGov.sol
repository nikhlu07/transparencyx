// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}
contract ClearGov {
    address public mainGovernment; // Main government (should be a multi-sig wallet in production)
    mapping(address => bool) public stateHeads; // State heads
    mapping(address => address) public deputies; // Deputy => State head who appointed them
    IERC20 public pyusd;
    uint256 public budget; // Total budget in PYUSD
    uint256 private reservedBudget;
    bool public paused;
    bool private isLocked;
    // Budget structure
    struct Budget {
        uint256 amount;
        string purpose;
        bool locked;
        uint256 lockTime; // Time when the budget was locked
    }
    mapping(uint256 => Budget) public budgets; // Budget ID => Budget

    // Budget Allocations
    struct Allocation {
        address stateHead; // State head who allocated
        uint256 amount; // Amount in PYUSD
        string area; // Area/project (e.g., "School Supplies in Area 1")
        address deputy; // Deputy for this allocation
        bool assigned; // Vendor selected
    }
    mapping(uint256 => Allocation[]) public allocations; // Budget ID => Allocations
    uint256 public budgetCount;

    // Vendor management
    mapping(address => uint256) private vendorIndex;
    address[] public vettedVendors;
    uint256 public vendorCount;
    mapping(address => bool) private isVendor;
    mapping(address => bool) private pendingVendors;
    uint256 public constant MAX_VENDORS = 50;

    // Claims
    mapping(bytes32 => bool) private invoiceClaimed;
    mapping(bytes32 => uint256) private invoiceToClaimId;
    struct Claim {
        address vendor; // Vendor address
        uint256 amount; // Amount in PYUSD
        bytes32 invoiceHash; // IPFS hash of invoice PDF
        address deputy; // Deputy who selected the vendor
        bool aiApproved; // AI approval
        bool flagged; // AI flagged for review
        bool paid; // Payment status
        uint256 escrowTime; // Escrow start time
        uint256 totalPaidToSuppliers; // Track total paid to suppliers
    }
    mapping(uint256 => Claim) private claims;
    uint256 public claimCount;

    // Supplier Payments
    struct SupplierPayment {
        address supplier; // Supplier address
        uint256 amount; // Amount in PYUSD
        string invoiceHash; // IPFS hash of supplier invoice
        bool verified; // Payment verified
    }
    mapping(uint256 => SupplierPayment[]) public supplierPayments; // Claim ID => Supplier payments

    // Challenges
    struct Challenge {
        address staker;
        uint256 amount;
        bool withdrawn;
    }
    mapping(bytes32 => Challenge[]) private invoiceChallenges;
    mapping(bytes32 => mapping(address => uint256)) private challengeIndex;
    uint256 public constant STAKE_AMOUNT = 1e6; // 1 PYUSD for staking
    uint256 public constant REWARD_AMOUNT = 5e6; // 5 PYUSD reward
    mapping(address => bool) private approvedStakers;

    // Role management limits
    uint256 public stateHeadCount;
    uint256 public deputyCount;
    uint256 public constant MAX_STATE_HEADS = 10;
    uint256 public constant MAX_DEPUTIES = 50;

    // Two-step role assignment
    struct RoleProposal {
        address candidate;
        uint256 proposalTime;
        bool confirmed;
    }
    mapping(address => RoleProposal) public stateHeadProposals;
    mapping(address => RoleProposal) public deputyProposals;
    uint256 public constant ROLE_CONFIRMATION_DELAY = 0; // 0 for testing (originally 1 days)

    // Time lock for sensitive actions
    uint256 public constant TIME_LOCK_DURATION = 0; // 0 for testing (originally 1 days)

    // Events
    event BudgetLocked(uint256 budgetId, uint256 amount, string purpose);
    event BudgetAllocated(uint256 budgetId, address allocator, uint256 amount, string area);
    event StateHeadProposed(address stateHead);
    event StateHeadConfirmed(address stateHead);
    event DeputyProposed(address stateHead, address deputy);
    event DeputyConfirmed(address stateHead, address deputy);
    event VendorSelected(uint256 budgetId, uint256 allocationId, address selector, address vendor);
    event ClaimSubmitted(uint256 claimId, address vendor, uint256 amount, bytes32 invoiceHash);
    event ClaimApprovedByAI(uint256 claimId);
    event ClaimFlaggedByAI(uint256 claimId, string reason);
    event ClaimPaid(uint256 claimId, address vendor, uint256 amount);
    event SupplierPaid(uint256 claimId, address supplier, uint256 amount, string invoiceHash);
    event ChallengeStaked(address staker, bytes32 invoiceHash);
    event ChallengeRewarded(address staker, bytes32 invoiceHash, uint256 reward);
    event VendorRemoved(address vendor);
    event StateHeadRemoved(address stateHead);
    event DeputyRemoved(address deputy);

    constructor(address _pyusd) {
        pyusd = IERC20(_pyusd);
        mainGovernment = msg.sender;
        approvedStakers[msg.sender] = true;
    }

    modifier onlyMainGovernment() {
        require(msg.sender == mainGovernment, "Only main government");
        _;
    }

    modifier onlyStateHead() {
        require(stateHeads[msg.sender], "Not a state head");
        _;
    }

    modifier onlyDeputy() {
        require(deputies[msg.sender] != address(0), "Not a deputy");
        _;
    }

    modifier onlyVendor() {
        require(isVendor[msg.sender], "Not a vendor");
        _;
    }

    modifier notPaused() {
        require(!paused, "Paused");
        _;
    }

    modifier nonReentrant() {
        require(!isLocked, "Reentrant call");
        isLocked = true;
        _;
        isLocked = false;
    }

    modifier onlyMainGovernmentOrAuthorized() {
        require(msg.sender == mainGovernment || (stateHeads[msg.sender] && msg.sender != mainGovernment) || (deputies[msg.sender] != address(0) && msg.sender != mainGovernment), "Not authorized");
        _;
    }

    // Utility function to check if an address is a contract
    function isContract(address _addr) private view returns (bool) {
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }

    // Main government proposes a state head
    function proposeStateHead(address stateHead) external onlyMainGovernment notPaused nonReentrant {
        require(stateHead != address(0), "Invalid address");
        require(stateHeadCount < MAX_STATE_HEADS, "Max state heads reached");
        require(!stateHeads[stateHead], "Already a state head");
        require(stateHeadProposals[stateHead].candidate == address(0), "Already proposed");
        stateHeadProposals[stateHead] = RoleProposal({
            candidate: stateHead,
            proposalTime: block.timestamp,
            confirmed: false
        });
        emit StateHeadProposed(stateHead);
    }

    // Main government confirms a state head
    function confirmStateHead(address stateHead) external onlyMainGovernment notPaused nonReentrant {
        RoleProposal storage proposal = stateHeadProposals[stateHead];
        require(proposal.candidate == stateHead, "Not proposed");
        require(!proposal.confirmed, "Already confirmed");
        require(block.timestamp >= proposal.proposalTime + ROLE_CONFIRMATION_DELAY, "Confirmation delay not met");
        stateHeads[stateHead] = true;
        approvedStakers[stateHead] = true;
        stateHeadCount++;
        proposal.confirmed = true;
        emit StateHeadConfirmed(stateHead);
    }

    // Main government removes a state head
    function removeStateHead(address stateHead) external onlyMainGovernment notPaused nonReentrant {
        require(stateHead != address(0), "Invalid address");
        require(stateHeads[stateHead], "Not a state head");
        stateHeads[stateHead] = false;
        approvedStakers[stateHead] = false;
        stateHeadCount--;
        delete stateHeadProposals[stateHead];
        emit StateHeadRemoved(stateHead);
    }

    // State head proposes a deputy
    function proposeDeputy(address deputy) external onlyStateHead notPaused nonReentrant {
        require(deputy != address(0), "Invalid address");
        require(deputyCount < MAX_DEPUTIES, "Max deputies reached");
        require(deputies[deputy] == address(0), "Already a deputy");
        require(deputyProposals[deputy].candidate == address(0), "Already proposed");
        deputyProposals[deputy] = RoleProposal({
            candidate: deputy,
            proposalTime: block.timestamp,
            confirmed: false
        });
        emit DeputyProposed(msg.sender, deputy);
    }

    // State head confirms a deputy
    function confirmDeputy(address deputy) external onlyStateHead notPaused nonReentrant {
        RoleProposal storage proposal = deputyProposals[deputy];
        require(proposal.candidate == deputy, "Not proposed");
        require(!proposal.confirmed, "Already confirmed");
        require(block.timestamp >= proposal.proposalTime + ROLE_CONFIRMATION_DELAY, "Confirmation delay not met");
        deputies[deputy] = msg.sender;
        approvedStakers[deputy] = true;
        deputyCount++;
        proposal.confirmed = true;
        emit DeputyConfirmed(msg.sender, deputy);
    }

    // State head removes a deputy
    function removeDeputy(address deputy) external onlyStateHead notPaused nonReentrant {
        require(deputy != address(0), "Invalid address");
        require(deputies[deputy] == msg.sender, "Not your deputy");
        delete deputies[deputy];
        approvedStakers[deputy] = false;
        deputyCount--;
        delete deputyProposals[deputy];
        emit DeputyRemoved(deputy);
    }

    // Main government locks a budget
    function lockBudget(uint256 amount, string memory purpose) external onlyMainGovernment notPaused nonReentrant {
        require(amount > 0, "Invalid amount");
        budgetCount++;
        budgets[budgetCount] = Budget({
            amount: amount,
            purpose: purpose,
            locked: true,
            lockTime: block.timestamp
        });
        require(pyusd.transferFrom(mainGovernment, address(this), amount), "Transfer failed");
        budget += amount;
        emit BudgetLocked(budgetCount, amount, purpose);
    }

    // State head or main government allocates budget to an area
    function allocateBudget(uint256 budgetId, uint256 amount, string memory area, address deputy) external onlyMainGovernmentOrAuthorized notPaused nonReentrant {
        require(budgetId > 0 && budgetId <= budgetCount, "Invalid budget ID");
        require(deputies[deputy] != address(0), "Invalid deputy");
        Budget storage budgetItem = budgets[budgetId];
        require(budgetItem.locked, "Budget not locked");
        require(amount > 0, "Invalid amount");
        require(amount <= budgetItem.amount, "Exceeds budget");
        require(block.timestamp >= budgetItem.lockTime + TIME_LOCK_DURATION, "Budget still in time lock");
        address allocator = stateHeads[msg.sender] ? msg.sender : (msg.sender == mainGovernment ? mainGovernment : address(0));
        require(allocator != address(0), "Invalid allocator");
        allocations[budgetId].push(Allocation({
            stateHead: allocator,
            amount: amount,
            area: area,
            deputy: deputy,
            assigned: false
        }));
        emit BudgetAllocated(budgetId, msg.sender, amount, area);
    }

    // Deputy or main government selects a vendor for an allocation
    function selectVendor(uint256 budgetId, uint256 allocationId, address vendor) external onlyMainGovernmentOrAuthorized notPaused nonReentrant {
        require(budgetId > 0 && budgetId <= budgetCount, "Invalid budget ID");
        require(allocationId < allocations[budgetId].length, "Invalid allocation ID");
        Allocation storage allocation = allocations[budgetId][allocationId];
        require(msg.sender == mainGovernment || msg.sender == allocation.deputy, "Not the deputy or main government for this allocation");
        require(!allocation.assigned, "Vendor already selected");
        require(isVendor[vendor], "Not a vetted vendor");
        allocation.assigned = true;
        emit VendorSelected(budgetId, allocationId, msg.sender, vendor);
    }

    // Internal function to handle vendor removal logic
    function _removeVendor(address vendor) internal {
        require(isVendor[vendor], "Not a vendor");
        uint256 idx = vendorIndex[vendor];
        if (idx != vendorCount - 1) {
            address lastVendor = vettedVendors[vendorCount - 1];
            vettedVendors[idx] = lastVendor;
            vendorIndex[lastVendor] = idx;
        }
        vettedVendors.pop();
        vendorCount--;
        delete vendorIndex[vendor];
        delete isVendor[vendor];
        emit VendorRemoved(vendor);
    }

    // Main government proposes a vendor
    function proposeVendor(address vendor) external onlyMainGovernment notPaused nonReentrant {
        require(vendor != address(0), "Invalid address");
        // require(isContract(vendor), "Vendor must be a contract"); // Commented out for testing
        require(!isVendor[vendor] && !pendingVendors[vendor], "Invalid vendor");
        require(vendorCount < MAX_VENDORS, "Max vendors reached");
        pendingVendors[vendor] = true;
    }

    // Main government approves a vendor
    function approveVendor(address vendor) external onlyMainGovernment notPaused nonReentrant {
        require(pendingVendors[vendor], "Vendor not proposed");
        require(vendorCount < MAX_VENDORS, "Max vendors reached");
        vettedVendors.push(vendor);
        vendorIndex[vendor] = vendorCount;
        vendorCount++;
        isVendor[vendor] = true;
        delete pendingVendors[vendor];
    }

    // Main government removes a vendor
    function removeVendor(address vendor) external onlyMainGovernment notPaused nonReentrant {
        _removeVendor(vendor);
    }

    // Vendor submits a claim with invoice
    function submitClaim(uint256 budgetId, uint256 allocationId, uint256 amount, string memory invoiceData) external onlyVendor notPaused nonReentrant {
        require(budgetId > 0 && budgetId <= budgetCount, "Invalid budget ID");
        require(allocationId < allocations[budgetId].length, "Invalid allocation ID");
        Allocation storage allocation = allocations[budgetId][allocationId];
        require(allocation.assigned, "Vendor not selected");
        require(amount > 0, "Invalid amount");
        require(amount <= allocation.amount, "Exceeds allocation");
        require(amount <= budget - reservedBudget, "Insufficient funds");
        bytes32 invoiceHash = keccak256(abi.encodePacked(invoiceData, msg.sender));
        require(!invoiceClaimed[invoiceHash], "Invoice already claimed");
        claimCount++;
        claims[claimCount] = Claim({
            vendor: msg.sender,
            amount: amount,
            invoiceHash: invoiceHash,
            deputy: allocation.deputy,
            aiApproved: false,
            flagged: false,
            paid: false,
            escrowTime: 0,
            totalPaidToSuppliers: 0
        });
        invoiceClaimed[invoiceHash] = true;
        invoiceToClaimId[invoiceHash] = claimCount;
        reservedBudget += amount;
        emit ClaimSubmitted(claimCount, msg.sender, amount, invoiceHash);
    }

    // AI approves or flags claim (simulated as a main government call for demo)
    function approveClaimByAI(uint256 claimId, bool approve, string memory flagReason) external onlyMainGovernment notPaused nonReentrant {
        require(claimId > 0 && claimId <= claimCount, "Invalid claim");
        Claim storage claim = claims[claimId];
        require(!claim.aiApproved && !claim.flagged, "Already processed by AI");
        if (approve) {
            claim.aiApproved = true;
            claim.escrowTime = block.timestamp;
            emit ClaimApprovedByAI(claimId);
        } else {
            claim.flagged = true;
            emit ClaimFlaggedByAI(claimId, flagReason);
        }
    }

    // Main government rejects a flagged claim
    function rejectClaim(uint256 claimId) external onlyMainGovernment notPaused nonReentrant {
        require(claimId > 0 && claimId <= claimCount, "Invalid claim");
        Claim storage claim = claims[claimId];
        require(claim.flagged, "Claim not flagged");
        require(!claim.paid, "Claim already paid");
        reservedBudget -= claim.amount;
        _removeVendor(claim.vendor);
    }

    // Pay vendor after escrow period
    function payClaim(uint256 claimId) external onlyMainGovernment notPaused nonReentrant {
        require(claimId > 0 && claimId <= claimCount, "Invalid claim");
        Claim storage claim = claims[claimId];
        require(claim.aiApproved, "Not approved by AI");
        require(!claim.flagged, "Claim flagged");
        require(block.timestamp >= claim.escrowTime, "Escrow period not over"); // Set to 0 for testing
        require(!claim.paid, "Already paid");
        require(budget >= claim.amount && reservedBudget >= claim.amount, "Insufficient funds");
        claim.paid = true;
        budget -= claim.amount;
        reservedBudget -= claim.amount;
        require(pyusd.transfer(claim.vendor, claim.amount), "Transfer failed");
        emit ClaimPaid(claimId, claim.vendor, claim.amount);
    }

    // Vendor pays supplier and submits supplier invoice
    function paySupplier(uint256 claimId, address supplier, uint256 amount, string memory supplierInvoiceHash) external onlyVendor notPaused nonReentrant {
        require(claimId > 0 && claimId <= claimCount, "Invalid claim");
        require(supplier != address(0), "Invalid supplier address");
        require(supplier != msg.sender && supplier != address(this), "Invalid supplier");
        Claim storage claim = claims[claimId];
        require(msg.sender == claim.vendor, "Only vendor can pay suppliers");
        require(claim.paid, "Claim not paid yet");
        require(amount > 0, "Invalid amount");
        require(claim.totalPaidToSuppliers + amount <= claim.amount, "Amount exceeds claim");
        require(pyusd.transferFrom(msg.sender, supplier, amount), "Transfer failed");
        claim.totalPaidToSuppliers += amount;
        supplierPayments[claimId].push(SupplierPayment({
            supplier: supplier,
            amount: amount,
            invoiceHash: supplierInvoiceHash,
            verified: true // Simplified for demo; AI would verify
        }));
        emit SupplierPaid(claimId, supplier, amount, supplierInvoiceHash);
    }

    // Supplier pays sub-supplier and submits invoice
    function paySubSupplier(uint256 claimId, uint256 paymentIndex, address subSupplier, uint256 amount, string memory subSupplierInvoiceHash) external notPaused nonReentrant {
        require(claimId > 0 && claimId <= claimCount, "Invalid claim");
        require(paymentIndex < supplierPayments[claimId].length, "Invalid payment index");
        require(subSupplier != address(0), "Invalid sub-supplier address");
        require(subSupplier != msg.sender && subSupplier != address(this), "Invalid sub-supplier");
        SupplierPayment storage payment = supplierPayments[claimId][paymentIndex];
        require(msg.sender == payment.supplier, "Only supplier can pay sub-suppliers");
        require(amount > 0, "Invalid amount");
        require(amount <= payment.amount, "Amount exceeds payment");
        require(pyusd.transferFrom(msg.sender, subSupplier, amount), "Transfer failed");
        supplierPayments[claimId].push(SupplierPayment({
            supplier: subSupplier,
            amount: amount,
            invoiceHash: subSupplierInvoiceHash,
            verified: true // Simplified for demo
        }));
        emit SupplierPaid(claimId, subSupplier, amount, subSupplierInvoiceHash);
    }

    // Public stakes to challenge a claim
    function stakeChallenge(bytes32 invoiceHash) external notPaused nonReentrant {
        require(invoiceClaimed[invoiceHash], "Not allowed to stake");
        require(pyusd.transferFrom(msg.sender, address(this), STAKE_AMOUNT), "Transfer failed");
        Challenge[] storage challenges = invoiceChallenges[invoiceHash];
        challengeIndex[invoiceHash][msg.sender] = challenges.length;
        challenges.push(Challenge(msg.sender, STAKE_AMOUNT, false));
        emit ChallengeStaked(msg.sender, invoiceHash);
    }

    // Main government rewards a staker after verifying a challenge
    function rewardStaker(bytes32 invoiceHash, address staker) external onlyMainGovernment notPaused nonReentrant {
        Challenge[] storage challenges = invoiceChallenges[invoiceHash];
        uint256 idx = challengeIndex[invoiceHash][staker];
        require(idx < challenges.length && challenges[idx].staker == staker && !challenges[idx].withdrawn, "Invalid challenge");
        require(budget >= REWARD_AMOUNT, "Insufficient budget for reward");
        challenges[idx].withdrawn = true;
        budget -= REWARD_AMOUNT;
        require(pyusd.transfer(staker, REWARD_AMOUNT), "Transfer failed");
        emit ChallengeRewarded(staker, invoiceHash, REWARD_AMOUNT);
    }

    // Main government sets paused state
    function setPaused(bool _paused) external onlyMainGovernment nonReentrant {
        paused = _paused;
    }

    // Public view functions for transparency
    function getClaim(uint256 claimId) external view returns (address vendor, uint256 amount, bytes32 invoiceHash, bool paid, bool flagged, uint256 totalPaidToSuppliers) {
        require(claimId > 0 && claimId <= claimCount, "Invalid claim");
        Claim storage claim = claims[claimId];
        return (claim.vendor, claim.amount, claim.invoiceHash, claim.paid, claim.flagged, claim.totalPaidToSuppliers);
    }

    function getSupplierPayments(uint256 claimId) external view returns (SupplierPayment[] memory) {
        require(claimId > 0 && claimId <= claimCount, "Invalid claim");
        return supplierPayments[claimId];
    }
}