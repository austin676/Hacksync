// API route to generate authentication challenge for wallet signing

import { type NextRequest, NextResponse } from "next/server"
import { generateNonce, createSignMessage } from "@/lib/crypto"
import { isValidWalletAddress } from "@/lib/mock-blockchain"
import { addAuditLog } from "@/lib/store"

// In-memory challenge store (would be Redis in production)
const challenges: Map<string, { nonce: string; message: string; expiresAt: Date }> = new Map()

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json()

    if (!walletAddress || !isValidWalletAddress(walletAddress)) {
      return NextResponse.json({ error: "Invalid wallet address format" }, { status: 400 })
    }

    const nonce = generateNonce()
    const message = createSignMessage(nonce, walletAddress)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Store the challenge
    challenges.set(walletAddress.toLowerCase(), { nonce, message, expiresAt })

    // Audit log
    addAuditLog("AUTH_CHALLENGE_REQUESTED", "system", walletAddress, null, { nonce: nonce.slice(0, 8) + "..." })

    return NextResponse.json({ message, nonce, expiresAt })
  } catch (error) {
    console.error("Challenge generation error:", error)
    return NextResponse.json({ error: "Failed to generate challenge" }, { status: 500 })
  }
}

// Export for use in verify route
export { challenges }
