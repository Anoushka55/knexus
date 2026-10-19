import { cn } from "../utils";
import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary: "bg-coral text-white hover:bg-coral-dark active:bg-coral-dark",
  secondary: "bg-navy text-white hover:bg-navy-soft active:bg-navy-soft",
  outline: "bg-white text-navy border border-navy/20 hover:bg-navy/5",
  ghost: "bg-transparent text-navy hover:bg-navy/5",
  danger: "bg-critical text-white hover:opacity-90",
};

const sizeClass: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

export function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus:outline-none focus:ring-2 focus:ring-coral/40 focus:ring-offset-2 focus:ring-offset-cream",
        variantClass[variant],
        sizeClass[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
