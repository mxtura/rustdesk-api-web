import { describe, it, expect } from 'vitest'
import { osIcon, isPeerOnline, peersQueryKey, ONLINE_WINDOW_MS } from '@/utils/peer'

describe('osIcon', () => {
  it('распознаёт основные системы', () => {
    expect(osIcon('Windows 10 Pro')).toBe('🪟')
    expect(osIcon('Ubuntu 24.04')).toBe('🐧')
    expect(osIcon('macOS 15')).toBe('🍎')
    expect(osIcon('Android 14')).toBe('🤖')
  })
  it('на пустое значение отдаёт заглушку', () => {
    expect(osIcon('')).toBe('🖥️')
    expect(osIcon(undefined)).toBe('🖥️')
  })
})

describe('isPeerOnline', () => {
  const now = 1_800_000_000_000
  it('онлайн, если метка свежее окна', () => {
    expect(isPeerOnline(Math.floor((now - 10_000) / 1000), now)).toBe(true)
  })
  it('офлайн, если метка старше окна', () => {
    expect(isPeerOnline(Math.floor((now - ONLINE_WINDOW_MS - 1000) / 1000), now)).toBe(false)
  })
  it('офлайн без метки', () => {
    expect(isPeerOnline(0, now)).toBe(false)
    expect(isPeerOnline(undefined, now)).toBe(false)
  })
})

describe('peersQueryKey', () => {
  it('включает страницу, размер и все поля фильтра', () => {
    const q = { page: 3, page_size: 10, id: '123', hostname: 'box', time_ago: 7, user_id: 2 }
    expect(peersQueryKey('my-peers', q)).toEqual(['my-peers', 3, 10, '123', 'box', 7, 2])
  })
  it('пустые фильтры дают стабильный ключ', () => {
    const a = peersQueryKey('my-peers', { page: 1, page_size: 10 })
    const b = peersQueryKey('my-peers', { page: 1, page_size: 10, id: '', hostname: '' })
    expect(a).toEqual(b)
  })
})
