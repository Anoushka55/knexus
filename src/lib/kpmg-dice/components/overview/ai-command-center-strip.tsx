import {
  Brain,
  ChartColumn,
  Cog,
  HandHeart,
  IndianRupee,
  Target,
  type LucideIcon,
} from 'lucide-react'

import { BRAND, VALUE_PILLARS } from '@/lib/kpmg-dice/config/brand'

const PILLAR_ICONS: Record<string, LucideIcon> = {
  Brain,
  Target,
  Cog,
  ChartColumn,
  IndianRupee,
  HandHeart,
}

export function AiCommandCenterStrip() {
  return (
    <section className="overflow-hidden rounded-xl bg-rail-800 text-white shadow-card">
      <div className="flex flex-col gap-5 p-5 xl:flex-row xl:items-stretch xl:gap-0">
        {/* Tagline */}
        <div className="shrink-0 xl:w-[250px] xl:pr-6">
          <h2 className="text-[19px] font-bold leading-tight tracking-[-0.01em]">
            AI Command Center
          </h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-white/60">
            {BRAND.oneLiner}
          </p>
        </div>

        {/* Pillars */}
        <ul className="grid flex-1 grid-cols-2 gap-y-5 sm:grid-cols-3 xl:grid-cols-6 xl:gap-y-0">
          {VALUE_PILLARS.map((pillar) => {
            const Icon = PILLAR_ICONS[pillar.icon]
            return (
              <li
                key={pillar.id}
                className="flex items-center gap-2.5 px-1 xl:justify-center xl:border-l xl:border-white/10 xl:px-3"
              >
                <Icon
                  className="size-[26px] shrink-0 text-white/85"
                  strokeWidth={1.4}
                />
                <span className="whitespace-pre-line text-[12.5px] font-semibold leading-tight">
                  {pillar.label}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
