import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-semibold text-[#d1d5db]">
            {label}
            {props.required && <span className="text-[#ef4444] ml-0.5">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-3 rounded-xl
            bg-[#0d1117] border border-[#1f2937]
            text-[#f9fafb] placeholder-[#4b5563]
            focus:outline-none focus:border-[#F5C518]/60 focus:ring-1 focus:ring-[#F5C518]/30
            transition-colors text-sm
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-[#ef4444]/60 focus:border-[#ef4444]/60 focus:ring-[#ef4444]/30' : ''}
            ${className}
          `}
          {...props}
        />
        {hint && !error && <p className="text-xs text-[#6b7280]">{hint}</p>}
        {error && <p className="text-xs text-[#ef4444]">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  children: React.ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, children, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-semibold text-[#d1d5db]">
            {label}
            {props.required && <span className="text-[#ef4444] ml-0.5">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full px-4 py-3 rounded-xl
            bg-[#0d1117] border border-[#1f2937]
            text-[#f9fafb]
            focus:outline-none focus:border-[#F5C518]/60 focus:ring-1 focus:ring-[#F5C518]/30
            transition-colors text-sm
            ${error ? 'border-[#ef4444]/60' : ''}
            ${className}
          `}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-[#ef4444]">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
