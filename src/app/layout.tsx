import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mahamordo — มหาหมอดู AI",
  description: "ดูดวงด้วย AI ออราเคิล 3 รูปแบบ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
