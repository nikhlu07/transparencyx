"use client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ethers } from "ethers"
import { useAuth } from "@/contexts/auth-context"
import { getClearGovContract } from "@/app/lib/contractConfig"
import { useEffect, useState } from "react"

interface ViewPaymentHistoryModalProps {
  open: boolean
  onClose: () => void
}

export function ViewPaymentHistoryModal({ open, onClose }: ViewPaymentHistoryModalProps) {
  const { user } = useAuth()
  const [paymentHistory, setPaymentHistory] = useState<
    { id: number; from: string; amount: string; invoiceHash: string; timestamp: string; status: string }[]
  >([])

  // Fetch payment history from contract
  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        const contract = await getClearGovContract()
        const paymentCount = await contract.paymentCount()
        const history = []
        for (let i = 1; i <= paymentCount; i++) {
          const payment = await contract.getPayment(i)
          history.push({
            id: i,
            from: payment.from,
            amount: `$${ethers.formatEther(payment.amount)}`,
            invoiceHash: payment.invoiceHash,
            timestamp: new Date(Number(payment.timestamp) * 1000).toLocaleDateString(),
            status: payment.completed ? "completed" : "pending",
          })
        }
        setPaymentHistory(history)
      } catch (error) {
        console.error("Error fetching payment history:", error)
      }
    }
    fetchPaymentHistory()
  }, [])

  if (!user) return null // Render nothing if no user

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Payment History</DialogTitle>
          <DialogDescription>View all payments received as a sub-supplier.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>From</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Invoice Hash</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentHistory.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.id}</TableCell>
                  <TableCell className="font-mono">{payment.from}</TableCell>
                  <TableCell>{payment.amount}</TableCell>
                  <TableCell className="font-mono">{payment.invoiceHash}</TableCell>
                  <TableCell>{payment.timestamp}</TableCell>
                  <TableCell>
                    <Badge variant={payment.status === "completed" ? "success" : "outline"}>{payment.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}