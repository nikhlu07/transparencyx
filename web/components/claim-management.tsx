"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, X, AlertTriangle, FileCheck } from "lucide-react"

export function ClaimManagement() {
  const [openDetails, setOpenDetails] = useState(false)
  const [selectedClaim, setSelectedClaim] = useState<any>(null)

  const handleViewDetails = (claim: any) => {
    setSelectedClaim(claim)
    setOpenDetails(true)
  }

  // Sample data for demonstration
  const pendingClaims = [
    {
      id: 1,
      vendor: "0x5678...9012",
      amount: "$50,000",
      invoiceHash: "0xabc...123",
      deputy: "0x3456...7890",
      status: "Pending AI",
    },
    {
      id: 2,
      vendor: "0x6789...0123",
      amount: "$75,000",
      invoiceHash: "0xdef...456",
      deputy: "0x4567...8901",
      status: "Pending AI",
    },
  ]

  const approvedClaims = [
    {
      id: 3,
      vendor: "0x7890...1234",
      amount: "$100,000",
      invoiceHash: "0xghi...789",
      deputy: "0x3456...7890",
      status: "Approved",
      escrowTime: "Feb 20, 2025",
    },
  ]

  const flaggedClaims = [
    {
      id: 4,
      vendor: "0x8901...2345",
      amount: "$25,000",
      invoiceHash: "0xjkl...012",
      deputy: "0x4567...8901",
      status: "Flagged",
      reason: "Suspicious invoice amount",
    },
  ]

  const paidClaims = [
    {
      id: 5,
      vendor: "0x9012...3456",
      amount: "$80,000",
      invoiceHash: "0xmno...345",
      deputy: "0x3456...7890",
      status: "Paid",
      paidAt: "Jan 30, 2025",
    },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Claim Management</h2>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingClaims.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedClaims.length})</TabsTrigger>
          <TabsTrigger value="flagged">Flagged ({flaggedClaims.length})</TabsTrigger>
          <TabsTrigger value="paid">Paid ({paidClaims.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Claims</CardTitle>
              <CardDescription>Claims waiting for AI verification.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Invoice Hash</TableHead>
                    <TableHead>Deputy</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingClaims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell>{claim.id}</TableCell>
                      <TableCell className="font-mono">{claim.vendor}</TableCell>
                      <TableCell>{claim.amount}</TableCell>
                      <TableCell className="font-mono">{claim.invoiceHash}</TableCell>
                      <TableCell className="font-mono">{claim.deputy}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="mr-2" onClick={() => handleViewDetails(claim)}>
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" className="text-emerald-500 mr-2">
                          <Check className="mr-2 h-4 w-4" /> Approve
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-500">
                          <AlertTriangle className="mr-2 h-4 w-4" /> Flag
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approved Claims</CardTitle>
              <CardDescription>Claims approved by AI and waiting for payment.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Invoice Hash</TableHead>
                    <TableHead>Escrow Until</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedClaims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell>{claim.id}</TableCell>
                      <TableCell className="font-mono">{claim.vendor}</TableCell>
                      <TableCell>{claim.amount}</TableCell>
                      <TableCell className="font-mono">{claim.invoiceHash}</TableCell>
                      <TableCell>{claim.escrowTime}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="mr-2" onClick={() => handleViewDetails(claim)}>
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" className="text-emerald-500">
                          <FileCheck className="mr-2 h-4 w-4" /> Pay Claim
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flagged" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Flagged Claims</CardTitle>
              <CardDescription>Claims flagged by AI for review.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Invoice Hash</TableHead>
                    <TableHead>Flag Reason</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flaggedClaims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell>{claim.id}</TableCell>
                      <TableCell className="font-mono">{claim.vendor}</TableCell>
                      <TableCell>{claim.amount}</TableCell>
                      <TableCell className="font-mono">{claim.invoiceHash}</TableCell>
                      <TableCell>{claim.reason}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="mr-2" onClick={() => handleViewDetails(claim)}>
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" className="text-emerald-500 mr-2">
                          <Check className="mr-2 h-4 w-4" /> Override & Approve
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-500">
                          <X className="mr-2 h-4 w-4" /> Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paid" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paid Claims</CardTitle>
              <CardDescription>Claims that have been paid to vendors.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Invoice Hash</TableHead>
                    <TableHead>Paid At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paidClaims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell>{claim.id}</TableCell>
                      <TableCell className="font-mono">{claim.vendor}</TableCell>
                      <TableCell>{claim.amount}</TableCell>
                      <TableCell className="font-mono">{claim.invoiceHash}</TableCell>
                      <TableCell>{claim.paidAt}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(claim)}>
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={openDetails} onOpenChange={setOpenDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Claim Details</DialogTitle>
            <DialogDescription>Detailed information about the selected claim.</DialogDescription>
          </DialogHeader>
          {selectedClaim && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Claim ID</h3>
                  <p>{selectedClaim.id}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Status</h3>
                  <p>{selectedClaim.status}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Vendor</h3>
                  <p className="font-mono">{selectedClaim.vendor}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Amount</h3>
                  <p>{selectedClaim.amount}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Invoice Hash</h3>
                  <p className="font-mono">{selectedClaim.invoiceHash}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Deputy</h3>
                  <p className="font-mono">{selectedClaim.deputy}</p>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold mb-2">Supplier Payments</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Invoice Hash</TableHead>
                      <TableHead>Verified</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono">0xabcd...1234</TableCell>
                      <TableCell>$30,000</TableCell>
                      <TableCell className="font-mono">0xpqr...678</TableCell>
                      <TableCell>
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                          Yes
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
