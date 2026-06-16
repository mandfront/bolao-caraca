'use client'

import { useState, useEffect } from 'react'

interface LiveClockProps {
  startsAt: string
  lastMinute: number | null
  status: 'live' | 'halftime'
}

function calculateMinute(startsAt: string): { minute: number; isHalftime: boolean; isOver: boolean } {
  const startTime = new Date(startsAt).getTime()
  const now = Date.now()
  const elapsed = Math.floor((now - startTime) / 60000)

  // Antes do jogo começar
  if (elapsed < 0) return { minute: 0, isHalftime: false, isOver: false }

  // 1º tempo (0-45)
  if (elapsed <= 45) return { minute: elapsed, isHalftime: false, isOver: false }

  // Intervalo (45-60min do início)
  if (elapsed <= 60) return { minute: 45, isHalftime: true, isOver: false }

  // 2º tempo (60-105min do início = 45'-90')
  if (elapsed <= 105) return { minute: 45 + (elapsed - 60), isHalftime: false, isOver: false }

  // Acréscimos (105-115min)
  if (elapsed <= 115) return { minute: 90, isHalftime: false, isOver: false }

  // Provavelmente acabou
  return { minute: 90, isHalftime: false, isOver: true }
}

export function LiveClock({ startsAt, lastMinute, status }: LiveClockProps) {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 30000)
    return () => clearInterval(interval)
  }, [])

  // Se o banco diz que é intervalo, prioriza isso
  if (status === 'halftime') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[#F5C518] font-display text-3xl leading-none">HT</span>
        <span className="text-[#F5C518] text-xs font-bold animate-pulse">Intervalo</span>
      </div>
    )
  }

  // Calcula o minuto local baseado no tempo decorrido
  const { minute: calculated, isHalftime: localHalftime } = calculateMinute(startsAt)

  // Se localmente parece estar no intervalo, mas o banco diz que ainda é "live"
  if (localHalftime) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[#F5C518] font-display text-3xl leading-none">HT</span>
        <span className="text-[#F5C518] text-xs font-bold animate-pulse">~Intervalo</span>
      </div>
    )
  }

  // Usa o maior entre lastMinute do banco e o calculado (nunca volta no tempo)
  const display = Math.max(lastMinute ?? 0, calculated)

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-display text-4xl text-[#22c55e] leading-none">{display}</span>
      <span className="text-[#22c55e] text-lg font-bold leading-none">&apos;</span>
      <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
    </div>
  )
}
