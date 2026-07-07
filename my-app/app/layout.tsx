import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SafeMaeMoh",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/mae-moh-logo.png",
  },
  description: "ระบบรายงานเหตุและจัดการความปลอดภัย วิทยาลัยเทคนิค กฟผ. แม่เมาะ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
