"use client";

import { Button } from "@heroui/button";
import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

interface ThemeHeaderProps {
  children?: React.ReactNode;
}

/**
 * ThemeHeader
 * A component that provides a header with a theme toggle button.
 * It allows users to switch between dark and light themes.
 * @param children - The child components to be rendered within the header.
 * @returns {JSX.Element} - The rendered header component with theme toggle functionality.
 */
export function ThemeHeader({ children }: ThemeHeaderProps) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div
      className={cn(
        "h-screen w-screen flex flex-col bg-background text-foreground transition-colors",
        theme,
      )}
    >
      <div className="flex flex-row justify-between h-20 bg-foreground-100 shadow-md transition-colors px-5 items-center z-10">
        <div className="flex flex-row gap-3 items-center">
          <Image alt="Rhombus AI" height={30} src="/RhombusAI.svg" width={30} />
          <h1 className="tracking-tight inline font-bold from-[#0FB7CB] to-[#4986f8] bg-clip-text text-transparent text-3xl bg-gradient-to-b">
            Rhombus AI&nbsp;
          </h1>
        </div>
        <Button
          isIconOnly
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          variant="flat"
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
        </Button>
      </div>
      <div className="flex flex-1">{children}</div>
    </div>
  );
}
