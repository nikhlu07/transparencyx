"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShieldCheck, Info, AlertCircle, CheckCircle2, X } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// MetaMask detection and type safety
declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [role, setRole] = useState("main-government")
  const [address, setAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [addressValid, setAddressValid] = useState<boolean | null>(null)
  const [metaMaskAvailable, setMetaMaskAvailable] = useState(false)
  const [connectingMetaMask, setConnectingMetaMask] = useState(false)

  // Check if MetaMask is available
  useEffect(() => {
    if (typeof window !== "undefined") {
      setMetaMaskAvailable(!!window.ethereum && !!window.ethereum.isMetaMask)
    }
  }, [])

  // Validate Ethereum address as user types
  useEffect(() => {
    if (!address) {
      setAddressValid(null)
      return
    }
    
    // Basic validation (starts with 0x and has appropriate length)
    const isBasicValid = address.startsWith("0x") && address.length === 42
    
    // Advanced validation (check if it's a proper hex address)
    const isHexValid = /^0x[0-9a-fA-F]{40}$/.test(address)
    
    setAddressValid(isBasicValid && isHexValid)
  }, [address])

  const connectMetaMask = async () => {
    if (!window.ethereum) {
      setError("MetaMask not detected. Please install MetaMask first.")
      return
    }

    setConnectingMetaMask(true)
    setError("")

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      if (accounts.length > 0) {
        setAddress(accounts[0])
        setAddressValid(true)
      } else {
        setError("No accounts found. Please create an account in MetaMask.")
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to MetaMask")
    } finally {
      setConnectingMetaMask(false)
    }
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAddress(value)
    setError("") // Clear any previous errors when user is typing
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!addressValid) {
      setError("Please enter a valid Ethereum address")
      setLoading(false)
      return
    }

    // Simulate login - in a real app, this would connect to a wallet and verify on blockchain
    setTimeout(() => {
      login(address, role as any)
      setLoading(false)
      router.push("/dashboard")
    }, 1000)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Link href="/" className="absolute left-8 top-8 flex items-center gap-2 hover:opacity-80 transition-opacity">
        <ShieldCheck className="h-6 w-6 text-emerald-600" />
        <span className="text-xl font-bold">TransparencyX</span>
      </Link>

      <Card className="w-full max-w-md shadow-lg border-gray-200 dark:border-gray-700">
        <CardHeader className="space-y-1">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">Login to TransparencyX</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4 text-gray-500" />
                  <span className="sr-only">Learn More</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>About Blockchain Access</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                  <p className="mb-4">TransparencyX uses blockchain technology to ensure transparency and accountability in government funding.</p>
                  
                  <h3 className="font-semibold mb-2">How It Works:</h3>
                  <ul className="list-disc pl-5 space-y-1 mb-4">
                    <li>Connect your Ethereum wallet to access the platform</li>
                    <li>Different roles have different levels of access and capabilities</li>
                    <li>All transactions are recorded on the blockchain for complete transparency</li>
                    <li>Smart contracts automate fund releases based on predefined conditions</li>
                  </ul>
                  
                  <h3 className="font-semibold mb-2">Getting Started:</h3>
                  <p>If you don't have MetaMask installed, you can <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">download it here</a>.</p>
                </DialogDescription>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription>Connect your wallet to access the TransparencyX blockchain platform</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main-government">Main Government</SelectItem>
                  <SelectItem value="state-head">State Head</SelectItem>
                  <SelectItem value="deputy">Deputy</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="supplier">Supplier</SelectItem>
                  <SelectItem value="sub-supplier">Sub-supplier</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="address">Wallet Address</Label>
                {metaMaskAvailable && (
                  <span className="text-xs text-emerald-600">MetaMask Detected</span>
                )}
              </div>
              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <Input
                      id="address"
                      placeholder="0x..."
                      value={address}
                      onChange={handleAddressChange}
                      className={`pr-8 ${
                        addressValid === true ? "border-green-500 focus-visible:ring-green-500" : 
                        addressValid === false ? "border-red-500 focus-visible:ring-red-500" : ""
                      }`}
                    />
                    {address && (
                      <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                        {addressValid === true && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        {addressValid === false && <X className="h-4 w-4 text-red-500" />}
                      </div>
                    )}
                  </div>
                  {metaMaskAvailable && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-shrink-0 border-emerald-600 text-emerald-600" 
                      onClick={connectMetaMask}
                      disabled={connectingMetaMask}
                    >
                      {connectingMetaMask ? "Connecting..." : "MetaMask"}
                    </Button>
                  )}
                </div>
                {addressValid === false && !error && (
                  <p className="text-xs text-red-500 mt-1">Invalid Ethereum address format</p>
                )}
                {addressValid === true && !error && (
                  <p className="text-xs text-green-500 mt-1">Valid Ethereum address detected</p>
                )}
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <p>{error}</p>
                </div>
              )}
            </div>

            <div className="pt-2 pb-1">
              <Button 
                variant="link" 
                className="text-sm text-gray-500 hover:text-emerald-600 p-0 h-auto" 
                type="button"
                onClick={() => window.open("https://docs.TransparencyX.org/getting-started", "_blank")}
              >
                Learn more about accessing the blockchain platform
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700" 
              type="submit" 
              disabled={loading || addressValid === false}
            >
              {loading ? "Connecting..." : "Connect Wallet"}
            </Button>
            
            <div className="text-xs text-center text-gray-500">
              No wallet? <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Install MetaMask</a> to get started
            </div>
          </CardFooter>
        </form>
      </Card>

      <div className="absolute bottom-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} TransparencyX. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link href="/privacy" className="hover:text-emerald-600">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-emerald-600">Terms of Service</Link>
        </div>
      </div>
    </div>
  )
}