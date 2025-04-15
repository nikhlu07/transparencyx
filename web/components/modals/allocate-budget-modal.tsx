"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { getClearGovContract } from "@/app/lib/contractConfig";
import { ethers } from "ethers";

interface AllocateBudgetModalProps {
  open: boolean;
  onClose: () => void;
}

export function AllocateBudgetModal({ open, onClose }: AllocateBudgetModalProps) {
  const { user } = useAuth();
  const [budgetId, setBudgetId] = useState("");
  const [amount, setAmount] = useState("");
  const [area, setArea] = useState("");
  const [deputy, setDeputy] = useState("");
  const [loading, setLoading] = useState(false);
  const [budgets, setBudgets] = useState<{ id: string; name: string }[]>([]);
  const [deputies, setDeputies] = useState<{ address: string; name: string }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!open || !user) return;
      setLoading(true);
      try {
        const contract = await getClearGovContract();
        const budgetCount = Number(await contract.budgetCount());
        const budgetList = [];
        for (let i = 0; i < budgetCount; i++) {
          const budget = await contract.budgets(i);
          budgetList.push({
            id: i.toString(),
            name: `${budget.purpose} (ID: ${i}, ${ethers.formatEther(budget.amount)} ETH)`,
          });
        }
        console.log("Budgets fetched:", budgetList);
        setBudgets(budgetList);

        const deputyCount = Number(await contract.deputyCount() || 0);
        const deputyList = [];
        for (let i = 0; i < deputyCount; i++) {
          try {
            const deputy = await contract.vettedVendors(i); // Fixed to match ABI
            if (deputy !== ethers.ZeroAddress) {
              deputyList.push({
                address: deputy,
                name: `Deputy ${deputy.slice(0, 6)}...`,
              });
            }
          } catch (err) {
            console.warn(`Error fetching deputy ${i}:`, err);
          }
        }
        setDeputies(deputyList.length ? deputyList : [
          { address: "0x1234567890123456789012345678901234567890", name: "Deputy 0x1234..." },
          { address: "0x2345678901234567890123456789012345678901", name: "Deputy 0x2345..." },
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const contract = await getClearGovContract();
      console.log("User role:", user.role);
      if (!["main-government", "state-head"].includes(user.role)) throw new Error("Unauthorized");

      const tx = await contract.lockBudget(
        ethers.parseEther(amount),
        area,
        { gasLimit: 1000000 }
      );
      console.log("Tx sent:", tx.hash);
      await tx.wait();
      console.log("Tx confirmed:", tx.hash);

      const signerAddress = await (contract.signer as unknown as ethers.Signer).getAddress();
      console.log("Logging to BigQuery:", {
        hash: tx.hash,
        state: "Default",
        action: "lockBudget",
        user: signerAddress,
        amount,
        area,
      });
    } catch (error) {
      console.error("Error locking budget:", error);
    } finally {
      setLoading(false);
      onClose();
      setBudgetId("");
      setAmount("");
      setArea("");
      setDeputy("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Lock Budget</DialogTitle>
            <DialogDescription>Lock a budget for a specific area.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (ETH)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.5"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="area">Area</Label>
              <Input
                id="area"
                placeholder="Elementary Schools in District 5"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={loading || !user || !["main-government", "state-head"].includes(user.role)}
            >
              {loading ? "Processing..." : "Lock Budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}