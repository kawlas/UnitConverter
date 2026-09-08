import React, { useState, useEffect, useRef, useCallback } from 'react';
import { evaluateExpression } from '../lib/calculator-parser';

interface HistoryItem {
  id: string;
  expression: string;
  result: number;
  timestamp: number;
}

const STORAGE_KEY = 'q_calculator_history';
const MAX_HISTORY = 20;
const PURGE_DAYS = 30;

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);
}

export default function Calculator() {
  const [expression, setExpression] = useState('');
  const [display, setDisplay] = useState('0');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [startingNew, setStartingNew] = useState(true);
  const urlParamRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: HistoryItem[] = JSON.parse(saved);
        const thirtyDaysAgo = Date.now() - PURGE_DAYS * 24 * 60 * 60 * 1000;
        const valid = parsed.filter(item => item.timestamp > thirtyDaysAgo);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHistory(valid);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
      }
    } catch {
      // ignore storage errors
    }
  }, []);

    useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const exprParam = params.get('expr');
    
    if (exprParam && exprParam !== urlParamRef.current) {
      urlParamRef.current = exprParam;
      setExpression(exprParam);
      try {
        const res = evaluateExpression(exprParam);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDisplay(String(res));
        setStartingNew(false);
      } catch {
        // ignore invalid URL expressions
      }
    }
  }, []);

  const updateUrlSync = useCallback((newExpr: string) => {
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
  }, []);

  const handleCalculate = useCallback((exprToCalc?: string) => {
    const targetExpr = exprToCalc !== undefined ? exprToCalc : expression;
    if (!targetExpr.trim() && !exprToCalc) return;

    try {
      setError(null);
      const res = evaluateExpression(targetExpr);
      setDisplay(String(res));
      setExpression('');
      setStartingNew(true);

      const newItem: HistoryItem = {
        id: generateId(),
        expression: targetExpr,
        result: res,
        timestamp: Date.now()
      };

      setHistory(prev => {
        const updated = [newItem, ...prev].slice(0, MAX_HISTORY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });

      updateUrlSync('');
    } catch {
      setError('Syntax Error');
    }
  }, [expression, updateUrlSync]);

  const handleClear = useCallback(() => {
    setExpression('');
    setDisplay('0');
    setError(null);
    setStartingNew(true);
    updateUrlSync('');
  }, [updateUrlSync]);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCalculate();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleClear();
    }
  }, [handleCalculate, handleClear]);

  const handleConvertToConverter = useCallback(() => {
    const val = display;
    window.location.href = `/length?value=${encodeURIComponent(val)}`;
  }, [display]);

  const handleButtonPress = useCallback((btn: string) => {
    if (btn === '=') {
      handleCalculate();
      return;
    }
    if (btn === 'AC') {
      handleClear();
      return;
    }
    if (btn === '⌫') {
      setExpression(prev => {
        const next = prev.length > 0 ? prev.slice(0, -1) : '';
        updateUrlSync(next);
        return next;
      });
      return;
    }

    if (startingNew && /^[0-9.]$/.test(btn)) {
      setDisplay(btn === '.' ? '0.' : btn);
      setExpression(btn === '.' ? '0.' : btn);
      setStartingNew(false);
      return;
    }

    setExpression(prev => {
      const next = prev + btn;
      setStartingNew(false);
      updateUrlSync(next);
      return next;
    });
  }, [startingNew, handleCalculate, handleClear, updateUrlSync]);

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
              setStartingNew(false);
              updateUrlSync(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type expression (e.g. 15 + 20 * 2)..."
            className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+', '(', ')', '%', '⌫', 'AC'].map((btn) => (
            <button
              key={btn}
              onClick={() => handleButtonPress(btn)}
              className={`p-3 font-semibold rounded-lg transition ${
                btn === '='
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : btn === 'AC'
                  ? 'bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300'
                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
              }`}
            >
              {btn}
            </button>
          ))}
        </div>

        {/* Convert Button */}
        <button
          onClick={handleConvertToConverter}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md transition flex items-center justify-center gap-2"
        >
          Convert Result
        </button>
      </div>

      {/* History Sidebar */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 border border-zinc-200 dark:border-zinc-800 flex flex-col h-[500px]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            History ({history.length}/20)
          </h3>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-xs text-red-600 dark:text-red-400 hover:underline"
            >
              Clear History
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {history.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-10">No history</p>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setExpression(item.expression);
                  setDisplay(String(item.result));
                  setStartingNew(true);
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