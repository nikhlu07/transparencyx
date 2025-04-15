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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PaySupplierModalProps {
  open: boolean
  onClose: () => void
}

export function PaySupplierModal({ open, onClose }: PaySupplierModalProps) {
  const [claimId, setClaimId] = useState("")
  const [supplierAddress, setSupplierAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [invoiceHash, setInvoiceHash] = useState("")
  const [loading, setLoading] = useState(false)

  // Mock data
  const claims = [
    { id: "1", description: "Elementary Schools Supplies" },
    { id: "2", description: "Road Repair Materials" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Simulate contract call
      console.log("Calling paySupplier with:", { claimId, supplierAddress, amount, invoiceHash })

      // In a real implementation, this would call the contract method
      // const tx = await contract.paySupplier(claimId, supplierAddress, amount, invoiceHash)
      // await tx.wait()

      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      onClose()
      setClaimId("")
      setSupplierAddress("")
      setAmount("")
      setInvoiceHash("")
    } catch (error) {
      console.error("Error paying supplier:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Pay Supplier</DialogTitle>
            <DialogDescription>Pay a supplier for goods or services provided.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="claim">Claim</Label>
              <Select value={claimId} onValueChange={setClaimId}>
                <SelectTrigger id="claim">
                  <SelectValue placeholder="Select claim" />
                </SelectTrigger>
                <SelectContent>
                  {claims.map((claim) => (
                    <SelectItem key={claim.id} value={claim.id}>
                      Claim #{claim.id}: {claim.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="supplier-address">Supplier Address</Label>
              <Input
                id="supplier-address"
                placeholder="0x..."
                value={supplierAddress}
                onChange={(e) => setSupplierAddress(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (PYUSD)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="25000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="invoice-hash">Supplier Invoice Hash</Label>
              <Input
                id="invoice-hash"
                placeholder="IPFS hash or invoice identifier"
                value={invoiceHash}
                onChange={(e) => setInvoiceHash(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
              {loading ? "Processing..." : "Pay Supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
