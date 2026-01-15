// Core types for the wallet authentication system

export type UserRole = "user" | "admin" | "auditor"

export type TransactionStatus = "created" | "pending" | "approved" | "rejected" | "completed"

export interface User {
  id: string
  walletAddress: string
  role: UserRole
  createdAt: Date
  lastLogin: Date | null
}

export interface Transaction {
  id: string
  userId: string
  walletAddress: string
  amount: number
  recipient: string
  description: string
  status: TransactionStatus
  blockchainTxHash: string | null
  createdAt: Date
  updatedAt: Date
  approvedBy: string | null
  approvedAt: Date | null
}

export interface AuditLog {
  id: string
  action: string
  userId: string
  walletAddress: string
  targetId: string | null
  metadata: Record<string, unknown>
  timestamp: Date
  hash: string
}

export interface JWTPayload {
  userId: string
  walletAddress: string
  role: UserRole
  iat: number
  exp: number
}

export interface AuthChallenge {
  nonce: string
  message: string
  expiresAt: Date
}
