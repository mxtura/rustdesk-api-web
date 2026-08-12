import { describe, it, expect } from 'vitest'
import { groupDisplayName, isShareGroup } from '@/utils/group'

describe('группы определяются по type', () => {
  it('общая группа переводится', () => {
    expect(isShareGroup({ name: '共享组', type: 2 })).toBe(true)
    expect(groupDisplayName({ name: '共享组', type: 2 })).not.toBe('共享组')
  })
  it('пользовательская группа с именем как у системной не подменяется', () => {
    expect(groupDisplayName({ name: 'Default Group', type: 1 })).toBe('Default Group')
    expect(isShareGroup({ name: 'Shared Group', type: 1 })).toBe(false)
  })
  it('переименованная системная группа остаётся общей', () => {
    expect(isShareGroup({ name: 'моя общая', type: 2 })).toBe(true)
  })
})
