"use client"

import type React from "react"
import { ethers } from "ethers";
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useAuth } from "@/contexts/auth-context"
import { getClearGovContract } from "@/app/lib/contractConfig"

interface ApproveClaimModalProps {
  open: boolean
  onClose: () => void
}

export function ApproveClaimModal({ open, onClose }: ApproveClaimModalProps) {
  const { user } = useAuth()
  const [claimId, setClaimId] = useState("")
  const [approve, setApprove] = useState("true")
  const [flagReason, setFlagReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [claimList, setClaimList] = useState<any[]>([]);

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const contract = await getClearGovContract();
        const claimCount = await contract.claimCount();
        const claimList = [];
        for (let i = 1; i <= claimCount; i++) {
          const claim = await contract.getClaim(i);
          claimList.push(claim);
        }
        setClaimList(claimList);
      } catch (error) {
        console.error("Error fetching claims:", error);
      }
    };
    fetchClaims();
  }, []);

  // Fetch real pending claims from contract
  const [pendingClaims, setPendingClaims] = useState<{ id: string; vendor: string; amount: string; description: string }[]>([])
  useEffect(() => {
    const fetchClaims = async () => {
      const contract = await getClearGovContract()
      const claimCount = await contract.claimCount()
      const claimList = []
      for (let i = 1; i <= claimCount; i++) {
        const claim = await contract.getClaim(i)
        if (!claim.paid && !claim.aiApproved && !claim.flagged) {
          claimList.push({
            id: i.toString(),
            vendor: claim.vendor,
            amount: `$${ethers.formatEther(claim.amount)}`,
            description: `Claim #${i} by ${claim.vendor.slice(0, 6)}...`,
          })
        }
      }
      setPendingClaims(claimList)
    }
    fetchClaims()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)

    try {
      const contract = await getClearGovContract()
      if (user.role !== "main-government") throw new Error("Only main government can approve claims")

      const tx = await contract.approveClaimByAI(claimId, approve === "true", flagReason, { gasLimit: 1000000 })
      await tx.wait()
      const txHash = tx.hash
      console.log("Claim processed with tx:", txHash)

      // Store in BigQuery (placeholder API call)
      await fetch("/api/store-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hash: txHash, action: approve === "true" ? "approveClaim" : "flagClaim" }),
      })
    } catch (error) {
      console.error("Error approving/flagging claim:", error)
    } finally {
      setLoading(false)
      onClose()
      setClaimId("")
      setApprove("true")
      setFlagReason("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Approve or Flag Claim</DialogTitle>
            <DialogDescription>Approve a claim for payment or flag it for review.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="claim">Claim</Label>
              <Select value={claimId} onValueChange={setClaimId}>
                <SelectTrigger id="claim">
                  <SelectValue placeholder="Select claim" />
                </SelectTrigger>
                <SelectContent>
                  {pendingClaims.map((claim) => (
                    <SelectItem key={claim.id} value={claim.id}>
                      {claim.description} ({claim.amount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Decision</Label>
              <RadioGroup value={approve} onValueChange={setApprove}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="approve" />
                  <Label htmlFor="approve">Approve</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="flag" />
                  <Label htmlFor="flag">Flag for Review</Label>
                </div>
              </RadioGroup>
            </div>

            {approve === "false" && (
              <div className="grid gap-2">
                <Label htmlFor="flag-reason">Flag Reason</Label>
                <Textarea
                  id="flag-reason"
                  placeholder="Reason for flagging the claim"
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  required={approve === "false"}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading || !user || user.role !== "main-government"}>
              {loading ? "Processing..." : approve === "true" ? "Approve Claim" : "Flag Claim"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}