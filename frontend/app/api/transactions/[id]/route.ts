// API routes for individual transaction operations

import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, getTokenFromHeader } from "@/lib/jwt"
import { hasPermission } from "@/lib/rbac"
import { getTransaction, updateTransactionStatus, addAuditLog } from "@/lib/store"
import { executeTransaction } from "@/lib/mock-blockchain"

// GET - Get single transaction
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("authorization")
    const token = getTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const transaction = getTransaction(id)
    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Check permissions
    const canViewAll = hasPermission(payload.role, "transaction:read:all")
    const canViewOwn = hasPermission(payload.role, "transaction:read:own")
    const isOwner = transaction.userId === payload.userId

    if (!canViewAll && !(canViewOwn && isOwner)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error("Get transaction error:", error)
    return NextResponse.json({ error: "Failed to fetch transaction" }, { status: 500 })
  }
}

// PATCH - Update transaction (approve/reject)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("authorization")
    const token = getTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { action } = await request.json()

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Check permissions
    const permission = action === "approve" ? "transaction:approve" : "transaction:reject"
    if (!hasPermission(payload.role, permission)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const transaction = getTransaction(id)
    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    if (transaction.status !== "pending") {
      return NextResponse.json({ error: "Can only approve/reject pending transactions" }, { status: 400 })
    }

    if (action === "approve") {
      // Execute on mock blockchain
      const blockchainResult = await executeTransaction(
        transaction.walletAddress,
        transaction.recipient,
        transaction.amount,
      )

      if (blockchainResult.status === "failed") {
        updateTransactionStatus(id, "rejected", payload.userId)
        addAuditLog("TRANSACTION_BLOCKCHAIN_FAILED", payload.userId, payload.walletAddress, id, {
          blockchainStatus: blockchainResult.status,
        })
        return NextResponse.json(
          { error: "Blockchain execution failed", transaction: getTransaction(id) },
          { status: 500 },
        )
      }

      // Update to approved then completed
      updateTransactionStatus(id, "approved", payload.userId, blockchainResult.txHash)
      updateTransactionStatus(id, "completed")

      addAuditLog("TRANSACTION_APPROVED", payload.userId, payload.walletAddress, id, {
        txHash: blockchainResult.txHash,
        blockNumber: blockchainResult.blockNumber,
      })
    } else {
      updateTransactionStatus(id, "rejected", payload.userId)
      addAuditLog("TRANSACTION_REJECTED", payload.userId, payload.walletAddress, id, {})
    }

    return NextResponse.json({ transaction: getTransaction(id) })
  } catch (error) {
    console.error("Update transaction error:", error)
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
  }
}
