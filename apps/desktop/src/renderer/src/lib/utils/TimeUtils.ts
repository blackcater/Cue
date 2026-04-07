const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY
const MONTH = 30 * DAY
const YEAR = 365 * DAY

export class TimeUtils {
	/**
	 * Format a date as a short relative time string
	 * e.g. "2h", "3d", "1w", "2mo", "1y"
	 */
	static formatRelativeTime(date: Date): string {
		const diff = Date.now() - date.getTime()

		if (diff < HOUR) {
			const mins = Math.floor(diff / MINUTE)
			return `${mins}m`
		}
		if (diff < DAY) {
			const hours = Math.floor(diff / HOUR)
			return `${hours}h`
		}
		if (diff < WEEK) {
			const days = Math.floor(diff / DAY)
			return `${days}d`
		}
		if (diff < MONTH) {
			const weeks = Math.floor(diff / WEEK)
			return `${weeks}w`
		}
		if (diff < YEAR) {
			const months = Math.floor(diff / MONTH)
			return `${months}mo`
		}
		const years = Math.floor(diff / YEAR)
		return `${years}y`
	}
}
