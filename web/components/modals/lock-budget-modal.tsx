"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { useAuth } from "@/contexts/auth-context"
import { getClearGovContract } from "@/app/lib/contractConfig"

interface LockBudgetModalProps {
  open: boolean
  onClose: () => void
}

export function LockBudgetModal({ open, onClose }: LockBudgetModalProps) {
  const { user } = useAuth()
  const [amount, setAmount] = useState("")
  const [purpose, setPurpose] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || user.role !== "main-government") return // Prevent submission if user is invalid or unauthorized
    setLoading(true)

    try {
      const contract = await getClearGovContract()
      const tx = await contract.lockBudget(amount, purpose, { gasLimit: 1000000 })
      await tx.wait()
      console.log("Budget locked with tx:", tx.hash)
    } catch (error) {
      console.error("Error locking budget:", error)
    } finally {
      setLoading(false)
      onClose()
      setAmount("")
      setPurpose("")
    }
  }

  if (!user) return null // Render nothing if no user

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Lock Budget</DialogTitle>
            <DialogDescription>Lock a budget for allocation by state heads.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (PYUSD)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="100000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea
                id="purpose"
                placeholder="Education funding for Q2 2025"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
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
              disabled={loading || user.role !== "main-government" || !amount || !purpose}
            >
              {loading ? "Processing..." : "Lock Budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}