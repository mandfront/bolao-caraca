'use client'

import { useState, useEffect } from 'react'

interface LiveClockProps {
  startsAt: string
  lastMinute: number | null
  status: 'live' | 'halftime'
}

export function LiveClock({ startsAt, lastMinute, status }: LiveClockProps) {
  const [displayMinute, setDisplayMinute] = useState(lastMinute ?? 0)

  useEffect(() => {
    if (status === 'halftime') {
      setDisplayMinute(45)
      return
    }

    // Calculate approximate current minute based on start time
    const startTime = new Date(startsAt).getTime()

    const tick = () => {
      const now = Date.now()
      const elapsedMs = now - startTime
      const elapsedMinutes = Math.floor(elapsedMs / 60000)

      // If we have a last known minute, use it as a base for display
      // but don't go backwards
      const calculated = Math.max(lastMinute ?? 0, Math.min(elapsedMinutes, 90))
      setDisplayMinute(calculated)
    }

    tick()
    const interval = setInterval(tick, 30000) // update every 30s
    return () => clearInterval(interval)
  }, [startsAt, lastMinute, status])

  if (status === 'halftime') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[#F5C518] font-display text-3xl leading-none">HT</span>
        <span className="text-[#F5C518] text-xs font-bold animate-pulse">Intervalo</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-display text-4xl text-[#22c55e] leading-none">{displayMinute}</span>
      <span className="text-[#22c55e] text-lg font-bold leading-none">'</span>
      <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
    </div>
  )
}
