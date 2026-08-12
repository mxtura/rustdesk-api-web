import { describe, it, expect, vi } from 'vitest'

vi.mock('@/api/peer', () => ({ list: vi.fn(() => Promise.resolve('admin-list')) }))
vi.mock('@/api/my/peer', () => ({ list: vi.fn(() => Promise.resolve('my-list')) }))

import { peerListApi } from '@/utils/peerApi'

describe('peerListApi', () => {
  it('админу отдаёт админский список', async () => {
    await expect(peerListApi(true)({ page: 1 })).resolves.toBe('admin-list')
  })
  it('обычному пользователю — личный список', async () => {
    await expect(peerListApi(false)({ page: 1 })).resolves.toBe('my-list')
  })
})
