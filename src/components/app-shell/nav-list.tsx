import Link from "next/link";
import { isActiveHref, navItems } from "@/components/app-shell/nav-items";

// Without a pathname (the Suspense fallback) no item is marked current.
export function NavList({ pathname }: { pathname?: string }) {
  return (
    <ul className="flex flex-wrap gap-s1 wide:flex-col">
      {navItems.map((item) => {
        const active = pathname !== undefined && isActiveHref(item.href, pathname);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-control-md items-center rounded-md px-pad-md py-s2 text-control leading-[1.35] font-semibold transition-colors duration-150 ease-out ${
                active ? "bg-accent-soft text-accent-ink" : "text-ink-2 hover:bg-surface-3"
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
