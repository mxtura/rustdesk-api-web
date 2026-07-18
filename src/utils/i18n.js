import { createI18n } from 'vue-i18n'
import en from '@/utils/i18n/en.json'
import fr from '@/utils/i18n/fr.json'
import zhCN from '@/utils/i18n/zh_CN.json'
import ko from '@/utils/i18n/ko.json'
import ru from '@/utils/i18n/ru.json'
import es from '@/utils/i18n/es.json'
import zhTW from '@/utils/i18n/zh_TW.json'
const defaultLocale = localStorage.getItem('lang') || navigator.language || 'zh-CN'

// Движок — vue-i18n (плюрализация "one | other", интерполяция {param}, фолбэк, предупреждения о пропусках).
export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: defaultLocale,
  fallbackLocale: 'en',
  missingWarn: false,
  fallbackWarn: false,
  messages: {
    en,
    fr,
    'zh-CN': zhCN,
    ko,
    ru,
    es,
    'zh-TW': zhTW,
  },
})

// Обёртка совместимости со старым API T(key, params, num) — чтобы не трогать ~50 файлов.
// Локаль — глобальная (см. main.js, синхронизируется с appStore). num — счётчик плюрализации.
export function T(key, params = {}, num) {
  // как старый T: нестроковый/пустой ключ возвращаем как есть (vue-i18n на undefined кидает ошибку)
  if (typeof key !== 'string' || key === '') return key ?? ''
  return typeof num === 'number'
    ? i18n.global.t(key, num, { named: params })
    : i18n.global.t(key, params)
}
