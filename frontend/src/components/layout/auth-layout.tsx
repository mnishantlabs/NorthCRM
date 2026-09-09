import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { Building2, PhoneCall, TrendingUp } from "lucide-react"

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <Link to="/login" className="flex items-center gap-2 text-lg font-bold">
          <Building2 className="h-6 w-6" />
          CRM
        </Link>

        <div className="relative z-10 space-y-6">
          <h2 className="max-w-md text-3xl font-bold leading-tight">
            Manage your businesses, calls, follow-ups and deals in one place.
          </h2>
          <ul className="space-y-3 text-sm text-primary-foreground/80">
            <li className="flex items-center gap-3">
              <PhoneCall className="h-4 w-4" />
              Track every call and follow-up with your leads
            </li>
            <li className="flex items-center gap-3">
              <TrendingUp className="h-4 w-4" />
              Close more deals with pipeline visibility
            </li>
          </ul>
        </div>

        <p className="relative z-10 text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} CRM. All rights reserved.
        </p>
      </aside>

      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  )
}