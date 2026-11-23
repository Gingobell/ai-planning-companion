// The sidebar destinations, defined once (DESIGN.md section 1). Pages for each route are built by their owners.
export interface NavItem {
  href: string;
  label: string;
}

export const navItems: readonly NavItem[] = [
  { href: "/", label: "Chat" },
  { href: "/today", label: "Today" },
  { href: "/week", label: "Week" },
  { href: "/goals", label: "Goals & tasks" },
  { href: "/preferences", label: "Preferences" },
];

export function isActiveHref(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
