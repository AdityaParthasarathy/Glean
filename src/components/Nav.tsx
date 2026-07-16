import Link from "next/link";
import { getSession } from "@/lib/session";
import { roleHome } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

const ROLE_LABEL: Record<string, string> = {
  admin: "Glean dispatch",
  retailer: "Retailer",
  ngo: "NGO",
};

const PUBLIC_LINKS = [
  { href: "/consumer", label: "Consumer deals" },
  { href: "/impact", label: "Impact" },
];

const linkClass =
  "rounded-full px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50";

export default async function Nav() {
  const session = await getSession();

  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Glean
        </Link>
        <nav className="flex items-center gap-1">
          {session ? (
            <Link href={roleHome(session.role)} className={linkClass}>
              {ROLE_LABEL[session.role]}
            </Link>
          ) : (
            <Link href="/login" className={linkClass}>
              Log in
            </Link>
          )}
          {PUBLIC_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass}>
              {l.label}
            </Link>
          ))}
          {session && (
            <>
              <span className="mx-1 text-xs text-zinc-400">{session.displayName}</span>
              <LogoutButton />
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
