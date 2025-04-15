"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getClearGovContract } from "@/app/lib/contractConfig"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface ProposeDeputyModalProps {
  open: boolean
  onClose: () => void
  state?: string
}

export function ProposeDeputyModal({ open, onClose, state = "California" }: ProposeDeputyModalProps) {
  const { user } = useAuth()
  const [deputyAddress, setDeputyAddress] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || user.role !== "state-head") return
    setLoading(true)

    try {
      const contract = await getClearGovContract()
      const tx = await contract.proposeDeputy(deputyAddress, state, { gasLimit: 1000000 })
      await tx.wait()
      console.log("Deputy proposed with tx:", tx.hash)
      onClose()
    } catch (error) {
      console.error("Error proposing deputy:", error)
    } finally {
      setLoading(false)
      setDeputyAddress("")
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Propose Deputy for {state}</DialogTitle>
            <DialogDescription>Propose a deputy to manage vendor selection in {state}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="deputy-address">Deputy Address</Label>
              <Input
                id="deputy-address"
                placeholder="0x..."
                value={deputyAddress}
                onChange={(e) => setDeputyAddress(e.target.value)}
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
              disabled={loading || user.role !== "state-head" || !deputyAddress}
            >
              {loading ? "Processing..." : "Propose Deputy"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}