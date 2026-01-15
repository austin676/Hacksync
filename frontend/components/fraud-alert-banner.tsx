"use client"

import { useState } from "react"
import { AlertTriangle, Shield, ShieldAlert, ShieldX, X, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FraudFlag {
  rule: string
  description: string
  severity: "low" | "medium" | "high" | "critical"
  details: Record<string, unknown>
}

interface FraudAlert {
  transactionId: string
  riskLevel: "low" | "medium" | "high" | "critical"
  riskScore: number
  flags: FraudFlag[]
  timestamp: Date
}

interface FraudAlertBannerProps {
  alerts: FraudAlert[]
  onDismiss?: (transactionId: string) => void
}

const severityConfig = {
  low: {
    icon: Shield,
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    textColor: "text-blue-400",
    iconColor: "text-blue-500",
    label: "Low Risk",
  },
  medium: {
    icon: AlertTriangle,
    bgColor: "bg-warning/10",
    borderColor: "border-warning/30",
    textColor: "text-warning",
    iconColor: "text-warning",
    label: "Medium Risk",
  },
  high: {
    icon: ShieldAlert,
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    textColor: "text-orange-400",
    iconColor: "text-orange-500",
    label: "High Risk",
  },
  critical: {
    icon: ShieldX,
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
    textColor: "text-destructive",
    iconColor: "text-destructive",
    label: "Critical Risk",
  },
}

export function FraudAlertBanner({ alerts, onDismiss }: FraudAlertBannerProps) {
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set())

  if (alerts.length === 0) return null

  const toggleExpanded = (id: string) => {
    setExpandedAlerts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Sort by risk level (critical first)
  const sortedAlerts = [...alerts].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 }
    return order[a.riskLevel] - order[b.riskLevel]
  })

  return (
    <div className="space-y-3">
      {sortedAlerts.map((alert) => {
        const config = severityConfig[alert.riskLevel]
        const Icon = config.icon
        const isExpanded = expandedAlerts.has(alert.transactionId)

        return (
          <div
            key={alert.transactionId}
            className={cn("rounded-lg border p-4 transition-all", config.bgColor, config.borderColor)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={cn("mt-0.5 rounded-full p-1.5", config.bgColor)}>
                  <Icon className={cn("h-5 w-5", config.iconColor)} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("font-semibold", config.textColor)}>{config.label}</span>
                    <span
                      className={cn("rounded-full px-2 py-0.5 text-xs font-medium", config.bgColor, config.textColor)}
                    >
                      Score: {alert.riskScore}/100
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Transaction <span className="font-mono text-xs">{alert.transactionId.slice(0, 8)}...</span>{" "}
                    triggered {alert.flags.length} fraud detection rule{alert.flags.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(alert.transactionId)}
                  className={config.textColor}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="mr-1 h-4 w-4" />
                      Hide
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-1 h-4 w-4" />
                      Details
                    </>
                  )}
                </Button>
                {onDismiss && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDismiss(alert.transactionId)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="mt-4 space-y-2 border-t border-border/50 pt-4">
                <h4 className={cn("text-sm font-medium", config.textColor)}>Triggered Rules:</h4>
                <div className="space-y-2">
                  {alert.flags.map((flag, index) => {
                    const flagConfig = severityConfig[flag.severity]
                    return (
                      <div key={index} className="flex items-start gap-2 rounded-md bg-background/50 p-2">
                        <div
                          className={cn("mt-0.5 h-2 w-2 rounded-full", {
                            "bg-blue-500": flag.severity === "low",
                            "bg-warning": flag.severity === "medium",
                            "bg-orange-500": flag.severity === "high",
                            "bg-destructive": flag.severity === "critical",
                          })}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs text-muted-foreground">{flag.rule}</span>
                            <span className={cn("text-xs", flagConfig.textColor)}>{flag.severity.toUpperCase()}</span>
                          </div>
                          <p className="text-sm text-foreground">{flag.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
