"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardMetrics } from "@/components/dashboard-metrics";
import { RoleBasedActions } from "@/components/role-based-actions";
import { useAuth } from "@/contexts/auth-context";
import { ClaimsStatusChart } from "@/components/claims-status-chart";
import { RecentActivityTable } from "@/components/recent-activity-table";
import { TransactionTrailChart } from "@/components/transaction-trail-chart";
import { FraudAlerts } from "@/components/fraud-alerts";
import { ActiveChallenges } from "@/components/active-challenges";
import { DashboardSkeleton } from "@/components/dashboard-skeleton";
import { getClearGovContract, clearGovConfig } from "@/app/lib/contractConfig";
import { ethers } from "ethers";
import detectEthereumProvider from "@metamask/detect-provider";

// Prop interfaces
interface ChartProps {
  
  data: { status: string; count: number }[];
}

interface TableProps {
  data: { id: number; action: string; user: string; role: string; details: string; timestamp: string }[];
}

interface AlertProps {
  alerts: { id: number; title: string; description: string; severity: string; timestamp: string }[];
}

interface ChallengeProps {
  data: { id: number; invoiceHash: string; staker: string; amount: string; claimId: number; status: string; timestamp: string }[];
}

interface TrailProps {
  data: { name: string; mainGov: number; stateHead: number; deputy: number; vendor: number }[];
}

interface Action {
  type: "claim" | "budget";
  amount: string;
  purpose: string;
  budgetId: string;
  allocationId: string;
  invoiceData: string;
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [claimsData, setClaimsData] = useState<ChartProps["data"]>([]);
  const [recentActivity, setRecentActivity] = useState<TableProps["data"]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<AlertProps["alerts"]>([]);
  const [trailData, setTrailData] = useState<TrailProps["data"]>([]);
  const [challengesData, setChallengesData] = useState<ChallengeProps["data"]>([]);
  const [newAction, setNewAction] = useState<Action>({
    type: "claim",
    amount: "",
    purpose: "",
    budgetId: "0",
    allocationId: "0",
    invoiceData: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [availableBudgets, setAvailableBudgets] = useState<{ id: string; purpose: string; amount: string }[]>([]);
  const [availableAllocations, setAvailableAllocations] = useState<{ budgetId: string; id: string; area: string; amount: string }[]>([]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) fetchDashboardData();
  }, [user, router, isLoading]);

