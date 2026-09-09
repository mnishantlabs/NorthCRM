import { lazy, Suspense, type ReactNode } from "react"
import { createBrowserRouter } from "react-router-dom"
import { AppLayout } from "@/components/layout/app-layout"
import { AuthLayout } from "@/components/layout/auth-layout"
import { ProtectedRoute } from "@/components/shared/protected-route"
import { PageLoader } from "@/components/shared/loading-state"

const LoginPage = lazy(() => import("@/pages/auth/login"))
const RegisterPage = lazy(() => import("@/pages/auth/register"))
const ForgotPasswordPage = lazy(() => import("@/pages/auth/forgot-password"))
const DashboardPage = lazy(() => import("@/pages/dashboard"))
const BusinessesPage = lazy(() => import("@/pages/businesses"))
const BusinessDetailPage = lazy(() => import("@/pages/businesses/business-detail"))
const CallsPage = lazy(() => import("@/pages/calls"))
const FollowUpsPage = lazy(() => import("@/pages/follow-ups"))
const DealsPage = lazy(() => import("@/pages/deals"))
const AnalyticsPage = lazy(() => import("@/pages/analytics"))
const UsersPage = lazy(() => import("@/pages/users"))
const SettingsPage = lazy(() => import("@/pages/settings"))
const NotFoundPage = lazy(() => import("@/pages/not-found"))

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: withSuspense(
      <AuthLayout>
        <LoginPage />
      </AuthLayout>,
    ),
  },
  {
    path: "/register",
    element: withSuspense(
      <AuthLayout>
        <RegisterPage />
      </AuthLayout>,
    ),
  },
  {
    path: "/forgot-password",
    element: withSuspense(
      <AuthLayout>
        <ForgotPasswordPage />
      </AuthLayout>,
    ),
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: withSuspense(<DashboardPage />) },
      { path: "businesses", element: withSuspense(<BusinessesPage />) },
      { path: "businesses/:id", element: withSuspense(<BusinessDetailPage />) },
      { path: "calls", element: withSuspense(<CallsPage />) },
      { path: "follow-ups", element: withSuspense(<FollowUpsPage />) },
      { path: "deals", element: withSuspense(<DealsPage />) },
      { path: "analytics", element: withSuspense(<AnalyticsPage />) },
      { path: "users", element: withSuspense(<UsersPage />) },
      { path: "settings", element: withSuspense(<SettingsPage />) },
    ],
  },
  {
    path: "*",
    element: withSuspense(<NotFoundPage />),
  },
])