// Mock Blockchain Service Layer
// This simulates smart contract behavior and can be replaced with real blockchain calls

import { randomBytes } from "crypto"

export interface BlockchainTransaction {
  txHash: string
  blockNumber: number
  timestamp: Date
  status: "pending" | "confirmed" | "failed"
  gasUsed: number
}

// Simulate transaction execution on the blockchain
export async function executeTransaction(from: string, to: string, amount: number): Promise<BlockchainTransaction> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000))

  // Generate fake transaction hash (looks like Ethereum tx hash)
  const txHash = "0x" + randomBytes(32).toString("hex")

  // Simulate occasional failures (5% chance)
  const failed = Math.random() < 0.05

  return {
    txHash,
    blockNumber: Math.floor(19000000 + Math.random() * 100000),
    timestamp: new Date(),
    status: failed ? "failed" : "confirmed",
    gasUsed: Math.floor(21000 + Math.random() * 50000),
  }
}

// Simulate checking transaction status
export async function getTransactionStatus(txHash: string): Promise<BlockchainTransaction | null> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200))

  // In production, this would query the actual blockchain
  return {
    txHash,
    blockNumber: Math.floor(19000000 + Math.random() * 100000),
    timestamp: new Date(),
    status: "confirmed",
    gasUsed: Math.floor(21000 + Math.random() * 50000),
  }
}

// Validate wallet address format
export function isValidWalletAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// Generate a mock wallet address for testing
export function generateMockWalletAddress(): string {
  return "0x" + randomBytes(20).toString("hex")
}
