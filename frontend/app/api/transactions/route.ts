// API routes for transaction management

import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, getTokenFromHeader } from "@/lib/jwt"
import { hasPermission } from "@/lib/rbac"
import {
  createTransaction,
  getTransactionsByUser,
  getAllTransactions,
  updateTransactionStatus,
  addAuditLog,
} from "@/lib/store"
import { isValidWalletAddress } from "@/lib/mock-blockchain"
import { checkTransaction } from "@/lib/fraud-detection"

// GET - List transactions
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = getTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Check permissions
    if (hasPermission(payload.role, "transaction:read:all")) {
      const transactions = getAllTransactions()
      return NextResponse.json({ transactions })
    } else if (hasPermission(payload.role, "transaction:read:own")) {
      const transactions = getTransactionsByUser(payload.userId)
      return NextResponse.json({ transactions })
    }

    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  } catch (error) {
    console.error("Get transactions error:", error)
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}

// POST - Create transaction
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = getTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (!hasPermission(payload.role, "transaction:create")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { amount, recipient, description } = await request.json()

    // Validate input
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    if (!recipient || !isValidWalletAddress(recipient)) {
      return NextResponse.json({ error: "Invalid recipient address" }, { status: 400 })
    }

    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "Description required" }, { status: 400 })
    }

    // Fraud detection check
    const userTransactions = getTransactionsByUser(payload.userId)
    const fraudCheck = checkTransaction({ amount, recipient, walletAddress: payload.walletAddress }, userTransactions)

    if (!fraudCheck.passed) {
      addAuditLog("TRANSACTION_BLOCKED", payload.userId, payload.walletAddress, null, {
        reason: "Fraud detection",
        flags: fraudCheck.flags,
        riskLevel: fraudCheck.riskLevel,
      })
      return NextResponse.json(
        { error: "Transaction blocked due to security concerns", flags: fraudCheck.flags },
        { status: 400 },
      )
    }

    // Create transaction
    const transaction = createTransaction(payload.userId, payload.walletAddress, amount, recipient, description)

    // Update status to pending (ready for admin approval)
    updateTransactionStatus(transaction.id, "pending")

    // Audit log
    addAuditLog("TRANSACTION_CREATED", payload.userId, payload.walletAddress, transaction.id, {
      amount,
      recipient,
      riskLevel: fraudCheck.riskLevel,
    })

    return NextResponse.json({
      transaction: {
        ...transaction,
        status: "pending",
      },
      fraudCheck: {
        riskLevel: fraudCheck.riskLevel,
        flags: fraudCheck.flags,
      },
    })
  } catch (error) {
    console.error("Create transaction error:", error)
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
  }
}
