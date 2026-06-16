'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface AutoRefreshProps {
  intervalMs?: number
  enabled?: boolean
}

export function AutoRefresh({ intervalMs = 60000, enabled = true }: AutoRefreshProps) {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!enabled) return

    timerRef.current = setInterval(() => {
      router.refresh()
    }, intervalMs)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [router, intervalMs, enabled])

  return null
}
