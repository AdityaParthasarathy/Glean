import Link from "next/link";
import { TextEffect } from "@/components/core/text-effect";
import { AnimatedGroup } from "@/components/core/animated-group";
import Velaris from "@/components/ui/velaris";

// Literal hex copies of globals.css tokens (--color-ink/--color-accent/
// --color-clay/--color-accent-soft/--color-accent-hover). Velaris parses
// its bg/colors props as raw hex, so they can't reference the CSS custom
// properties directly — keep these in sync with globals.css by hand.
const HERO_BG = "#23201a"; // --color-ink
const HERO_COLORS = [
  "#e4e8d7", // --color-accent-soft
  "#445337", // --color-accent
  "#a85c34", // --color-clay
  "#333f2a", // --color-accent-hover
];

const SECTIONS = [
  {
    href: "/retailer",
    title: "Retailer dashboard",
    desc: "List inventory, see freshness scores and suggested markdowns, sell directly to consumers.",
    gated: true,
  },
  {
    href: "/glean",
    title: "Glean dispatch console",
    desc: "The middleman: matches listed surplus to NGOs and owns pickup and delivery once accepted.",
    gated: true,
  },
  {
    href: "/ngo",
    title: "NGO surplus feed",
    desc: "Accept or decline incoming matches. Set your own category, freshness, and capacity preferences.",
    gated: true,
  },
  {
    href: "/consumer",
    title: "Consumer deals",
    desc: "Browse markdown deals near you, filterable by category and location.",
    gated: false,
  },
  {
    href: "/impact",
    title: "Impact dashboard",
    desc: "Meals redirected, CO2e avoided, revenue recovered — and average freshness of donations.",
    gated: false,
  },
];

export default function Home() {
  return (
    <div>
      <Velaris
        bg={HERO_BG}
        colors={HERO_COLORS}
        speed={0.9}
        grain={0.18}
        height="auto"
        className="border-b border-black/20"
      >
        <div className="mx-auto max-w-3xl px-6 py-24 sm:py-32">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium tracking-[0.14em] text-white/80 uppercase backdrop-blur-sm">
            <span className="h-1 w-1 rounded-full bg-accent-soft" />
            Demo — accounts and NGO matches are simulated
          </p>

          <TextEffect
            as="h1"
            per="word"
            preset="slide"
            className="max-w-xl font-serif text-[2.5rem] leading-[1.12] tracking-tight text-white sm:text-5xl"
          >
            An AI circular food network
          </TextEffect>

          <p className="mt-6 max-w-lg text-[16px] leading-relaxed text-white/70">
            Glean predicts freshness, recommends dynamic markdown pricing before expiry, and
            matches surplus to nearby buyers or NGOs — with a hard safety floor so nothing unsafe
            is ever redistributed. The retailer, Glean, and NGO interfaces each require their own
            login; no account can see the other two.
          </p>

          <Link
            href="/login"
            className="mt-8 inline-flex items-center rounded-full bg-bg px-5 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
          >
            Log in
          </Link>
        </div>
      </Velaris>

      <div className="mx-auto max-w-3xl px-6 pb-20 sm:pb-28">
        <AnimatedGroup className="mt-16 border-t border-hairline" preset="blur-slide">
          {SECTIONS.map((s, i) => (
            <Link
              key={s.href}
              href={s.href}
              className="group -mx-3 flex items-start justify-between gap-6 border-b border-hairline px-3 py-6 transition-colors hover:bg-surface"
            >
              <div className="flex items-baseline gap-4">
                <span className="font-serif text-sm text-ink-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-serif text-lg text-ink transition-colors group-hover:text-accent">
                      {s.title}
                    </h2>
                    {s.gated && (
                      <span className="rounded-full border border-hairline-strong px-2 py-0.5 text-[10px] font-medium text-ink-faint">
                        login required
                      </span>
                    )}
                  </div>
                  <p className="mt-1 max-w-md text-sm text-ink-soft">{s.desc}</p>
                </div>
              </div>
              <span className="mt-1 shrink-0 text-ink-faint transition-all group-hover:translate-x-0.5 group-hover:text-accent">
                →
              </span>
            </Link>
          ))}
        </AnimatedGroup>
      </div>
    </div>
  );
}
