import { describe, it, expect, beforeAll } from 'vitest'
import { i18n, T } from '@/utils/i18n'

describe('i18n T()', () => {
  beforeAll(() => {
    i18n.global.locale.value = 'en'
  })

  it('переводит простой ключ', () => {
    expect(T('Login')).toBe('Login')
  })

  it('интерполирует параметры', () => {
    expect(T('ParamRequired', { param: 'Name' })).toContain('Name')
  })

  it('плюрализация: единственное vs множественное', () => {
    const one = T('MinutesAgo', { param: 1 }, 1)
    const many = T('MinutesAgo', { param: 5 }, 5)
    expect(one).toContain('1')
    expect(many).toContain('5')
    expect(one).not.toBe(many)
  })

  it('нестроковый ключ возвращается как есть (без падения)', () => {
    expect(T(undefined)).toBe('')
    expect(T('')).toBe('')
  })

  it('переключение локали', () => {
    i18n.global.locale.value = 'ru'
    expect(T('Login')).toBe('Вход')
    i18n.global.locale.value = 'en'
  })
})
