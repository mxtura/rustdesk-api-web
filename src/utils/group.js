import { T } from '@/utils/i18n'

// Тип группы приходит с бэкенда (model.GroupTypeShare == 2). Сравнение по имени
// подменяло пользовательские группы с именем «Default Group» и отваливалось
// после переименования системной группы.
export const GROUP_TYPE_SHARE = 2

export function isShareGroup(group) {
  return Number(group?.type) === GROUP_TYPE_SHARE
}

export function groupDisplayName(group) {
  if (isShareGroup(group)) return T('SharedGroup')
  return group?.name || ''
}
