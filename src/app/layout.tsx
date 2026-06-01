import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Placement ERP",
  description: "Placement management system for campus recruitment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-surface font-body text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
