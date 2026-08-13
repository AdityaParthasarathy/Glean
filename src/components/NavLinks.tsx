"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AnimatedBackground } from "@/components/core/animated-background";
import { notifyError } from "@/lib/toast";

export interface NavLinkItem {
  href: string;
  label: string;
}

const itemClass =
  "rounded-full px-3.5 py-1.5 text-[12.5px] font-medium text-ink-soft transition-colors hover:text-ink";

const mobileItemClass =
  "block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink-soft transition-colors hover:bg-accent-soft hover:text-ink";

export default function NavLinks({
  items,
  showLogout,
}: {
  items: NavLinkItem[];
  showLogout?: boolean;
}) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (err) {
      notifyError(err);
    }
  }

  const children = [
    ...items.map((item) => (
      <Link key={item.href} data-id={item.href} href={item.href} className={itemClass}>
        {item.label}
      </Link>
    )),
    ...(showLogout
      ? [
          <button key="logout" data-id="logout" onClick={handleLogout} className={itemClass}>
            Log out
          </button>,
        ]
      : []),
  ];

  return (
    <>
      {/* Desktop/tablet: the existing animated pill row, unchanged. */}
      <div className="hidden sm:block">
        <AnimatedBackground
          className="rounded-full bg-accent-soft"
          transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
          enableHover
        >
          {children}
        </AnimatedBackground>
      </div>

      {/* Mobile: the pill row has no room to breathe below sm — even
          without triggering page-level overflow, it sits flush against
          the viewport edge with zero margin (confirmed at 375-382px).
          Collapse to a menu button + dropdown instead. */}
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileOpen}
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:text-ink sm:hidden"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mobileOpen && (
        <div className="absolute inset-x-0 top-full flex flex-col gap-0.5 border-b border-hairline bg-bg p-3 shadow-sm sm:hidden">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={mobileItemClass}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {showLogout && (
            <button
              onClick={() => {
                setMobileOpen(false);
                handleLogout();
              }}
              className={mobileItemClass}
            >
              Log out
            </button>
          )}
        </div>
      )}
    </>
  );
}
