export type JourneySeverity = 'High' | 'Medium' | 'Low' | 'None';

export interface CustomerJourney {
  id: string;
  name: string;
  /** lucide-react icon name */
  icon: string;
  status: string;
  impact: string;
  severity: JourneySeverity;
}

export const customerJourneys: CustomerJourney[] = [
  {
    id: 'online-checkout',
    name: 'Online Checkout',
    icon: 'ShoppingCart',
    status: 'Transaction failures',
    impact: '£184K',
    severity: 'High',
  },
  {
    id: 'click-collect',
    name: 'Click & Collect',
    icon: 'Target',
    status: 'Delayed pickups',
    impact: '£32K',
    severity: 'Medium',
  },
  {
    id: 'home-delivery',
    name: 'Home Delivery',
    icon: 'Truck',
    status: 'Delivery delays',
    impact: '£18K',
    severity: 'Low',
  },
  {
    id: 'loyalty',
    name: 'Loyalty Program',
    icon: 'Star',
    status: 'Points sync failures',
    impact: '£7K',
    severity: 'Low',
  },
  {
    id: 'search-browse',
    name: 'Search & Browse',
    icon: 'Search',
    status: 'Healthy',
    impact: '—',
    severity: 'None',
  },
];

export const customerJourneysById: Record<string, CustomerJourney> = customerJourneys.reduce<
  Record<string, CustomerJourney>
>((acc, journey) => {
  acc[journey.id] = journey;
  return acc;
}, {});
