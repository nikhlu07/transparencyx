"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getClearGovContract } from "@/app/lib/contractConfig";
import { ethers } from "ethers";

interface ProposeStateModalProps {
  open: boolean;
  onClose: () => void;
  state?: string;
}

export function ProposeStateModal({ open, onClose, state }: ProposeStateModalProps) {
  const { user } = useAuth();
  const [stateHeadAddress, setStateHeadAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressValid, setAddressValid] = useState(true);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setStateHeadAddress(address);
    if (address.trim()) {
      setAddressValid(ethers.isAddress(address));
    } else {
      setAddressValid(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Please connect your wallet.");
      return;
    }
    if (user.role !== "main-government") {
      setError("Only Main Government can propose a state head.");
      return;
    }
    if (!ethers.isAddress(stateHeadAddress)) {
      setError("Please enter a valid Ethereum address.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const contract = await getClearGovContract();
      console.log("Connected to contract at:", await contract.getAddress(), "with caller:", user.address);

      let gasLimit;
      try {
        const gasEstimate = await contract.proposeStateHead.estimateGas(stateHeadAddress);
        gasLimit = Math.floor(Number(gasEstimate) * 1.5); // 50% buffer
        console.log("Gas estimated at:", Number(gasEstimate), "Using limit:", gasLimit);
      } catch (gasErr) {
        console.error("Gas estimation failed:", gasErr);
        gasLimit = 1000000; // Fallback
      }

      console.log(`Proposing state head with address: ${stateHeadAddress}, gasLimit: ${gasLimit}`);
      const tx = await contract.proposeStateHead(stateHeadAddress, { gasLimit });
      console.log("Transaction sent, hash:", tx.hash);

      const receipt = await tx.wait(1);
      console.log("Transaction confirmed, hash:", receipt.transactionHash);

      setStateHeadAddress("");
      onClose();
    } catch (err: any) {
      console.error("Error proposing state head:", err);
      if (err.code === 4001 || (err.message && err.message.includes("user rejected"))) {
        setError("Transaction rejected by user. Please approve in MetaMask.");
      } else if (err.message.includes("insufficient funds")) {
        setError("Insufficient funds. Ensure you have ETH on Sepolia.");
      } else if (err.message.includes("revert")) {
        setError(`Transaction reverted. Possible causes:
1. Your address (${user.address}) may not have the main-government role.
2. A state head may already be proposed or confirmed.
3. The contract might be paused. Check with the deployer.
Share the full error for more help.`);
      } else if (err.message.includes("timeout")) {
        setError("Transaction timed out. Check your Sepolia RPC.");
      } else {
        setError(err.message || "Failed to propose state head. Check console.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setStateHeadAddress("");
        setError(null);
        setAddressValid(true);
      }
      onClose();
    }}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Propose State Head for {state || "a State"}</DialogTitle>
            <DialogDescription>Propose a state head to manage {state || "this"} governance.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="state-head-address">State Head Address</Label>
              <Input
                id="state-head-address"
                placeholder="0x..."
                value={stateHeadAddress}
                onChange={handleAddressChange}
                className={!addressValid ? "border-red-500" : ""}
                required
              />
              {!addressValid && (
                <p className="text-red-500 text-xs mt-1">Please enter a valid Ethereum address</p>
              )}
            </div>
            {error && (
              <div className="bg-red-50 p-3 rounded border border-red-200">
                <p className="text-red-600 text-sm whitespace-pre-line">{error}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={loading || !stateHeadAddress || !addressValid}
            >
              {loading ? "Processing..." : "Propose State Head"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}