  const fetchDashboardData = async () => {
    if (!user ) return;
    setError(null);
    setDataLoading(true);
    try {
      const contract = await getClearGovContract();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const blockNumber = await provider.getBlockNumber();
      console.log("Latest block:", blockNumber);

      const budgetCount = await contract.budgetCount();
      const budgets = [];
      for (let i = 0; i < budgetCount; i++) {
        try {
          const budget = await contract.budgets(i);
          budgets.push({
            id: i.toString(),
            purpose: budget.purpose,
            amount: ethers.formatEther(budget.amount),
          });
        } catch (err) {
          console.warn(`Error fetching budget ${i}:`, err);
        }
      }
      setAvailableBudgets(budgets);

      if (budgets.length > 0) {
        const allocations = [];
        for (let i = 0; i < 5; i++) {
          try {
            const allocation = await contract.allocations(0, i);
            if (allocation.amount > 0 && allocation.assigned) {
              allocations.push({
                budgetId: "0",
                id: i.toString(),
                area: allocation.area,
                amount: ethers.formatEther(allocation.amount),
              });
            }
          } catch (err) {
            break;
          }
        }
        setAvailableAllocations(allocations);
      }

      const contractInterface = new ethers.Interface(clearGovConfig.abi);
      const claimSubmittedEvents = await contract.queryFilter(contract.filters.ClaimSubmitted(), 0, blockNumber);
      const claimPaidEvents = await contract.queryFilter(contract.filters.ClaimPaid(), 0, blockNumber);
      const claimFlaggedEvents = await contract.queryFilter(contract.filters.ClaimFlaggedByAI(), 0, blockNumber);

      const claimIds = new Set();
      const paidClaimIds = new Set();
      const flaggedClaimIds = new Set();

      claimSubmittedEvents.forEach(event => {
        const decoded = contractInterface.parseLog(event);
        if (decoded && decoded.args.claimId) claimIds.add(decoded.args.claimId.toString());
      });

      claimPaidEvents.forEach(event => {
        const decoded = contractInterface.parseLog(event);
        if (decoded && decoded.args.claimId) paidClaimIds.add(decoded.args.claimId.toString());
      });

      claimFlaggedEvents.forEach(event => {
        const decoded = contractInterface.parseLog(event);
        if (decoded && decoded.args.claimId) flaggedClaimIds.add(decoded.args.claimId.toString());
      });

      const statusCounts = {
        "Pending": 0,
        "Approved": 0,
        "Rejected": 0,
        "Challenged": 0,
      };

      claimIds.forEach(id => {
        if (paidClaimIds.has(id)) statusCounts["Approved"]++;
        else if (flaggedClaimIds.has(id)) statusCounts["Rejected"]++;
        else statusCounts["Pending"]++;
      });

      setClaimsData(Object.entries(statusCounts).map(([status, count]) => ({ status, count })));

      const budgetLockedEvents = await contract.queryFilter(contract.filters.BudgetLocked(), 0, blockNumber);
      const activityEvents = [...budgetLockedEvents, ...claimSubmittedEvents];

      const activities = activityEvents.map((event, id) => {
        const decoded = contractInterface.parseLog(event);
        if (!decoded) return null;

        let action, details, userAddress, amount;
        if (decoded.name === "BudgetLocked") {
          action = "Budget Locked";
          [,, userAddress, amount, details] = decoded.args;
          details = `Purpose: ${details}, Amount: ${ethers.formatEther(amount)} ETH`;
        } else if (decoded.name === "ClaimSubmitted") {
          action = "Claim Submitted";
          [userAddress, amount, details] = decoded.args;
          details = `Claim ID: ${decoded.args.claimId}, Amount: ${ethers.formatEther(amount)} ETH`;
        } else {
          return null;
        }

        return {
          id,
          action,
          user: userAddress ? `${userAddress.substring(0, 6)}...${userAddress.slice(-4)}` : "Unknown",
          role: userAddress === user.address ? user.role : "Unknown",
          details,
          timestamp: new Date().toISOString().split('T')[0] + ` (Block #${event.blockNumber || "unknown"})`,
        };
      }).filter(Boolean) as TableProps["data"];

      activities.sort((a, b) => {
        const blockA = parseInt(a.timestamp.split('#')[1]) || 0;
        const blockB = parseInt(b.timestamp.split('#')[1]) || 0;
        return blockB - blockA;
      });

      setRecentActivity(activities.slice(0, 10));

      setFraudAlerts([
        { id: 1, title: "Unusual Transaction Pattern", description: "Multiple rapid claims detected", severity: "Medium", timestamp: "2025-04-14" },
        { id: 2, title: "Large Amount Alert", description: "Claim exceeds threshold", severity: "Low", timestamp: "2025-04-13" },
      ]);

      setTrailData([
        { name: "Q1", mainGov: 10, stateHead: 5, deputy: 3, vendor: 2 },
        { name: "Q2", mainGov: 8, stateHead: 6, deputy: 4, vendor: 3 },
      ]);

      const challengeStakedEvents = await contract.queryFilter(contract.filters.ChallengeStaked(), 0, blockNumber);
      const challenges = challengeStakedEvents.map((event, id) => {
        const decoded = contractInterface.parseLog(event);
        if (!decoded) return null;
        const [staker, invoiceHash] = decoded.args;
        return {
          id: id + 1,
          invoiceHash: invoiceHash ? invoiceHash.toString().substring(0, 6) + "..." : "Unknown",
          staker: staker ? `${staker.substring(0, 6)}...${staker.slice(-4)}` : "Unknown",
          amount: "0.1",
          claimId: id + 1,
          status: "Active",
          timestamp: new Date().toISOString().split('T')[0] + ` (Block #${event.blockNumber || "unknown"})`,
        };
      }).filter(Boolean) as ChallengeProps["data"];

      setChallengesData(challenges);

    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setDataLoading(false);
    }
  };

  const validateForm = () => {
    const { type, amount, purpose, budgetId, allocationId, invoiceData } = newAction;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Please enter a valid positive amount");
      return false;
    }

    if (type === "budget" && !purpose) {
      setError("Please enter budget purpose");
      return false;
    }

