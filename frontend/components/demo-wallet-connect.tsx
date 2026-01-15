"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Wallet, CheckCircle2, AlertCircle, Info } from "lucide-react"
import type { UserRole } from "@/lib/types"

interface DemoWalletConnectProps {
  onSuccess?: () => void
}

// Demo wallet addresses with preset roles
const demoWallets: { address: string; role: UserRole; label: string }[] = [
  { address: "0x1234567890123456789012345678901234567890", role: "admin", label: "Admin Wallet" },
  { address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd", role: "auditor", label: "Auditor Wallet" },
  { address: "0x9876543210987654321098765432109876543210", role: "user", label: "User Wallet" },
]

export function DemoWalletConnect({ onSuccess }: DemoWalletConnectProps) {
  const { requestChallenge, login } = useAuth()
  const [selectedWallet, setSelectedWallet] = useState<string>("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const connectDemoWallet = async () => {
    if (!selectedWallet) return

    setIsConnecting(true)
    setError(null)

    try {
      // Get challenge from backend
      const challenge = await requestChallenge(selectedWallet)

      // For demo, we simulate a valid signature
      // In production, this would be signed by the actual wallet
      const mockSignature = "0x" + "a".repeat(130)

      // Verify with backend
      await login(selectedWallet, mockSignature)

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed")
    } finally {
      setIsConnecting(false)
    }
  }

  const selectedWalletInfo = demoWallets.find((w) => w.address === selectedWallet)

  return (
    <Card className="w-full max-w-md border-border bg-card">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Wallet className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl text-foreground">Demo Mode</CardTitle>
        <CardDescription className="text-muted-foreground">
          Select a demo wallet to explore different user roles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {success ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle2 className="h-8 w-8 text-success" />
            <div className="text-center">
              <p className="font-medium text-foreground">Connected!</p>
              <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Select Demo Wallet</label>
              <Select value={selectedWallet} onValueChange={setSelectedWallet}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a wallet role..." />
                </SelectTrigger>
                <SelectContent>
                  {demoWallets.map((wallet) => (
                    <SelectItem key={wallet.address} value={wallet.address}>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex h-2 w-2 rounded-full ${
                            wallet.role === "admin"
                              ? "bg-chart-4"
                              : wallet.role === "auditor"
                                ? "bg-chart-3"
                                : "bg-chart-1"
                          }`}
                        />
                        {wallet.label} ({wallet.role})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedWalletInfo && (
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Role Permissions</span>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {selectedWalletInfo.role === "user" && (
                    <>
                      <li>- Create transactions</li>
                      <li>- View own transactions</li>
                    </>
                  )}
                  {selectedWalletInfo.role === "admin" && (
                    <>
                      <li>- Create transactions</li>
                      <li>- View all transactions</li>
                      <li>- Approve/reject transactions</li>
                      <li>- View audit logs</li>
                    </>
                  )}
                  {selectedWalletInfo.role === "auditor" && (
                    <>
                      <li>- View all transactions (read-only)</li>
                      <li>- View audit logs</li>
                    </>
                  )}
                </ul>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            )}

            <Button onClick={connectDemoWallet} disabled={!selectedWallet || isConnecting} className="w-full" size="lg">
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-5 w-5" />
                  Connect Demo Wallet
                </>
              )}
            </Button>
          </>
        )}

        <p className="text-center text-xs text-muted-foreground">
          This is a demo mode. In production, connect with MetaMask.
        </p>
      </CardContent>
    </Card>
  )
}
