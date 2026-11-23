import Link from "next/link";
import { Suspense } from "react";
import { NavLinks } from "@/components/app-shell/nav-links";
import { NavList } from "@/components/app-shell/nav-list";
import { RouteMark } from "@/components/app-shell/route-mark";

// 248 px sidebar on wide screens; below 760 px it becomes a top bar (DESIGN.md sections 1, 7 and 8).
export function Sidebar() {
  return (
    <aside className="flex flex-col gap-s4 border-b border-line bg-surface-2 px-s3 py-s4 wide:w-sidebar wide:shrink-0 wide:border-r wide:border-b-0">
      <Link href="/" className="flex items-center gap-s2 self-start rounded-md">
        <span className="inline-flex size-control-md items-center justify-center rounded-md bg-accent text-on-accent">
          <RouteMark className="size-s4" />
        </span>
        <span className="text-base font-semibold">AI Planning Companion</span>
      </Link>
      <nav aria-label="Main">
        {/* usePathname suspends on routes with unknown dynamic params, so the fallback renders the same links unmarked. */}
        <Suspense fallback={<NavList />}>
          <NavLinks />
        </Suspense>
      </nav>
    </aside>
  );
}
