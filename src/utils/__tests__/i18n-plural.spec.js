import { describe, it, expect } from 'vitest'
import { i18n } from '@/utils/i18n'

describe('русская плюрализация', () => {
  const t = (key, n) => i18n.global.t(key, n, { locale: 'ru' })
  it('минуты', () => {
    expect(t('MinutesAgo', 1)).toBe('1 минуту назад')
    expect(t('MinutesAgo', 2)).toBe('2 минуты назад')
    expect(t('MinutesAgo', 5)).toBe('5 минут назад')
    expect(t('MinutesAgo', 22)).toBe('22 минуты назад')
    expect(t('MinutesAgo', 11)).toBe('11 минут назад')
  })

  it('часы', () => {
    expect(t('HoursAgo', 1)).toBe('1 час назад')
    expect(t('HoursAgo', 2)).toBe('2 часа назад')
    expect(t('HoursAgo', 5)).toBe('5 часов назад')
    expect(t('HoursAgo', 21)).toBe('21 час назад')
    expect(t('HoursAgo', 12)).toBe('12 часов назад')
  })

  it('дни', () => {
    expect(t('DaysAgo', 1)).toBe('1 день назад')
    expect(t('DaysAgo', 2)).toBe('2 дня назад')
    expect(t('DaysAgo', 5)).toBe('5 дней назад')
    expect(t('DaysAgo', 21)).toBe('21 день назад')
    expect(t('DaysAgo', 14)).toBe('14 дней назад')
  })

  it('месяцы', () => {
    expect(t('MonthsAgo', 1)).toBe('1 месяц назад')
    expect(t('MonthsAgo', 2)).toBe('2 месяца назад')
    expect(t('MonthsAgo', 5)).toBe('5 месяцев назад')
    expect(t('MonthsAgo', 11)).toBe('11 месяцев назад')
  })

  it('годы', () => {
    expect(t('YearsAgo', 1)).toBe('1 год назад')
    expect(t('YearsAgo', 2)).toBe('2 года назад')
    expect(t('YearsAgo', 5)).toBe('5 лет назад')
    expect(t('YearsAgo', 11)).toBe('11 лет назад')
  })

  // регресс: строки были в двух формах с {param} — pluralRules возвращал индекс 2,
  // которого не было в массиве, и для "5 минут" выходило "5 минуты"
  it('менее (минуты/часы/дни)', () => {
    expect(t('MinutesLess', 1)).toBe('Менее 1 минуты')
    expect(t('MinutesLess', 2)).toBe('Менее 2 минут')
    expect(t('MinutesLess', 5)).toBe('Менее 5 минут')
    expect(t('HoursLess', 1)).toBe('Менее 1 часа')
    expect(t('HoursLess', 5)).toBe('Менее 5 часов')
    expect(t('DaysLess', 1)).toBe('Менее 1 дня')
    expect(t('DaysLess', 5)).toBe('Менее 5 дней')
  })
})
