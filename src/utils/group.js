import { T } from '@/utils/i18n'

// Сид-группы бэкенда создаются на языке сервера (часто zh).
// Показываем локализованное имя по языку панели, пользовательские имена не трогаем.
const DEFAULT_GROUP_NAMES = new Set(['默认组', '默認组', '默認組', 'Default Group'])
const SHARE_GROUP_NAMES = new Set(['共享组', '共享組', 'Shared Group'])

export function groupDisplayName (name) {
  if (DEFAULT_GROUP_NAMES.has(name)) return T('GroupDefaultName')
  if (SHARE_GROUP_NAMES.has(name)) return T('GroupShareName')
  return name || ''
}
