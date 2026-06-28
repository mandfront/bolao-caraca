'use client'

import { useState } from 'react'

interface StandingsTabsProps {
  groupsView: React.ReactNode
  knockoutView: React.ReactNode
  hasKnockout: boolean
}

export function StandingsTabs({ groupsView, knockoutView, hasKnockout }: StandingsTabsProps) {
  // Com mata-mata em andamento, abre direto nessa aba
  const [tab, setTab] = useState<'grupos' | 'mata'>('mata')

  // Enquanto não há jogos de mata-mata, mostra só a classificação dos grupos
  if (!hasKnockout) return <>{groupsView}</>

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <button
          onClick={() => setTab('grupos')}
          className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
            tab === 'grupos'
              ? 'bg-[#F5C518] text-[#0a0f1e]'
              : 'bg-[#111827] border border-[#1f2937] text-[#6b7280] hover:text-[#9ca3af]'
          }`}
        >
          Grupos
        </button>
        <button
          onClick={() => setTab('mata')}
          className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
            tab === 'mata'
              ? 'bg-[#F5C518] text-[#0a0f1e]'
              : 'bg-[#111827] border border-[#1f2937] text-[#6b7280] hover:text-[#9ca3af]'
          }`}
        >
          Mata-mata
        </button>
      </div>

      <div>{tab === 'grupos' ? groupsView : knockoutView}</div>
    </div>
  )
}
