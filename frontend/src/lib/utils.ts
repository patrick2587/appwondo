import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

/**
 * Combines class names with clsx and merges Tailwind conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats an ISO date string to German date format: dd.MM.yyyy
 */
export function formatDate(iso: string): string {
  return format(parseISO(iso), "dd.MM.yyyy");
}

/**
 * Formats an ISO date string to time format: HH:mm
 */
export function formatTime(iso: string): string {
  return format(parseISO(iso), "HH:mm");
}

/**
 * Formats an ISO date string to German date-time format: dd.MM.yyyy, HH:mm Uhr
 */
export function formatDateTime(iso: string): string {
  return format(parseISO(iso), "dd.MM.yyyy, HH:mm") + " Uhr";
}
