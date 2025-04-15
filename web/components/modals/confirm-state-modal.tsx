"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import { useAuth } from "@/contexts/auth-context"
import { getClearGovContract } from "@/app/lib/contractConfig"

// For ethers v6, we may need to use bigint instead of BigNumber
interface Proposal {
  candidate: string;
  proposalTime: bigint | number;
  confirmed: boolean;
}

interface StateHeadProposal {
  address: string;
  name: string;
}

interface ConfirmStateModalProps {
  open: boolean
  onClose: () => void
  state?: string
}

export function ConfirmStateModal({ open, onClose, state = "Default State" }: ConfirmStateModalProps) {
  const { user } = useAuth()
  const [stateHead, setStateHead] = useState("")
  const [loading, setLoading] = useState(false)
  const [proposedStateHeads, setProposedStateHeads] = useState<StateHeadProposal[]>([])

  useEffect(() => {
    const fetchStateHeads = async () => {
      if (!open) return // Only fetch when modal is open

      try {
        const contract = await getClearGovContract()
        
        // We need to get all possible state head proposals
        // Option 1: Query past StateHeadProposed events
        try {
          const filter = contract.filters.StateHeadProposed()
          const events = await contract.queryFilter(filter)
          
          // Process events to get addresses
          const proposalAddresses: string[] = []
          
          events.forEach(event => {
            // Access the stateHead from the event
            const eventData = (event as any).args
            if (eventData && eventData.stateHead) {
              proposalAddresses.push(eventData.stateHead)
            }
          })
          
          // Deduplicate addresses
          const uniqueAddresses = [...new Set(proposalAddresses)]
          
          // Now fetch each proposal's details
          const heads = await Promise.all(
            uniqueAddresses.map(async (addr) => {
              try {
                const proposal = await contract.stateHeadProposals(addr)
                
                // Only include proposals that are not confirmed
                if (!proposal.confirmed) {
                  return {
                    address: addr,
                    name: `State Head ${addr.slice(0, 6)}...`
                  }
                }
                return null
              } catch (err) {
                console.error(`Error fetching proposal for address ${addr}:`, err)
                return null
              }
            })
          )
          
          // Filter out nulls
          setProposedStateHeads(heads.filter(Boolean) as StateHeadProposal[])
        } catch (eventError) {
          console.error("Error with event query approach:", eventError)
          
          // Option 2: If events don't work, fallback to getting a known list
          // This could be implemented as an API call to your backend
          console.log("Falling back to alternative method to get state heads")
          
          // For now, show an empty list or any hardcoded test data you might need
          setProposedStateHeads([])
        }
      } catch (error) {
        console.error("Error fetching state heads:", error)
      }
    }
    
    fetchStateHeads()
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || user.role !== "main-government") return
    setLoading(true)

    try {
      const contract = await getClearGovContract()
      const tx = await contract.confirmStateHead(stateHead, { gasLimit: 1000000 })
      await tx.wait()
      const txHash = tx.hash
      console.log("State head confirmed with tx:", txHash)
    } catch (error) {
      console.error("Error confirming state head:", error)
    } finally {
      setLoading(false)
      onClose()
      setStateHead("")
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Confirm State Head for {state}</DialogTitle>
            <DialogDescription>Confirm a proposed state head to manage {state} governance.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="stateHead">Proposed State Head</Label>
              <Select value={stateHead} onValueChange={setStateHead}>
                <SelectTrigger id="stateHead">
                  <SelectValue placeholder="Select proposed state head" />
                </SelectTrigger>
                <SelectContent>
                  {proposedStateHeads.length > 0 ? (
                    proposedStateHeads.map((head) => (
                      <SelectItem key={head.address} value={head.address}>
                        {head.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No proposed state heads found
                    </SelectItem>
                  )}
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
              disabled={loading || user.role !== "main-government" || !stateHead}
            >
              {loading ? "Processing..." : "Confirm State Head"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}