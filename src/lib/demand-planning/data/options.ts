import { DemandRecord } from "./mockData";

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function getFilterOptions(data: DemandRecord[]) {
  return {
    skuOptions: unique(data.map((r) => r.sku_name)).sort(),
    depotOptions: unique(data.map((r) => r.depot_name)).sort(),
    accountOptions: unique(data.map((r) => r.account_name)).sort(),
    brandOptions: unique(data.map((r) => r.brand_name)).sort(),
    periodOptions: unique(data.map((r) => r.period)).sort(),
  };
}

export interface Filters {
  sku: string;
  depot: string;
  account: string;
  brand: string;
  period: string;
}

export const DEFAULT_FILTERS: Filters = {
  sku: "all",
  depot: "all",
  account: "all",
  brand: "all",
  period: "all",
};

export function applyFilters<T extends {
  sku_name: string; depot_name: string; account_name: string; brand_name: string; period: string;
}>(data: T[], filters: Filters): T[] {
  return data.filter((r) => {
    if (filters.sku !== "all" && r.sku_name !== filters.sku) return false;
    if (filters.depot !== "all" && r.depot_name !== filters.depot) return false;
    if (filters.account !== "all" && r.account_name !== filters.account) return false;
    if (filters.brand !== "all" && r.brand_name !== filters.brand) return false;
    if (filters.period !== "all" && r.period !== filters.period) return false;
    return true;
  });
}
