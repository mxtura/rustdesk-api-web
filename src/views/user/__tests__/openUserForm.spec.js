import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { openUserForm, emptyUserForm } from '@/views/user/composables/edit'

// Регресс B12 (круг правок 1): диалог не сбрасывал форму перед загрузкой.
// Если detail() падал (сеть/ошибка сервера — перехватчик отклоняет промис),
// в form оставались данные ПРЕДЫДУЩЕГО открытого пользователя, а userId уже
// указывал на нового — «Отправить» отправило бы чужие поля на чужой id.
describe('openUserForm', () => {
  it('при ошибке загрузки форма не содержит данных предыдущего пользователя', async () => {
    const form = ref({ id: 3, username: 'previous-user', email: 'prev@example.com' })
    const getDetail = vi.fn().mockRejectedValue(new Error('network'))

    const ok = await openUserForm(7, form, getDetail)

    expect(ok).toBe(false)
    expect(form.value).toEqual(emptyUserForm())
    expect(form.value.username).not.toBe('previous-user')
  })

  it('при успехе сбрасывает форму перед вызовом getDetail и оставляет загруженные данные', async () => {
    const form = ref({ username: 'previous-user' })
    const getDetail = vi.fn(async id => {
      // на момент вызова getDetail форма уже должна быть сброшена
      expect(form.value).toEqual(emptyUserForm())
      form.value = { id, username: 'loaded-user' }
    })

    const ok = await openUserForm(7, form, getDetail)

    expect(ok).toBe(true)
    expect(getDetail).toHaveBeenCalledWith(7)
    expect(form.value).toEqual({ id: 7, username: 'loaded-user' })
  })

  it('для нового пользователя (userId=0) просто сбрасывает форму, без вызова getDetail', async () => {
    const form = ref({ username: 'previous-user' })
    const getDetail = vi.fn()

    const ok = await openUserForm(0, form, getDetail)

    expect(ok).toBe(true)
    expect(getDetail).not.toHaveBeenCalled()
    expect(form.value).toEqual(emptyUserForm())
  })
})
