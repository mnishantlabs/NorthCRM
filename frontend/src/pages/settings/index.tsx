import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  Loader2,
  KeyRound,
  Lock,
  Save,
  Users,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { ServicesList } from "@/components/admin/services-list"
import { useAuthStore } from "@/store/auth-store"
import { updateUser } from "@/services/user.service"
import { getErrorMessage } from "@/services/api"
import { toast } from "@/components/ui/toast"
import { useMutation } from "@tanstack/react-query"
import type { UserType } from "@/types"

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional().or(z.literal("")),
})

type ProfileFormValues = z.infer<typeof profileSchema>

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

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const isAdmin = user?.role === "admin"

  const updateProfile = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<{ name: string; email: string; phone: string | null }> }) =>
      updateUser(id, payload),
    onSuccess: (updated) => {
      setUser(updated)
      toast({ title: "Profile updated", description: "Your profile was saved successfully.", variant: "success" })
    },
    onError: (err) => {
      toast({ title: "Something went wrong", description: getErrorMessage(err), variant: "destructive" })
    },
  })

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
    },
  })

  async function onSubmit(values: ProfileFormValues) {
    if (!user) return
    await updateProfile.mutateAsync({
      id: user.id,
      payload: {
        name: values.name,
        email: values.email,
        phone: values.phone || null,
      },
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your profile, services and team."
      />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          {isAdmin ? <TabsTrigger value="services">Services</TabsTrigger> : null}
          {isAdmin ? <TabsTrigger value="team">Team</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="rounded-xl shadow-sm lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Your account</CardTitle>
                <CardDescription>Details used to identify you.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                      {getInitials(user?.name ?? "User")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-base font-semibold">{user?.name ?? "—"}</p>
                    <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
                    {user ? <div>{roleBadge(user.role)}</div> : null}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 border-t pt-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">{user?.phone ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Member since</p>
                    <p className="text-sm font-medium">
                      {user?.created_at ? new Date(user.created_at).getFullYear() : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Edit profile</CardTitle>
                <CardDescription>
                  Update your name, email and phone number.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="you@company.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+91 98765 43210" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Button type="submit" disabled={updateProfile.isPending}>
                        {updateProfile.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Save changes
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-xl shadow-sm">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/50">
                <KeyRound className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-base">Change password</CardTitle>
                <CardDescription>
                  Keep your account secure with a strong password.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Password reset coming soon</p>
                <p className="text-sm text-muted-foreground">
                  You&apos;ll be able to update your password from here shortly.
                </p>
              </div>
              <Button variant="outline" disabled>
                <Lock className="h-4 w-4" />
                Update password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin ? (
          <TabsContent value="services" className="mt-6">
            <ServicesList />
          </TabsContent>
        ) : null}

        {isAdmin ? (
          <TabsContent value="team" className="mt-6">
            <Card className="rounded-xl shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/50">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-base">Team members</CardTitle>
                    <CardDescription>
                      Manage roles, access and active members of your team.
                    </CardDescription>
                  </div>
                </div>
                <Badge className="border-blue-500/20 bg-blue-500/10 text-blue-500">
                  Admin
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    View and manage all team members, roles and access from the Users
                    page.
                  </p>
                </div>
                <Link to="/users">
                  <Button>
                    Manage team
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  )
}
