import { create, update, changePwd } from '@/api/user'

// Возвращает {ok, error}. Успех означает, что и запись, и пароль применены:
// раньше сообщение об успехе показывалось всегда, а пароль молча терялся.
export async function saveUser(form, userId) {
  const res = userId ? await update(form).catch(() => null) : await create(form).catch(() => null)
  if (!res || res.code !== 0) return { ok: false, error: res?.message || '' }

  if (!form.password) return { ok: true }

  const id = userId || res.data?.id
  if (!id) return { ok: false, error: 'no-id' }

  const pwd = await changePwd({ id, password: form.password }).catch(() => null)
  if (!pwd || pwd.code !== 0) return { ok: false, error: pwd?.message || '' }
  return { ok: true }
}
