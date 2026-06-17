'use client'

import { useState, useEffect } from 'react'
import { AppShell, TopBar } from '@/components/Navigation'
import { Button } from '@/components/ui/Button'

interface SyncResult {
  synced?: number
  updated?: number
  errors?: string[]
  error?: string
}

interface ApiStatus {
  configured: boolean
  error?: string
  account?: string
  plan?: string
  requests_used?: number
  requests_limit?: number
  requests_remaining?: number
}

export default function SincronizarPage() {
  const [results, setResults] = useState<Record<string, SyncResult>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(true)

  useEffect(() => {
    checkApiStatus()
  }, [])

  async function checkApiStatus() {
    setCheckingStatus(true)
    try {
      const res = await fetch('/api/admin/api-status')
      const data = await res.json()
      setApiStatus(data)
    } catch {
      setApiStatus({ configured: false, error: 'Erro ao verificar status' })
    } finally {
      setCheckingStatus(false)
    }
  }

  const runSync = async (type: string, url: string, method = 'POST') => {
    setLoading(prev => ({ ...prev, [type]: true }))
    try {
      const res = await fetch(url, { method })
      const data = await res.json()
      setResults(prev => ({ ...prev, [type]: data }))
      // Atualiza status após sync
      checkApiStatus()
    } catch {
      setResults(prev => ({ ...prev, [type]: { error: 'Erro de conexão' } }))
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }))
    }
  }

  type SyncAction = {
    key: string
    label: string
    description: string
    url: string
    method: string
    icon: string
    highlight?: boolean
  }

  const SYNC_ACTIONS: SyncAction[] = [
    {
      key: 'fd',
      label: 'Sincronizar via football-data.org',
      description: 'Gratuito · UTC real · bandeiras oficiais · 104 jogos da Copa',
      url: '/api/sync/fd',
      method: 'GET',
      icon: '⭐',
      highlight: true,
    },
    {
      key: 'matches',
      label: 'Sincronizar via API-Football (Pago)',
      description: 'Requer plano pago — tem escalações e eventos',
      url: '/api/sync/matches',
      method: 'GET',
      icon: '📅',
      highlight: false,
    },
    {
      key: 'live',
      label: 'Atualizar Ao Vivo',
      description: 'Atualiza placares dos jogos em andamento',
      url: '/api/sync/live',
      method: 'POST',
      icon: '⚡',
    },
  ]

  const usedPercent = apiStatus?.requests_used && apiStatus?.requests_limit
    ? Math.round((apiStatus.requests_used / apiStatus.requests_limit) * 100)
    : 0

  return (
    <AppShell isAdmin>
      <TopBar title="Sincronizar API" showBack />

      <div className="px-4 pt-4 pb-6 max-w-2xl mx-auto space-y-4">

        {/* Status da API */}
        <div className={`rounded-2xl p-4 border animate-slide-up ${
          checkingStatus ? 'bg-[#111827] border-[#1f2937]' :
          !apiStatus?.configured || apiStatus?.error ? 'bg-[#ef4444]/8 border-[#ef4444]/30' :
          'bg-[#22c55e]/8 border-[#22c55e]/30'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[#f9fafb] font-bold text-sm">Status da API-Football</p>
            <button
              onClick={checkApiStatus}
              disabled={checkingStatus}
              className="text-[#6b7280] text-xs hover:text-[#9ca3af] transition-colors disabled:opacity-50"
            >
              {checkingStatus ? 'Verificando...' : '↻ Atualizar'}
            </button>
          </div>

          {checkingStatus ? (
            <p className="text-[#6b7280] text-sm animate-pulse">Verificando conexão...</p>
          ) : !apiStatus?.configured || apiStatus?.error ? (
            <div>
              <p className="text-[#ef4444] text-sm font-semibold">❌ Não conectada</p>
              <p className="text-[#9ca3af] text-xs mt-1">{apiStatus?.error}</p>
              <div className="mt-3 bg-[#0d1117] rounded-xl p-3 text-xs text-[#6b7280] space-y-1">
                <p>1. Acesse <span className="text-[#F5C518]">api-sports.io</span> e copie sua API Key</p>
                <p>2. Adicione no <span className="text-[#F5C518]">.env.local</span>: <code className="text-[#22c55e]">API_FUTEBOL_KEY=sua-chave</code></p>
                <p>3. Reinicie o servidor: <code className="text-[#22c55e]">yarn dev</code></p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                <p className="text-[#22c55e] text-sm font-semibold">Conectada</p>
                {apiStatus.plan && (
                  <span className="text-[10px] bg-[#22c55e]/15 text-[#22c55e] px-2 py-0.5 rounded-full font-bold">
                    {apiStatus.plan}
                  </span>
                )}
              </div>

              {/* Barra de uso */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[#9ca3af] text-xs">Requisições hoje</p>
                  <p className="text-[#f9fafb] text-xs font-bold">
                    {apiStatus.requests_used}/{apiStatus.requests_limit}
                    <span className="text-[#6b7280] font-normal"> ({apiStatus.requests_remaining} restantes)</span>
                  </p>
                </div>
                <div className="w-full bg-[#1f2937] rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      usedPercent > 80 ? 'bg-[#ef4444]' :
                      usedPercent > 60 ? 'bg-[#F5C518]' :
                      'bg-[#22c55e]'
                    }`}
                    style={{ width: `${usedPercent}%` }}
                  />
                </div>
                <p className="text-[#4b5563] text-xs mt-1">Resetado todo dia às 00:00 UTC</p>
              </div>
            </div>
          )}
        </div>

        {/* Aviso */}
        <div className="bg-[#F5C518]/8 border border-[#F5C518]/25 rounded-2xl p-4 animate-slide-up delay-100">
          <p className="text-[#F5C518] text-xs font-semibold mb-1">⚠️ Importante</p>
          <p className="text-[#9ca3af] text-xs">
            Partidas manuais nunca são sobrescritas. Sincronize apenas quando necessário para economizar requisições.
          </p>
        </div>

        {/* Ações de sync */}
        {SYNC_ACTIONS.map(({ key, label, description, url, method, icon, highlight }) => (
          <div key={key} className={`rounded-2xl p-4 border animate-slide-up ${highlight ? 'bg-[#22c55e]/8 border-[#22c55e]/40' : 'bg-[#111827] border-[#1f2937]'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="text-[#f9fafb] font-semibold text-sm">{label}</p>
                  <p className="text-[#6b7280] text-xs">{description}</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => runSync(key, url, method)}
                loading={loading[key]}
                variant={highlight ? 'success' : 'secondary'}
                disabled={key !== 'copa' && (!apiStatus?.configured || !!apiStatus?.error)}
              >
                Executar
              </Button>
            </div>

            {results[key] && (
              <div className={`rounded-xl p-3 text-xs ${
                results[key].error
                  ? 'bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444]'
                  : 'bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e]'
              }`}>
                {results[key].error ? (
                  <p>❌ {results[key].error}</p>
                ) : (
                  <div className="space-y-1">
                    {results[key].synced !== undefined && (
                      <p>✓ {results[key].synced} partidas sincronizadas</p>
                    )}
                    {results[key].updated !== undefined && (
                      <p>✓ {results[key].updated} partidas atualizadas</p>
                    )}
                    {results[key].errors && results[key].errors!.length > 0 && (
                      <div className="text-[#F5C518] mt-1">
                        {results[key].errors!.slice(0, 3).map((e, i) => <p key={i}>⚠ {e}</p>)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </AppShell>
  )
}
