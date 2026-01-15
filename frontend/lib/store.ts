// In-memory data store (would be a real database in production)
// Simulates encrypted storage with proper data structures

import { encrypt, decrypt, createAuditHash } from "./crypto"
import type { User, Transaction, AuditLog, UserRole, TransactionStatus } from "./types"

// In-memory stores
const users: Map<string, User> = new Map()
const transactions: Map<string, Transaction> = new Map()
const auditLogs: AuditLog[] = []

// Pre-configured wallet-to-role mappings (would be in database)
const walletRoles: Map<string, UserRole> = new Map([
  // Demo wallets - any wallet can connect, these have preset roles
  ["0x1234567890123456789012345678901234567890", "admin"],
  ["0xabcdefabcdefabcdefabcdefabcdefabcdefabcd", "auditor"],
])

let lastAuditHash = "0".repeat(64)

// User operations
export function getOrCreateUser(walletAddress: string): User {
  const normalizedAddress = walletAddress.toLowerCase()
  let user = users.get(normalizedAddress)

  if (!user) {
    // Determine role - check preset roles or default to 'user'
    const role = walletRoles.get(normalizedAddress) || "user"

    user = {
      id: crypto.randomUUID(),
      walletAddress: normalizedAddress,
      role,
      createdAt: new Date(),
      lastLogin: new Date(),
    }
    users.set(normalizedAddress, user)
  } else {
    user.lastLogin = new Date()
    users.set(normalizedAddress, user)
  }

  return user
}

export function getUserByWallet(walletAddress: string): User | null {
  return users.get(walletAddress.toLowerCase()) || null
}

export function getUserById(userId: string): User | null {
  for (const user of users.values()) {
    if (user.id === userId) return user
  }
  return null
}

export function updateUserRole(walletAddress: string, role: UserRole): User | null {
  const user = users.get(walletAddress.toLowerCase())
  if (user) {
    user.role = role
    users.set(walletAddress.toLowerCase(), user)
    return user
  }
  return null
}

// Transaction operations
export function createTransaction(
  userId: string,
  walletAddress: string,
  amount: number,
  recipient: string,
  description: string,
): Transaction {
  const transaction: Transaction = {
    id: crypto.randomUUID(),
    userId,
    walletAddress: walletAddress.toLowerCase(),
    amount,
    recipient: recipient.toLowerCase(),
    description: encrypt(description), // Encrypt sensitive metadata
    status: "created",
    blockchainTxHash: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    approvedBy: null,
    approvedAt: null,
  }
  transactions.set(transaction.id, transaction)
  return transaction
}

export function getTransaction(id: string): Transaction | null {
  const tx = transactions.get(id)
  if (tx) {
    return {
      ...tx,
      description: decrypt(tx.description), // Decrypt for reading
    }
  }
  return null
}

export function getTransactionsByUser(userId: string): Transaction[] {
  return Array.from(transactions.values())
    .filter((tx) => tx.userId === userId)
    .map((tx) => ({
      ...tx,
      description: decrypt(tx.description),
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export function getAllTransactions(): Transaction[] {
  return Array.from(transactions.values())
    .map((tx) => ({
      ...tx,
      description: decrypt(tx.description),
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export function getPendingTransactions(): Transaction[] {
  return getAllTransactions().filter((tx) => tx.status === "pending")
}

export function updateTransactionStatus(
  id: string,
  status: TransactionStatus,
  approvedBy?: string,
  txHash?: string,
): Transaction | null {
  const tx = transactions.get(id)
  if (tx) {
    tx.status = status
    tx.updatedAt = new Date()
    if (approvedBy) {
      tx.approvedBy = approvedBy
      tx.approvedAt = new Date()
    }
    if (txHash) {
      tx.blockchainTxHash = txHash
    }
    transactions.set(id, tx)
    return {
      ...tx,
      description: decrypt(tx.description),
    }
  }
  return null
}

// Audit log operations (append-only, immutable)
export function addAuditLog(
  action: string,
  userId: string,
  walletAddress: string,
  targetId: string | null,
  metadata: Record<string, unknown>,
): AuditLog {
  const timestamp = new Date()
  const timestampISO = timestamp.toISOString()

  const logData = JSON.stringify({
    action,
    userId,
    walletAddress,
    targetId,
    metadata,
    timestamp: timestampISO,
  })

  const hash = createAuditHash(logData, lastAuditHash)
  lastAuditHash = hash

  const log: AuditLog = {
    id: crypto.randomUUID(),
    action,
    userId,
    walletAddress: walletAddress.toLowerCase(),
    targetId,
    metadata,
    timestamp,
    timestampISO,
    hash,
  }

  auditLogs.push(log)
  return log
}

export function getAuditLogs(limit = 100, offset = 0): AuditLog[] {
  return auditLogs
    .slice()
    .reverse()
    .slice(offset, offset + limit)
}

export function getAuditLogsByUser(userId: string): AuditLog[] {
  return auditLogs
    .filter((log) => log.userId === userId)
    .slice()
    .reverse()
}

// Verify audit log chain integrity
export function verifyAuditLogIntegrity(): boolean {
  if (auditLogs.length === 0) {
    return true
  }

  let prevHash = "0".repeat(64)
  for (const log of auditLogs) {
    const logData = JSON.stringify({
      action: log.action,
      userId: log.userId,
      walletAddress: log.walletAddress,
      targetId: log.targetId,
      metadata: log.metadata,
      timestamp: log.timestampISO,
    })
    const expectedHash = createAuditHash(logData, prevHash)
    if (log.hash !== expectedHash) {
      return false
    }
    prevHash = log.hash
  }
  return true
}
