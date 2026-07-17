<template>
    <div class="set-row" v-loading="form.loading">
    <div class="set-info">
      <div class="set-title">{{ T('RelayServersTitle') }}</div>
      <div class="set-desc">{{ T('RelayServersDesc') }}</div>
    </div>
    <div class="set-ctrl">
      <el-input v-model="form.option" :disabled="!canSend" placeholder="ip:port,ip:port" style="width: 260px"/>
      <el-button @click="save" type="primary" :disabled="!canSend">{{ T('Save') }}</el-button>
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
    cmd: 'rs',
    option: '',
    target: ID_TARGET,
    loading: false,
  })
  const get = async () => {
    form.loading = true
    const res = await sendCmd({ cmd: 'rs', target: ID_TARGET }).catch(_ => false)
    form.loading = false
    if (res) {
      const data = res.data.split('\n').filter(i => i)
      form.option = data.join(',')
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
  //为了在设置always_use_relay之后自动重新保存，防止被重置
  defineExpose({
    save,
  });
</script>
<style scoped lang="scss">

</style>
