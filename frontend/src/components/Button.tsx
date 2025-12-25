import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export default function Button({ variant = "primary", className = "", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition border";
  const styles =
    variant === "secondary"
      ? "border-zinc-800 bg-zinc-900/60 text-zinc-100 hover:bg-zinc-900"
      : "border-zinc-800 bg-white text-black hover:bg-zinc-200";

  return (
    <button
      type="button"
      {...props}
      className={`${base} ${styles} ${className}`}
    />
  );
}
