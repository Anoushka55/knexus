import type { Persona } from '@/lib/kpmg-dice/types'

/**
 * Meridian Developers' buyer personas.
 *
 * Colours are a validated 6-slot categorical palette (validate_palette.js,
 * light mode: lightness band, chroma floor, CVD separation and contrast all
 * pass). The declared order below IS the board order — the two blues sit at
 * positions 1 and 5 deliberately, because adjacent they fail the
 * normal-vision separation check.
 */
export const PERSONAS: Persona[] = [
  {
    id: 'persona-first-time',
    name: 'First-Time Homebuyer',
    shortName: 'First-Time',
    description:
      'Buying their first home, usually a young couple or small family moving out of a rental. Highly price-sensitive and heavily dependent on loan eligibility.',
    budgetBand: '₹0.6 – 1.6 Cr',
    budgetRangeCr: [0.6, 1.6],
    typicalFamilySize: '1–3 members',
    motivations: [
      'Stop paying rent and start building equity',
      'Own before the next price cycle',
      'Proximity to workplace and transit',
    ],
    objections: [
      'Loan eligibility and down-payment gap',
      'Hidden charges beyond the base price',
      'Possession delay risk on under-construction stock',
    ],
    channels: ['Property portals', 'Organic search', 'WhatsApp'],
    buyingTriggers: ['Marriage', 'Rent hike', 'Job stability', 'Loan pre-approval'],
    preferredProjectTypes: ['1 BHK', '2 BHK', 'Ready to move'],
    bestFitProjects: ['prj-royal-pavilion', 'prj-dream-acres'],
    playbook:
      'Lead with total cost of ownership and a pre-approved loan tie-up. Compare EMI against current rent, and prioritise ready-to-move inventory to remove possession risk.',
    color: '#005EB8',
  },
  {
    id: 'persona-upgrade',
    name: 'Upgrade / Trade-Up Buyer',
    shortName: 'Upgrade',
    description:
      'Already owns a home and is moving up for space, schools or a better address. Decision is family-led and comparison-heavy across two or three shortlisted projects.',
    budgetBand: '₹1.6 – 3.5 Cr',
    budgetRangeCr: [1.6, 3.5],
    typicalFamilySize: '3–5 members',
    motivations: [
      'More space as the family grows',
      'Better schools and amenities',
      'Upgrade to a stronger address',
    ],
    objections: [
      'Possession timeline against the existing lease or sale',
      'Bridging the gap while the current home sells',
      'Carpet-area efficiency versus the current home',
    ],
    channels: ['Site visits', 'Email', 'Referrals', 'Website'],
    buyingTriggers: [
      'Growing family',
      'School admission cycle',
      'Sale of existing property',
    ],
    preferredProjectTypes: ['3 BHK', '4 BHK', 'Gated community'],
    bestFitProjects: ['prj-forest-edge', 'prj-silicon-oasis', 'prj-serein'],
    playbook:
      'Run a side-by-side comparison against their shortlist and lead with possession certainty. Sequence the site visit with the family, and pre-empt the bridging question with a flexible payment plan.',
    color: '#00A3A1',
  },
  {
    id: 'persona-investor',
    name: 'Investor / Yield Seeker',
    shortName: 'Investor',
    description:
      'Buying for rental yield and appreciation rather than to occupy. Evaluates several projects in parallel and moves fast when the numbers work.',
    budgetBand: '₹1.2 – 3.0 Cr',
    budgetRangeCr: [1.2, 3.0],
    typicalFamilySize: 'Not occupancy-driven',
    motivations: [
      'Rental yield and tenant demand',
      'Capital appreciation on infrastructure build-out',
      'Portfolio diversification',
    ],
    objections: [
      'Rental yield below expectation',
      'Exit liquidity in the micro-market',
      'Maintenance and vacancy cost',
    ],
    channels: ['Website', 'Broker network', 'Email'],
    buyingTriggers: [
      'New metro or infrastructure announcement',
      'Pre-launch pricing',
      'Bonus or liquidity event',
    ],
    preferredProjectTypes: ['1 BHK', '2 BHK', 'High rental-demand corridors'],
    bestFitProjects: ['prj-eureka-park', 'prj-dream-acres'],
    playbook:
      'Lead with a yield model, not a lifestyle pitch: rental comparables, absorption rate and the infrastructure timeline. Offer pre-launch allocation and a managed-rental tie-up.',
    color: '#C6007E',
  },
  {
    id: 'persona-nri',
    name: 'NRI Buyer',
    shortName: 'NRI',
    description:
      'Based overseas, buying remotely for investment or an eventual return. Cannot attend a site visit, so the journey stalls the moment it depends on physical presence.',
    budgetBand: '₹2.0 – 5.0 Cr',
    budgetRangeCr: [2.0, 5.0],
    typicalFamilySize: '2–4 members',
    motivations: [
      'An asset back home',
      'Rental income in INR',
      'A base for eventual return',
    ],
    objections: [
      'Cannot travel for a site visit',
      'Repatriation, FEMA and POA complexity',
      'Trusting construction quality remotely',
    ],
    channels: ['Video call', 'WhatsApp', 'Email', 'Virtual tour'],
    buyingTriggers: [
      'Favourable currency movement',
      'Planned return to India',
      'NRI-specific offer window',
    ],
    preferredProjectTypes: ['3 BHK', '4 BHK', 'Branded developer stock'],
    bestFitProjects: ['prj-windsor', 'prj-eureka-park'],
    playbook:
      'Never let the journey depend on travel. Lead with a video walkthrough in their timezone, a documented NRI payment route and POA support, plus third-party construction updates.',
    color: '#7C5CD6',
  },
  {
    id: 'persona-hni',
    name: 'HNI / Luxury Buyer',
    shortName: 'HNI',
    description:
      'Buying premium or trophy inventory where the decision is driven by exclusivity and view rather than price per square foot. Expects a senior, unhurried relationship.',
    budgetBand: '₹3.5 Cr and above',
    budgetRangeCr: [3.5, 15],
    typicalFamilySize: '3–6 members',
    motivations: [
      'Exclusivity and address prestige',
      'View, floor rise and private amenities',
      'Bespoke customisation',
    ],
    objections: [
      'Floor-rise and premium-charge negotiation',
      'Privacy and neighbour profile',
      'Customisation limits on the unit',
    ],
    channels: ['Direct relationship', 'Expo', 'Private site visit'],
    buyingTriggers: [
      'Trophy inventory release',
      'Business liquidity event',
      'Peer purchase in the same tower',
    ],
    preferredProjectTypes: ['4 BHK', 'Penthouse', 'Sea-facing'],
    bestFitProjects: ['prj-windsor', 'prj-serein', 'prj-forest-edge'],
    playbook:
      'Assign a senior relationship owner and keep the process private and unhurried. Lead with the specific unit — view, floor, customisation — and negotiate on inclusions rather than headline price.',
    color: '#0091DA',
  },
  {
    id: 'persona-referral',
    name: 'Referral / Walk-in',
    shortName: 'Referral',
    description:
      'Arrives through an existing customer or straight to the site office. Already carries trust, so the cycle is short — but only if someone responds quickly.',
    budgetBand: '₹1.0 – 2.5 Cr',
    budgetRangeCr: [1.0, 2.5],
    typicalFamilySize: '2–5 members',
    motivations: [
      'Trust in a recommendation from someone they know',
      'Already seen the project through a friend',
      'Referral benefit or walk-in offer',
    ],
    objections: [
      'Expects the same deal the referrer received',
      'Slow response undermines the referral',
      'Limited inventory left in the preferred tower',
    ],
    channels: ['Walk-in', 'WhatsApp', 'Phone'],
    buyingTriggers: [
      'A friend or relative booking in the project',
      'Referral scheme window',
      'Site-office visit',
    ],
    preferredProjectTypes: ['2 BHK', '3 BHK', 'Same project as the referrer'],
    bestFitProjects: ['prj-silicon-oasis', 'prj-dream-acres', 'prj-royal-pavilion'],
    playbook:
      'Respond within the hour — referral trust decays fast. Acknowledge the referrer by name, honour the scheme benefit explicitly, and shortcut straight to inventory selection.',
    color: '#A03FA8',
  },
]

export const PERSONAS_BY_ID = Object.fromEntries(
  PERSONAS.map((p) => [p.id, p]),
) as Record<string, Persona>

/** Kept for the legacy barrel export. */
export const personas = PERSONAS
