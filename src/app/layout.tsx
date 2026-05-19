import type { Metadata } from "next";
import "./globals.css";
import Shell from "@/components/layout/Shell";

export const metadata: Metadata = {
  title: "DAM Viewer - カラオケ採点データ管理",
  description: "DAMとも採点データを蓄積・分析するアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="bg-gray-100 text-gray-900">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
