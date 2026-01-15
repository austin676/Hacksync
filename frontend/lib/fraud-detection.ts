// Fraud and Anomaly Detection Service

import type { Transaction } from "./types"

export interface FraudCheckResult {
  passed: boolean
 // requiresReview: boolean
  riskLevel: "low" | "medium" | "high"
  flags: string[]
}

// Thresholds for anomaly detection
const LARGE_TRANSACTION_THRESHOLD = 10000 // Units of currency
const RAPID_TRANSACTION_WINDOW = 60000 // 1 minute in ms
const MAX_TRANSACTIONS_PER_WINDOW = 3

// In-memory store for recent transactions (would be Redis in production)
const recentTransactions: Map<string, Date[]> = new Map()

export function checkTransaction(
  transaction: Partial<Transaction>,
  userTransactionHistory: Transaction[],
): FraudCheckResult {
  const flags: string[] = []
  let riskLevel: "low" | "medium" | "high" = "low"

  // Check 1: Large transaction amount
  if (transaction.amount && transaction.amount > LARGE_TRANSACTION_THRESHOLD) {
    flags.push(`Large transaction: ${transaction.amount} exceeds threshold of ${LARGE_TRANSACTION_THRESHOLD}`)
    riskLevel = "medium"
  }

  // Check 2: Rapid transaction attempts
  const walletAddress = transaction.walletAddress || ""
  const now = Date.now()
  const recentTxTimes = recentTransactions.get(walletAddress) || []
  const recentCount = recentTxTimes.filter((time) => now - time.getTime() < RAPID_TRANSACTION_WINDOW).length

  if (recentCount >= MAX_TRANSACTIONS_PER_WINDOW) {
    flags.push(`Rapid transactions: ${recentCount + 1} transactions within ${RAPID_TRANSACTION_WINDOW / 1000}s`)
    riskLevel = "high"
  }

  // Check 3: Unusual recipient pattern
  if (transaction.recipient) {
    const recipientHistory = userTransactionHistory.filter((tx) => tx.recipient === transaction.recipient)
    if (recipientHistory.length === 0 && transaction.amount && transaction.amount > 1000) {
      flags.push("New recipient with high-value transaction")
      if (riskLevel === "low") riskLevel = "medium"
    }
  }

  // Check 4: Deviation from average transaction
  if (userTransactionHistory.length > 2 && transaction.amount) {
    const avgAmount = userTransactionHistory.reduce((sum, tx) => sum + tx.amount, 0) / userTransactionHistory.length
    if (transaction.amount > avgAmount * 5) {
      flags.push(`Transaction amount significantly higher than average (${Math.round(avgAmount)})`)
      riskLevel = "high"
    }
  }

  // Record this transaction attempt
  recentTransactions.set(walletAddress, [
    ...recentTxTimes.filter((time) => now - time.getTime() < RAPID_TRANSACTION_WINDOW),
    new Date(),
  ])

  return {
    passed: riskLevel !== "high",
    //passed:true,
    //requiresReview: riskLevel === "high",
    riskLevel,
    flags,
  }
}

// Clear old entries periodically (call this on a schedule in production)
export function cleanupRecentTransactions(): void {
  const now = Date.now()
  for (const [address, times] of recentTransactions.entries()) {
    const validTimes = times.filter((time) => now - time.getTime() < RAPID_TRANSACTION_WINDOW)
    if (validTimes.length === 0) {
      recentTransactions.delete(address)
    } else {
      recentTransactions.set(address, validTimes)
    }
  }
}
