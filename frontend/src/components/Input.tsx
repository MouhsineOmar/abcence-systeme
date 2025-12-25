import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

export default function Input({ label, hint, className="", ...props }: Props) {
  return (
    <label className="block">
      {label ? <div className="mb-1 text-sm font-medium text-zinc-200">{label}</div> : null}
      <input
        {...props}
        className={[
          "w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm outline-none",
          "placeholder:text-zinc-600 focus:border-zinc-600 focus:ring-2 focus:ring-zinc-700/50",
          className,
        ].join(" ")}
      />
      {hint ? <div className="mt-1 text-xs text-zinc-500">{hint}</div> : null}
    </label>
  );
}
