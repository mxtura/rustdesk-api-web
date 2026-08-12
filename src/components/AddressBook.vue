<template>
  <div class="ab-page">
    <!-- шапка админа: назад к пользователям + чей это раздел -->
    <div v-if="isAdmin && lockedUserId" class="ab-header">
      <el-button :icon="ArrowLeft" @click="backToUsers">{{ T('Users') }}</el-button>
      <div class="ab-header-title">
        <span class="aht-avatar">{{ (lockedUsername || '?').charAt(0).toUpperCase() }}</span>
        <span
          >{{ T('AddressBook') }} · <b>{{ lockedUsername }}</b></span
        >
      </div>
    </div>

    <div class="ab-wrap">
      <!-- РЕЙЛ -->
      <aside class="ab-rail">
        <el-select
          v-if="isAdmin && !lockedUserId"
          v-model="userId"
          :placeholder="T('User')"
          filterable
          class="rail-user"
          @change="onUserChange"
        >
          <el-option v-for="u in allUsers" :key="u.id" :label="u.username" :value="u.id" />
        </el-select>
        <div class="rail-col">
          <el-select v-model="currentCol" class="rail-select" @change="onColChange">
            <el-option :value="0" :label="T('MyAddressBook')" />
            <el-option v-for="c in collectionListRes.list" :key="c.id" :value="c.id" :label="c.name" />
          </el-select>
          <el-dropdown trigger="click">
            <el-button :icon="MoreFilled" text />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="newCollection">＋ {{ T('AddressBookName') }}</el-dropdown-item>
                <el-dropdown-item v-if="currentCol" @click="renameCollection">{{ T('Edit') }}</el-dropdown-item>
                <el-dropdown-item v-if="currentCol" divided @click="deleteCollection">{{
                  T('Delete')
                }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <div class="rail-tags">
          <div class="rail-tags-head">
            <span>{{ T('Tags') }}</span>
            <el-dropdown trigger="click">
              <el-icon class="rt-more"><MoreFilled /></el-icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="addTag">＋ {{ T('Tags') }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <div class="rail-tag-list">
            <span
              class="tag-chip"
              :class="{ active: selectedTags.includes('__none__') }"
              @click="toggleTag('__none__')"
              >{{ T('NoTag') }}</span
            >
            <span
              v-for="t in tagListRes.list"
              :key="t.id"
              class="tag-chip"
              :class="{ active: selectedTags.includes(t.name) }"
              @click="toggleTag(t.name)"
            >
              {{ t.name }}
              <el-icon class="tag-x" @click.stop="deleteTag(t)"><Close /></el-icon>
            </span>
          </div>
        </div>

        <div class="rail-foot">
          <span class="rf-label">{{ T('HideOffline') }}</span>
          <el-switch v-model="hideOffline" size="small" />
        </div>
      </aside>

      <!-- ОСНОВНОЕ: устройства -->
      <section v-loading="listRes.loading" class="ab-main">
        <div class="ab-toolbar">
          <el-input
            v-model="search"
            :placeholder="T('SearchPlaceholder')"
            :prefix-icon="Search"
            clearable
            class="ab-search"
          />
          <el-button type="primary" :icon="Plus" @click="addDevice">{{ T('Add') }}</el-button>
        </div>

        <div class="dev-grid">
          <div v-for="row in filtered" :key="row.row_id || row.id" class="dev-card">
            <div class="dev-top">
              <PlatformIcons :name="platIcon(row)" class="dev-os" color="#fff" />
            </div>
            <div class="dev-name" :title="devName(row)">{{ devName(row) }}</div>
            <div class="dev-foot">
              <span class="dot" :class="isOnline(row) ? 'on' : 'off'"></span>
              <span class="dev-id" @click="handleClipboard(row.id, $event)">{{ fmtId(row.id) }}</span>
              <el-dropdown trigger="click" class="dev-more">
                <el-icon><MoreFilled /></el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="connectByClient(row.id)">{{ T('Link') }}</el-dropdown-item>
                    <el-dropdown-item v-if="appStore.setting.appConfig.web_client" @click="toWebClientLink(row)"
                      >Web Client</el-dropdown-item
                    >
                    <el-dropdown-item @click="toEdit(row)">{{ T('Edit') }}</el-dropdown-item>
                    <el-dropdown-item divided @click="del(row)">{{ T('Delete') }}</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          <el-empty v-if="!listRes.loading && !filtered.length" description="—" />
        </div>

        <div class="ab-pager">
          <el-pagination
            v-model:current-page="listQuery.page"
            v-model:page-size="listQuery.page_size"
            :page-sizes="[20, 50, 100, 200]"
            :total="listRes.total"
            layout="total, sizes, prev, pager, next"
            @size-change="reload"
            @current-change="reload"
          />
        </div>
      </section>

      <!-- диалог устройства -->
      <el-dialog v-model="formVisible" width="600" :title="!formData.row_id ? T('Create') : T('Update')">
        <el-form class="dialog-form" :model="formData" label-width="120px">
          <el-form-item label="ID" required>
            <el-input v-model="formData.id"></el-input>
          </el-form-item>
          <el-form-item :label="T('Username')">
            <el-input v-model="formData.username"></el-input>
          </el-form-item>
          <el-form-item :label="T('Hostname')">
            <el-input v-model="formData.hostname"></el-input>
          </el-form-item>
          <el-form-item :label="T('Alias')">
            <el-input v-model="formData.alias"></el-input>
          </el-form-item>
          <el-form-item :label="T('Platform')">
            <el-select v-model="formData.platform">
              <el-option v-for="item in platformList" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item :label="T('Tags')">
            <el-select v-model="formData.tags" multiple>
              <el-option v-for="item in tagListRes.list" :key="item.name" :label="item.name" :value="item.name" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button @click="formVisible = false">{{ T('Cancel') }}</el-button>
            <el-button type="primary" @click="submit">{{ T('Submit') }}</el-button>
          </el-form-item>
        </el-form>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, watch } from 'vue'
  import { T } from '@/utils/i18n'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useAppStore } from '@/store/app'
  import { connectByClient } from '@/utils/peer'
  import { toWebClientLink } from '@/utils/webclient'
  import { handleClipboard } from '@/utils/clipboard'
  import { MoreFilled, Plus, Close, Search, ArrowLeft } from '@element-plus/icons-vue'
  import PlatformIcons from '@/components/icons/platform.vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useRepositories } from '@/views/address_book'
  import * as myCol from '@/api/my/address_book_collection'
  import * as adminCol from '@/api/address_book_collection'
  import * as myTag from '@/api/my/tag'
  import * as adminTag from '@/api/tag'
  import { loadAllUsers } from '@/global'

  const props = defineProps({ scope: { type: String, default: 'my' } })
  const isAdmin = props.scope === 'admin'
  const colApi = isAdmin ? adminCol : myCol
  const tagApi = isAdmin ? adminTag : myTag

  const appStore = useAppStore()
  const {
    listRes,
    listQuery,
    getList,
    collectionListRes,
    collectionListQuery,
    getCollectionList,
    tagListRes,
    tagListQuery,
    getTagList,
    del,
    formVisible,
    formData,
    toEdit,
    toAdd,
    submit,
    platformList,
  } = useRepositories(props.scope)
  // useRepositories по умолчанию отдаёт page_size = 10 (общий для всех потребителей
  // фабрики); для адресной книги нужно больше записей на страницу — задаём здесь,
  // в единственном месте, один раз при инициализации компонента.
  listQuery.page_size = 50

  const route = useRoute()
  const router = useRouter()
  const { allUsers, getAllUsers } = loadAllUsers()
  const lockedUserId = isAdmin && route.query?.user_id ? parseInt(route.query.user_id) : null
  const userId = ref(lockedUserId)
  const lockedUsername = computed(() => allUsers.value.find(u => u.id === lockedUserId)?.username || '')
  const backToUsers = () => router.push('/user/index')
  const currentCol = ref(0)
  const selectedTags = ref([])
  const hideOffline = ref(false)
  const search = ref('')

  const isOnline = row => !!row.peer?.last_online_time && (Date.now() - row.peer.last_online_time * 1000) / 1000 < 60
  const tagArr = row =>
    Array.isArray(row.tags) ? row.tags : row.tags ? String(row.tags).split(',').filter(Boolean) : []
  const platIcon = row => platformList.find(p => p.label === row.platform)?.icon
  const devName = row => (row.username ? row.username + '@' : '') + (row.hostname || row.id)
  const fmtId = id => String(id).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

  const filtered = computed(() => {
    let l = listRes.list
    if (selectedTags.value.length) {
      l = l.filter(row => {
        const tags = tagArr(row)
        return selectedTags.value.every(st => (st === '__none__' ? tags.length === 0 : tags.includes(st)))
      })
    }
    if (hideOffline.value) l = l.filter(isOnline)
    const s = search.value.trim().toLowerCase()
    if (s)
      l = l.filter(
        row =>
          String(row.id).includes(s) ||
          (row.hostname || '').toLowerCase().includes(s) ||
          (row.username || '').toLowerCase().includes(s) ||
          (row.alias || '').toLowerCase().includes(s),
      )
    return l
  })

  const reload = () => {
    if (isAdmin) {
      if (!userId.value) {
        listRes.list = []
        tagListRes.list = []
        return
      }
      listQuery.user_id = userId.value
      collectionListQuery.user_id = userId.value
      tagListQuery.user_id = userId.value
    }
    listQuery.collection_id = currentCol.value
    getList()
    tagListQuery.collection_id = currentCol.value
    getTagList()
  }
  const onColChange = () => {
    selectedTags.value = []
    reload()
  }
  const onUserChange = () => {
    currentCol.value = 0
    selectedTags.value = []
    collectionListQuery.user_id = userId.value
    getCollectionList()
    reload()
  }
  const toggleTag = name => {
    const i = selectedTags.value.indexOf(name)
    if (i >= 0) selectedTags.value.splice(i, 1)
    else selectedTags.value.push(name)
  }

  const addDevice = () => {
    if (isAdmin && !userId.value) {
      ElMessage.warning(T('PleaseSelectData'))
      return
    }
    toAdd()
    formData.collection_id = currentCol.value
    formData.user_id = isAdmin ? userId.value : formData.user_id
    formData.tags = []
    tagListQuery.collection_id = currentCol.value
    getTagList()
  }

  // коллекции
  const newCollection = async () => {
    if (isAdmin && !userId.value) {
      ElMessage.warning(T('PleaseSelectData'))
      return
    }
    const r = await ElMessageBox.prompt(T('AddressBookName'), T('Create')).catch(() => false)
    if (!r || !r.value) return
    const payload = { name: r.value }
    if (isAdmin) payload.user_id = userId.value
    const res = await colApi.create(payload).catch(() => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      getCollectionList()
    }
  }
  const renameCollection = async () => {
    const cur = collectionListRes.list.find(c => c.id === currentCol.value)
    if (!cur) return
    const r = await ElMessageBox.prompt(T('AddressBookName'), T('Edit'), { inputValue: cur.name }).catch(() => false)
    if (!r || !r.value) return
    const res = await colApi.update({ id: cur.id, name: r.value }).catch(() => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      getCollectionList()
    }
  }
  const deleteCollection = async () => {
    const cur = collectionListRes.list.find(c => c.id === currentCol.value)
    if (!cur) return
    const cf = await ElMessageBox.confirm(T('Confirm?', { param: T('Delete') }), { type: 'warning' }).catch(() => false)
    if (!cf) return
    const res = await colApi.remove({ id: cur.id }).catch(() => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      currentCol.value = 0
      getCollectionList()
      reload()
    }
  }

  // теги
  const addTag = async () => {
    if (isAdmin && !userId.value) {
      ElMessage.warning(T('PleaseSelectData'))
      return
    }
    const r = await ElMessageBox.prompt(T('Tags'), T('Create')).catch(() => false)
    if (!r || !r.value) return
    const payload = { name: r.value, collection_id: currentCol.value }
    if (isAdmin) payload.user_id = userId.value
    const res = await tagApi.create(payload).catch(() => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      getTagList()
    }
  }
  const deleteTag = async tag => {
    const cf = await ElMessageBox.confirm(T('Confirm?', { param: T('Delete') }), { type: 'warning' }).catch(() => false)
    if (!cf) return
    const res = await tagApi.remove({ id: tag.id, name: tag.name, collection_id: currentCol.value }).catch(() => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      getTagList()
      selectedTags.value = selectedTags.value.filter(t => t !== tag.name)
    }
  }

  onMounted(() => {
    if (isAdmin) {
      getAllUsers()
      if (lockedUserId) onUserChange()
    } else {
      getCollectionList()
      reload()
    }
  })
