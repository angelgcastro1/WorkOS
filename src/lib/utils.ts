import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatMoney(value: number): string {
  return "$" + (value || 0).toLocaleString();
}

export function formatDate(value?: string | null): string {
  if (!value) return "";
  // Accept both date-only ("YYYY-MM-DD") and full ISO timestamps ("...T...Z").
  const d = value.includes("T") ? new Date(value) : new Date(value + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function daysUntil(value?: string | null): number | null {
  if (!value) return null;
  const target = new Date(value + "T00:00:00").getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today.getTime()) / 86400000);
}
