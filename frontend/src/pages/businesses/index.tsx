import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { FileUp, Loader2, Plus, Upload } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { BusinessFiltersBar } from "@/components/businesses/business-filters"
import { BusinessTable } from "@/components/businesses/business-table"
import { BusinessForm } from "@/components/businesses/business-form"
import { Pagination } from "@/components/shared/pagination"
import { TableSkeleton } from "@/components/shared/loading-state"
import { useBusinesses, useImportBusinesses } from "@/hooks/use-businesses"
import { useAuthStore } from "@/store/auth-store"
import type { BusinessFilters } from "@/services/business.service"

const PER_PAGE = 10

function ImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const importBusinesses = useImportBusinesses()
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setFile(null)
  }, [open])

  function handleImport() {
    if (!file) return
    importBusinesses.mutate(file, {
      onSuccess: () => onOpenChange(false),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-muted-foreground" />
            Import Businesses
          </DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to bulk-import businesses.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            const dropped = e.dataTransfer.files?.[0]
            if (dropped) setFile(dropped)
          }}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:bg-accent/50"
          style={dragOver ? { borderColor: "var(--ring)" } : undefined}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">
            {file ? file.name : "Drag & drop your file here"}
          </p>
          <p className="text-xs text-muted-foreground">
            {file
              ? `${(file.size / 1024).toFixed(1)} KB`
              : "or click to browse (CSV, XLSX, XLS)"}
          </p>
        </div>

        {importBusinesses.error ? (
          <p className="text-sm text-destructive">
            Import failed. Please check the file format and try again.
          </p>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importBusinesses.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file || importBusinesses.isPending}>
            {importBusinesses.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function BusinessesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === "admin"

  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const page = Number(searchParams.get("page") ?? "1")
  const search = searchParams.get("search") ?? ""
  const status = searchParams.get("status") ?? undefined
  const agent = searchParams.get("agent") ?? undefined
  const category = searchParams.get("category") ?? undefined

  const filters: BusinessFilters = {
    page,
    per_page: PER_PAGE,
    search: search || undefined,
    status,
    assigned_agent: agent,
    category: category || undefined,
    sort_by: "created_at",
    sort_order: "desc",
  }

  const { data, isLoading } = useBusinesses(filters)

  function updateParams(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(patch)) {
      if (!value || value === "") {
        next.delete(key)
      } else {
        next.set(key, value)
      }
    }
    next.delete("page")
    setSearchParams(next)
  }

  function handleFilterChange(patch: Partial<BusinessFilters>) {
    const mapped: Record<string, string | undefined> = {}
    if ("search" in patch) mapped.search = patch.search || undefined
    if ("status" in patch) mapped.status = patch.status || undefined
    if ("assigned_agent" in patch) mapped.agent = patch.assigned_agent || undefined
    if ("category" in patch) mapped.category = patch.category || undefined
    updateParams(mapped)
  }

  function handleReset() {
    setSearchParams(new URLSearchParams())
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Businesses"
        description="Manage your business leads, contacts and assignments"
      >
        {isAdmin ? (
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add business
            </Button>
          </>
        ) : null}
      </PageHeader>

      <BusinessFiltersBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
      />

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : (
        <BusinessTable businesses={data?.items ?? []} loading={false} />
      )}

      {data && !isLoading && data.items.length > 0 ? (
        <Pagination
          page={data.page}
          pages={data.pages}
          total={data.total}
          perPage={PER_PAGE}
          onChange={(nextPage) => updateParams({ page: String(nextPage) })}
        />
      ) : null}

      <BusinessForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        business={null}
      />

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}
