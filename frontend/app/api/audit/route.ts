// API route for audit logs

import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, getTokenFromHeader } from "@/lib/jwt"
import { hasPermission } from "@/lib/rbac"
import { getAuditLogs, verifyAuditLogIntegrity } from "@/lib/store"

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

    if (!hasPermission(payload.role, "audit:read")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const logs = getAuditLogs(limit, offset)
    const integrityValid = verifyAuditLogIntegrity()

    return NextResponse.json({
      logs,
      integrityValid,
      pagination: { limit, offset, total: logs.length },
    })
  } catch (error) {
    console.error("Get audit logs error:", error)
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
  }
}
