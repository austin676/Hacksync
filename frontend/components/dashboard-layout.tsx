"use client"

import type React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Shield, LayoutDashboard, Send, CheckSquare, FileText, LogOut, User, ChevronDown, Menu, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  // Navigation items based on role
  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["user", "admin", "auditor"],
    },
    {
      label: "Transactions",
      href: "/dashboard/transactions",
      icon: Send,
      roles: ["user", "admin", "auditor"],
    },
    {
      label: "Approvals",
      href: "/dashboard/approvals",
      icon: CheckSquare,
      roles: ["admin"],
    },
    {
      label: "Audit Logs",
      href: "/dashboard/audit",
      icon: FileText,
      roles: ["admin", "auditor"],
    },
  ]

  const filteredNavItems = navItems.filter((item) => user && item.roles.includes(user.role))

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-chart-4/20 text-chart-4"
      case "auditor":
        return "bg-chart-3/20 text-chart-3"
      default:
        return "bg-chart-1/20 text-chart-1"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <a href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold text-foreground">WalletAuth</span>
            </a>

            {/* Desktop Nav */}
            <nav className="ml-8 hidden items-center gap-1 md:flex">
              {filteredNavItems.map((item) => (
                <Button
                  key={item.href}
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => router.push(item.href)}
                  className={cn("gap-2", pathname === item.href && "bg-secondary")}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="hidden text-left md:block">
                    <p className="text-sm font-medium text-foreground">
                      {user?.walletAddress.slice(0, 6)}...{user?.walletAddress.slice(-4)}
                    </p>
                    <p className={cn("inline-flex rounded px-1.5 py-0.5 text-xs", getRoleBadgeColor(user?.role || ""))}>
                      {user?.role}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="font-mono text-xs text-muted-foreground">{user?.walletAddress}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect Wallet
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="border-t border-border px-4 py-4 md:hidden">
            <div className="flex flex-col gap-2">
              {filteredNavItems.map((item) => (
                <Button
                  key={item.href}
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  onClick={() => {
                    router.push(item.href)
                    setMobileMenuOpen(false)
                  }}
                  className="justify-start gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  )
}
