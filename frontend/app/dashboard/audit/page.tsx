"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuditLogItem } from "@/components/audit-log-item"
import { Button } from "@/components/ui/button"
import { Loader2, FileText, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react"
import type { AuditLog } from "@/lib/types"

export default function AuditPage() {
  const router = useRouter()
  const { user, token, isAuthenticated, isLoading } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [integrityValid, setIntegrityValid] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
      return
    }

    // Redirect users without audit access
    if (!isLoading && user && user.role === "user") {
      router.push("/dashboard")
    }
  }, [isAuthenticated, isLoading, user, router])

  useEffect(() => {
    if (token && (user?.role === "admin" || user?.role === "auditor")) {
      fetchAuditLogs()
    }
  }, [token, user])

  const fetchAuditLogs = async () => {
    setIsFetching(true)
    setError(null)

    try {
      const response = await fetch("/api/audit?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch audit logs")
      }

      const data = await response.json()
      setLogs(data.logs)
      setIntegrityValid(data.integrityValid)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsFetching(false)
    }
  }

  if (isLoading || !isAuthenticated || user?.role === "user") {
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
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>
            <p className="text-muted-foreground">Immutable, cryptographically verified activity trail</p>
          </div>
          <Button variant="outline" onClick={fetchAuditLogs} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Integrity Status */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Entries</p>
                <p className="text-2xl font-bold text-foreground">{logs.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chart-1/10">
                <FileText className="h-6 w-6 text-chart-1" />
              </div>
            </div>
          </div>

          <div
            className={`rounded-lg border p-4 ${
              integrityValid === null
                ? "border-border bg-card"
                : integrityValid
                  ? "border-success/50 bg-success/5"
                  : "border-destructive/50 bg-destructive/5"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chain Integrity</p>
                <p className="text-lg font-bold text-foreground">
                  {integrityValid === null ? "Checking..." : integrityValid ? "Verified" : "Compromised"}
                </p>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  integrityValid ? "bg-success/10" : "bg-destructive/10"
                }`}
              >
                {integrityValid ? (
                  <CheckCircle className="h-6 w-6 text-success" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <h3 className="mb-2 font-medium text-foreground">About Audit Logs</h3>
          <p className="text-sm text-muted-foreground">
            All actions are recorded in an append-only, tamper-proof log. Each entry is cryptographically hashed with
            the previous entry, creating an unbreakable chain of custody. Any modification to historical records will
            break the hash chain and be immediately detected.
          </p>
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
        {!isFetching && logs.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">No Audit Logs</h3>
            <p className="mt-1 text-muted-foreground">Activity will be recorded here.</p>
          </div>
        )}

        {/* Audit Logs */}
        {!isFetching && logs.length > 0 && (
          <div className="space-y-4">
            {logs.map((log) => (
              <AuditLogItem key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
