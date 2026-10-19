/**
 * Single source of truth for demo branding and the signed-in persona.
 * KPMG-branded throughout; the demo client is the fictional "Meridian Developers".
 */

export const BRAND = {
  vendor: 'KPMG',
  product: 'DICE',
  productFull: 'Digital Infrastructure & Customer Experience',
  appName: 'Customer Journey Command Center',
  /**
   * The descriptor under the rail wordmark.
   *
   * Its own field rather than a slice of `appName`: the rail has about 185px
   * of usable width and the full name needs roughly twice that, so this is a
   * deliberate short form, not a truncation of another string.
   */
  railDescriptor: 'Command Center',
  tagline: 'AI-Powered Customer Intelligence Platform.',
  oneLiner: 'One AI Brain. Every Customer Interaction. Every Journey.',
  demoClient: 'Meridian Developers',
  leadIdPrefix: 'MRD',
} as const

export const CURRENT_USER = {
  name: 'Anand Kumar',
  role: 'Sales Manager',
  initials: 'AK',
} as const

/** The six value pillars rendered in the AI Command Center footer strip. */
export const VALUE_PILLARS = [
  { id: 'intent', label: 'Understand\nCustomer Intent', icon: 'Brain' },
  { id: 'nba', label: 'Recommend\nNext Best Action', icon: 'Target' },
  { id: 'automate', label: 'Automate\nFollow-ups', icon: 'Cog' },
  { id: 'convert', label: 'Improve\nConversions', icon: 'ChartColumn' },
  { id: 'revenue', label: 'Drive\nRevenue', icon: 'IndianRupee' },
  { id: 'delight', label: 'Delight\nCustomers', icon: 'HandHeart' },
] as const
