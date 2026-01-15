"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, Clock, CheckCircle, XCircle, Send } from "lucide-react"
import type { Transaction } from "@/lib/types"

interface DashboardStatsProps {
  refreshKey?: number
}

export function DashboardStats({ refreshKey }: DashboardStatsProps) {
  const { token } = useAuth()
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    rejected: 0,
    totalAmount: 0,
  })

  useEffect(() => {
    fetchStats()
  }, [token, refreshKey])

  const fetchStats = async () => {
    if (!token) return

    try {
      const response = await fetch("/api/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        const transactions: Transaction[] = data.transactions

        setStats({
          total: transactions.length,
          pending: transactions.filter((t) => t.status === "pending").length,
          completed: transactions.filter((t) => t.status === "completed").length,
          rejected: transactions.filter((t) => t.status === "rejected").length,
          totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
        })
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
          <Send className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          <p className="text-xs text-muted-foreground">All time</p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          <Clock className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.pending}</div>
          <p className="flex items-center text-xs text-warning">
            <ArrowUpRight className="mr-1 h-3 w-3" />
            Awaiting approval
          </p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.completed}</div>
          <p className="flex items-center text-xs text-success">
            <ArrowUpRight className="mr-1 h-3 w-3" />
            Successfully executed
          </p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
          <XCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.rejected}</div>
          <p className="flex items-center text-xs text-destructive">
            <ArrowDownRight className="mr-1 h-3 w-3" />
            Not approved
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
