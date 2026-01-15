// API route to verify wallet signature and issue JWT

import { type NextRequest, NextResponse } from "next/server"
import { verifySignature } from "@/lib/crypto"
import { createToken } from "@/lib/jwt"
import { getOrCreateUser, addAuditLog, setUserRole } from "@/lib/store"
import { isValidWalletAddress } from "@/lib/mock-blockchain"
import { challenges } from "../challenge/route"

// Helper to get role from contract (server-side simulation)
// In production, you'd query the contract directly
function getContractRole(walletAddress: string): "admin" | "auditor" | "user" {
  // This will be overridden by frontend contract check
  // Default to "user" - frontend will update based on contract
  return "user"
}

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, signature, contractRole } = await request.json()

    if (!walletAddress || !isValidWalletAddress(walletAddress)) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 })
    }

    if (!signature) {
      return NextResponse.json({ error: "Signature required" }, { status: 400 })
    }

    // Get the challenge
    const challenge = challenges.get(walletAddress.toLowerCase())
    if (!challenge) {
      return NextResponse.json({ error: "No challenge found. Please request a new challenge." }, { status: 400 })
    }

    // Check expiry
    if (new Date() > challenge.expiresAt) {
      challenges.delete(walletAddress.toLowerCase())
      return NextResponse.json({ error: "Challenge expired. Please request a new challenge." }, { status: 400 })
    }

    // Verify signature
    const isValid = verifySignature(challenge.message, signature, walletAddress)
    if (!isValid) {
      addAuditLog("AUTH_FAILED", "system", walletAddress, null, { reason: "Invalid signature" })
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    // Clean up challenge
    challenges.delete(walletAddress.toLowerCase())

    // Use contract role if provided, otherwise default
    const role = contractRole || getContractRole(walletAddress)
    
    // Store role in cache
    if (contractRole) {
      setUserRole(walletAddress, contractRole)
    }

    // Get or create user with role from contract
    const user = getOrCreateUser(walletAddress, role)

    // Create JWT
    const token = await createToken(user.id, user.walletAddress, user.role)

    // Audit log
    addAuditLog("AUTH_SUCCESS", user.id, user.walletAddress, null, { role: user.role })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
