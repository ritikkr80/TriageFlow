import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

export function getEsiBadge(esiLevel: number) {
  switch (esiLevel) {
    case 1:
      return {
        label: "ESI 1 - Resuscitation",
        bg: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300",
        badge: "bg-red-600 text-white",
        color: "#DC2626",
        urgency: "Immediate (0 min)"
      };
    case 2:
      return {
        label: "ESI 2 - Emergent",
        bg: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300",
        badge: "bg-orange-600 text-white",
        color: "#EA580C",
        urgency: "Within 15 mins"
      };
    case 3:
      return {
        label: "ESI 3 - Urgent",
        bg: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300",
        badge: "bg-amber-500 text-white",
        color: "#EAB308",
        urgency: "Within 60 mins"
      };
    case 4:
      return {
        label: "ESI 4 - Less Urgent",
        bg: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300",
        badge: "bg-emerald-600 text-white",
        color: "#16A34A",
        urgency: "Within 120 mins"
      };
    case 5:
    default:
      return {
        label: "ESI 5 - Non-Urgent",
        bg: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300",
        badge: "bg-blue-600 text-white",
        color: "#2563EB",
        urgency: "Within 240 mins"
      };
  }
}
