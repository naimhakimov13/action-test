import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aqua Delivery Dashboard",
  description: "Dashboard for water delivery management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
