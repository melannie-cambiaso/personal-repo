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
    <html lang="es" className={`${patrickHand.variable} ${lexend.variable} dark h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AppNav />
        {children}
      </body>
    </html>
  );
}
