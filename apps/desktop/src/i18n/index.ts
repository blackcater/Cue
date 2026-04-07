export const SUPPORTED_LOCALES = ['en', 'zh-CN', 'zh-TW'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const LOCALE_MAP: Record<string, SupportedLocale> = {
	'en-US': 'en',
	'zh-CN': 'zh-CN',
	'zh-TW': 'zh-TW',
}

export const DEFAULT_LOCALE: SupportedLocale = 'en'

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
	en: 'English',
	'zh-CN': '简体中文',
	'zh-TW': '繁體中文',
}

export function normalizeLocale(
	locale: string,
	fallbackLocale?: string
): string {
	return LOCALE_MAP[locale] ?? fallbackLocale ?? locale
}

export function isSupportedLocale(locale: string): locale is SupportedLocale {
	return SUPPORTED_LOCALES.includes(
		normalizeLocale(locale) as SupportedLocale
	)
}

export function checkLocale(locale: string): SupportedLocale {
	const normalizedLocale = normalizeLocale(locale) as SupportedLocale
	return SUPPORTED_LOCALES.includes(normalizedLocale)
		? normalizedLocale
		: DEFAULT_LOCALE
}
