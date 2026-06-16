'use client'

import { useState } from 'react'
import type { Tables } from '@/types/database'

interface GroupInviteCardProps {
  group: Tables<'groups'>
  memberCount: number
}

export function GroupInviteCard({ group, memberCount }: GroupInviteCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(group.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-[#111827] rounded-2xl border border-[#1f2937] p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-[#f9fafb] font-bold text-base">{group.name}</h3>
          <p className="text-[#6b7280] text-xs mt-0.5">{memberCount} {memberCount === 1 ? 'membro' : 'membros'}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#F5C518]/15 flex items-center justify-center text-xl">🏆</div>
      </div>

      <div className="bg-[#0d1117] rounded-xl border border-[#1f2937] p-3 flex items-center justify-between">
        <div>
          <p className="text-[#6b7280] text-xs mb-0.5">Código de convite</p>
          <p className="text-[#f9fafb] font-bold font-display text-xl tracking-widest">{group.invite_code}</p>
        </div>
        <button
          onClick={handleCopy}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
            copied
              ? 'bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30'
              : 'bg-[#1f2937] text-[#9ca3af] hover:text-[#f9fafb] hover:bg-[#374151]'
          }`}
        >
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>
    </div>
  )
}
