import type { Metadata } from "next";
import { Geist, Geist_Mono, Didact_Gothic } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const didactGothic = Didact_Gothic({
  weight: "400",
  subsets: ['latin'],
  variable: '--font-sans',
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CapsuleX Auth",
  description: "Authentication and Identity Management platform.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", didactGothic.variable)}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
