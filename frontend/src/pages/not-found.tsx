import { Link } from "react-router-dom"
import { Compass } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border bg-muted/50">
        <Compass className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h1 className="text-5xl font-bold tracking-tight">404</h1>
        <p className="text-lg font-semibold">Page not found</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          The page you are looking for doesn't exist or may have been moved.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button asChild variant="outline">
          <Link to="/">Back to dashboard</Link>
        </Button>
        <Button asChild>
          <Link to="/businesses">Browse businesses</Link>
        </Button>
      </div>
    </div>
  )
}