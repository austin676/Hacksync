"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { getUserRole, registerUser, switchToPolygonAmoy, isOnPolygonAmoy } from "@/lib/contract"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Wallet, AlertCircle, CheckCircle2 } from "lucide-react"

type ConnectionStep = "idle" | "connecting" | "switching-network" | "checking" | "registering" | "signing" | "verifying" | "success" | "error"

interface WalletConnectProps {
  onSuccess?: () => void
}

export function WalletConnect({ onSuccess }: WalletConnectProps) {
  const { requestChallenge, login } = useAuth()
  const [step, setStep] = useState<ConnectionStep>("idle")
  const [error, setError] = useState<string | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  const connectWallet = async () => {
    setError(null)
    setStep("connecting")

    try {
      // Check if MetaMask is available
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("MetaMask not detected. Please install MetaMask to continue.")
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please connect your wallet.")
      }

      const address = accounts[0] as string
      setWalletAddress(address)
      
      // Switch to Polygon Amoy network
      setStep("switching-network")
      const onCorrectNetwork = await isOnPolygonAmoy()
      if (!onCorrectNetwork) {
        const switched = await switchToPolygonAmoy()
        if (!switched) {
          throw new Error("Please switch to Polygon Amoy network in MetaMask")
        }
      }
      
      // Check role from smart contract
      setStep("checking")
      let role = "user"
      
      try {
        const contractRole = await getUserRole(address)
        role = contractRole
        setUserRole(contractRole)
        
        // If not registered on contract, register them
        if (contractRole === "none") {
          setStep("registering")
          try {
            await registerUser()
            role = "user"
            setUserRole("user")
          } catch (regError) {
            // User might already be registered or contract not deployed
            console.log("Registration skipped:", regError)
            role = "user"
          }
        }
      } catch (contractError) {
        // Contract might not be deployed yet, continue with default role
        console.log("Contract check skipped:", contractError)
        role = "user"
      }

      setStep("signing")

      // Get challenge from backend
      const challenge = await requestChallenge(address)

      // Request signature from wallet
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [challenge.message, address],
      })

      setStep("verifying")

      // Verify signature with backend (include role from contract)
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          walletAddress: address, 
          signature,
          contractRole: role // Pass role from contract
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Authentication failed")
      }

      const data = await response.json()
      
      // Update auth context manually
      localStorage.setItem("auth_token", data.token)

      setStep("success")
      setTimeout(() => {
        window.location.reload() // Refresh to load new auth state
      }, 1000)
    } catch (err) {
      setStep("error")
      if (err instanceof Error) {
        if (err.message.includes("User rejected") || err.message.includes("User denied")) {
          setError("Connection cancelled. Please try again.")
        } else {
          setError(err.message)
        }
      } else {
        setError("An unexpected error occurred")
      }
    }
  }

  const getStepContent = () => {
    switch (step) {
      case "connecting":
        return {
          icon: <Loader2 className="h-8 w-8 animate-spin text-primary" />,
          title: "Connecting Wallet",
          description: "Please approve the connection request in MetaMask...",
        }
      case "switching-network":
        return {
          icon: <Loader2 className="h-8 w-8 animate-spin text-primary" />,
          title: "Switching to Polygon Amoy",
          description: "Please approve the network switch in MetaMask...",
        }
      case "checking":
        return {
          icon: <Loader2 className="h-8 w-8 animate-spin text-primary" />,
          title: "Checking Role",
          description: "Verifying your role from smart contract...",
        }
      case "registering":
        return {
          icon: <Loader2 className="h-8 w-8 animate-spin text-primary" />,
          title: "Registering User",
          description: "Please confirm the registration transaction...",
        }
      case "signing":
        return {
          icon: <Loader2 className="h-8 w-8 animate-spin text-primary" />,
          title: "Sign Message",
          description: "Please sign the authentication message in your wallet...",
        }
      case "verifying":
        return {
          icon: <Loader2 className="h-8 w-8 animate-spin text-primary" />,
          title: "Verifying Signature",
          description: "Authenticating your wallet ownership...",
        }
      case "success":
        return {
          icon: <CheckCircle2 className="h-8 w-8 text-green-500" />,
          title: "Connected!",
          description: `Wallet ${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)} authenticated as ${userRole || "user"}`,
        }
      case "error":
        return {
          icon: <AlertCircle className="h-8 w-8 text-destructive" />,
          title: "Connection Failed",
          description: error,
        }
      default:
        return null
    }
  }

  const stepContent = getStepContent()

  return (
    <Card className="w-full max-w-md border-border bg-card">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Wallet className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl text-foreground">Connect Wallet</CardTitle>
        <CardDescription className="text-muted-foreground">
          Sign in securely using your Ethereum wallet. No password required.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {stepContent ? (
          <div className="flex flex-col items-center gap-4 py-6">
            {stepContent.icon}
            <div className="text-center">
              <p className="font-medium text-foreground">{stepContent.title}</p>
              <p className="text-sm text-muted-foreground">{stepContent.description}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <h4 className="mb-2 font-medium text-foreground">How it works:</h4>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">
                    1
                  </span>
                  Connect your MetaMask wallet
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">
                    2
                  </span>
                  Sign a verification message
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">
                    3
                  </span>
                  Access your dashboard
                </li>
              </ol>
            </div>
          </div>
        )}

        <Button
          onClick={connectWallet}
          disabled={step === "connecting" || step === "signing" || step === "verifying" || step === "success"}
          className="w-full"
          size="lg"
        >
          {step === "idle" && (
            <>
              <Wallet className="mr-2 h-5 w-5" />
              Connect with MetaMask
            </>
          )}
          {step === "error" && "Try Again"}
          {(step === "connecting" || step === "signing" || step === "verifying") && (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          )}
          {step === "success" && "Redirecting..."}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          By connecting, you agree to sign a message to verify wallet ownership. No transaction fees are required.
        </p>
      </CardContent>
    </Card>
  )
}

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      on?: (event: string, callback: (...args: unknown[]) => void) => void
      removeListener?: (event: string, callback: (...args: unknown[]) => void) => void
    }
  }
}
