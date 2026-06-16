import type { RankingEntry } from '@/types/prediction'

interface RankingTableProps {
  ranking: RankingEntry[]
  currentUserId?: string
}

const MEDALS = ['🥇', '🥈', '🥉']

export function RankingTable({ ranking, currentUserId }: RankingTableProps) {
  if (!ranking.length) {
    return (
      <div className="text-center py-12 text-[#4b5563] text-sm">
        Nenhum palpite registrado ainda
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {ranking.map((entry, index) => {
        const isTop3 = index < 3
        const isMe = entry.user_id === currentUserId
        const medal = MEDALS[index]

        return (
          <div
            key={entry.user_id}
            className={`
              flex items-center gap-3 p-3 rounded-2xl border transition-all
              ${isMe ? 'border-[#F5C518]/40 bg-[#F5C518]/5' : 'border-[#1f2937] bg-[#111827]'}
              ${isTop3 ? 'shadow-lg' : ''}
              animate-slide-up
            `}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Position */}
            <div className="w-8 text-center shrink-0">
              {medal ? (
                <span className="text-xl">{medal}</span>
              ) : (
                <span className="text-[#6b7280] text-sm font-bold">{entry.position}</span>
              )}
            </div>

            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 ${
              isTop3 ? 'border-[#F5C518]/40' : 'border-[#1f2937]'
            } ${isMe ? 'bg-[#F5C518]/15' : 'bg-[#1f2937]'}`}>
              {entry.avatar_url ? (
                <img src={entry.avatar_url} alt={entry.user_name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-lg">{entry.user_name[0]?.toUpperCase()}</span>
              )}
            </div>

            {/* Name + stats */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className={`font-semibold text-sm truncate ${isMe ? 'text-[#F5C518]' : 'text-[#f9fafb]'}`}>
                  {entry.user_name}
                </p>
                {isMe && <span className="text-[10px] text-[#F5C518] font-bold bg-[#F5C518]/15 px-1.5 rounded">Você</span>}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[#6b7280] text-xs">{entry.predictions_count} palpites</span>
                {entry.exact_scores > 0 && (
                  <span className="text-[#F5C518] text-xs">⚡ {entry.exact_scores} exatos</span>
                )}
              </div>
            </div>

            {/* Points */}
            <div className="text-right shrink-0">
              <p className={`font-display text-2xl leading-none ${isTop3 ? 'text-[#F5C518]' : 'text-[#f9fafb]'}`}>
                {entry.total_points}
              </p>
              <p className="text-[#6b7280] text-xs">pts</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
