import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, getCurrentProfile } from '@/lib/supabase/server'
import { AppShell, TopBar } from '@/components/Navigation'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile(user.id)
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [matchCountResult, syncLogsResult, teamsCountResult] = await Promise.all([
    supabase.from('matches').select('id', { count: 'exact', head: true }),
    supabase.from('sync_logs').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('teams').select('id', { count: 'exact', head: true }),
  ])

  const matchCount = matchCountResult.count ?? 0
  const teamsCount = teamsCountResult.count ?? 0
  const recentLogs = syncLogsResult.data ?? []

  return (
    <AppShell isAdmin>
      <TopBar title="Admin" />

      <div className="px-4 pt-4 pb-6 max-w-2xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 animate-slide-up">
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4">
            <p className="font-display text-4xl text-[#F5C518]">{matchCount}</p>
            <p className="text-[#6b7280] text-xs mt-0.5">Partidas cadastradas</p>
          </div>
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4">
            <p className="font-display text-4xl text-[#22c55e]">{teamsCount}</p>
            <p className="text-[#6b7280] text-xs mt-0.5">Times cadastrados</p>
          </div>
        </div>

        {/* Actions */}
        <div className="animate-slide-up delay-100">
          <h3 className="text-[#6b7280] text-xs font-semibold uppercase tracking-wider mb-3">Ações</h3>
          <div className="space-y-2">
            <Link
              href="/admin/partidas"
              className="flex items-center justify-between p-4 bg-[#111827] border border-[#1f2937] rounded-2xl hover:border-[#374151] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">⚽</span>
                <div>
                  <p className="text-[#f9fafb] font-semibold text-sm">Gerenciar Partidas</p>
                  <p className="text-[#6b7280] text-xs">Criar, editar e atualizar partidas</p>
                </div>
              </div>
              <span className="text-[#374151]">→</span>
            </Link>

            <Link
              href="/admin/sincronizar"
              className="flex items-center justify-between p-4 bg-[#111827] border border-[#1f2937] rounded-2xl hover:border-[#374151] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🔄</span>
                <div>
                  <p className="text-[#f9fafb] font-semibold text-sm">Sincronizar API</p>
                  <p className="text-[#6b7280] text-xs">Buscar dados da API Futebol</p>
                </div>
              </div>
              <span className="text-[#374151]">→</span>
            </Link>
          </div>
        </div>

        {/* Recent sync logs */}
        {recentLogs.length > 0 && (
          <div className="animate-slide-up delay-200">
            <h3 className="text-[#6b7280] text-xs font-semibold uppercase tracking-wider mb-3">Logs recentes</h3>
            <div className="space-y-2">
              {recentLogs.map((log) => (
                <div key={log.id} className="bg-[#111827] border border-[#1f2937] rounded-xl p-3 flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    log.status === 'success' ? 'bg-[#22c55e]' :
                    log.status === 'error' ? 'bg-[#ef4444]' :
                    'bg-[#F5C518]'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[#f9fafb] text-xs font-semibold">{log.type}</p>
                    {log.message && <p className="text-[#6b7280] text-xs truncate">{log.message}</p>}
                  </div>
                  <p className="text-[#4b5563] text-xs shrink-0">
                    {new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
