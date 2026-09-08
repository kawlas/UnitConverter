import React from 'react';

type Props = {
  value: number;
};

export default function ConvertButton({ value }: Props) {
  const href = `/convert/generic?value=${encodeURIComponent(value)}`;

  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
    >
      Convert
    </a>
  );
}
