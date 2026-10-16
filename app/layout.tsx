import type { Metadata } from "next";
import { Lexend, Patrick_Hand } from "next/font/google";
import { AppNav } from "@/shared/components/AppNav/AppNav";
import "./globals.css";

const patrickHand = Patrick_Hand({
  variable: "--font-primary",
  subsets: ["latin"],
  weight: "400",
});

const lexend = Lexend({
  variable: "--font-figure-src",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Personal Repo",
  description: "Mi repositorio personal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${patrickHand.variable} ${lexend.variable} dark h-full antialiased`}
    >
      {/* Column on mobile (top bar above the page), row from `lg` (sidebar beside it). */}
      <body className="flex min-h-full flex-col lg:flex-row">
        <AppNav />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
