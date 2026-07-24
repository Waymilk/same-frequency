import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "同频播放｜双人音乐合拍测试",
  description: "两个人，十六次选择，看看你们能不能共用一副耳机。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
