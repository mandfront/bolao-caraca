interface CardProps {
  children: React.ReactNode
  className?: string
  glow?: 'yellow' | 'green' | 'red' | null
  onClick?: () => void
}

export function Card({ children, className = '', glow, onClick }: CardProps) {
  const glowStyle = {
    yellow: 'shadow-[0_0_20px_rgba(245,197,24,0.15)] border-[#F5C518]/30',
    green: 'shadow-[0_0_20px_rgba(34,197,94,0.15)] border-[#22c55e]/30',
    red: 'shadow-[0_0_20px_rgba(239,68,68,0.15)] border-[#ef4444]/30',
  }

  return (
    <div
      onClick={onClick}
      className={`
        bg-[#111827] rounded-2xl border border-[#1f2937]
        ${glow ? glowStyle[glow] : ''}
        ${onClick ? 'cursor-pointer hover:border-[#374151] transition-colors' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-4 pt-4 pb-3 ${className}`}>{children}</div>
  )
}

export function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-4 pb-4 ${className}`}>{children}</div>
  )
}
