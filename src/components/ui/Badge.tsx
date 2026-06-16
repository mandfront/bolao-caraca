type BadgeVariant = 'default' | 'yellow' | 'green' | 'red' | 'blue' | 'outline'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[#1f2937] text-[#9ca3af]',
  yellow: 'bg-[#F5C518]/15 text-[#F5C518] border border-[#F5C518]/30',
  green: 'bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30',
  red: 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30',
  blue: 'bg-[#3b82f6]/15 text-[#3b82f6] border border-[#3b82f6]/30',
  outline: 'border border-[#374151] text-[#9ca3af]',
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full
        text-xs font-semibold tracking-wide
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}

export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#22c55e]/15 border border-[#22c55e]/40 text-[#22c55e] text-xs font-bold tracking-widest animate-live-pulse">
      <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
      AO VIVO
    </span>
  )
}
