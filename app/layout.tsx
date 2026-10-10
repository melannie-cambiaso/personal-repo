import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AppNav } from "@/shared/components/AppNav/AppNav";
import "./globals.css";

const geist = Geist({
  variable: "--font-primary",
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
    <html lang="es" className={`${geist.variable} dark h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AppNav />
        {children}
      </body>
    </html>
  );
}
