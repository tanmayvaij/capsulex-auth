import type { Metadata } from "next";
import { Didact_Gothic } from "next/font/google";
import "./globals.css";

const didactGothic = Didact_Gothic({
  variable: "--font-sans",
  weight: "400",
  subsets: ["latin"],
});

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export const metadata: Metadata = {
  title: "Capsulex Auth - Open-Source Identity Platform",
  description: "The complete authentication and identity management platform for modern applications. Self-hostable, secure, and developer-first.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${didactGothic.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
