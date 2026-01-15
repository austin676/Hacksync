// JWT authentication utilities

import { SignJWT, jwtVerify } from "jose"
import type { JWTPayload, UserRole } from "./types"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-super-secret-jwt-key-min-32-chars!")

const JWT_EXPIRY = "24h"

export async function createToken(userId: string, walletAddress: string, role: UserRole): Promise<string> {
  return new SignJWT({
    userId,
    walletAddress,
    role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }
  return authHeader.slice(7)
}
