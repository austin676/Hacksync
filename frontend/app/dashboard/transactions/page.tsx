"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TransactionsTable } from "@/components/transactions-table"
import { CreateTransactionDialog } from "@/components/create-transaction-dialog"
import { Loader2 } from "lucide-react"

export default function TransactionsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const handleTransactionCreated = () => {
    setRefreshKey((k) => k + 1)
  }

  const canCreateTransactions = user?.role === "user" || user?.role === "admin"

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
            <p className="text-muted-foreground">
              {user?.role === "auditor" ? "View all transaction history" : "Manage your blockchain transactions"}
            </p>
          </div>
          {canCreateTransactions && <CreateTransactionDialog onSuccess={handleTransactionCreated} />}
        </div>

        {/* Transactions Table */}
        <TransactionsTable refreshKey={refreshKey} />
      </div>
    </DashboardLayout>
  )
}
