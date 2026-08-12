import { describe, it, expect, vi, beforeEach } from 'vitest'

// vitest поднимает vi.mock над импортами и запрещает ссылаться в фабрике
// на внешние переменные без префикса mock — оборачиваем в vi.hoisted.
const { create, update, changePwd } = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  changePwd: vi.fn(),
}))

vi.mock('@/api/user', () => ({ create, update, changePwd, detail: vi.fn() }))

// Проверяем именно порядок вызовов сохранения, без монтирования диалога:
// логика вынесена в saveUser, диалог только собирает форму.
import { saveUser } from '@/views/user/save'

describe('saveUser', () => {
  beforeEach(() => {
    create.mockReset()
    update.mockReset()
    changePwd.mockReset()
  })

  it('при создании применяет пароль по возвращённому id', async () => {
    create.mockResolvedValue({ code: 0, data: { id: 7 } })
    changePwd.mockResolvedValue({ code: 0 })
    const res = await saveUser({ username: 'a', password: 'secret1' }, null)
    expect(create).toHaveBeenCalledOnce()
    expect(changePwd).toHaveBeenCalledWith({ id: 7, password: 'secret1' })
    expect(res.ok).toBe(true)
  })

  it('сообщает о неудаче, если пароль не применился', async () => {
    create.mockResolvedValue({ code: 0, data: { id: 7 } })
    changePwd.mockResolvedValue({ code: 101, message: 'too short' })
    const res = await saveUser({ username: 'a', password: 'x' }, null)
    expect(res.ok).toBe(false)
    expect(res.error).toBe('too short')
  })

  it('без пароля changePwd не вызывается', async () => {
    create.mockResolvedValue({ code: 0, data: { id: 7 } })
    const res = await saveUser({ username: 'a', password: '' }, null)
    expect(changePwd).not.toHaveBeenCalled()
    expect(res.ok).toBe(true)
  })

  it('при правке применяет пароль по существующему id', async () => {
    update.mockResolvedValue({ code: 0 })
    changePwd.mockResolvedValue({ code: 0 })
    const res = await saveUser({ username: 'a', password: 'secret1' }, 3)
    expect(update).toHaveBeenCalledOnce()
    expect(changePwd).toHaveBeenCalledWith({ id: 3, password: 'secret1' })
    expect(res.ok).toBe(true)
  })
})
