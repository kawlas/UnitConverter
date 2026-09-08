import React, { useState } from "react";
import { convert } from "@/lib/conversions";

interface ConversionItem {
  id: string;
  fromValue: string;
  fromUnit: string;
  toUnit: string;
  categoryId: string;
  result: string;
  createdAt: number;
}

interface SavedConversionsProps {
  categoryId?: string;
  units?: Array<{ value: string; label: string }>;
}

const STORAGE_KEY = "uni_converter_saved";
const MAX_ITEMS = 8;

function loadItems(categoryId?: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ConversionItem[];
      const filtered = categoryId
        ? parsed.filter((item) => item.categoryId === categoryId)
        : parsed;
      return filtered
        .slice()
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, MAX_ITEMS);
    }
  } catch {
    return [];
  }
  return [];
}

export function SavedConversions({
  categoryId,
  units = [],
}: SavedConversionsProps) {
  const [items, setItems] = useState<ConversionItem[]>(() => loadItems(categoryId));
  const [inputValue, setInputValue] = useState("1");

  const [prevCategoryId, setPrevCategoryId] = useState(categoryId);
  if (categoryId !== prevCategoryId) {
    setPrevCategoryId(categoryId);
    setItems(loadItems(categoryId));
  }

  const saveCurrent = () => {
    if (!categoryId || !units.length) return;
    const numericValue = Number(inputValue);
    if (!Number.isFinite(numericValue)) return;

    const toUnit = units[units.length - 1]?.value || units[0]?.value;
    const fromUnit = units[0]?.value || "";
    if (!fromUnit || !toUnit || fromUnit === toUnit) return;

    const result = convert(numericValue, fromUnit, toUnit, categoryId);

    const newItem: ConversionItem = {
      id: `${Date.now()}`,
      fromValue: inputValue,
      fromUnit,
      toUnit,
      categoryId,
      result: result.toString(),
      createdAt: Date.now(),
    };

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const existing: ConversionItem[] = raw ? JSON.parse(raw) : [];
      const filtered = existing.filter(
        (item) =>
          !(
            item.categoryId === newItem.categoryId &&
            item.fromUnit === newItem.fromUnit &&
            item.toUnit === newItem.toUnit
          )
      );
      const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setItems((prev) => [newItem, ...prev].slice(0, MAX_ITEMS));
    } catch {
      setItems((prev) => [newItem, ...prev].slice(0, MAX_ITEMS));
    }
  };

  const removeItem = (id: string) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const existing: ConversionItem[] = raw ? JSON.parse(raw) : [];
      const updated = existing.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const unitsMap = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const unit of units) {
      map.set(unit.value, unit.label);
    }
    return map;
  }, [units]);

  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        No saved conversions yet. Use the converter above, then save your
        frequent calculations here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Quick save current conversion
          </label>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            placeholder="Value"
          />
        </div>
        <button
          type="button"
          onClick={saveCurrent}
          className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
        >
          Save conversion
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900/60"
          >
            <div className="space-y-1">
              <div className="font-medium text-slate-900 dark:text-slate-100">
                {item.fromValue} {unitsMap.get(item.fromUnit) || item.fromUnit} →{" "}
                {item.result} {unitsMap.get(item.toUnit) || item.toUnit}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {new Date(item.createdAt).toLocaleString()}
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="ml-3 text-xs text-red-500 hover:text-red-600"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
