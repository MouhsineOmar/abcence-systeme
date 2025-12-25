import React from "react";

export default function Toast({ type, message }: { type: "success" | "error" | "info"; message: string }) {
  const styles =
    type === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : type === "error"
      ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
      : "border-sky-500/30 bg-sky-500/10 text-sky-200";

  return <div className={"rounded-xl border px-4 py-3 text-sm " + styles}>{message}</div>;
}
