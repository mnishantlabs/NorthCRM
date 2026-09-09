import { useCallback, useEffect, useState } from "react"

interface UsePaginationOptions {
  initialPage?: number
  perPage?: number
  total?: number
}

interface UsePaginationResult {
  page: number
  perPage: number
  total: number
  setPage: (page: number) => void
  reset: () => void
}

export function usePagination({
  initialPage = 1,
  perPage: initialPerPage = 10,
  total: initialTotal = 0,
}: UsePaginationOptions = {}): UsePaginationResult {
  const [page, setPage] = useState(initialPage)
  const [perPage] = useState(initialPerPage)
  const [total, setTotal] = useState(initialTotal)

  useEffect(() => {
    setTotal(initialTotal)
  }, [initialTotal])

  const reset = useCallback(() => {
    setPage(1)
  }, [])

  return { page, perPage, total, setPage, reset }
}
