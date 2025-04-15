"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ethers } from "ethers"
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
import { useAuth } from "@/contexts/auth-context"
import {getClearGovContract } from "@/app/lib/contractConfig"

// Define interfaces for contract data
interface Allocation {
  area: string;
  [key: string]: any; // Allow for additional fields
}

interface SubmitClaimModalProps {
  open: boolean
  onClose: () => void
}

export function SubmitClaimModal({ open, onClose }: SubmitClaimModalProps) {
  const { user } = useAuth()
  const [budgetId, setBudgetId] = useState("")
  const [allocationId, setAllocationId] = useState("")
  const [amount, setAmount] = useState("")
  const [invoiceData, setInvoiceData] = useState("")
  const [loading, setLoading] = useState(false)

  // Fetch budgets and allocations from contract
  const [budgets, setBudgets] = useState<{ id: string; name: string }[]>([])
  const [allocations, setAllocations] = useState<{ [key: string]: { id: string; area: string }[] }>({})
  useEffect(() => {
    const fetchData = async () => {
      try {
        const contract = await getClearGovContract()
        const budgetCount = await contract.budgetCount()
        const budgetList = []
        const allocMap: { [key: string]: { id: string; area: string }[] } = {}
        for (let i = 1; i <= budgetCount; i++) {
          const budget = await contract.budgets(i)
          budgetList.push({ id: i.toString(), name: `${budget.purpose} (ID: ${i})` })
          const allocs = await contract.getAllocations(i) as Allocation[]
          allocMap[i.toString()] = allocs.map((a, idx) => ({ id: idx.toString(), area: a.area }))
        }
        setBudgets(budgetList)
        setAllocations(allocMap)
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || user.role !== "vendor") return
    setLoading(true)

    try {
      const contract = await getClearGovContract()
      const tx = await contract.submitClaim(budgetId, allocationId, amount, invoiceData, { gasLimit: 1000000 })
      await tx.wait()
      console.log("Claim submitted with tx:", tx.hash)
    } catch (error) {
      console.error("Error submitting claim:", error)
    } finally {
      setLoading(false)
      onClose()
      setBudgetId("")
      setAllocationId("")
      setAmount("")
      setInvoiceData("")
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Submit Claim</DialogTitle>
            <DialogDescription>Submit a claim for work completed on a budget allocation.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="budget">Budget</Label>
              <Select
                value={budgetId}
                onValueChange={(value) => {
                  setBudgetId(value)
                  setAllocationId("")
                }}
              >
                <SelectTrigger id="budget">
                  <SelectValue placeholder="Select budget" />
                </SelectTrigger>
                <SelectContent>
                  {budgets.map((budget) => (
                    <SelectItem key={budget.id} value={budget.id}>
                      {budget.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {budgetId && (
              <div className="grid gap-2">
                <Label htmlFor="allocation">Allocation</Label>
                <Select value={allocationId} onValueChange={setAllocationId}>
                  <SelectTrigger id="allocation">
                    <SelectValue placeholder="Select allocation" />
                  </SelectTrigger>
                  <SelectContent>
                    {allocations[budgetId]?.map((allocation) => (
                      <SelectItem key={allocation.id} value={allocation.id}>
                        {allocation.area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (PYUSD)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="invoice-data">Invoice Data</Label>
              <Textarea
                id="invoice-data"
                placeholder="Invoice details or IPFS hash"
                value={invoiceData}
                onChange={(e) => setInvoiceData(e.target.value)}
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
              disabled={loading || user.role !== "vendor" || !budgetId || !allocationId || !amount || !invoiceData}
            >
              {loading ? "Processing..." : "Submit Claim"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}