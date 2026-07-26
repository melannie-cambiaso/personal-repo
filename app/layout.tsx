import type { Metadata } from "next";
import { Lexend, Dancing_Script } from "next/font/google";
import { AppNav } from "@/shared/components/AppNav/AppNav";
import "./globals.css";

const lexend = Lexend({
  variable: "--font-primary",
  subsets: ["latin"],
});

const dancingScript = Dancing_Script({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
    <html lang="es" className={`${lexend.variable} ${dancingScript.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AppNav />
        {children}
      </body>
    </html>
  );
}
