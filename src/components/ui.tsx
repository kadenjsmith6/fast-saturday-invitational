"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-card border border-line rounded-xl p-4 ${className}`}>{children}</div>;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const styles = {
    primary: "bg-pine text-sand hover:bg-pine-2",
    ghost: "bg-transparent border border-line hover:bg-sand-2",
    danger: "bg-transparent text-loss border border-loss/40 hover:bg-loss/10",
  }[variant];
  return (
    <button
      {...props}
      className={`px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-40 ${styles} ${className}`}
    />
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1">{label}</span>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-line rounded-lg px-3 py-2 bg-white ${props.className ?? ""}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full border border-line rounded-lg px-3 py-2 bg-white ${props.className ?? ""}`}
    />
  );
}

export function Status({ loading, error, pending }: { loading?: boolean; error?: string | null; pending?: boolean }) {
  if (error)
    return (
      <div className="text-sm rounded-lg px-3 py-2 bg-loss/10 text-loss">
        Can&apos;t reach the database right now. Showing the last data this phone saw. ({error})
      </div>
    );
  if (loading) return <div className="text-sm text-muted">Loading…</div>;
  if (pending)
    return (
      <div className="text-sm rounded-lg px-3 py-2 bg-gold/20 text-ink">
        Waiting to sync — your entries are saved on this phone and will upload when you have signal.
      </div>
    );
  return null;
}

export function strokeLabel(n: number) {
  if (!n) return "0";
  return Number.isInteger(n) ? `${n}` : `${Math.floor(n) || ""}½`;
}
