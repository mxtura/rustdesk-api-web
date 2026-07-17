<template>
  <div class="edit-wrap">
    <el-card class="edit-card" shadow="never">
      <div class="edit-title">{{ route.params.id ? T('UserEdit') : T('UserAdd') }}</div>
      <el-form ref="root" label-position="top" :model="form" :rules="rules">
      <el-form-item :label="T('Username')" prop="username">
        <el-input v-model="form.username"></el-input>
      </el-form-item>
      <el-form-item :label="T('Email')" prop="email">
        <el-input v-model="form.email"></el-input>
      </el-form-item>
      <el-form-item :label="T('Nickname')" prop="nickname">
        <el-input v-model="form.nickname"></el-input>
      </el-form-item>
      <el-form-item :label="T('Group')" prop="group_id">
        <el-select v-model="form.group_id">
          <el-option
              v-for="item in groupsList"
              :key="item.id"
              :label="gname(item.name)"
              :value="item.id"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="T('IsAdmin')" prop="is_admin">
        <el-switch v-model="form.is_admin"
                   :active-value="true"
                   :inactive-value="false"
        ></el-switch>
      </el-form-item>
      <el-form-item :label="T('Status')" prop="status">
        <el-switch v-model="form.status"
                   :active-value="ENABLE_STATUS"
                   :inactive-value="DISABLE_STATUS"
        ></el-switch>
      </el-form-item>
      <el-form-item :label="T('Remark')" prop="remark">
          <el-input v-model="form.remark"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button @click="cancel">{{ T('Cancel') }}</el-button>
        <el-button @click="submit" type="primary">{{ T('Submit') }}</el-button>
      </el-form-item>
    </el-form>
    </el-card>
  </div>
</template>

<script setup>
  import { useRoute } from 'vue-router'
  import { useGetDetail, useSubmit } from '@/views/user/composables/edit'
  import { ENABLE_STATUS, DISABLE_STATUS } from '@/utils/common_options'
  import { T } from '@/utils/i18n'
  import { groupDisplayName as gname } from '@/utils/group'

  const route = useRoute()
  const { form, item, getDetail, groupsList } = useGetDetail(route.params.id)

  const { root, rules, validate, submit, cancel } = useSubmit(form, route.params.id)

</script>

<style lang="scss" scoped>
.edit-wrap {
  display: flex;
  justify-content: center;
  padding: 12px;
}
.edit-card {
  width: 100%;
  max-width: 560px;
}
.edit-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
}
.edit-card :deep(.el-form-item__label) {
  padding-bottom: 2px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
