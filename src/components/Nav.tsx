import Link from "next/link";
import { getSession } from "@/lib/session";
import { roleHome } from "@/lib/auth";
import NavLinks, { type NavLinkItem } from "./NavLinks";

const ROLE_LABEL: Record<string, string> = {
  admin: "Glean dispatch",
  retailer: "Retailer",
  ngo: "NGO",
};

const PUBLIC_LINKS: NavLinkItem[] = [
  { href: "/consumer", label: "Consumer deals" },
  { href: "/impact", label: "Impact" },
];

export default async function Nav() {
  const session = await getSession();

  const links: NavLinkItem[] = [
    session
      ? { href: roleHome(session.role), label: ROLE_LABEL[session.role] }
      : { href: "/login", label: "Log in" },
    ...PUBLIC_LINKS,
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="font-serif text-lg tracking-tight text-ink">Glean</span>
        </Link>
        <nav className="flex items-center gap-1">
          {session && (
            <span className="mr-3 hidden text-xs text-ink-faint sm:inline">
              {session.displayName}
            </span>
          )}
          <NavLinks items={links} showLogout={!!session} />
        </nav>
      </div>
    </header>
  );
}
