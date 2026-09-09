import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { Timer } from "lucide-react"

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl">Reset password</CardTitle>
        <CardDescription>
          Password reset is not available yet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState
          icon={<Timer className="h-8 w-8 text-muted-foreground" />}
          title="Coming soon"
          description="Self-service password reset will be available in a future release. Contact an administrator for assistance."
        />
      </CardContent>
      <CardFooter className="justify-center">
        <Button asChild variant="outline">
          <Link to="/login">Back to sign in</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}