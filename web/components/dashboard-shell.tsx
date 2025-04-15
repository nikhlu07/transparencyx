"use client"

import type React from "react"
import {
  ShieldCheck,
  Home,
  DollarSign,
  Users,
  Building,
  FileCheck,
  LogOut,
  BarChart3,
  AlertTriangle,
  Activity,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const formatRole = (role: string) => {
    return role
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            <span className="text-xl font-bold">TransparencyX</span>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-normal">
                  {formatRole(user.role)}
                </Badge>
                <span className="font-mono text-sm">
                  {user.address.substring(0, 6)}...{user.address.substring(user.address.length - 4)}
                </span>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-64 flex-col border-r bg-gray-50 dark:bg-gray-900 dark:border-gray-800 md:flex">
          <nav className="grid gap-2 p-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 dark:text-gray-400 transition-all hover:text-gray-900 dark:hover:text-gray-50"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/dashboard/budgets"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 dark:text-gray-400 transition-all hover:text-gray-900 dark:hover:text-gray-50"
            >
              <DollarSign className="h-4 w-4" />
              Budgets
            </Link>
            <Link
              href="/dashboard/roles"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 dark:text-gray-400 transition-all hover:text-gray-900 dark:hover:text-gray-50"
            >
              <Users className="h-4 w-4" />
              Roles
            </Link>
            <Link
              href="/dashboard/vendors"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 dark:text-gray-400 transition-all hover:text-gray-900 dark:hover:text-gray-50"
            >
              <Building className="h-4 w-4" />
              Vendors
            </Link>
            <Link
              href="/dashboard/claims"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 dark:text-gray-400 transition-all hover:text-gray-900 dark:hover:text-gray-50"
            >
              <FileCheck className="h-4 w-4" />
              Claims
            </Link>
            <Link
              href="/dashboard/analytics"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 dark:text-gray-400 transition-all hover:text-gray-900 dark:hover:text-gray-50"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Link>
            <Link
              href="/dashboard/fraud-alerts"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 dark:text-gray-400 transition-all hover:text-gray-900 dark:hover:text-gray-50"
            >
              <AlertTriangle className="h-4 w-4" />
              Fraud Alerts
            </Link>
            <Link
              href="/dashboard/activity"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 dark:text-gray-400 transition-all hover:text-gray-900 dark:hover:text-gray-50"
            >
              <Activity className="h-4 w-4" />
              Activity
            </Link>
          </nav>
        </aside>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
