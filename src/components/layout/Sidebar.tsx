"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "ダッシュボード", icon: "🏠" },
  { href: "/songs", label: "曲一覧", icon: "🎵" },
  { href: "/history", label: "採点履歴", icon: "📋" },
  { href: "/rankings", label: "ランキング", icon: "🏆" },
  { href: "/settings", label: "設定", icon: "⚙️" },
  { href: "/bookmarklet", label: "データ取込", icon: "📲" },
  { href: "/import-csv", label: "CSVインポート", icon: "📂" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="px-4 py-5 border-b border-gray-700">
        <h1 className="text-lg font-bold text-pink-400">DAM Viewer</h1>
        <p className="text-xs text-gray-400 mt-0.5">採点データ管理</p>
      </div>
      <nav className="flex-1 px-2 py-4">
        <ul className="space-y-1">
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    active
                      ? "bg-pink-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
