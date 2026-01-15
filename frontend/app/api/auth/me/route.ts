// API route to get current authenticated user

import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, getTokenFromHeader } from "@/lib/jwt"
import { getUserById } from "@/lib/store"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = getTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    const user = getUserById(payload.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
