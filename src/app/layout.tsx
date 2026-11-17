import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ACAY — Beyond the River — WrongMeca Studios",
  description:
    "ACAY / Beyond the River: una aventura gráfica de exploración + duelos rítmicos de esquive. Valles Calchaquíes, NOA. Next.js + Canvas 2D con motor propio.",
  keywords: ["game", "acay", "adventure", "rhythm", "NOA", "Next.js", "Canvas 2D"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
