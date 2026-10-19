import type { Campaign, Project, SalesRep } from '@/lib/kpmg-dice/types'

/**
 * Fixed clock for the whole demo.
 *
 * Every generated timestamp is derived from this anchor rather than from
 * `new Date()`, which keeps the dataset deterministic — the server and the
 * browser generate byte-identical data, so nothing hydrates mismatched and a
 * demo run on any day shows the same numbers.
 */
export const DEMO_NOW = new Date('2026-05-31T10:30:00.000Z')

export const MICRO_MARKETS = [
  'Powai',
  'Thane',
  'Kalyan',
  'Mulund',
  'Seawoods',
  'Andheri',
  'Navi Mumbai',
  'Chembur',
  'Ghatkopar',
  'Borivali',
  'Panvel',
  'Dombivli',
] as const

export const PROJECTS: Project[] = [
  {
    id: 'prj-forest-edge',
    name: 'Meridian Forest Edge',
    location: 'Powai',
    priceRangeCr: [2.1, 4.8],
    possession: 'Dec 2027',
    unitTypes: ['2 BHK', '3 BHK', '4 BHK'],
  },
  {
    id: 'prj-dream-acres',
    name: 'Meridian Dream Acres',
    location: 'Thane',
    priceRangeCr: [1.2, 2.6],
    possession: 'Jun 2027',
    unitTypes: ['1 BHK', '2 BHK', '3 BHK'],
  },
  {
    id: 'prj-windsor',
    name: 'Meridian Windsor',
    location: 'Seawoods',
    priceRangeCr: [2.8, 6.5],
    possession: 'Mar 2028',
    unitTypes: ['3 BHK', '4 BHK', 'Penthouse'],
  },
  {
    id: 'prj-royal-pavilion',
    name: 'Meridian Royal Pavilion',
    location: 'Kalyan',
    priceRangeCr: [0.7, 1.6],
    possession: 'Ready to move',
    unitTypes: ['1 BHK', '2 BHK'],
  },
  {
    id: 'prj-silicon-oasis',
    name: 'Meridian Silicon Oasis',
    location: 'Mulund',
    priceRangeCr: [1.6, 3.4],
    possession: 'Sep 2027',
    unitTypes: ['2 BHK', '3 BHK'],
  },
  {
    id: 'prj-serein',
    name: 'Meridian Serein',
    location: 'Andheri',
    priceRangeCr: [2.4, 5.6],
    possession: 'Ready to move',
    unitTypes: ['2 BHK', '3 BHK', '4 BHK'],
  },
  {
    id: 'prj-eureka-park',
    name: 'Meridian Eureka Park',
    location: 'Navi Mumbai',
    priceRangeCr: [1.4, 3.1],
    possession: 'Dec 2026',
    unitTypes: ['2 BHK', '3 BHK'],
  },
  {
    id: 'prj-primanti',
    name: 'Meridian Primanti',
    location: 'Powai',
    priceRangeCr: [3.4, 6.2],
    possession: 'Mar 2028',
    unitTypes: ['3 BHK', '4 BHK'],
  },
  {
    id: 'prj-new-haven',
    name: 'Meridian New Haven',
    location: 'Thane',
    priceRangeCr: [1.4, 2.6],
    possession: 'Sep 2027',
    unitTypes: ['1 BHK', '2 BHK'],
  },
  {
    id: 'prj-promont',
    name: 'Meridian Promont',
    location: 'Seawoods',
    priceRangeCr: [2.8, 5.1],
    possession: 'Jun 2028',
    unitTypes: ['2 BHK', '3 BHK'],
  },
  {
    id: 'prj-lakeside-habitat',
    name: 'Meridian Lakeside Habitat',
    location: 'Kalyan',
    priceRangeCr: [0.9, 1.8],
    possession: 'Dec 2026',
    unitTypes: ['1 BHK', '2 BHK'],
  },
  {
    id: 'prj-falcon-city',
    name: 'Meridian Falcon City',
    location: 'Mulund',
    priceRangeCr: [1.8, 3.4],
    possession: 'Mar 2027',
    unitTypes: ['2 BHK', '3 BHK'],
  },
  {
    id: 'prj-waterford',
    name: 'Meridian Waterford',
    location: 'Andheri',
    priceRangeCr: [4.2, 8.5],
    possession: 'Sep 2028',
    unitTypes: ['3 BHK', '4 BHK'],
  },
  {
    id: 'prj-park-grove',
    name: 'Meridian Park Grove',
    location: 'Navi Mumbai',
    priceRangeCr: [1.6, 3.1],
    possession: 'Jun 2027',
    unitTypes: ['2 BHK', '3 BHK'],
  },
  {
    id: 'prj-sunrise-park',
    name: 'Meridian Sunrise Park',
    location: 'Thane',
    priceRangeCr: [2.2, 4.0],
    possession: 'Dec 2027',
    unitTypes: ['2 BHK', '3 BHK'],
  },
  {
    id: 'prj-kew-gardens',
    name: 'Meridian Kew Gardens',
    location: 'Powai',
    priceRangeCr: [5.1, 9.4],
    possession: 'Mar 2029',
    unitTypes: ['4 BHK', '5 BHK'],
  },
  {
    id: 'prj-white-meadows',
    name: 'Meridian White Meadows',
    location: 'Mulund',
    priceRangeCr: [3.0, 5.6],
    possession: 'Sep 2027',
    unitTypes: ['3 BHK', '4 BHK'],
  },
]

