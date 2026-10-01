import React from 'react';

interface DateSeparatorProps {
  label: string;
}

export function DateSeparator({ label }: DateSeparatorProps) {
  if (!label) return null;

  return (
    <div className="flex items-center justify-center my-3.5 select-none">
      <span className="rounded-full bg-white/85 border border-slate-200/60 px-3.5 py-1 text-[11.5px] font-medium text-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-md">
        {label}
      </span>
    </div>
  );
}
