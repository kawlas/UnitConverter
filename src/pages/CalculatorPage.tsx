import React from 'react';
import Calculator from '@/components/Calculator';
import { useTheme } from '@/components/DarkModeProvider';
import ConvertButton from '@/components/ConvertButton';

export default function CalculatorPage() {
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Q Calculator Pro</h1>
          <button onClick={toggle} className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
            {theme === 'light' ? 'Dark' : 'Light'} mode
          </button>
        </div>
        <p className="mt-2 max-w-xl text-sm text-slate-600 sm:text-base">
          Fast, keyboard-friendly calculations with history and instant unit conversion.
        </p>
        <div className="mt-6">
          <Calculator />
        </div>
      </div>
    </div>
  );
}
