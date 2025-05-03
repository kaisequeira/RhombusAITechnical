"use client";

import type React from "react";

import { HeroUIProvider } from "@heroui/system";
import { ToastProvider } from "@heroui/toast";

import { ThemeHeader } from "./theme-header";

/**
 * Providers
 * Component that wraps the application with necessary providers including
 * HeroUIProvider and ThemeHeader.
 * @param children - The child components to be rendered within the providers.
 * @returns {JSX.Element} - The wrapped child components.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <ThemeHeader>
        <ToastProvider />
        {children}
      </ThemeHeader>
    </HeroUIProvider>
  );
}
