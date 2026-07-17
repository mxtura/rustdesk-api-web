<template>
    <div class="set-row" v-loading="form.loading">
    <div class="set-info">
      <div class="set-title">{{ T('MustLoginTitle') }}</div>
      <div class="set-desc">{{ T('MustLoginDesc') }}</div>
    </div>
    <div class="set-ctrl">
      <el-switch v-model="form.option" active-value="Y" inactive-value="N" :disabled="!canSend" @change="save"/>
    </div>
  </div>
</template>
<script setup>

  import { T } from '@/utils/i18n'
  import { reactive, watch } from 'vue'
  import { sendCmd } from '@/api/rustdesk'
  import { ElMessage } from 'element-plus'
  import { ID_TARGET } from '@/views/rustdesk/options'

  const props = defineProps({
    canSend: Boolean,
  })

  const form = reactive({
    cmd: 'ml',
    option: '',
    target: ID_TARGET,
    value: 0,
    loading: false,
  })
  const get = async () => {
    form.loading = true
    const res = await sendCmd({ cmd: 'ml', target: ID_TARGET }).catch(_ => false)
    form.loading = false
    if (res) {
      if (res.data === 'MUST_LOGIN: true' || res.data === 'MUST_LOGIN: true\n') {
        form.option = 'Y'
      } else {
        form.option = 'N'
      }
    }
  }
  const save = async () => {
    const res = await sendCmd(form).catch(_ => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
    }
  }

  watch(() => props.canSend, (v) => {
    if (v) {
      get()
    }
  })
</script>


<style scoped lang="scss">

</style>
