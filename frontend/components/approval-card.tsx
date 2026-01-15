"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TransactionStatusBadge } from "@/components/transaction-status-badge"
import { Loader2, CheckCircle, XCircle, AlertTriangle, User, ArrowRight } from "lucide-react"
import type { Transaction } from "@/lib/types"

interface ApprovalCardProps {
  transaction: Transaction
  onActionComplete?: () => void
}

export function ApprovalCard({ transaction, onActionComplete }: ApprovalCardProps) {
  const { token } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [action, setAction] = useState<"approve" | "reject" | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAction = async (actionType: "approve" | "reject") => {
    setIsProcessing(true)
    setAction(actionType)
    setError(null)

    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: actionType }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to ${actionType} transaction`)
      }

      onActionComplete?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setAction(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const isLargeTransaction = transaction.amount > 10000

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">
              Transaction #{transaction.id.slice(0, 8)}
            </CardTitle>
            <CardDescription className="text-muted-foreground">{formatDate(transaction.createdAt)}</CardDescription>
          </div>
          <TransactionStatusBadge status={transaction.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Transaction Details */}
        <div className="grid gap-3">
          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">From</span>
            </div>
            <span className="font-mono text-sm text-foreground">{truncateAddress(transaction.walletAddress)}</span>
          </div>

          <div className="flex items-center justify-center">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">To</span>
            </div>
            <span className="font-mono text-sm text-foreground">{truncateAddress(transaction.recipient)}</span>
          </div>
        </div>

        {/* Amount */}
        <div className="rounded-lg border border-border p-4 text-center">
          <p className="text-sm text-muted-foreground">Amount</p>
          <p className="text-3xl font-bold text-foreground">{transaction.amount.toLocaleString()}</p>
        </div>

        {/* Description */}
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">Description</p>
          <p className="mt-1 text-sm text-foreground">{transaction.description}</p>
        </div>

        {/* Warning for large transactions */}
        {isLargeTransaction && (
          <div className="flex items-start gap-2 rounded-lg border border-warning/50 bg-warning/10 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div className="text-sm text-warning">
              <p className="font-medium">Large Transaction Warning</p>
              <p>This transaction exceeds the standard threshold of 10,000 units.</p>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10 bg-transparent"
            onClick={() => handleAction("reject")}
            disabled={isProcessing}
          >
            {isProcessing && action === "reject" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            Reject
          </Button>
          <Button className="flex-1" onClick={() => handleAction("approve")} disabled={isProcessing}>
            {isProcessing && action === "approve" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Approve
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
