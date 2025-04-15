"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ethers } from "ethers"
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

// Define interfaces for contract data
interface Allocation {
  area: string;
  [key: string]: any; // Allow for additional fields
}

interface SelectVendorModalProps {
  open: boolean
  onClose: () => void
}

export function SelectVendorModal({ open, onClose }: SelectVendorModalProps) {
  const { user } = useAuth()
  const [budgetId, setBudgetId] = useState("")
  const [allocationId, setAllocationId] = useState("")
  const [vendor, setVendor] = useState("")
  const [loading, setLoading] = useState(false)

  // Fetch budgets, allocations, and vendors from contract
  const [budgets, setBudgets] = useState<{ id: string; name: string }[]>([])
  const [allocations, setAllocations] = useState<{ [key: string]: { id: string; area: string }[] }>({})
  const [vendors, setVendors] = useState<{ address: string; name: string }[]>([])
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

        const vendorCount = await contract.vendorCount()
        const vendorList = []
        for (let i = 0; i < vendorCount; i++) {
          const vendorAddr = await contract.getVendor(i)
          vendorList.push({ address: vendorAddr, name: `Vendor ${vendorAddr.slice(0, 6)}...` })
        }
        setVendors(vendorList)
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || user.role !== "deputy") return
    setLoading(true)

    try {
      const contract = await getClearGovContract()
      const tx = await contract.selectVendor(budgetId, allocationId, vendor, { gasLimit: 1000000 })
      await tx.wait()
      console.log("Vendor selected with tx:", tx.hash)
    } catch (error) {
      console.error("Error selecting vendor:", error)
    } finally {
      setLoading(false)
      onClose()
      setBudgetId("")
      setAllocationId("")
      setVendor("")
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Select Vendor</DialogTitle>
            <DialogDescription>Select a vendor for a budget allocation.</DialogDescription>
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
              <Label htmlFor="vendor">Vendor</Label>
              <Select value={vendor} onValueChange={setVendor}>
                <SelectTrigger id="vendor">
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v.address} value={v.address}>
                      {v.name} ({v.address})
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
              disabled={loading || user.role !== "deputy" || !budgetId || !allocationId || !vendor}
            >
              {loading ? "Processing..." : "Select Vendor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}