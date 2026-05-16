import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

import ThemeProvider from "@/components/ThemeProvider";
import UIProvider from "@/components/UIProvider";

export const metadata: Metadata = {
  title: "BK Media CRM",
  description: "End-to-end workflow CRM for BK Media",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
          <UIProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
