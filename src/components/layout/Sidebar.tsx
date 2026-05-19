"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "ダッシュボード", icon: "🏠" },
  { href: "/songs", label: "曲別分析", icon: "🎵" },
  { href: "/history", label: "全曲分析", icon: "📋" },
  { href: "/rankings", label: "ランキング", icon: "🏆" },
  { href: "/settings", label: "設定", icon: "⚙️" },
  { href: "/bookmarklet", label: "データ取込", icon: "📲" },
  { href: "/import-csv", label: "CSVインポート", icon: "📂" },
];

interface Props {
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ open = false, onClose }: Props) {
  const pathname = usePathname();

  return (
    <aside
      className={[
        "bg-gray-900 text-white flex flex-col",
        // Mobile: fixed drawer, slide in/out
        "fixed inset-y-0 left-0 w-64 z-50 transition-transform duration-200 ease-in-out",
        open ? "translate-x-0" : "-translate-x-full",
        // Desktop: always visible, static in flow
        "md:relative md:translate-x-0 md:w-56 md:min-h-screen md:shrink-0",
      ].join(" ")}
    >
      <div className="px-4 py-5 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-pink-400">DAM Viewer</h1>
          <p className="text-xs text-gray-400 mt-0.5">採点データ管理</p>
        </div>
        {/* Close button (mobile only) */}
        <button
          onClick={onClose}
          className="md:hidden text-gray-400 hover:text-white p-1 rounded"
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>

      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                    active
                      ? "bg-pink-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <span className="text-base">{link.icon}</span>
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
