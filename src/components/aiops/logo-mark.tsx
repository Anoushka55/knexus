export function LogoMark({ size = 56 }: { size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div className="aiops-pulse-ring absolute inset-0 rounded-aiops-sm" />
      <svg viewBox="0 0 56 56" width={size} height={size}>
        <rect x="6" y="6" width="20" height="20" fill="#00338D" />
        <rect x="30" y="6" width="20" height="20" fill="#005EB8" />
        <rect x="6" y="30" width="20" height="20" fill="#005EB8" />
        <rect x="30" y="30" width="20" height="20" fill="#00B0A0" />
        <circle cx="40" cy="40" r="4" fill="#fff" />
      </svg>
    </div>
  );
}
