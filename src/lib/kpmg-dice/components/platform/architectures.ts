import { MessagesSquare, Network, Share2, type LucideIcon } from 'lucide-react'

import { FeedbackIntelligenceSlide } from './feedback-intelligence-slide'
import { CrmArchitecture } from './crm-architecture'
import { AgentCollaborationSlide } from './agent-collaboration-slide'

/**
 * The reference architectures this build can show.
 *
 * A registry rather than hard-wired pages: adding an architecture is one entry
 * here plus its component, and the tile grid, the route and the segmented bar
 * all pick it up without further edits.
 */
export interface ArchitectureEntry {
  slug: string
  name: string
  /** Short label for the segmented bar, where the full name will not fit. */
  shortName: string
  blurb: string
  icon: LucideIcon
  /** Descriptive chips for the tile. Plain facts about the diagram itself. */
  facts: string[]
  /** Reserved but not yet authored — the tile says so rather than implying content. */
  pending?: boolean
  Component: () => React.JSX.Element
}

export const ARCHITECTURES: ArchitectureEntry[] = [
  {
    // First in the array, so it renders left of the SPAR tile.
    slug: 'dice-clm',
    name: 'KPMG DICE Architecture for CLM',
    shortName: 'KPMG DICE for CLM',
    blurb:
      'The full CRM-centric stack for customer lifecycle management: interaction channels and data foundation feeding the CRM hub, the AI intelligence and orchestration layers above it, and the business outcomes they drive.',
    icon: Network,
    facts: ['6 layers', 'CRM hub', '8 outcomes'],
    Component: CrmArchitecture,
  },
  {
    slug: 'feedback-intelligence',
    name: 'KPMG SPAR AI Engine for Customer Intelligence',
    // The bar sits two-across; the full name would wrap.
    shortName: 'KPMG SPAR AI Engine',
    blurb:
      'Strengthening Voice-of-Customer insights: the existing customer and survey data feeding the KPMG SPAR AI Engine, and the participation outcomes it is meant to produce.',
    icon: MessagesSquare,
    facts: ['3-stage flow', 'SPAR engine', '5-step pathway'],
    Component: FeedbackIntelligenceSlide,
  },
  {
    slug: 'agent-collaboration',
    name: 'DICE Agent Collaboration Fabric',
    shortName: 'Agent Collaboration',
    blurb:
      'How the seventeen agents hand conclusions to one another: the four chains and the agents in each, where a step stops and passes its finding forward, how a completed step is marked, and where the run statistics surface.',
    icon: Share2,
    facts: ['17 agents', '4 chains', '3 roles'],
    Component: AgentCollaborationSlide,
  },
]

export const ARCHITECTURE_SLUGS = ARCHITECTURES.map((a) => a.slug)

export function architectureBySlug(slug: string) {
  return ARCHITECTURES.find((a) => a.slug === slug)
}
