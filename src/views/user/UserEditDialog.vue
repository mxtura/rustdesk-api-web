<template>
  <el-dialog
    :model-value="visible"
    :title="userId ? T('UserEdit') : T('UserAdd')"
    width="560"
    @update:model-value="v => emit('update:visible', v)"
    @open="onOpen"
  >
    <el-form ref="root" label-position="top" :model="form" :rules="rules" class="ued-form">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item :label="T('Username')" prop="username" required>
            <el-input v-model="form.username"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="userId ? T('NewPassword') : T('Password')" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              autocomplete="new-password"
              :placeholder="userId ? '••••••' : ''"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item :label="T('Email')" prop="email">
            <el-input v-model="form.email"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="T('Nickname')" prop="nickname">
            <el-input v-model="form.nickname"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item :label="T('Group')" prop="group_id" required>
        <el-select v-model="form.group_id" style="width: 100%">
          <el-option v-for="item in groupsList" :key="item.id" :label="gname(item)" :value="item.id" />
        </el-select>
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item :label="T('IsAdmin')" prop="is_admin">
            <el-switch v-model="form.is_admin" :active-value="true" :inactive-value="false" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="T('Status')" prop="status" required>
            <el-switch v-model="form.status" :active-value="ENABLE_STATUS" :inactive-value="DISABLE_STATUS" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item :label="T('Remark')" prop="remark">
        <el-input v-model="form.remark"></el-input>
      </el-form-item>

      <div class="ued-actions">
        <el-button @click="emit('update:visible', false)">{{ T('Cancel') }}</el-button>
        <el-button type="primary" @click="save">{{ T('Submit') }}</el-button>
      </div>
    </el-form>
  </el-dialog>
</template>

<script setup>
  import { ref } from 'vue'
  import { T } from '@/utils/i18n'
  import { ElMessage } from 'element-plus'
  import { saveUser } from '@/views/user/save'
  import { useGetDetail, useSubmit, openUserForm } from '@/views/user/composables/edit'
  import { ENABLE_STATUS, DISABLE_STATUS } from '@/utils/common_options'
  import { groupDisplayName as gname } from '@/utils/group'

  const props = defineProps({
    visible: { type: Boolean, default: false },
    userId: { type: [Number, String], default: 0 },
  })
  const emit = defineEmits(['update:visible', 'success'])

  const root = ref(null)
  const { form, getDetail, groupsList } = useGetDetail(props.userId)
  const { rules } = useSubmit(form, props.userId)

  const onOpen = async () => {
    // сброс + загрузка вынесены в openUserForm: если запрос упадёт, форма не
    // должна остаться с данными ранее открытого пользователя (см. B12, круг 1)
    const ok = await openUserForm(props.userId, form, getDetail)
    if (!ok) emit('update:visible', false)
  }

  const save = async () => {
    const ok = await root.value.validate().catch(() => false)
    if (!ok) return
    const res = await saveUser(form.value, props.userId)
    if (!res.ok) {
      ElMessage.error(res.error || T('OperationFailed'))
      return
    }
    ElMessage.success(T('OperationSuccess'))
    emit('update:visible', false)
    emit('success')
  }
</script>

<style scoped lang="scss">
  .ued-form :deep(.el-form-item__label) {
    padding-bottom: 2px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
  .ued-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 8px;
  }
</style>
