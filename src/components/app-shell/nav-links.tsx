"use client";

import { usePathname } from "next/navigation";
import { NavList } from "@/components/app-shell/nav-list";

export function NavLinks() {
  return <NavList pathname={usePathname()} />;
}
