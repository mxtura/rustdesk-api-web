import { ref, onMounted, reactive, watch } from 'vue'
import { create, detail, update, remove } from '@/api/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { list as groups } from '@/api/group'
import { T } from '@/utils/i18n'
import { ENABLE_STATUS } from '@/utils/common_options'

// дефолты формы для нового пользователя (используются и при первом монтировании,
// и при каждом открытии диалога на "создание" — см. openUserForm)
export function emptyUserForm() {
  return {
    id: 0,
    username: '',
    email: '',
    nickname: '',
    group_id: null,
    is_admin: false,
    status: ENABLE_STATUS,
    remark: '',
    password: '',
  }
}

// Сброс формы перед загрузкой + безопасная загрузка при (пере)открытии диалога.
// Раньше форма не сбрасывалась перед запросом: если getDetail() падал (сеть,
// ошибка сервера — перехватчик в utils/request.js отклоняет промис на любой
// code !== 0), в form оставались данные ПРЕДЫДУЩЕГО открытого пользователя,
// а userId уже указывал на нового — «Отправить» отправило бы чужие поля на
// чужой id. Возвращает false при неудаче загрузки — вызывающий код должен
// закрыть диалог (сообщение об ошибке уже показывает перехватчик).
export async function openUserForm(userId, form, getDetail) {
  form.value = emptyUserForm()
  if (!userId) return true
  try {
    await getDetail(userId)
    return true
  } catch {
    return false
  }
}

export function useGetDetail(id) {
  let item = ref({}) //保留原始值
  let form = ref({})
  const groupsList = ref([])
  const getDetail = async id => {
    const res = await detail(id)
    item.value = { ...res.data }
    form.value = { ...res.data }
  }
  if (id > 0) {
    onMounted(_ => {
      getDetail(id)
    })
  } else {
    // дефолты для нового пользователя: включён, не админ
    form.value = { status: ENABLE_STATUS, is_admin: false }
  }

  const getGroups = async () => {
    const res = await groups({ page_size: 9999 }).catch(_ => false)
    if (res) {
      groupsList.value = res.data.list
    }
  }
  onMounted(getGroups)
  return {
    form,
    item,
    getDetail,
    groupsList,
  }
}

export function useSubmit(form, id) {
  const root = ref(null)
  const router = useRouter()
  const rules = reactive({
    username: [{ required: true, message: T('ParamRequired', { param: T('Username') }) }],
    // email: [{ required: true, message: T('ParamRequired', { param: T('Email') }) }],
    group_id: [{ required: true, message: T('ParamRequired', { param: T('Group') }) }],
    // nickname: [{ required: true, message: '昵称是必须的' }],
    status: [{ required: true, message: T('ParamRequired', { param: T('Status') }) }],
  })

  const validate = async () => {
    const res = await root.value.validate().catch(err => false)
    return res
  }

  const submitCreate = async () => {
    const res = await create(form.value).catch(_ => false)
    return res && res.code === 0
  }

  const submitUpdate = async () => {
    const res = await update(form.value).catch(_ => false)
    return res && res.code === 0
  }
  const submitFunc = id > 0 ? submitUpdate : submitCreate

  const submit = async () => {
    const v = await validate()
    if (!v) {
      return
    }

    const res = await submitFunc()
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      router.push('/user/index')
    }
  }

  const cancel = () => {
    router.back()
  }

  return {
    root,
    rules,
    validate,
    submit,
    cancel,
  }
}
