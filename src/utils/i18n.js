import { createI18n } from 'vue-i18n'
import en from '@/utils/i18n/en.json'
import fr from '@/utils/i18n/fr.json'
import zhCN from '@/utils/i18n/zh_CN.json'
import ko from '@/utils/i18n/ko.json'
import ru from '@/utils/i18n/ru.json'
import es from '@/utils/i18n/es.json'
import zhTW from '@/utils/i18n/zh_TW.json'
import { useAppStore } from '@/store/app'

// Движок — vue-i18n (плюрализация "one | other", интерполяция {param}, фолбэк, предупреждения о пропусках).
export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: 'en',
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
// Локаль берём из appStore (как и раньше). num — счётчик для плюрализации.
export function T(key, params = {}, num) {
  const locale = useAppStore().setting.lang
  return i18n.global.t(key, num ?? 1, { named: params, locale })
}
