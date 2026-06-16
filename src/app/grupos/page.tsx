'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppShell, TopBar } from '@/components/Navigation'
import { GroupInviteCard } from '@/components/groups/GroupInviteCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingPage, EmptyState } from '@/components/ui/LoadingState'

interface Group {
  id: string
  name: string
  invite_code: string
  created_by: string
  created_at: string
  member_count?: number
}

export default function GruposPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadGroups()
  }, [])

  async function loadGroups() {
    setLoading(true)
    try {
      const res = await fetch('/api/groups')
      if (res.ok) {
        const data = await res.json()
        setGroups(data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setShowCreate(false)
      setGroupName('')
      await loadGroups()
      router.push(`/grupo/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar grupo')
    } finally {
      setSaving(false)
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', invite_code: inviteCode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setShowJoin(false)
      setInviteCode('')
      await loadGroups()
      router.push(`/grupo/${data.group_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código inválido')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingPage />

  return (
    <AppShell>
      <TopBar title="Meus Grupos" />

      <div className="px-4 pt-4 pb-6 max-w-2xl mx-auto space-y-4">
        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 animate-slide-up">
          <Button onClick={() => { setShowCreate(true); setShowJoin(false); setError('') }} variant="primary">
            + Criar grupo
          </Button>
          <Button onClick={() => { setShowJoin(true); setShowCreate(false); setError('') }} variant="secondary">
            Entrar com código
          </Button>
        </div>

        {/* Create form */}
        {showCreate && (
          <form onSubmit={handleCreate} className="bg-[#111827] border border-[#F5C518]/30 rounded-2xl p-4 space-y-3 animate-slide-up">
            <h3 className="text-[#f9fafb] font-bold text-sm">Criar novo grupo</h3>
            <Input
              label="Nome do grupo"
              placeholder="Ex: Família Caraça 2026"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
              autoFocus
            />
            {error && <p className="text-[#ef4444] text-xs">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" loading={saving} size="sm">Criar</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => { setShowCreate(false); setError('') }}>Cancelar</Button>
            </div>
          </form>
        )}

        {/* Join form */}
        {showJoin && (
          <form onSubmit={handleJoin} className="bg-[#111827] border border-[#22c55e]/30 rounded-2xl p-4 space-y-3 animate-slide-up">
            <h3 className="text-[#f9fafb] font-bold text-sm">Entrar em grupo</h3>
            <Input
              label="Código de convite"
              placeholder="Ex: BravoRei4821"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.trim())}
              required
              autoFocus
              autoComplete="off"
            />
            {error && <p className="text-[#ef4444] text-xs">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" loading={saving} size="sm" variant="success">Entrar</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => { setShowJoin(false); setError('') }}>Cancelar</Button>
            </div>
          </form>
        )}

        {/* Groups list */}
        {groups.length > 0 ? (
          <div className="space-y-3 animate-slide-up delay-100">
            <h3 className="text-[#6b7280] text-xs font-semibold uppercase tracking-wider">Seus grupos</h3>
            {groups.map((group) => (
              <Link key={group.id} href={`/grupo/${group.id}`}>
                <GroupInviteCard group={group} memberCount={group.member_count ?? 0} />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<span className="text-3xl">👥</span>}
            title="Você não está em nenhum grupo"
            description="Crie um grupo ou peça o código para entrar com a família"
          />
        )}
      </div>
    </AppShell>
  )
}
