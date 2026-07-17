<template>
  <div>
    <el-card class="list-query" shadow="hover">
      <el-form inline label-width="80px">
        <el-form-item :label="T('Username')">
          <el-input v-model="listQuery.username"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handlerQuery">{{ T('Filter') }}</el-button>
          <el-button @click="toAdd">{{ T('Add') }}</el-button>
          <el-button @click="toExport">{{ T('Export') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="list-body" shadow="hover">
      <div class="lb-head">
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button label="cards"><el-icon><Grid/></el-icon></el-radio-button>
          <el-radio-button label="table"><el-icon><Menu/></el-icon></el-radio-button>
        </el-radio-group>
      </div>

      <!-- ПЛИТКИ -->
      <div v-if="viewMode==='cards'" class="user-grid" v-loading="listRes.loading">
        <div v-for="row in listRes.list" :key="row.id" class="user-card">
          <div class="uc-head">
            <div class="uc-avatar" :style="avatarStyle(row.username)">{{ initial(row.username) }}</div>
            <div class="uc-title">
              <div class="uc-name">{{ row.username }}</div>
              <div class="uc-sub">{{ row.nickname || row.email || '—' }}</div>
            </div>
          </div>

          <div class="uc-statusrow">
            <el-switch
                v-model="row.status"
                :active-value="ENABLE_STATUS"
                :inactive-value="DISABLE_STATUS"
                @change="changeStatus(row)"
            />
            <div class="uc-badges">
              <el-tag v-if="row.is_admin" size="small" type="warning" effect="dark">Admin</el-tag>
              <el-tag v-if="row.group_id" size="small">{{ groupName(row.group_id) }}</el-tag>
            </div>
          </div>

          <div class="uc-specs">
            <div class="spec" :title="row.email"><el-icon><Message/></el-icon><span>{{ row.email || '—' }}</span></div>
            <div class="spec"><el-icon><Calendar/></el-icon><span>{{ row.created_at }}</span></div>
            <div v-if="row.remark" class="spec spec-full" :title="row.remark"><el-icon><Document/></el-icon><span>{{ row.remark }}</span></div>
          </div>

          <div class="uc-actions">
            <el-button type="primary" class="uc-book" :icon="Notebook" @click="toAddressBook(row)">{{ T('AddressBook') }}</el-button>
            <el-tooltip :content="T('Edit')" placement="top">
              <el-button :icon="Edit" @click="toEdit(row)"/>
            </el-tooltip>
            <el-dropdown trigger="click" class="uc-more">
              <el-button :icon="MoreFilled"></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="toTag(row)">{{ T('UserTags') }}</el-dropdown-item>
                  <el-dropdown-item @click="changePass(row)">{{ T('ResetPassword') }}</el-dropdown-item>
                  <el-dropdown-item divided @click="remove(row)">{{ T('Delete') }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
        <el-empty v-if="!listRes.loading && !listRes.list.length" description="—"/>
      </div>

      <!-- ТАБЛИЦА -->
      <el-table v-else :data="listRes.list" v-loading="listRes.loading" border>
        <el-table-column prop="id" label="ID" align="center" width="70"></el-table-column>
        <el-table-column prop="username" :label="T('Username')" align="center"/>
        <el-table-column prop="email" :label="T('Email')" align="center"/>
        <el-table-column prop="nickname" :label="T('Nickname')" align="center"/>
        <el-table-column :label="T('Group')" align="center">
          <template #default="{row}">
            <el-tag v-if="row.group_id" size="small">{{ groupName(row.group_id) }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column :label="T('Status')" align="center" width="90">
          <template #default="{row}">
            <el-switch v-model="row.status" :active-value="ENABLE_STATUS" :inactive-value="DISABLE_STATUS" @change="changeStatus(row)"/>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" :label="T('CreatedAt')" align="center" min-width="120"/>
        <el-table-column :label="T('Actions')" align="center" width="150" class-name="table-actions">
          <template #default="{row}">
            <el-button type="primary" size="small" @click="toEdit(row)">{{ T('Edit') }}</el-button>
            <el-dropdown trigger="click">
              <el-button size="small" :icon="MoreFilled"></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="toTag(row)">{{ T('UserTags') }}</el-dropdown-item>
                  <el-dropdown-item @click="toAddressBook(row)">{{ T('UserAddressBook') }}</el-dropdown-item>
                  <el-dropdown-item @click="changePass(row)">{{ T('ResetPassword') }}</el-dropdown-item>
                  <el-dropdown-item divided @click="remove(row)">{{ T('Delete') }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card class="list-page" shadow="hover">
      <el-pagination background
                     layout="prev, pager, next, sizes, jumper"
                     :page-sizes="[10,20,50,100]"
                     v-model:page-size="listQuery.page_size"
                     v-model:current-page="listQuery.page"
                     :total="listRes.total">
      </el-pagination>
    </el-card>
  </div>
</template>

<script setup>
  import { useRepositories, useDel, useToEditOrAdd, useChangePwd } from '@/views/user/composables'
  import { T } from '@/utils/i18n'
  import { DISABLE_STATUS, ENABLE_STATUS } from '@/utils/common_options'
  import { update } from '@/api/user'
  import { ElMessage } from 'element-plus'
  import { onMounted, ref, watch } from 'vue'
  import { Grid, Menu, MoreFilled, Message, Calendar, Document, Notebook, Edit } from '@element-plus/icons'
  import { groupDisplayName } from '@/utils/group'

  const {
    listRes,
    listQuery,
    handlerQuery,
    getList,
    getGroups,
    toExport,
  } = useRepositories()

  const viewMode = ref(localStorage.getItem('user_view_mode') || 'cards')
  watch(viewMode, (v) => localStorage.setItem('user_view_mode', v))

  onMounted(getGroups)
  onMounted(getList)
  watch(() => listQuery.page, getList)
  watch(() => listQuery.page_size, handlerQuery)

  const { toEdit, toAdd, toAddressBook, toTag } = useToEditOrAdd()
  const { changePass } = useChangePwd()
  const { del } = useDel()

  const remove = async (row) => {
    const res = await del(row.id)
    if (res) getList(listQuery)
  }

  const changeStatus = async (row) => {
    const res = await update(row).catch(_ => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      getList(listQuery)
    }
  }

  // локализация авто-групп по языку панели
  const groupName = (id) => {
    const g = listRes.groups?.find(x => x.id === id)
    return g ? groupDisplayName(g.name) : '-'
  }

  // аватар: первая буква + стабильный цвет по имени
  const initial = (name) => (name || '?').trim().charAt(0).toUpperCase()
  const palette = ['#0071ff', '#7c5cff', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6']
  const avatarStyle = (name) => {
    let h = 0
    for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
    const c = palette[h % palette.length]
    return { background: `linear-gradient(135deg, ${c}, ${c}cc)` }
  }
</script>

<style scoped lang="scss">
.lb-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }

.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  min-height: 80px;
}

.user-card {
  position: relative;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}
.user-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lift);
  border-color: var(--glass-border-strong);
}

.uc-head { display: flex; align-items: center; gap: 14px; }
.uc-avatar {
  width: 46px; height: 46px;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 19px;
  font-weight: 600;
  color: #fff;
  border-radius: 13px;
}
.uc-title { flex: 1; min-width: 0; }
.uc-name {
  font-weight: 600;
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.uc-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.uc-statusrow { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.uc-badges { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }

.uc-specs {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  border-top: 1px solid var(--glass-border);
  padding-top: 14px;
}
.uc-specs .spec {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.uc-specs .spec .el-icon { font-size: 15px; color: var(--el-text-color-secondary); flex-shrink: 0; }
.uc-specs .spec span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.uc-actions { display: flex; gap: 8px; margin-top: auto; align-items: center; }
.uc-book { flex: 1; }
</style>
