"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ApprovalCard } from "@/components/approval-card"
import { Loader2, Inbox } from "lucide-react"
import type { Transaction } from "@/lib/types"

export default function ApprovalsPage() {
  const router = useRouter()
  const { user, token, isAuthenticated, isLoading } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
      return
    }

    // Redirect non-admins
    if (!isLoading && user && user.role !== "admin") {
      router.push("/dashboard")
    }
  }, [isAuthenticated, isLoading, user, router])

  useEffect(() => {
    if (token && user?.role === "admin") {
      fetchPendingTransactions()
    }
  }, [token, user])

  const fetchPendingTransactions = async () => {
    try {
      const response = await fetch("/api/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch transactions")
      }

      const data = await response.json()
      // Filter for pending transactions only
      const pending = data.transactions.filter((tx: Transaction) => tx.status === "pending")
      setTransactions(pending)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsFetching(false)
    }
  }

  const handleActionComplete = () => {
    fetchPendingTransactions()
  }

  if (isLoading || !isAuthenticated || user?.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pending Approvals</h1>
          <p className="text-muted-foreground">Review and approve or reject pending transactions</p>
        </div>

        {/* Stats */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
              <p className="text-2xl font-bold text-foreground">{transactions.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
              <Inbox className="h-6 w-6 text-warning" />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* Loading */}
        {isFetching && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty State */}
        {!isFetching && transactions.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">No Pending Approvals</h3>
            <p className="mt-1 text-muted-foreground">All transactions have been reviewed.</p>
          </div>
        )}

        {/* Approval Cards */}
        {!isFetching && transactions.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {transactions.map((tx) => (
              <ApprovalCard key={tx.id} transaction={tx} onActionComplete={handleActionComplete} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
