import type { Tables } from '@/types/database'

interface LineupSectionProps {
  lineup: Tables<'lineups'> & { players: Tables<'player_lineups'>[] }
  teamName: string
}

export function LineupSection({ lineup, teamName }: LineupSectionProps) {
  const starters = lineup.players.filter((p) => p.is_starter).sort((a, b) => (a.shirt_number ?? 99) - (b.shirt_number ?? 99))
  const bench = lineup.players.filter((p) => !p.is_starter).sort((a, b) => (a.shirt_number ?? 99) - (b.shirt_number ?? 99))

  return (
    <div className="bg-[#111827] rounded-2xl border border-[#1f2937] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[#f9fafb] font-bold text-sm">{teamName}</h3>
        {lineup.formation && (
          <span className="bg-[#1f2937] text-[#F5C518] text-xs font-bold px-2 py-1 rounded-lg">
            {lineup.formation}
          </span>
        )}
      </div>

      {lineup.coach_name && (
        <p className="text-[#6b7280] text-xs mb-3">Técnico: {lineup.coach_name}</p>
      )}

      <div className="space-y-1 mb-3">
        {starters.map((player) => (
          <div key={player.id} className="flex items-center gap-2.5 py-1.5">
            <span className="w-6 h-6 rounded-md bg-[#1f2937] flex items-center justify-center text-[#F5C518] text-xs font-bold shrink-0">
              {player.shirt_number ?? '-'}
            </span>
            <span className="text-[#f9fafb] text-sm flex-1">{player.player_name}</span>
            {player.position && (
              <span className="text-[#4b5563] text-xs">{player.position}</span>
            )}
          </div>
        ))}
      </div>

      {bench.length > 0 && (
        <>
          <p className="text-[#4b5563] text-xs font-semibold uppercase tracking-wider mb-2 pt-2 border-t border-[#1f2937]">
            Banco
          </p>
          <div className="space-y-1">
            {bench.map((player) => (
              <div key={player.id} className="flex items-center gap-2.5 py-1">
                <span className="w-6 h-6 rounded-md bg-[#0d1117] flex items-center justify-center text-[#4b5563] text-xs font-bold shrink-0">
                  {player.shirt_number ?? '-'}
                </span>
                <span className="text-[#6b7280] text-sm flex-1">{player.player_name}</span>
                {player.position && (
                  <span className="text-[#374151] text-xs">{player.position}</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
