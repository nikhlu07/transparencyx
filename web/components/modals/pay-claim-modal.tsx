"use client"

import type React from "react"
import { ethers } from "ethers"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { getClearGovContract } from "@/app/lib/contractConfig"

interface PayClaimModalProps {
  open: boolean
  onClose: () => void
}

export function PayClaimModal({ open, onClose }: PayClaimModalProps) {
  const { user } = useAuth()
  const [claimId, setClaimId] = useState("")
  const [loading, setLoading] = useState(false)

  // Fetch approved claims from contract
  const [approvedClaims, setApprovedClaims] = useState<{ id: string; vendor: string; amount: string; description: string }[]>([])
  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const contract = await getClearGovContract()
        const claimCount = await contract.claimCount()
        const claimList = []
        for (let i = 1; i <= claimCount; i++) {
          const claim = await contract.getClaim(i)
          if (claim.aiApproved && !claim.flagged && !claim.paid) {
            claimList.push({
              id: i.toString(),
              vendor: claim.vendor,
              amount: `$${ethers.formatEther(claim.amount)}`,
              description: `Claim #${i} by ${claim.vendor.slice(0, 6)}...`,
            })
          }
        }
        setApprovedClaims(claimList)
      } catch (error) {
        console.error("Error fetching claims:", error)
      }
    }
    fetchClaims()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || user.role !== "main-government") return // Prevent submission if user is invalid or unauthorized
    setLoading(true)

    try {
      const contract = await getClearGovContract()
      const tx = await contract.payClaim(claimId, { gasLimit: 1000000 })
      await tx.wait()
      console.log("Claim paid with tx:", tx.hash)
    } catch (error) {
      console.error("Error paying claim:", error)
    } finally {
      setLoading(false)
      onClose()
      setClaimId("")
    }
  }

  if (!user) return null // Render nothing if no user

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Pay Claim</DialogTitle>
            <DialogDescription>Pay an approved claim to the vendor.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="claim">Approved Claim</Label>
              <Select value={claimId} onValueChange={setClaimId}>
                <SelectTrigger id="claim">
                  <SelectValue placeholder="Select claim" />
                </SelectTrigger>
                <SelectContent>
                  {approvedClaims.map((claim) => (
                    <SelectItem key={claim.id} value={claim.id}>
                      {claim.description} ({claim.amount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={loading || user.role !== "main-government" || !claimId}
            >
              {loading ? "Processing..." : "Pay Claim"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}