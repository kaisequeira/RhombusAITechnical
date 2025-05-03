import type React from "react";

import "./globals.css";
import { Inter } from "next/font/google";

import { Providers } from "../components/providers/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Rhombus AI - TA",
  description: "Upload, transform, and download data with type overrides",
};

/**
 * RootLayout
 * The root layout component for the application.
 * It wraps the entire application with necessary providers and sets the HTML structure.
 * @param children - The child components to be rendered within the layout.
 * @returns {JSX.Element} - The rendered root layout component.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
