import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const STAGE_NAMES = [
  "Pitch and Propose",
  "Scope and Resources",
  "Allocation and Owner",
  "Execution",
  "Finish",
]

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  PARKED: "Parked",
  KILLED: "Killed",
  ARCHIVED: "Archived",
}

export const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700",
  PARKED: "bg-yellow-50 text-yellow-700",
  KILLED: "bg-red-50 text-red-700",
  ARCHIVED: "bg-gray-100 text-gray-600",
}
