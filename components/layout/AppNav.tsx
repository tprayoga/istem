"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menus = [
  { href: "/", label: "Dashboard" },
  { href: "/setting", label: "Setting" },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-5 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap gap-2">
        {menus.map((menu) => {
          const active = pathname === menu.href;
          return (
            <Link
              key={menu.href}
              href={menu.href}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {menu.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
