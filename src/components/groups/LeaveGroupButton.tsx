'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface LeaveGroupButtonProps {
  groupId: string
  groupName: string
  isCreator: boolean
  memberCount: number
}

export function LeaveGroupButton({ groupId, groupName, isCreator, memberCount }: LeaveGroupButtonProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLeave() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/groups/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push('/grupos')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao sair')
    } finally {
      setLoading(false)
    }
  }

  // Criador com outros membros não pode sair (só excluir o grupo)
  const isCreatorWithMembers = isCreator && memberCount > 1
  const willDeleteGroup = isCreator && memberCount === 1

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="w-full text-[#ef4444]/70 hover:text-[#ef4444] text-xs font-semibold py-3 transition-colors"
      >
        Sair deste grupo
      </button>
    )
  }

  return (
    <div className="bg-[#ef4444]/8 border border-[#ef4444]/30 rounded-2xl p-4 space-y-3">
      <p className="text-[#f9fafb] text-sm font-bold">
        {willDeleteGroup ? `Excluir "${groupName}"?` : `Sair de "${groupName}"?`}
      </p>

      {isCreatorWithMembers ? (
        <p className="text-[#9ca3af] text-xs">
          Você é o criador deste grupo. Para sair, primeiro transfira a administração ou peça para os outros membros saírem.
        </p>
      ) : willDeleteGroup ? (
        <p className="text-[#9ca3af] text-xs">
          Como você é o único membro, o grupo será excluído. Esta ação não pode ser desfeita.
        </p>
      ) : (
        <p className="text-[#9ca3af] text-xs">
          Seus palpites neste grupo serão removidos. Você poderá voltar usando o código de convite.
        </p>
      )}

      {error && (
        <p className="text-[#ef4444] text-xs bg-[#ef4444]/10 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="flex-1 bg-[#1f2937] text-[#9ca3af] text-sm font-semibold py-2.5 rounded-xl hover:bg-[#374151] transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        {!isCreatorWithMembers && (
          <button
            onClick={handleLeave}
            disabled={loading}
            className="flex-1 bg-[#ef4444] text-white text-sm font-bold py-2.5 rounded-xl hover:bg-[#dc2626] transition-colors disabled:opacity-50"
          >
            {loading ? 'Saindo...' : willDeleteGroup ? 'Excluir' : 'Confirmar saída'}
          </button>
        )}
      </div>
    </div>
  )
}
