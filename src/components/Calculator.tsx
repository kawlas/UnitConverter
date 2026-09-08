import React, { useState, useEffect } from 'react';
import { evaluateExpression } from '@/lib/calculator';

export default function Calculator() {
  const [display, setDisplay] = useState('0');
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('q-converter:calc-history:v1');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch { /* ignore */ }
    }
  }, []);

  const saveHistory = (next: string[]) => {
    setHistory(next);
    localStorage.setItem('q-converter:calc-history:v1', JSON.stringify(next));
  };

  const handleKey = (key: string) => {
    if (key === '=') {
      try {
        const result = evaluateExpression(display);
        const entry = `${display} = ${result}`;
        saveHistory([entry, ...history.filter((item) => !item.startsWith(display))].slice(0, 50));
        setDisplay(String(result));
      } catch {
        setDisplay('Error');
      }
      return;
    }
    if (key === 'C') {
      setDisplay('0');
      return;
    }
    if (key === '⌫') {
      setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
      return;
    }
    setDisplay((prev) => {
      if (prev === '0' || prev === 'Error') return key;
      return prev + key;
    });
  };

  const keys = [
    ['C', '⌫', '%', '/'],
    ['7', '8', '9', '*'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '='],
  ];

  return (
    <div className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(11,16,32,0.08)] sm:grid-cols-[minmax(280px,1fr)_minmax(220px,0.6fr)]">
      <div className="space-y-3">
        <div className="min-h-[88px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right text-4xl font-bold tracking-tight text-slate-950">
          {display}
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
          {keys.flat().map((key) => (
            <button
              key={key}
              onClick={() => handleKey(key)}
              className="flex h-14 min-h-[56px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-semibold text-slate-900 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 active:scale-[0.97]"
            >
              {key}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">History</h3>
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {history.length === 0 && <p className="text-xs text-slate-500">No calculations yet.</p>}
          {history.map((item, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
