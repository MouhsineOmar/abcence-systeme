import React from "react";

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
};

export default function Select({ label, hint, className="", children, ...props }: Props) {
  return (
    <label className="block">
      {label ? <div className="mb-1 text-sm font-medium text-zinc-200">{label}</div> : null}
      <select
        {...props}
        className={[
          "w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm outline-none",
          "focus:border-zinc-600 focus:ring-2 focus:ring-zinc-700/50",
          className,
        ].join(" ")}
      >
        {children}
      </select>
      {hint ? <div className="mt-1 text-xs text-zinc-500">{hint}</div> : null}
    </label>
  );
}
