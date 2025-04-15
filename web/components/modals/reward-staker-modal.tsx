"use client"

import type React from "react"
import { ethers } from "ethers"
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

interface RewardStakerModalProps {
  open: boolean
  onClose: () => void
}

export function RewardStakerModal({ open, onClose }: RewardStakerModalProps) {
  const { user } = useAuth()
  const [invoiceHash, setInvoiceHash] = useState("")
  const [staker, setStaker] = useState("")
  const [loading, setLoading] = useState(false)

  // Fetch challenges and stakers from contract
  const [challenges, setChallenges] = useState<{ invoiceHash: string; description: string }[]>([])
  const [stakers, setStakers] = useState<{ [key: string]: { address: string; amount: string }[] }>({})
  useEffect(() => {
    const fetchData = async () => {
      try {
        const contract = await getClearGovContract()
        const claimCount = await contract.claimCount()
        const challengeList: { invoiceHash: string; description: string }[] = []
        const stakerMap: { [key: string]: { address: string; amount: string }[] } = {}

        for (let i = 1; i <= claimCount; i++) {
          const claim = await contract.getClaim(i)
          const challengesForInvoice = await contract.invoiceChallenges(claim.invoiceHash)
          if (challengesForInvoice.length > 0) {
            challengeList.push({
              invoiceHash: claim.invoiceHash,
              description: `Challenge for Claim #${i}`,
            })
            stakerMap[claim.invoiceHash] = challengesForInvoice.map((challenge: any) => ({
              address: challenge.staker,
              amount: `${ethers.formatEther(challenge.amount)} PYUSD`,
            }))
          }
        }
        setChallenges(challengeList)
        setStakers(stakerMap)
      } catch (error) {
        console.error("Error fetching challenges/stakers:", error)
      }
    }
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || user.role !== "main-government") return // Prevent submission if user is invalid or unauthorized
    setLoading(true)

    try {
      const contract = await getClearGovContract()
      const tx = await contract.rewardStaker(invoiceHash, staker, { gasLimit: 1000000 })
      await tx.wait()
      console.log("Staker rewarded with tx:", tx.hash)
    } catch (error) {
      console.error("Error rewarding staker:", error)
    } finally {
      setLoading(false)
      onClose()
      setInvoiceHash("")
      setStaker("")
    }
  }

  if (!user) return null // Render nothing if no user

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Reward Staker</DialogTitle>
            <DialogDescription>Reward a staker who challenged a fraudulent claim.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="invoice-hash">Challenge</Label>
              <Select
                value={invoiceHash}
                onValueChange={(value) => {
                  setInvoiceHash(value)
                  setStaker("")
                }}
              >
                <SelectTrigger id="invoice-hash">
                  <SelectValue placeholder="Select challenge" />
                </SelectTrigger>
                <SelectContent>
                  {challenges.map((challenge) => (
                    <SelectItem key={challenge.invoiceHash} value={challenge.invoiceHash}>
                      {challenge.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {invoiceHash && (
              <div className="grid gap-2">
                <Label htmlFor="staker">Staker</Label>
                <Select value={staker} onValueChange={setStaker}>
                  <SelectTrigger id="staker">
                    <SelectValue placeholder="Select staker" />
                  </SelectTrigger>
                  <SelectContent>
                    {stakers[invoiceHash]?.map((s) => (
                      <SelectItem key={s.address} value={s.address}>
                        {s.address} ({s.amount})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={loading || user.role !== "main-government" || !invoiceHash || !staker}
            >
              {loading ? "Processing..." : "Reward Staker"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}