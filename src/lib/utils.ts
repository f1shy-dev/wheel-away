import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatDuration(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);

	const displayHours = hours.toString().padStart(2, "0");
	const displayMinutes = (minutes % 60).toString().padStart(2, "0");
	const displaySeconds = (seconds % 60).toString().padStart(2, "0");

	return `${displayHours}:${displayMinutes}:${displaySeconds}`;
}

export function formatDateTime(date: Date): string {
	return new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	}).format(date);
}
