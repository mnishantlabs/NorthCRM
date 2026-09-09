import { useState } from "react"
import { Lock, Plus, Users as UsersIcon, RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { UsersTable } from "@/components/admin/users-table"
import { UserFormDialog } from "@/components/admin/user-form-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TableSkeleton } from "@/components/shared/loading-state"
import { useUsers } from "@/hooks/use-users"
import { useAuthStore } from "@/store/auth-store"

export default function UsersPage() {
  const [formOpen, setFormOpen] = useState(false)
  const usersQuery = useUsers({ page: 1, per_page: 10 })
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === "admin"

  if (!isAdmin) {
    return (
      <EmptyState
        icon={<Lock className="h-8 w-8 text-muted-foreground" />}
        title="Admins only"
        description="You need administrator access to view and manage team members."
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Members"
        description="Manage your team, roles and access."
      >
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Add member
        </Button>
      </PageHeader>

      {usersQuery.isLoading ? (
        <TableSkeleton rows={6} />
      ) : usersQuery.isError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <p className="text-lg font-semibold">Failed to load team members</p>
            <p className="text-sm text-muted-foreground">
              Something went wrong while fetching your team. Please try again.
            </p>
            <Button onClick={() => usersQuery.refetch()} variant="outline">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (usersQuery.data?.items.length ?? 0) === 0 ? (
        <EmptyState
          icon={<UsersIcon className="h-8 w-8 text-muted-foreground" />}
          title="No team members yet"
          description="Add your first teammate to start organizing your sales team."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Add member
            </Button>
          }
        />
      ) : (
        <UsersTable />
      )}

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  )
}
