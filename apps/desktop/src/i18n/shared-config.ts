export const SUPPORTED_LOCALES = ['en', 'zh-CN', 'zh-TW'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: SupportedLocale = 'en'

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
	en: 'English',
	'zh-CN': '简体中文',
	'zh-TW': '繁體中文',
}

export function detectSystemLocale(): SupportedLocale {
	// Dynamic import os-locale
	return DEFAULT_LOCALE
}

export function isSupportedLocale(locale: string): locale is SupportedLocale {
	return SUPPORTED_LOCALES.includes(locale as SupportedLocale)
}
