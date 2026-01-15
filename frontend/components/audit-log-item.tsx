import { cn } from "@/lib/utils"
import type { AuditLog } from "@/lib/types"
import {
  LogIn,
  LogOut,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  FileText,
  type LucideIcon,
} from "lucide-react"

interface AuditLogItemProps {
  log: AuditLog
}

const actionIcons: Record<string, LucideIcon> = {
  AUTH_CHALLENGE_REQUESTED: Shield,
  AUTH_SUCCESS: LogIn,
  AUTH_FAILED: LogOut,
  TRANSACTION_CREATED: Send,
  TRANSACTION_APPROVED: CheckCircle,
  TRANSACTION_REJECTED: XCircle,
  TRANSACTION_BLOCKED: AlertTriangle,
  TRANSACTION_BLOCKCHAIN_FAILED: AlertTriangle,
}

const actionColors: Record<string, string> = {
  AUTH_CHALLENGE_REQUESTED: "text-muted-foreground bg-muted",
  AUTH_SUCCESS: "text-success bg-success/10",
  AUTH_FAILED: "text-destructive bg-destructive/10",
  TRANSACTION_CREATED: "text-chart-1 bg-chart-1/10",
  TRANSACTION_APPROVED: "text-success bg-success/10",
  TRANSACTION_REJECTED: "text-destructive bg-destructive/10",
  TRANSACTION_BLOCKED: "text-warning bg-warning/10",
  TRANSACTION_BLOCKCHAIN_FAILED: "text-destructive bg-destructive/10",
}

export function AuditLogItem({ log }: AuditLogItemProps) {
  const Icon = actionIcons[log.action] || FileText
  const colorClass = actionColors[log.action] || "text-muted-foreground bg-muted"

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatAction = (action: string) => {
    return action.replace(/_/g, " ").toLowerCase()
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`
  }

  return (
    <div className="flex gap-4 rounded-lg border border-border bg-card p-4">
      {/* Icon */}
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", colorClass)}>
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium capitalize text-foreground">{formatAction(log.action)}</span>
          <span className="text-sm text-muted-foreground">{formatDate(log.timestamp)}</span>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Wallet: </span>
            <span className="font-mono text-foreground">{truncateAddress(log.walletAddress)}</span>
          </div>
          {log.targetId && (
            <div>
              <span className="text-muted-foreground">Target: </span>
              <span className="font-mono text-foreground">{log.targetId.slice(0, 8)}...</span>
            </div>
          )}
        </div>

        {/* Metadata */}
        {Object.keys(log.metadata).length > 0 && (
          <div className="rounded bg-muted/50 p-2">
            <pre className="overflow-x-auto text-xs text-muted-foreground">{JSON.stringify(log.metadata, null, 2)}</pre>
          </div>
        )}

        {/* Hash */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Hash:</span>
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-muted-foreground">
            {truncateHash(log.hash)}
          </code>
        </div>
      </div>
    </div>
  )
}
