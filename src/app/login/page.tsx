"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-bold">Log in</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Each account is scoped to one role — a retailer login only sees its own inventory, an
        NGO login only sees its own matches, and the Glean admin console is separate from both.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
            autoComplete="username"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
            autoComplete="current-password"
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          Log in
        </button>
      </form>

      <div className="mt-10 rounded-xl border border-black/10 p-4 text-xs dark:border-white/10">
        <p className="mb-2 font-semibold text-zinc-700 dark:text-zinc-300">Demo accounts</p>
        <ul className="flex flex-col gap-1.5 text-zinc-500">
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.username}>
              <span className="text-zinc-700 dark:text-zinc-300">{a.label}:</span>{" "}
              <code>{a.username}</code> / <code>{a.password}</code>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
