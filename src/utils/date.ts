export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    ...options,
  }).format(new Date(date))
}

export function formatMatchDate(date: string): string {
  return formatDate(date, { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatMatchTime(date: string): string {
  return formatDate(date, { hour: '2-digit', minute: '2-digit' })
}

export function formatDateTime(date: string): string {
  return formatDate(date, {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatRelative(date: string): string {
  const now = new Date()
  const target = new Date(date)
  const diff = target.getTime() - now.getTime()
  const absDiff = Math.abs(diff)

  if (absDiff < 60000) return 'agora'
  if (absDiff < 3600000) {
    const mins = Math.round(absDiff / 60000)
    return diff > 0 ? `em ${mins}min` : `há ${mins}min`
  }
  if (absDiff < 86400000) {
    const hours = Math.round(absDiff / 3600000)
    return diff > 0 ? `em ${hours}h` : `há ${hours}h`
  }
  const days = Math.round(absDiff / 86400000)
  return diff > 0 ? `em ${days}d` : `há ${days}d`
}

export function isSameDay(a: string, b: string): boolean {
  const dateA = new Date(a)
  const dateB = new Date(b)
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  )
}

export function groupByDate<T extends { starts_at: string }>(items: T[]): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const key = formatMatchDate(item.starts_at)
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {} as Record<string, T[]>)
}
