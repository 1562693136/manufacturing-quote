import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "制造业报价与产量盈利阶梯测算系统",
  description: "云端制造业报价管理系统",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
