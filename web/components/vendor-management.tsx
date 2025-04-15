"use client"

import type React from "react"

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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Check, X } from "lucide-react"

export function VendorManagement() {
  const [open, setOpen] = useState(false)
  const [vendorAddress, setVendorAddress] = useState("")

  const handleProposeVendor = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would call the contract's proposeVendor function
    console.log("Proposing vendor:", vendorAddress)
    setOpen(false)
    setVendorAddress("")
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-bold">Vendor Management</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" /> Propose Vendor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleProposeVendor}>
              <DialogHeader>
                <DialogTitle>Propose Vendor</DialogTitle>
                <DialogDescription>Propose a new vendor to fulfill budget allocations.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="vendor-address">Vendor Address</Label>
                  <Input
                    id="vendor-address"
                    placeholder="0x..."
                    value={vendorAddress}
                    onChange={(e) => setVendorAddress(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  Propose
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vetted Vendors</CardTitle>
          <CardDescription>View and manage approved vendors who can fulfill allocations.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Proposed At</TableHead>
                <TableHead>Approved At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono">0x5678...9012</TableCell>
                <TableCell>
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                    Approved
                  </span>
                </TableCell>
                <TableCell>Jan 25, 2025</TableCell>
                <TableCell>Jan 26, 2025</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" className="text-red-500">
                    <X className="mr-2 h-4 w-4" /> Remove
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">0x6789...0123</TableCell>
                <TableCell>
                  <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                    Proposed
                  </span>
                </TableCell>
                <TableCell>Feb 10, 2025</TableCell>
                <TableCell>-</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" className="text-emerald-500 mr-2">
                    <Check className="mr-2 h-4 w-4" /> Approve
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-500">
                    <X className="mr-2 h-4 w-4" /> Reject
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
