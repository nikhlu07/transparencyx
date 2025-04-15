"use client"

import type React from "react"
import { ethers } from "ethers"
import { useState, useEffect } from "react"
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
import { useAuth } from "@/contexts/auth-context"
import { getClearGovContract } from "@/app/lib/contractConfig"

// Define interfaces for contract data
interface Payment {
  supplier: string;
  amount: ethers.BigNumberish; // Updated to BigNumberish for ethers v6 compatibility
  [key: string]: any; // Allow for additional fields
}

interface PaySubSupplierModalProps {
  open: boolean
  onClose: () => void
}

export function PaySubSupplierModal({ open, onClose }: PaySubSupplierModalProps) {
  const { user } = useAuth()
  const [claimId, setClaimId] = useState("")
  const [paymentIndex, setPaymentIndex] = useState("")
  const [subSupplierAddress, setSubSupplierAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [invoiceHash, setInvoiceHash] = useState("")
  const [loading, setLoading] = useState(false)

  // Fetch claims and payments from contract
  const [claims, setClaims] = useState<{ id: string; description: string }[]>([])
  const [payments, setPayments] = useState<{ [key: string]: { id: string; supplier: string; amount: string }[] }>({})
  useEffect(() => {
    const fetchData = async () => {
      try {
        const contract = await getClearGovContract()
        const claimCount = await contract.claimCount()
        const claimList = []
        const paymentMap: { [key: string]: { id: string; supplier: string; amount: string }[] } = {}
        for (let i = 1; i <= claimCount; i++) {
          const claim = await contract.getClaim(i)
          if (claim.paid) {
            claimList.push({ id: i.toString(), description: `Claim #${i}` })
            const paymentsForClaim = await contract.getSupplierPayments(i) as Payment[]
            paymentMap[i.toString()] = paymentsForClaim.map((p, idx) => ({
              id: idx.toString(),
              supplier: p.supplier,
              amount: `$${ethers.formatEther(p.amount)}`, // formatEther handles BigNumberish
            }))
          }
        }
        setClaims(claimList)
        setPayments(paymentMap)
      } catch (error) {
        console.error("Error fetching claims/payments:", error)
      }
    }
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)

    try {
      const contract = await getClearGovContract()
      const tx = await contract.paySubSupplier(claimId, paymentIndex, subSupplierAddress, amount, invoiceHash, { gasLimit: 1000000 })
      await tx.wait()
      console.log("Sub-supplier paid with tx:", tx.hash)
    } catch (error) {
      console.error("Error paying sub-supplier:", error)
    } finally {
      setLoading(false)
      onClose()
      setClaimId("")
      setPaymentIndex("")
      setSubSupplierAddress("")
      setAmount("")
      setInvoiceHash("")
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Pay Sub-Supplier</DialogTitle>
            <DialogDescription>Pay a sub-supplier for goods or services provided.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="claim">Claim</Label>
              <Select
                value={claimId}
                onValueChange={(value) => {
                  setClaimId(value)
                  setPaymentIndex("")
                }}
              >
                <SelectTrigger id="claim">
                  <SelectValue placeholder="Select claim" />
                </SelectTrigger>
                <SelectContent>
                  {claims.map((claim) => (
                    <SelectItem key={claim.id} value={claim.id}>
                      {claim.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {claimId && (
              <div className="grid gap-2">
                <Label htmlFor="payment">Payment</Label>
                <Select value={paymentIndex} onValueChange={setPaymentIndex}>
                  <SelectTrigger id="payment">
                    <SelectValue placeholder="Select payment" />
                  </SelectTrigger>
                  <SelectContent>
                    {payments[claimId]?.map((payment) => (
                      <SelectItem key={payment.id} value={payment.id}>
                        Payment to {payment.supplier} ({payment.amount})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="sub-supplier-address">Sub-Supplier Address</Label>
              <Input
                id="sub-supplier-address"
                placeholder="0x..."
                value={subSupplierAddress}
                onChange={(e) => setSubSupplierAddress(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (PYUSD)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="10000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="invoice-hash">Sub-Supplier Invoice Hash</Label>
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
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={loading || !claimId || !paymentIndex || !subSupplierAddress || !amount || !invoiceHash}
            >
              {loading ? "Processing..." : "Pay Sub-Supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}