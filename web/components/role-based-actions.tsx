"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { LockBudgetModal } from "@/components/modals/lock-budget-modal"
import { AllocateBudgetModal } from "@/components/modals/allocate-budget-modal"
import { ProposeDeputyModal } from "@/components/modals/propose-deputy-modal"
import { ConfirmDeputyModal } from "@/components/modals/confirm-deputy-modal"
import { SelectVendorModal } from "@/components/modals/select-vendor-modal"
import { SubmitClaimModal } from "@/components/modals/submit-claim-modal"
import { PaySupplierModal } from "@/components/modals/pay-supplier-modal"
import { PaySubSupplierModal } from "@/components/modals/pay-sub-supplier-modal"
import { ApproveClaimModal } from "@/components/modals/approve-claim-modal"
import { PayClaimModal } from "@/components/modals/pay-claim-modal"
import { RewardStakerModal } from "@/components/modals/reward-staker-modal"
import { StakeChallengeModal } from "@/components/modals/stake-challenge-modal"
import { ViewPaymentHistoryModal } from "@/components/modals/view-payment-history-modal"
import { ConfirmStateModal } from "@/components/modals/confirm-state-modal"
import { ProposeStateModal } from "@/components/modals/propose-state-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getClearGovContract } from "@/app/lib/contractConfig"
import { ethers } from "ethers"
import { fetchEvents } from "@/components/utils/blockchain" // New import

interface ModalProps {
  open: boolean
  onClose: () => void
  state?: string
}

export function RoleBasedActions() {
  const { user } = useAuth()
  const [openModal, setOpenModal] = useState<string | null>(null)
  const [selectedState, setSelectedState] = useState<string>("California")

  useEffect(() => {
    const loadData = async () => {
      const events = await fetchEvents("0xf8e81d47203a594245e36c48e151709f0c19fbe8", 0, (await new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL).getBlockNumber()) || 0x7be00d);
      console.log("Events:", events);

      const contract = await getClearGovContract();
      try {
        const claimId = 0; // Test with 0, update after submission
        const claim = await contract.getClaim(claimId);
        console.log("Claim data:", claim);
      } catch (error: any) {
        console.error("GetClaim error:", error);
      }
    };
    if (user) loadData();
  }, [user]);

  if (!user) return null

  const handleOpenModal = (modalName: string) => {
    setOpenModal(modalName)
  }

  const handleCloseModal = () => {
    setOpenModal(null)
  }

  const renderActions = () => {
    switch (user.role) {
      case "main-government":
        return (
          <div className="flex flex-wrap gap-2">
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleOpenModal("lockBudget")}>
              Lock Budget
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleOpenModal("approveClaimByAI")}>
              Approve/Flag Claim
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleOpenModal("payClaim")}>
              Pay Claim
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleOpenModal("rewardStaker")}>
              Reward Staker
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleOpenModal("confirmState")}>
              Confirm State Head
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleOpenModal("proposeState")}>
              Propose State Head
            </Button>
          </div>
        )
      case "state-head":
        return (
          <div className="flex flex-wrap gap-2">
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleOpenModal("allocateBudget")}>
              Allocate Budget
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleOpenModal("proposeDeputy")}>
              Propose Deputy
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleOpenModal("confirmDeputy")}>
              Confirm Deputy
            </Button>
          </div>
        )
      case "deputy":
        return (
          <div className="flex flex-wrap gap-2">
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleOpenModal("selectVendor")}>
              Select Vendor
            </Button>
          </div>
        )
      case "vendor":
        return (
          <div className="flex flex-wrap gap-2">
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleOpenModal("submitClaim")}>
              Submit Claim
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleOpenModal("paySupplier")}>
              Pay Supplier
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleOpenModal("paySubSupplier")}>
              Pay Sub-Supplier
            </Button>
          </div>
        )
      case "supplier":
        return (
          <div className="flex flex-wrap gap-2">
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleOpenModal("paySubSupplier")}>
              Pay Sub-Supplier
            </Button>
          </div>
        )
      case "sub-supplier":
        return (
          <div className="flex flex-wrap gap-2">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => handleOpenModal("viewPaymentHistory")}
            >
              View Payment History
            </Button>
          </div>
        )
      case "public":
        return (
          <div className="flex flex-wrap gap-2">
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleOpenModal("stakeChallenge")}>
              Stake Challenge
            </Button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Actions</CardTitle>
        <CardDescription>
          Actions available for your role:{" "}
          {user.role
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")}
        </CardDescription>
      </CardHeader>
      <CardContent>{renderActions()}</CardContent>

      <LockBudgetModal open={openModal === "lockBudget"} onClose={handleCloseModal} />
      <AllocateBudgetModal open={openModal === "allocateBudget"} onClose={handleCloseModal} />
      <ProposeDeputyModal open={openModal === "proposeDeputy"} onClose={handleCloseModal} state={selectedState} />
      <ConfirmDeputyModal open={openModal === "confirmDeputy"} onClose={handleCloseModal} state={selectedState} />
      <SelectVendorModal open={openModal === "selectVendor"} onClose={handleCloseModal} />
      <SubmitClaimModal open={openModal === "submitClaim"} onClose={handleCloseModal} />
      <PaySupplierModal open={openModal === "paySupplier"} onClose={handleCloseModal} />
      <PaySubSupplierModal open={openModal === "paySubSupplier"} onClose={handleCloseModal} />
      <ApproveClaimModal open={openModal === "approveClaimByAI"} onClose={handleCloseModal} />
      <PayClaimModal open={openModal === "payClaim"} onClose={handleCloseModal} />
      <RewardStakerModal open={openModal === "rewardStaker"} onClose={handleCloseModal} />
      <StakeChallengeModal open={openModal === "stakeChallenge"} onClose={handleCloseModal} />
      <ViewPaymentHistoryModal open={openModal === "viewPaymentHistory"} onClose={handleCloseModal} />
      <ConfirmStateModal open={openModal === "confirmState"} onClose={handleCloseModal} state={selectedState} />
      <ProposeStateModal open={openModal === "proposeState"} onClose={handleCloseModal} state={selectedState} />
    </Card>
  )
}