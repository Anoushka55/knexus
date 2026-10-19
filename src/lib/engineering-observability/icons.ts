import {
  Activity,
  AlertTriangle,
  AppWindow,
  BarChart3,
  Bot,
  Box,
  Boxes,
  Briefcase,
  Cloud,
  Code,
  CreditCard,
  Database,
  ExternalLink,
  GitBranch,
  Globe,
  Heart,
  History,
  Layers,
  Monitor,
  Network,
  Radio,
  Search,
  Server,
  Settings,
  ShieldAlert,
  ShoppingCart,
  Smartphone,
  Star,
  Store,
  Target,
  Ticket,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react';

/**
 * The `/data` model stores icon names as strings so it stays serialisable and
 * framework-agnostic. This is the single place those names resolve to
 * components — add here when a data file introduces a new icon name.
 */
export const ICONS: Record<string, LucideIcon> = {
  Activity,
  AlertTriangle,
  AppWindow,
  BarChart3,
  Bot,
  Box,
  Boxes,
  Briefcase,
  Cloud,
  Code,
  CreditCard,
  Database,
  ExternalLink,
  GitBranch,
  Globe,
  Heart,
  History,
  Layers,
  Monitor,
  Network,
  Radio,
  Search,
  Server,
  Settings,
  ShieldAlert,
  ShoppingCart,
  Smartphone,
  Star,
  Store,
  Target,
  Ticket,
  Truck,
  Users,
};

/** Resolves a data-model icon name, falling back to a neutral glyph. */
export function getIcon(name: string | undefined, fallback: LucideIcon = Box): LucideIcon {
  if (!name) return fallback;
  return ICONS[name] ?? fallback;
}