export const REPS: SalesRep[] = [
  {
    id: 'rep-rk',
    name: 'Rahul Kulkarni',
    initials: 'RK',
    territory: 'Powai · Mulund',
  },
  {
    id: 'rep-as',
    name: 'Ananya Sharma',
    initials: 'AS',
    territory: 'Thane · Dombivli',
  },
  {
    id: 'rep-sp',
    name: 'Siddharth Pillai',
    initials: 'SP',
    territory: 'Seawoods · Navi Mumbai',
  },
  {
    id: 'rep-mb',
    name: 'Meera Bhatt',
    initials: 'MB',
    territory: 'Kalyan · Panvel',
  },
  {
    id: 'rep-vr',
    name: 'Vikram Rao',
    initials: 'VR',
    territory: 'Andheri · Borivali',
  },
]

/**
 * Per-campaign funnel targets.
 *
 * The generator emits exactly these counts, so every derived figure on the
 * Overview (12,842 to 4,652 to 842 to 326 to 246) falls out of the data itself
 * rather than being written into a card. The five marketing campaigns are the
 * only ones that clear a 2.7% booking rate, so "Top Campaigns by Quality"
 * ranks to precisely the five in the brief.
 */
export interface CampaignTargets {
  leads: number
  qualified: number
  siteVisits: number
  bookings: number
  closedWon: number
  /** Mean booking value in Cr for this campaign's converted leads. */
  avgBookingCr: number
}

export interface SeedCampaign extends Campaign {
  targets: CampaignTargets
  /** Shown in "Top Campaigns by Quality"; the rest are long-tail sources. */
  headline: boolean
}

