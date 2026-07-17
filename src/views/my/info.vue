<template>
  <div class="prof-wrap">
    <el-card class="prof-card" shadow="never">
      <div class="prof-head">
        <div class="prof-avatar">{{ initial }}</div>
        <div class="prof-id">
          <div class="prof-name">{{ userStore.username }}</div>
          <div class="prof-sub">{{ userStore.email || '—' }}</div>
        </div>
      </div>

      <div class="prof-rows">
        <div class="prow">
          <span class="pk">{{ T('Username') }}</span>
          <span class="pv">{{ userStore.username }}</span>
        </div>
        <div class="prow">
          <span class="pk">Email</span>
          <span class="pv">{{ userStore.email || '—' }}</span>
        </div>
        <div class="prow">
          <span class="pk">{{ T('Password') }}</span>
          <el-button @click="showChangePwd">{{ T('ChangePassword') }}</el-button>
        </div>
      </div>

      <div class="prof-oidc">
        <div class="po-title">OIDC</div>
        <el-table :data="oidcData" fit>
          <el-table-column :label="T('IdP')" prop="op" align="center"></el-table-column>
          <el-table-column :label="T('Status')" prop="status" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.status === 1" type="success">{{ T('HasBind') }}</el-tag>
              <el-tag v-else type="info">{{ T('NoBind') }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="T('Actions')" align="center" width="160">
            <template #default="{ row }">
              <el-button v-if="row.status === 1" type="danger" size="small" @click="toUnBind(row)">{{ T('UnBind') }}</el-button>
              <el-button v-else type="primary" size="small" @click="toBind(row)">{{ T('ToBind') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
    <changePwdDialog v-model:visible="changePwdVisible"></changePwdDialog>
  </div>
</template>

<script setup>
  import changePwdDialog from '@/components/changePwdDialog.vue'
  import { computed, ref } from 'vue'
  import { useUserStore } from '@/store/user'
  import { bind, unbind } from '@/api/oauth'
  import { myOauth } from '@/api/user'
  import { ElMessageBox } from 'element-plus'
  import { T } from '@/utils/i18n'

  const userStore = useUserStore()
  const initial = computed(() => (userStore.username || '?').charAt(0).toUpperCase())
  const changePwdVisible = ref(false)
  const showChangePwd = () => {
    changePwdVisible.value = true
  }
  const oidcData = ref([])
  const getMyOauth = async () => {
    const res = await myOauth().catch(_ => false)
    if (res) {
      oidcData.value = res.data
    }

  }
  getMyOauth()
  const toBind = async (row) => {
    const res = await bind({ op: row.op }).catch(_ => false)
    if (res) {
      const { code, url } = res.data
      window.open(url)
    }
  }
  const toUnBind = async (row) => {
    const cf = await ElMessageBox.confirm(T('Confirm?', { param: T('UnBind') }), {
      confirmButtonText: T('Confirm'),
      cancelButtonText: T('Cancel'),
      type: 'warning',
    }).catch(_ => false)
    if (!cf) {
      return false
    }
    const res = await unbind({ op: row.op }).catch(_ => false)
    if (res) {
      getMyOauth()
    }

  }

</script>

<style scoped lang="scss">
.prof-wrap { display: flex; justify-content: center; padding: 12px; }
.prof-card { width: 100%; max-width: 620px; }

.prof-head {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--glass-border);
}
.prof-avatar {
  width: 60px; height: 60px;
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; font-weight: 600; color: #fff;
  background: var(--accent-grad);
  flex-shrink: 0;
}
.prof-name { font-size: 20px; font-weight: 600; }
.prof-sub { font-size: 13px; color: var(--el-text-color-secondary); margin-top: 2px; }

.prof-rows { padding: 12px 0; }
.prow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 4px;
  border-bottom: 1px solid var(--glass-border);
}
.prow:last-child { border-bottom: none; }
.pk { font-size: 13px; color: var(--el-text-color-secondary); }
.pv { font-weight: 500; }

.prof-oidc { margin-top: 12px; }
.po-title {
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em;
  color: var(--el-text-color-secondary); margin-bottom: 10px;
}
</style>
