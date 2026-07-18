import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DeviceCard from '@/components/DeviceCard.vue'
import { i18n } from '@/utils/i18n'

const base = {
  row_id: 1,
  id: '123456789',
  hostname: 'test-host',
  os: 'Windows 10',
  memory: '16GB',
  version: '1.4.9',
  last_online_ip: '10.0.0.1',
}

const mountCard = row =>
  mount(DeviceCard, {
    props: { row },
    global: {
      plugins: [i18n],
      stubs: { 'el-icon': true, 'el-checkbox': true },
    },
  })

describe('DeviceCard', () => {
  it('показывает имя хоста и ID', () => {
    const w = mountCard(base)
    expect(w.text()).toContain('test-host')
    expect(w.text()).toContain('123456789')
  })

  it('онлайн при свежем last_online_time', () => {
    const w = mountCard({ ...base, last_online_time: Math.floor(Date.now() / 1000) })
    expect(w.find('.peer-card.online').exists()).toBe(true)
    expect(w.find('.pc-badge.on').exists()).toBe(true)
  })

  it('офлайн при устаревшем last_online_time', () => {
    const w = mountCard({ ...base, last_online_time: 100 })
    expect(w.find('.peer-card.online').exists()).toBe(false)
    expect(w.find('.pc-badge.off').exists()).toBe(true)
  })

  it('иконка ОС по платформе (Windows)', () => {
    const w = mountCard(base)
    expect(w.find('.pc-osbadge').text()).toBe('🪟')
  })
})
