"use client";

import * as React from "react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";

/**
 * ThemeProvider
 * A wrapper around the NextThemesProvider to provide theme context to the application.
 * This component allows for easy theme management and switching between light and dark modes.
 * @returns {JSX.Element} - The rendered ThemeProvider component.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
