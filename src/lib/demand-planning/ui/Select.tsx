import { cn } from "../utils";
import { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, className, children, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[10px] font-bold text-muted uppercase tracking-wider">{label}</label>
      )}
      <div className="relative">
        <select
          className={cn(
            "w-full appearance-none bg-white border border-[#E7DDCB] rounded-lg px-3 py-2 pr-9 text-sm text-navy font-medium",
            "focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral",
            "hover:border-navy/30 transition-colors cursor-pointer",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
