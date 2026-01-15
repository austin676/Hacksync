"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { WalletConnect } from "@/components/wallet-connect"
import { DemoWalletConnect } from "@/components/demo-wallet-connect"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Zap, Lock, ArrowRight, Loader2 } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router, mounted])

  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const handleSuccess = () => {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">WalletAuth</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">
              Features
            </a>
            <a href="#security" className="text-sm text-muted-foreground hover:text-foreground">
              Security
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Info */}
          <div className="flex flex-col justify-center">
            <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Secure Blockchain Transaction Management
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              Authenticate with your wallet, manage transactions, and maintain complete audit trails. No passwords, just
              cryptographic security.
            </p>

            {/* Feature Cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-1 font-medium text-foreground">Wallet-Based Auth</h3>
                <p className="text-sm text-muted-foreground">
                  Sign messages with your private key. No passwords to remember or steal.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Shield className="h-5 w-5 text-success" />
                </div>
                <h3 className="mb-1 font-medium text-foreground">Role-Based Access</h3>
                <p className="text-sm text-muted-foreground">
                  Users, Admins, and Auditors with granular permission controls.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Zap className="h-5 w-5 text-warning" />
                </div>
                <h3 className="mb-1 font-medium text-foreground">Fraud Detection</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time anomaly detection for suspicious transaction patterns.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-chart-5/10">
                  <ArrowRight className="h-5 w-5 text-chart-5" />
                </div>
                <h3 className="mb-1 font-medium text-foreground">Immutable Audit</h3>
                <p className="text-sm text-muted-foreground">
                  Tamper-proof audit logs with cryptographic hash chain verification.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Connect */}
          <div className="flex items-center justify-center">
            <Tabs defaultValue="demo" className="w-full max-w-md">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="demo">Demo Mode</TabsTrigger>
                <TabsTrigger value="metamask">MetaMask</TabsTrigger>
              </TabsList>
              <TabsContent value="demo" className="mt-4">
                <DemoWalletConnect onSuccess={handleSuccess} />
              </TabsContent>
              <TabsContent value="metamask" className="mt-4">
                <WalletConnect onSuccess={handleSuccess} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-4">
          <p className="text-center text-sm text-muted-foreground">
            WalletAuth - Blockchain Transaction Management System
          </p>
        </div>
      </footer>
    </div>
  )
}