export const CAMPAIGNS: SeedCampaign[] = [
  {
    id: 'cmp-summer-homes',
    name: 'Summer Homes 2026',
    channel: 'Integrated (Digital + OOH)',
    startedAt: '2026-01-12',
    spendLakh: 182,
    headline: true,
    targets: {
      leads: 1842,
      qualified: 842,
      siteVisits: 156,
      bookings: 114,
      closedWon: 86,
      avgBookingCr: 4.07,
    },
  },
  {
    id: 'cmp-urban-living',
    name: 'Urban Living Festival',
    channel: 'Events + Performance',
    startedAt: '2026-02-02',
    spendLakh: 134,
    headline: true,
    targets: {
      leads: 1236,
      qualified: 512,
      siteVisits: 98,
      bookings: 68,
      closedWon: 51,
      avgBookingCr: 3.53,
    },
  },
  {
    id: 'cmp-premium-living',
    name: 'Premium Living Expo',
    channel: 'Expo + Direct',
    startedAt: '2025-12-08',
    spendLakh: 96,
    headline: true,
    targets: {
      leads: 972,
      qualified: 402,
      siteVisits: 72,
      bookings: 47,
      closedWon: 35,
      avgBookingCr: 5.1,
    },
  },
  {
    id: 'cmp-refer-earn',
    name: 'Refer & Earn',
    channel: 'Referral',
    startedAt: '2025-11-20',
    spendLakh: 41,
    headline: true,
    targets: {
      leads: 654,
      qualified: 210,
      siteVisits: 34,
      bookings: 20,
      closedWon: 15,
      avgBookingCr: 3.34,
    },
  },
  {
    id: 'cmp-digital-organic',
    name: 'Digital Organic',
    channel: 'SEO + Social',
    startedAt: '2025-10-01',
    spendLakh: 28,
    headline: true,
    targets: {
      leads: 1345,
      qualified: 412,
      siteVisits: 48,
      bookings: 36,
      closedWon: 27,
      avgBookingCr: 3.04,
    },
  },

  /* Long-tail sources — high volume, poor quality. */
  {
    id: 'cmp-portals',
    name: 'Property Portals',
    channel: 'Aggregator',
    startedAt: '2025-09-01',
    spendLakh: 214,
    headline: false,
    targets: {
      leads: 3200,
      qualified: 1050,
      siteVisits: 170,
      bookings: 19,
      closedWon: 14,
      avgBookingCr: 2.55,
    },
  },
  {
    id: 'cmp-broker',
    name: 'Broker Network',
    channel: 'Channel Partner',
    startedAt: '2025-09-15',
    spendLakh: 168,
    headline: false,
    targets: {
      leads: 2100,
      qualified: 700,
      siteVisits: 150,
      bookings: 13,
      closedWon: 10,
      avgBookingCr: 2.85,
    },
  },
  {
    id: 'cmp-corporate',
    name: 'Corporate Tie-ups',
    channel: 'B2B2C',
    startedAt: '2025-11-05',
    spendLakh: 62,
    headline: false,
    targets: {
      leads: 900,
      qualified: 320,
      siteVisits: 68,
      bookings: 6,
      closedWon: 5,
      avgBookingCr: 2.35,
    },
  },
  {
    id: 'cmp-walkin',
    name: 'Walk-in & Site Enquiry',
    channel: 'Direct',
    startedAt: '2025-09-01',
    spendLakh: 12,
    headline: false,
    targets: {
      leads: 593,
      qualified: 204,
      siteVisits: 46,
      bookings: 3,
      closedWon: 3,
      avgBookingCr: 2.16,
    },
  },
]

/**
 * Stored monthly rollups.
 *
 * Historical conversion cannot be recomputed from a current-state snapshot —
 * a lead only carries the stage it is in today, not the stage it was in three
 * months ago. A real deployment persists a monthly snapshot; this is that
 * table. The final month's values are recomputed live from the current book.
 */
export const MONTHLY_ROLLUPS = [
  { month: "Dec'25", leadToSiteVisit: 4.8, leadToBooking: 1.6 },
  { month: "Jan'26", leadToSiteVisit: 5.2, leadToBooking: 1.9 },
  { month: "Feb'26", leadToSiteVisit: 5.6, leadToBooking: 2.1 },
  { month: "Mar'26", leadToSiteVisit: 6.0, leadToBooking: 2.2 },
  { month: "Apr'26", leadToSiteVisit: 6.3, leadToBooking: 2.4 },
  { month: "May'26", leadToSiteVisit: 6.6, leadToBooking: 2.5 },
]

/* ------------------------------------------------------------------ */
/* Name pools for generated leads                                      */
/* ------------------------------------------------------------------ */

