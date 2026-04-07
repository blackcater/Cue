import i18next from 'i18next'
import type { i18n as I18nInstance, Resource } from 'i18next'

import { checkLocale, DEFAULT_LOCALE } from '@/i18n'

import en from '../../locales/en.json'
import zhCN from '../../locales/zh-CN.json'
import zhTW from '../../locales/zh-TW.json'

const RESOURCES: Resource = {
	en: { translation: en },
	'zh-CN': { translation: zhCN },
	'zh-TW': { translation: zhTW },
}

export const i18n: I18nInstance = i18next.createInstance()

export async function initRendererI18n(locale: string): Promise<I18nInstance> {
	await i18n.init({
		resources: RESOURCES,
		lng: checkLocale(locale),
		fallbackLng: DEFAULT_LOCALE,
		interpolation: {
			escapeValue: false,
		},
	})

	return i18n
}
