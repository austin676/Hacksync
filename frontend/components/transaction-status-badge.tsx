import { cn } from "@/lib/utils"
import type { TransactionStatus } from "@/lib/types"

interface TransactionStatusBadgeProps {
  status: TransactionStatus
  className?: string
}

export function TransactionStatusBadge({ status, className }: TransactionStatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case "created":
        return "bg-muted text-muted-foreground"
      case "pending":
        return "bg-warning/20 text-warning"
      case "approved":
        return "bg-chart-1/20 text-chart-1"
      case "rejected":
        return "bg-destructive/20 text-destructive"
      case "completed":
        return "bg-success/20 text-success"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        getStatusStyles(),
        className,
      )}
    >
      {status}
    </span>
  )
}