    if (type === "claim") {
      if (!budgetId || !availableBudgets.find(b => b.id === budgetId)) {
        setError("Please select a valid budget");
        return false;
      }

      if (!allocationId || !availableAllocations.find(a => a.id === allocationId)) {
        setError("Please select a valid allocation");
        return false;
      }

      if (!invoiceData) {
        setError("Please enter invoice data");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("handleSubmit called");
  
    setError(null);
    setSuccessMessage(null);
  
    if (!validateForm()) {
      return;
    }
  
    setIsSubmitting(true);
    const { type, amount, purpose, budgetId, allocationId, invoiceData } = newAction;
  
    try {
      const contract = await getClearGovContract();
      const provider = new ethers.BrowserProvider(window.ethereum); // Correctly initialize the provider
      const signer = await provider.getSigner(); // Await the signer
      const signerAddress = await signer.getAddress(); // Retrieve the address
  
      const numAmount = ethers.parseEther(amount);
  
      let tx;
      if (type === "budget") {
        tx = await contract.lockBudget(numAmount, purpose || "", { gasLimit: 300000 });
      } else {
        tx = await contract.submitClaim(
          BigInt(budgetId),
          BigInt(allocationId),
          numAmount,
          invoiceData || "",
          { gasLimit: 500000 }
        );
      }
  
      console.log("Transaction sent, waiting for confirmation...");
      const receipt = await tx.wait();
      const txHash = tx.hash;
      console.log("Transaction confirmed, hash:", txHash);
  
      // Mock BigQuery log
      console.log("Logging to BigQuery:", {
        action: type,
        txHash,
        user: signerAddress || "0xMockUser",
        amount,
        details: type === "budget" ? purpose : `BudgetId: ${budgetId}, AllocationId: ${allocationId}, Invoice: ${invoiceData}`,
      });
  
      setRecentActivity((prev) => [
        {
          id: prev.length + 1,
          action: type === "budget" ? "Budget Locked" : "Claim Submitted",
          user: signerAddress.substring(0, 6) + "..." + signerAddress.slice(-4),
          role: user?.role || "Unknown",
          details: type === "budget"
            ? `Purpose: ${purpose}, Amount: ${amount} ETH, Tx: ${txHash.substring(0, 6)}...`
            : `BudgetId: ${budgetId}, AllocationId: ${allocationId}, Amount: ${amount} ETH, Tx: ${txHash.substring(0, 6)}...`,
          timestamp: new Date().toISOString().split('T')[0] + ` (Block #${receipt.blockNumber || "pending"})`,
        },
        ...prev,
      ]);
  
      setSuccessMessage(`${type === "budget" ? "Budget locked" : "Claim submitted"} successfully! Tx: ${txHash}`);
  
      setNewAction({
        type: "claim",
        amount: "",
        purpose: "",
        budgetId: "0",
        allocationId: "0",
        invoiceData: "",
      });
  
      await fetchDashboardData();
    } catch (err: any) {
      console.error("Submission error:", err);
      if (err.code === 4001) {
        setError("Transaction rejected by user");
      } else if (err.message && err.message.includes("insufficient funds")) {
        setError("Insufficient funds to complete transaction");
      } else if (err.message && err.message.includes("gas")) {
        setError("Gas estimation failed or insufficient gas");
      } else {
        setError(err instanceof Error ? err.message : "Transaction failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleBudgetChange = async (budgetId: string) => {
    setNewAction(prev => ({ ...prev, budgetId, allocationId: "0" }));

    if (!budgetId) return;

    try {
      setDataLoading(true);
      const contract = await getClearGovContract();

      const allocations = [];
      for (let i = 0; i < 10; i++) {
        try {
          const allocation = await contract.allocations(budgetId, i);
          if (allocation.amount > 0 && allocation.assigned) {
            allocations.push({
              budgetId,
              id: i.toString(),
              area: allocation.area,
              amount: ethers.formatEther(allocation.amount),
            });
          }
        } catch (err) {
          break;
        }
      }

      setAvailableAllocations(allocations);
    } catch (err) {
      console.error("Error fetching allocations:", err);
      setError("Failed to load allocations for this budget");
    } finally {
      setDataLoading(false);
    }
  };

  if (isLoading) return <DashboardShell><DashboardSkeleton /></DashboardShell>;
  if (!user) return <DashboardShell><p>Please connect MetaMask to continue</p></DashboardShell>;

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        text={`Welcome to your ${user.role.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} dashboard.`}
      />

      {error && error.includes("Failed to load") && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => fetchDashboardData()}
            className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
            aria-label="Retry loading dashboard data"
          >
            Retry
          </button>
        </div>
      )}

      <div className="mb-8"><RoleBasedActions /></div>
      <DashboardMetrics />

      <div className="grid gap-4 mt-8 md:grid-cols-2 lg:grid-cols-3">
        {dataLoading ? (
          <div className="col-span-3 flex justify-center p-12">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-gray-200 h-12 w-12"></div>
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <TransactionTrailChart data={trailData} />
            <ClaimsStatusChart data={claimsData} />
            <RecentActivityTable data={recentActivity} />
            <FraudAlerts alerts={fraudAlerts} />
            <ActiveChallenges data={challengesData} />
          </>
        )}
      </div>

      <div className="mt-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Submit Action</h2>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded" role="alert">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="action-type" className="block text-sm font-medium text-gray-700 mb-1">
              Action Type
            </label>
            <select
              id="action-type"
              value={newAction.type}
              onChange={(e) => setNewAction({ ...newAction, type: e.target.value as "claim" | "budget" })}
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              aria-required="true"
            >
              <option value="claim">Submit Claim</option>
              <option value="budget">Lock Budget</option>
            </select>
          </div>

          {newAction.type === "claim" && (
            <>
              <div>
                <label htmlFor="budget-id" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Budget
                </label>
                <select
                  id="budget-id"
                  value={newAction.budgetId}
                  onChange={(e) => handleBudgetChange(e.target.value)}
                  className="w-full border rounded-md p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  aria-required="true"
                >
                  <option value="">Select a budget</option>
                  {availableBudgets.map(budget => (
                    <option key={budget.id} value={budget.id}>
                      {budget.purpose} ({budget.amount} ETH)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="allocation-id" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Allocation
                </label>
                <select
                  id="allocation-id"
                  value={newAction.allocationId}
                  onChange={(e) => setNewAction({ ...newAction, allocationId: e.target.value })}
                  className="w-full border rounded-md p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  aria-required="true"
                  disabled={availableAllocations.length === 0}
                >
                  <option value="">Select an allocation</option>
                  {availableAllocations.map(allocation => (
                    <option key={allocation.id} value={allocation.id}>
                      {allocation.area} ({allocation.amount} ETH)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="claim-amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (ETH)
                </label>
                <input
                  id="claim-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={newAction.amount}
                  onChange={(e) => setNewAction({ ...newAction, amount: e.target.value })}
                  placeholder="Amount"
                  className="w-full border rounded-md p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  aria-required="true"
                />
              </div>

              <div>
                <label htmlFor="invoice-data" className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Data
                </label>
                <textarea
                  id="invoice-data"
                  value={newAction.invoiceData}
                  onChange={(e) => setNewAction({ ...newAction, invoiceData: e.target.value })}
                  placeholder="Enter invoice details (JSON format recommended)"
                  className="w-full border rounded-md p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  rows={3}
                  required
                  aria-required="true"
                />
              </div>
            </>
          )}

          {newAction.type === "budget" && (
            <>
              <div>
                <label htmlFor="budget-amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (ETH)
                </label>
                <input
                  id="budget-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={newAction.amount}
                  onChange={(e) => setNewAction({ ...newAction, amount: e.target.value })}
                  placeholder="Amount"
                  className="w-full border rounded-md p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="budget-purpose" className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose
                </label>
                <input
                  id="budget-purpose"
                  type="text"
                  value={newAction.purpose}
                  onChange={(e) => setNewAction({ ...newAction, purpose: e.target.value })}
                  placeholder="Budget purpose"
                  className="w-full border rounded-md p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  aria-required="true"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-600 text-white p-3 rounded-md hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
            aria-label={isSubmitting ? "Submitting action" : "Submit action"}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>

          {error && !error.includes("Failed to load") && (
            <p className="text-red-500 text-sm mt-2" role="alert">
              {error}
            </p>
          )}
        </form>
      </div>
    </DashboardShell>
  );
}