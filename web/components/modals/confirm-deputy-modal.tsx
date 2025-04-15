"use client"

import type React from "react"

import { useState } from "react"
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

interface ConfirmDeputyModalProps {
  open: boolean
  onClose: () => void
}

export function ConfirmDeputyModal({ open, onClose }: ConfirmDeputyModalProps) {
  const [deputy, setDeputy] = useState("")
  const [loading, setLoading] = useState(false)

  // Mock data for proposed deputies
  const proposedDeputies = [
    { address: "0x4567...8901", name: "Proposed Deputy 1" },
    { address: "0x5678...9012", name: "Proposed Deputy 2" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Simulate contract call
      console.log("Calling confirmDeputy with:", { deputy })

      // In a real implementation, this would call the contract method
      // const tx = await contract.confirmDeputy(deputy)
      // await tx.wait()

      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      onClose()
      setDeputy("")
    } catch (error) {
      console.error("Error confirming deputy:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Confirm Deputy</DialogTitle>
            <DialogDescription>Confirm a proposed deputy to manage vendor selection.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="deputy">Proposed Deputy</Label>
              <Select value={deputy} onValueChange={setDeputy}>
                <SelectTrigger id="deputy">
                  <SelectValue placeholder="Select proposed deputy" />
                </SelectTrigger>
                <SelectContent>
                  {proposedDeputies.map((dep) => (
                    <SelectItem key={dep.address} value={dep.address}>
                      {dep.name} ({dep.address})
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
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
              {loading ? "Processing..." : "Confirm Deputy"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
