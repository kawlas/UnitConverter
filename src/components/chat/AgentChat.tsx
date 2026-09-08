import React, { useState, useEffect } from 'react';

interface Message {
  agent: string;
  text: string;
  timestamp: number;
}

const agents = ['PM', 'UX', 'Architect', 'Security', 'Research'];
const starterLines = [
  'Kickoff: we need a world-class calculator.',
  'UX proposal: dedicated /calculator page with history.',
  'Security: no eval(), safe parser only.',
  'Research: users want quick math + unit conversion bridge.',
];

export default function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    setMessages(
      starterLines.map((text, index) => ({
        agent: agents[index % agents.length],
        text,
        timestamp: Date.now() - (starterLines.length - index) * 1000,
      })),
    );
  }, []);

  const send = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { agent: 'You', text: input.trim(), timestamp: Date.now() }]);
    setInput('');
  };

  return (
    <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(11,16,32,0.08)]">
      <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Agent Sync Chat</h3>
      <div className="mt-3 h-64 space-y-2 overflow-y-auto">
        {messages.map((msg, idx) => (
          <div key={idx} className="text-xs text-slate-800">
            <span className="font-semibold text-indigo-700">{msg.agent}:</span> {msg.text}
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Type a message..."
        />
        <button
          onClick={send}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