export const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Akash', 'Ameya', 'Anand', 'Ananya', 'Aniket', 'Anjali',
  'Ankit', 'Arjun', 'Aruna', 'Ashwin', 'Bhavna', 'Chetan', 'Darshan', 'Deepa',
  'Devika', 'Dhruv', 'Farhan', 'Gaurav', 'Geeta', 'Harsh', 'Hiral', 'Ishaan',
  'Jaya', 'Kabir', 'Kalpana', 'Karan', 'Kavya', 'Kunal', 'Lakshmi', 'Madhav',
  'Mahesh', 'Manish', 'Meenal', 'Mihir', 'Mohit', 'Namrata', 'Neha', 'Nikhil',
  'Nisha', 'Omkar', 'Pallavi', 'Parth', 'Pooja', 'Prakash', 'Pranav', 'Priya',
  'Rahul', 'Rajesh', 'Rakhi', 'Ramesh', 'Rashmi', 'Ravi', 'Rhea', 'Ritu',
  'Rohit', 'Sagar', 'Sanjay', 'Sanya', 'Shalini', 'Shreya', 'Siddharth',
  'Smita', 'Sneha', 'Sunil', 'Swati', 'Tanvi', 'Tarun', 'Uday', 'Vaibhav',
  'Varun', 'Vidya', 'Vikram', 'Vinay', 'Vishal', 'Yash', 'Zoya',
]

export const LAST_NAMES = [
  'Agarwal', 'Bhatt', 'Chauhan', 'Deshmukh', 'Desai', 'Dhawan', 'Gokhale',
  'Gupta', 'Iyer', 'Jain', 'Joshi', 'Kamath', 'Kapoor', 'Karnik', 'Khanna',
  'Kulkarni', 'Kumar', 'Malhotra', 'Mehta', 'Menon', 'Mishra', 'Nadkarni',
  'Nair', 'Naik', 'Pandey', 'Patel', 'Patil', 'Pillai', 'Prabhu', 'Raut',
  'Rao', 'Reddy', 'Sathe', 'Saxena', 'Sen', 'Shah', 'Sharma', 'Shetty',
  'Singh', 'Sinha', 'Subramanian', 'Thakur', 'Trivedi', 'Verma', 'Wadhwa',
]

export const OCCUPATIONS = [
  'IT Professional', 'Chartered Accountant', 'Business Owner', 'Doctor',
  'Banking Professional', 'Consultant', 'Architect', 'Pharma Executive',
  'Marketing Head', 'Civil Engineer', 'Lawyer', 'Professor',
]

/**
 * Which quarter of the week an ISO timestamp falls in.
 *
 * Shared by the feedback generator (to predict a contact window from a lead's
 * own history) and by the response-knowledge selector (to report when people
 * actually respond) — one classification, so the two never disagree about
 * what "weekday evening" means.
 */
export type DayPart = 'weekday-day' | 'weekday-evening' | 'weekend-day' | 'weekend-evening'

export function dayPartOf(iso: string): DayPart {
  const d = new Date(iso)
  const day = d.getUTCDay() // 0 Sun .. 6 Sat
  const hour = d.getUTCHours()
  const weekend = day === 0 || day === 6
  const evening = hour >= 17 || hour < 6
  if (weekend) return evening ? 'weekend-evening' : 'weekend-day'
  return evening ? 'weekday-evening' : 'weekday-day'
}

/** Re-stamps an ISO timestamp at a given UTC hour, keeping the date. */
export function atHour(iso: string, hour: number) {
  const d = new Date(iso)
  d.setUTCHours(hour, 0, 0, 0)
  return d.toISOString()
}

/**
 * Stable index into a pool, derived from a string key.
 *
 * Used where a record needs a plausible time of day: both generators carry
 * PRNG sequences whose draw order is load-bearing, so taking a draw here would
 * shift every number after it. Same key, same answer, no draw consumed.
 */
export function stableIndex(key: string, salt: number, modulo: number) {
  let h = 2166136261 ^ salt
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h) % modulo
}
