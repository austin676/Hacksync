"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TransactionStatusBadge } from "@/components/transaction-status-badge"
import { Loader2, ExternalLink } from "lucide-react"
import type { Transaction } from "@/lib/types"

interface TransactionsTableProps {
  refreshKey?: number
}

export function TransactionsTable({ refreshKey }: TransactionsTableProps) {
  const { token } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTransactions()
  }, [token, refreshKey])

  const fetchTransactions = async () => {
    if (!token) return

    try {
      const response = await fetch("/api/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch transactions")
      }

      const data = await response.json()
      setTransactions(data.transactions)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">No transactions found</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Recipient</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tx Hash</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell className="text-muted-foreground">{formatDate(tx.createdAt)}</TableCell>
              <TableCell className="font-mono text-sm">{truncateAddress(tx.recipient)}</TableCell>
              <TableCell className="text-right font-medium">{tx.amount.toLocaleString()}</TableCell>
              <TableCell>
                <TransactionStatusBadge status={tx.status} />
              </TableCell>
              <TableCell>
                {tx.blockchainTxHash ? (
                  <a
                    href={`https://etherscan.io/tx/${tx.blockchainTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                  >
                    {truncateAddress(tx.blockchainTxHash)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
