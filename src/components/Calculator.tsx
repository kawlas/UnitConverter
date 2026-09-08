import React, { useState, useEffect } from 'react';
import { evaluateExpression } from '../lib/calculator-parser';

interface HistoryItem {
  id: string;
  expression: string;
  result: number;
  timestamp: number;
}

export default function Calculator() {
  const [expression, setExpression] = useState('');
  const [display, setDisplay] = useState('0');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load history from localStorage and auto-purge items older than 30 days
  useEffect(() => {
    try {
      const saved = localStorage.getItem('q_calculator_history');
      if (saved) {
        const parsed: HistoryItem[] = JSON.parse(saved);
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const valid = parsed.filter(item => item.timestamp > thirtyDaysAgo);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHistory(valid);
        localStorage.setItem('q_calculator_history', JSON.stringify(valid));
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Sync with URL query parameter ?expr=...
  // Use a ref to track previous expression to avoid unnecessary updates
  const previousExprRef = React.useRef<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const exprParam = params.get('expr');
    if (exprParam && exprParam !== previousExprRef.current) {
      previousExprRef.current = exprParam;
      setExpression(exprParam);
      try {
        const res = evaluateExpression(exprParam);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDisplay(String(res));
      } catch {
        // ignore invalid URL expressions
      }
    }
  }, []);

  const updateUrlSync = (newExpr: string) => {
    try {
      const url = new URL(window.location.href);
      if (newExpr) {
        url.searchParams.set('expr', newExpr);
      } else {
        url.searchParams.delete('expr');
      }
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore
    }
  };

  const handleCalculate = (exprToCalc?: string) => {
    const targetExpr = exprToCalc !== undefined ? exprToCalc : expression;
    if (!targetExpr.trim()) return;

    try {
      setError(null);
      const res = evaluateExpression(targetExpr);
      setDisplay(String(res));
      setExpression(''); // clear expression after calculation so new input starts fresh

      const newItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        expression: targetExpr,
        result: res,
        timestamp: Date.now()
      };

      const updatedHistory = [newItem, ...history].slice(0, 20); // Keep max 20 items
      setHistory(updatedHistory);
      try {
        localStorage.setItem('q_calculator_history', JSON.stringify(updatedHistory));
      } catch {
        // ignore
      }

      updateUrlSync('');
    } catch {
      setError('Błąd składni');
    }
  };

  const handleClear = () => {
    setExpression('');
    setDisplay('0');
    setError(null);
    updateUrlSync('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCalculate();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleClear();
    }
  };

  const handleConvertToConverter = () => {
    const val = display;
    window.location.href = `/converter?value=${encodeURIComponent(val)}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 border border-zinc-200 dark:border-zinc-800">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Q Calculator Pro</h2>
        
        {/* Display */}
        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-4 mb-4 text-right">
          <div className="text-sm text-zinc-500 dark:text-zinc-400 min-h-[1.25rem]">{expression || '0'}</div>
          <div className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 truncate">{display}</div>
          {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
        </div>

        {/* Dual Mode Input */}
        <div className="mb-4">
          <input
            type="text"
            value={expression}
            onChange={(e) => {
              setExpression(e.target.value);
              updateUrlSync(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Wpisz wyrażenie (np. 15 + 20 * 2)..."
            className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+', '(', ')', '%'].map((btn) => (
            <button
              key={btn}
              onClick={() => {
                if (btn === '=') {
                  handleCalculate();
                } else {
                  setExpression(prev => prev + btn);
                }
              }}
              className="p-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold rounded-lg transition"
            >
              {btn}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="p-3 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 font-semibold rounded-lg transition col-span-2"
          >
            AC / C
          </button>
          <button
            onClick={() => handleCalculate()}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition col-span-2"
          >
            Oblicz
          </button>
        </div>

        {/* Convert Button */}
        <button
          onClick={handleConvertToConverter}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md transition flex items-center justify-center gap-2"
        >
          <span>Konwertuj wynik (Convert)</span>
        </button>
      </div>

      {/* History Sidebar */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 border border-zinc-200 dark:border-zinc-800 flex flex-col h-[500px]">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center justify-between">
          <span>Ostatnie obliczenia</span>
          <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-500">{history.length}/20</span>
        </h3>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {history.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-10">Brak historii</p>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setExpression(item.expression);
                  setDisplay(String(item.result));
                  updateUrlSync(item.expression);
                }}
                className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition border border-zinc-200/50 dark:border-zinc-700/50"
              >
                <div className="text-xs text-zinc-500 dark:text-zinc-400">{item.expression}</div>
                <div className="text-md font-bold text-zinc-900 dark:text-zinc-100">= {item.result}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}