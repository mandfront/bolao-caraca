'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { Tables } from '@/types/database'
import type { Match } from '@/types/match'

interface AdminMatchFormClientProps {
  teams: Tables<'teams'>[]
  match?: Match
  mode: 'create' | 'edit'
}

export function AdminMatchFormClient({ teams, match, mode }: AdminMatchFormClientProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [recalculating, setRecalculating] = useState(false)

  // Converte UTC ISO → "YYYY-MM-DDTHH:mm" em horário de Brasília para o input datetime-local
  const utcToLocalInput = (utc: string | null | undefined): string => {
    if (!utc) return ''
    const d = new Date(utc)
    // Formato pt-BR-CA-like: en-CA dá YYYY-MM-DD
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(d)
    const get = (t: string) => fmt.find(p => p.type === t)?.value ?? '00'
    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
  }

  const [form, setForm] = useState({
    home_team_id: match?.home_team_id ?? '',
    away_team_id: match?.away_team_id ?? '',
    starts_at: utcToLocalInput(match?.starts_at),
    phase: match?.phase ?? '',
    stadium: match?.stadium ?? '',
    status: match?.status ?? 'scheduled',
    minute: match?.minute?.toString() ?? '',
    home_score: match?.home_score?.toString() ?? '0',
    away_score: match?.away_score?.toString() ?? '0',
    home_penalty_score: match?.home_penalty_score?.toString() ?? '',
    away_penalty_score: match?.away_penalty_score?.toString() ?? '',
  })

  const updateField = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      // Converte "YYYY-MM-DDTHH:mm" (Brasília) → ISO UTC
      // Adiciona explicitamente "-03:00" pra Date entender como horário de Brasília
      const localToUtc = (local: string): string => {
        return new Date(`${local}:00-03:00`).toISOString()
      }

      const payload = {
        home_team_id: form.home_team_id,
        away_team_id: form.away_team_id,
        starts_at: localToUtc(form.starts_at),
        phase: form.phase || null,
        stadium: form.stadium || null,
        status: form.status,
        minute: form.minute ? parseInt(form.minute) : null,
        home_score: parseInt(form.home_score),
        away_score: parseInt(form.away_score),
        home_penalty_score: form.home_penalty_score ? parseInt(form.home_penalty_score) : null,
        away_penalty_score: form.away_penalty_score ? parseInt(form.away_penalty_score) : null,
      }

      const url = mode === 'create' ? '/api/admin/matches' : `/api/admin/matches/${match!.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      router.push('/admin/partidas')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const handleRecalculate = async () => {
    if (!match) return
    setRecalculating(true)
    try {
      const res = await fetch('/api/admin/recalculate-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      alert(`✓ ${data.updated} palpites recalculados`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro')
    } finally {
      setRecalculating(false)
    }
  }

  const handleDelete = async () => {
    if (!match || !confirm('Tem certeza que deseja excluir esta partida?')) return
    try {
      const res = await fetch(`/api/admin/matches/${match.id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/admin/partidas')
        router.refresh()
      }
    } catch {}
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Source info */}
      {match && (
        <div className="flex gap-2">
          <Badge variant={match.source === 'api' ? 'blue' : 'yellow'}>
            {match.source === 'api' ? 'Via API' : 'Manual'}
          </Badge>
          {match.is_manual_override && <Badge variant="yellow">Override manual</Badge>}
        </div>
      )}

      {/* Teams */}
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Time Mandante"
          value={form.home_team_id}
          onChange={(e) => updateField('home_team_id', e.target.value)}
          required
        >
          <option value="">Selecionar...</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </Select>
        <Select
          label="Time Visitante"
          value={form.away_team_id}
          onChange={(e) => updateField('away_team_id', e.target.value)}
          required
        >
          <option value="">Selecionar...</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </Select>
      </div>

      {/* Date/time */}
      <Input
        label="Data e hora"
        type="datetime-local"
        value={form.starts_at}
        onChange={(e) => updateField('starts_at', e.target.value)}
        required
      />

      {/* Phase and stadium */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Fase"
          placeholder="Ex: Grupo A"
          value={form.phase}
          onChange={(e) => updateField('phase', e.target.value)}
        />
        <Input
          label="Estádio"
          placeholder="Nome do estádio"
          value={form.stadium}
          onChange={(e) => updateField('stadium', e.target.value)}
        />
      </div>

      {/* Status and minute */}
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Status"
          value={form.status}
          onChange={(e) => updateField('status', e.target.value)}
          required
        >
          <option value="scheduled">Agendado</option>
          <option value="live">Ao Vivo</option>
          <option value="halftime">Intervalo</option>
          <option value="finished">Encerrado</option>
          <option value="postponed">Adiado</option>
          <option value="cancelled">Cancelado</option>
        </Select>
        <Input
          label="Minuto"
          type="number"
          min="0"
          max="120"
          placeholder="Ex: 45"
          value={form.minute}
          onChange={(e) => updateField('minute', e.target.value)}
        />
      </div>

      {/* Score */}
      <div>
        <p className="text-sm font-semibold text-[#d1d5db] mb-2">Placar</p>
        <div className="grid grid-cols-4 gap-2 items-end">
          <Input
            type="number"
            min="0"
            max="30"
            value={form.home_score}
            onChange={(e) => updateField('home_score', e.target.value)}
          />
          <div className="text-center text-[#6b7280] pb-3">:</div>
          <Input
            type="number"
            min="0"
            max="30"
            value={form.away_score}
            onChange={(e) => updateField('away_score', e.target.value)}
          />
        </div>
      </div>

      {/* Penalties */}
      <div>
        <p className="text-sm font-semibold text-[#d1d5db] mb-2">Pênaltis (opcional)</p>
        <div className="grid grid-cols-4 gap-2 items-end">
          <Input
            type="number"
            min="0"
            placeholder="-"
            value={form.home_penalty_score}
            onChange={(e) => updateField('home_penalty_score', e.target.value)}
          />
          <div className="text-center text-[#6b7280] pb-3">:</div>
          <Input
            type="number"
            min="0"
            placeholder="-"
            value={form.away_penalty_score}
            onChange={(e) => updateField('away_penalty_score', e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <Button type="submit" fullWidth size="lg" loading={saving}>
        {mode === 'create' ? 'Criar partida' : 'Salvar alterações'}
      </Button>

      {/* Admin actions for existing matches */}
      {match && mode === 'edit' && (
        <div className="pt-4 border-t border-[#1f2937] space-y-2">
          {match.status === 'finished' && (
            <Button
              type="button"
              fullWidth
              variant="secondary"
              size="md"
              loading={recalculating}
              onClick={handleRecalculate}
            >
              🔢 Recalcular pontuações
            </Button>
          )}
          <Button
            type="button"
            fullWidth
            variant="danger"
            size="md"
            onClick={handleDelete}
          >
            🗑 Excluir partida
          </Button>
        </div>
      )}
    </form>
  )
}
