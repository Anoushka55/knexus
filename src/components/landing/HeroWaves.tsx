/**
 * The soft, woven horizon under the hero — a stack of low-opacity curves that
 * fade the network backdrop into the section below it.
 */
export function HeroWaves() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 220"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full sm:h-52"
    >
      <defs>
        <linearGradient id="hero-wave-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e7e4fa" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      <path
        d="M0 96 C 240 44, 480 132, 720 104 S 1200 40, 1440 84 L1440 220 L0 220 Z"
        fill="url(#hero-wave-fill)"
      />

      {/* Hairlines suggest the knitted mesh without adding visual weight. */}
      {[0, 16, 32, 48, 64, 80].map((offset) => (
        <path
          key={offset}
          d={`M0 ${112 + offset} C 240 ${60 + offset}, 480 ${148 + offset}, 720 ${120 + offset} S 1200 ${56 + offset}, 1440 ${100 + offset}`}
          fill="none"
          stroke="#c7d2fe"
          strokeOpacity={0.3 - offset * 0.0025}
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}
