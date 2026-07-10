import Link from "next/link";

const CARDS = [
  {
    href: "/retailer",
    title: "Retailer dashboard",
    desc: "List inventory, see freshness scores and suggested markdowns, route surplus to NGOs or consumers.",
  },
  {
    href: "/ngo",
    title: "NGO surplus feed",
    desc: "Accept or decline incoming matches. Set your own category, freshness, and capacity preferences.",
  },
  {
    href: "/consumer",
    title: "Consumer deals",
    desc: "Browse markdown deals near you, filterable by category and location.",
  },
  {
    href: "/impact",
    title: "Impact dashboard",
    desc: "Meals redirected, CO2e avoided, revenue recovered — and average freshness of donations.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Demo — NGO accounts and matches are simulated
      </div>
      <h1 className="mt-4 text-4xl font-bold tracking-tight">Glean</h1>
      <p className="mt-3 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
        An AI circular food network: predicts freshness, recommends dynamic markdown pricing
        before expiry, and matches surplus to nearby buyers or NGOs — with a hard safety floor
        so nothing unsafe is ever redistributed.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-xl border border-black/10 p-5 transition-colors hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:border-white/10 dark:hover:bg-emerald-950/20"
          >
            <h2 className="font-semibold">{c.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
