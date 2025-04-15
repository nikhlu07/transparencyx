"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { getClearGovContract } from "@/app/lib/contractConfig"

interface StakeChallengeModalProps {
  open: boolean
  onClose: () => void
}

export function StakeChallengeModal({ open, onClose }: StakeChallengeModalProps) {
  const { user } = useAuth()
  const [invoiceHash, setInvoiceHash] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return // Prevent submission if user is invalid
    setLoading(true)

    try {
      const contract = await getClearGovContract()
      const tx = await contract.stakeChallenge(invoiceHash, { gasLimit: 1000000 })
      await tx.wait()
      console.log("Challenge staked with tx:", tx.hash)
    } catch (error) {
      console.error("Error staking challenge:", error)
    } finally {
      setLoading(false)
      onClose()
      setInvoiceHash("")
    }
  }

  if (!user) return null // Render nothing if no user

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Stake Challenge</DialogTitle>
            <DialogDescription>
              Stake 1 PYUSD to challenge a potentially fraudulent claim. If your challenge is verified, you will receive
              a 5 PYUSD reward.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="invoice-hash">Invoice Hash to Challenge</Label>
              <Input
                id="invoice-hash"
                placeholder="0x..."
                value={invoiceHash}
                onChange={(e) => setInvoiceHash(e.target.value)}
                required
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Staking amount: 1 PYUSD</p>
              <p>Potential reward: 5 PYUSD</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={loading || !invoiceHash}
            >
              {loading ? "Processing..." : "Stake Challenge"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}