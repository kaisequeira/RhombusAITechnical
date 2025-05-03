import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// This function combines the clsx and twMerge libraries to create a utility function for merging class names.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
