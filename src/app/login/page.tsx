"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeaderAccent from "@/components/PageHeaderAccent";

const DEMO_ACCOUNTS = [
  { label: "Glean admin (dispatch console)", username: "glean-admin", password: "glean-admin-demo" },
  { label: "Riverside Market (retailer)", username: "riverside", password: "riverside-demo" },
  { label: "Elm Street Grocers (retailer)", username: "elmstreet", password: "elmstreet-demo" },
  { label: "Community Food Shelter (NGO)", username: "food-shelter", password: "shelter-demo" },
  { label: "Neighbors Table Pantry (NGO)", username: "table-pantry", password: "pantry-demo" },
  { label: "Harbor Relief Kitchen (NGO)", username: "relief-kitchen", password: "kitchen-demo" },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <PageHeaderAccent className="mb-4" />
      <h1 className="font-serif text-3xl tracking-tight text-ink">Log in</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        Each account is scoped to one role — a retailer login only sees its own inventory, an
        NGO login only sees its own matches, and the Glean admin console is separate from both.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-6">
        <label className="block">
          <span className="text-xs font-medium text-ink-faint">Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-hairline-strong bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none transition-colors focus:border-accent focus:bg-bg focus:ring-2 focus:ring-accent/30"
            autoComplete="username"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-ink-faint">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-hairline-strong bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none transition-colors focus:border-accent focus:bg-bg focus:ring-2 focus:ring-accent/30"
            autoComplete="current-password"
          />
        </label>
        {error && <p className="text-sm text-status-unsafe">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          Log in
        </button>
      </form>

      <div className="mt-14 border-t border-hairline pt-6">
        <p className="mb-3 text-xs font-medium text-ink-faint">Demo accounts</p>
        <ul className="flex flex-col gap-2 text-xs text-ink-soft">
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.username}>
              <span className="text-ink">{a.label}</span>
              {" — "}
              <code className="text-ink-soft">{a.username}</code>
              {" / "}
              <code className="text-ink-soft">{a.password}</code>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
