import { useState } from "react"
import {
  MoreHorizontal,
  Pencil,
  Power,
  ShieldCheck,
  Trash2,
  UserX,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { UserFormDialog } from "@/components/admin/user-form-dialog"
import { Pagination } from "@/components/shared/pagination"
import { useDeleteUser, useUpdateUser, useUsers } from "@/hooks/use-users"
import { getErrorMessage } from "@/services/api"
import { toast } from "@/components/ui/toast"
import { useAuthStore } from "@/store/auth-store"
import { formatDate, formatPhone } from "@/utils/format"
import type { UserType } from "@/types"

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function roleBadge(role: UserType["role"]) {
  return role === "admin" ? (
    <Badge className="border-blue-500/20 bg-blue-500/10 text-blue-500">Admin</Badge>
  ) : (
    <Badge className="border-gray-500/20 bg-gray-500/10 text-gray-500">Agent</Badge>
  )
}

function statusBadge(isActive: boolean) {
  return isActive ? (
    <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
      Active
    </Badge>
  ) : (
    <Badge className="border-red-500/20 bg-red-500/10 text-red-500">Inactive</Badge>
  )
}

export function UsersTable() {
  const currentUser = useAuthStore((s) => s.user)
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [editUser, setEditUser] = useState<UserType | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<UserType | null>(null)

  const usersQuery = useUsers({ page, per_page: perPage })
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()

  const users = usersQuery.data?.items ?? []
  const pagination = usersQuery.data

  function isSelf(id: string) {
    return currentUser?.id === id
  }

  async function handleToggleActive(user: UserType) {
    try {
      await updateUser.mutateAsync({ id: user.id, payload: { is_active: !user.is_active } })
      toast({
        title: user.is_active ? "User deactivated" : "User activated",
        description: `${user.name} is now ${user.is_active ? "inactive" : "active"}.`,
        variant: "success",
      })
    } catch (err) {
      toast({ title: "Something went wrong", description: getErrorMessage(err), variant: "destructive" })
    }
  }

  async function handleRoleChange(user: UserType, role: UserType["role"]) {
    if (role === user.role) return
    try {
      await updateUser.mutateAsync({ id: user.id, payload: { role } })
      toast({ title: "Role updated", description: `${user.name} is now ${role}.`, variant: "success" })
    } catch (err) {
      toast({ title: "Something went wrong", description: getErrorMessage(err), variant: "destructive" })
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteUser.mutateAsync(deleteTarget.id)
      toast({ title: "User deleted", description: `${deleteTarget.name} was removed.`, variant: "success" })
      setDeleteTarget(null)
    } catch (err) {
      toast({ title: "Something went wrong", description: getErrorMessage(err), variant: "destructive" })
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {user.name}
                        {isSelf(user.id) ? (
                          <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                        ) : null}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{roleBadge(user.role)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatPhone(user.phone)}
                </TableCell>
                <TableCell>{statusBadge(user.is_active)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(user.created_at)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditUser(user)
                        setFormOpen(true)
                      }}
                      aria-label="Edit user"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="More actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuLabel className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4" />
                          Change role
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          disabled={user.role === "admin" || isSelf(user.id)}
                          onClick={() => handleRoleChange(user, "admin")}
                        >
                          Make admin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={user.role === "agent" || isSelf(user.id)}
                          onClick={() => handleRoleChange(user, "agent")}
                        >
                          Make agent
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={isSelf(user.id)}
                          onClick={() => handleToggleActive(user)}
                        >
                          <Power className="h-4 w-4" />
                          {user.is_active ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={isSelf(user.id)}
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pagination ? (
        <Pagination
          page={page}
          pages={pagination.pages}
          total={pagination.total}
          perPage={perPage}
          onChange={setPage}
        />
      ) : null}

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editUser} />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-destructive" />
              Delete user
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">{deleteTarget?.name}</span>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
