import { ethers } from "ethers";
const { BigQuery } = require('@google-cloud/bigquery');
export default function handler(req, res) {
  // Replace with your GCP Holesky RPC URL
  const provider = new ethers.providers.JsonRpcProvider("https://blockchain.googleapis.com/v1/projects/model-coral-286214/locations/us-central1/endpoints/ethereum-sepolia/rpc?key=AIzaSyDXEFg9kGahkj4RvBnMEzx2YbS6WKpbOsA");
  // Replace with your contract address and ABI
  const contractAddress = "0xC82Ec89076a7391e4c9FFCDaaC1F0C0c802833B8";
   const contractABI = [
    "event ClaimSubmitted(uint256 indexed claimId, address indexed vendor, uint256 amount, bytes32 invoiceHash)",
    "event BudgetLocked(uint256 indexed budgetId, uint256 amount, string purpose)",
    "event BudgetAllocated(uint256 indexed budgetId, address indexed allocator, uint256 amount, string area)",
    "event VendorSelected(uint256 indexed budgetId, uint256 indexed allocationId, address indexed selector, address vendor)",
    "event ClaimPaid(uint256 indexed claimId, address indexed vendor, uint256 amount)",
    "event SupplierPaid(uint256 indexed claimId, address indexed supplier, uint256 amount, string invoiceHash)",
    "event StateHeadProposed(address indexed stateHead)",
    "event StateHeadConfirmed(address indexed stateHead)",
    "event StateHeadRemoved(address indexed stateHead)",
    "event DeputyProposed(address indexed stateHead, address indexed deputy)",
    "event DeputyConfirmed(address indexed stateHead, address indexed deputy)",
    "event DeputyRemoved(address indexed deputy)",
    "event ChallengeStaked(address indexed staker, bytes32 indexed invoiceHash)",
    "event ChallengeRewarded(address indexed staker, bytes32 indexed invoiceHash, uint256 reward)",
    "event VendorRemoved(address indexed vendor)"
  ];
    
  const contract = new ethers.Contract(contractAddress, contractABI, provider);
  const bigquery = new BigQuery();

  contract.on("BudgetLocked", async (budgetId, amount, purpose) => {
    const rows = [{ type: "budget", budgetId: budgetId.toString(), amount: parseFloat(ethers.utils.formatEther(amount)), purpose, timestamp: new Date() }];
    await bigquery.dataset('cleargov').table('budgets').insert(rows);
    console.log(`Budget locked: ${budgetId}`);
  });

  contract.on("ClaimSubmitted", async (claimId, vendor, amount, invoiceHash) => {
    const rows = [{ type: "claim", claimId: claimId.toString(), vendor, amount: parseFloat(ethers.utils.formatEther(amount)), invoiceHash: invoiceHash.toString(), timestamp: new Date() }];
    await bigquery.dataset('cleargov').table('transactions').insert(rows);
    console.log(`Claim stored: ${claimId}`);
  });

  contract.on("VendorSelected", async (budgetId, allocationId, selector, vendor) => {
    const rows = [{ type: "vendor", budgetId: budgetId.toString(), allocationId: allocationId.toString(), selector, vendor, timestamp: new Date() }];
    await bigquery.dataset('cleargov').table('vendor_selections').insert(rows);
    console.log(`Vendor selected: ${vendor}`);
  });

  contract.on("ClaimPaid", async (claimId, vendor, amount) => {
    const rows = [{ type: "payment", claimId: claimId.toString(), vendor, amount: parseFloat(ethers.utils.formatEther(amount)), timestamp: new Date() }];
    await bigquery.dataset('cleargov').table('payments').insert(rows);
    console.log(`Claim paid: ${claimId}`);
  });

  contract.on("SupplierPaid", async (claimId, supplier, amount, invoiceHash) => {
    const rows = [{ type: "supplier_payment", claimId: claimId.toString(), supplier, amount: parseFloat(ethers.utils.formatEther(amount)), invoiceHash, timestamp: new Date() }];
    await bigquery.dataset('cleargov').table('supplier_payments').insert(rows);
    console.log(`Supplier paid: ${claimId}`);
  });

  contract.on("StateHeadProposed", async (stateHead) => {
    const rows = [{ type: "state_head_proposal", stateHead, timestamp: new Date() }];
    await bigquery.dataset('cleargov').table('role_proposals').insert(rows);
    console.log(`State head proposed: ${stateHead}`);
  });

  contract.on("StateHeadConfirmed", async (stateHead) => {
    const rows = [{ type: "state_head_confirmation", stateHead, timestamp: new Date() }];
    await bigquery.dataset('cleargov').table('role_confirmations').insert(rows);
    console.log(`State head confirmed: ${stateHead}`);
  });

  // Add more listeners for other events similarly

  res.status(200).json({ message: "Blockchain listener with BigQuery started" });
}