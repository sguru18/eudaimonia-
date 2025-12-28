import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Eudaimonia - Your Companion for a Balanced Life",
  description: "Build healthy habits, plan your days, track your priorities, and live with intention. Everything you need for personal growth, beautifully organized.",
  keywords: ["habits", "productivity", "wellness", "planner", "meal planning", "goals", "priorities"],
  authors: [{ name: "Eudaimonia" }],
  openGraph: {
    title: "Eudaimonia - Your Companion for a Balanced Life",
    description: "Build healthy habits, plan your days, track your priorities, and live with intention.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
