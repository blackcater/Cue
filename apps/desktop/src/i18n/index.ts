import i18next from 'i18next'

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './shared-config'

// Import locale files
import en from './locales/en.json'
import zhCN from './locales/zh-CN.json'
import zhTW from './locales/zh-TW.json'

export const i18n = i18next.createInstance()

const resources = {
	en: { translation: en },
	'zh-CN': { translation: zhCN },
	'zh-TW': { translation: zhTW },
}

export async function initI18n(locale: string): Promise<typeof i18n> {
	const detectedLocale = SUPPORTED_LOCALES.includes(locale as (typeof SUPPORTED_LOCALES)[number])
		? locale
		: DEFAULT_LOCALE

	await i18n.init({
		resources,
		lng: detectedLocale,
		fallbackLng: DEFAULT_LOCALE,
		interpolation: {
			escapeValue: false,
		},
	})

	return i18n
}

export function changeLanguage(locale: string) {
	return i18n.changeLanguage(locale)
}

export function getCurrentLocale(): string {
	return i18n.language
}

export { SUPPORTED_LOCALES, DEFAULT_LOCALE }