</script>

<style scoped lang="scss">
  .ab-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .ab-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    border-radius: var(--radius-lg);
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
  }
  .ab-header-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 15px;
  }
  .aht-avatar {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--accent-grad);
    color: #fff;
    font-weight: 600;
  }

  .ab-wrap {
    display: flex;
    gap: 16px;
    min-height: calc(100vh - 180px);
  }

  /* рейл */
  .ab-rail {
    width: 240px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 14px;
    border-radius: var(--radius-lg);
    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur));
    border: 1px solid var(--glass-border);
  }
  .rail-user {
    width: 100%;
  }
  .rail-col {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .rail-select {
    flex: 1;
  }
  .rail-tags {
    flex: 1;
  }
  .rail-tags-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--el-text-color-secondary);
    padding: 4px 2px 8px;
  }
  .rt-more {
    cursor: pointer;
  }
  .rail-tag-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .tag-chip {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s ease;
    color: var(--el-text-color-regular);
  }
  .tag-chip:hover {
    background: var(--glass-bg-strong);
  }
  .tag-chip.active {
    background: var(--accent-grad);
    color: #fff;
  }
  .tag-x {
    font-size: 12px;
    opacity: 0;
  }
  .tag-chip:hover .tag-x {
    opacity: 0.7;
  }
  .tag-x:hover {
    opacity: 1;
  }
  .rail-foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 10px;
    border-top: 1px solid var(--glass-border);
  }
  .rf-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  /* основное */
  .ab-main {
    flex: 1;
    min-width: 0;
  }
  .ab-toolbar {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  }
  .ab-search {
    max-width: 320px;
  }

  .dev-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }
  .ab-pager {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
  .dev-card {
    border-radius: var(--radius-lg);
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    overflow: hidden;
    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease,
      border-color 0.18s ease;
  }
  .dev-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-lift);
    border-color: var(--glass-border-strong);
  }
  .dev-top {
    height: 96px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(160deg, rgba(0, 113, 255, 0.18), rgba(0, 113, 255, 0.04));
  }
  .dev-os {
    width: 44px;
    height: 44px;
  }
  .dev-name {
    text-align: center;
    font-size: 13px;
    padding: 12px 12px 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dev-foot {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-top: 1px solid var(--glass-border);
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .dot.on {
    background: #22c55e;
    box-shadow: 0 0 6px #22c55e;
  }
  .dot.off {
    background: #6b7280;
  }
  .dev-id {
    flex: 1;
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
  }
  .dev-id:hover {
    color: var(--accent);
  }
  .dev-more {
    cursor: pointer;
  }
</style>
