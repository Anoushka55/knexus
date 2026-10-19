"use client";
import { useMemo } from "react";
import { Select } from "./Select";
import { Filters, getFilterOptions } from "../data/options";
import { useDataContext } from "../state/dataContext";

interface Props {
  filters: Filters;
  onChange: (next: Filters) => void;
  showBrand?: boolean;
}

export function FilterBar({ filters, onChange, showBrand = true }: Props) {
  const { activeDataset } = useDataContext();
  const { skuOptions, depotOptions, accountOptions, brandOptions, periodOptions } = useMemo(
    () => getFilterOptions(activeDataset),
    [activeDataset]
  );

  const update = (k: keyof Filters, v: string) => onChange({ ...filters, [k]: v });

  return (
    <div className="bg-white rounded-xl border border-[#E7DDCB] p-4 grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      <Select label="SKU" value={filters.sku} onChange={(e) => update("sku", e.target.value)}>
        <option value="all">All SKUs</option>
        {skuOptions.map((s) => <option key={s} value={s}>{s}</option>)}
      </Select>
      <Select label="Depot" value={filters.depot} onChange={(e) => update("depot", e.target.value)}>
        <option value="all">All Depots</option>
        {depotOptions.map((d) => <option key={d} value={d}>{d}</option>)}
      </Select>
      <Select label="Account" value={filters.account} onChange={(e) => update("account", e.target.value)}>
        <option value="all">All Accounts</option>
        {accountOptions.map((a) => <option key={a} value={a}>{a}</option>)}
      </Select>
      {showBrand && (
        <Select label="Brand" value={filters.brand} onChange={(e) => update("brand", e.target.value)}>
          <option value="all">All Brands</option>
          {brandOptions.map((b) => <option key={b} value={b}>{b}</option>)}
        </Select>
      )}
      <Select label="Period" value={filters.period} onChange={(e) => update("period", e.target.value)}>
        <option value="all">All Periods</option>
        {periodOptions.map((p) => <option key={p} value={p}>{p}</option>)}
      </Select>
    </div>
  );
}
