import type { Metadata } from "next";
import "./globals.css";
import { plexArabic, plexSans } from "./fonts";

export const metadata: Metadata = {
  title: "English Twin — Speech Shadowing POC",
  description: "Local-first speech shadowing proof of concept for English Twin.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexArabic.variable}`}>
      <body>{children}</body>
    </html>
  );
}
