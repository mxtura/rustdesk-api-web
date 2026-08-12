<template>
  <div>
    <el-card class="list-query" shadow="hover">
      <el-form inline label-width="150px">
        <el-form-item label="ID">
          <el-input v-model="listQuery.id" clearable />
        </el-form-item>
        <el-form-item :label="T('Hostname')">
          <el-input v-model="listQuery.hostname" clearable />
        </el-form-item>
        <el-form-item :label="T('LastOnlineTime')">
          <el-select v-model="listQuery.time_ago" clearable>
            <el-option
              v-for="item in timeFilters"
              :key="item.value"
              :label="item.text"
              :value="item.value"
              :disabled="item.value === 0"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handlerQuery">{{ T('Filter') }}</el-button>
          <el-button type="success" @click="toExport">{{ T('Export') }}</el-button>
          <!--          <el-button type="danger" @click="toBatchDelete">{{ T('BatchDelete') }}</el-button>-->
          <el-button type="primary" @click="toBatchAddToAB">{{ T('BatchAddToAB') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card class="list-body" shadow="hover">
      <div class="lb-head">
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button label="cards"
            ><el-icon><Grid /></el-icon
          ></el-radio-button>
          <el-radio-button label="table"
            ><el-icon><Menu /></el-icon
          ></el-radio-button>
        </el-radio-group>
      </div>

      <!-- ПЛИТКИ -->
      <div v-if="viewMode === 'cards'" v-loading="listRes.loading" class="peer-grid">
        <device-card v-for="row in listRes.list" :key="row.row_id || row.id" :row="row">
          <template #actions="{ row }">
            <el-button type="primary" class="pc-connect" @click="connectByClient(row.id)">{{ T('Link') }}</el-button>
            <el-button v-if="appStore.setting.appConfig.web_client" class="pc-web" @click="toWebClientLink(row)"
              >Web</el-button
            >
            <el-dropdown trigger="click" class="pc-more">
              <el-button :icon="MoreFilled"></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="toAddressBook(row)">{{ T('AddToAddressBook') }}</el-dropdown-item>
                  <el-dropdown-item @click="toView(row)">{{ T('View') }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </device-card>
        <el-empty v-if="!listRes.loading && !listRes.list.length" description="—" />
      </div>

      <!-- ТАБЛИЦА -->
      <device-table
        v-else
        :list="listRes.list"
        :loading="listRes.loading"
        :columns="peerColumns"
        storage-key="my_peer_columns_v1"
        :actions-width="210"
        @selection-change="handleSelectionChange"
      >
        <template #actions="{ row }">
          <el-button type="primary" size="small" @click="connectByClient(row.id)">{{ T('Link') }}</el-button>
          <el-dropdown trigger="click">
            <el-button size="small" :icon="MoreFilled"></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-if="appStore.setting.appConfig.web_client" @click="toWebClientLink(row)"
                  >Web Client</el-dropdown-item
                >
                <el-dropdown-item @click="toAddressBook(row)">{{ T('AddToAddressBook') }}</el-dropdown-item>
                <el-dropdown-item @click="toView(row)">{{ T('View') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </device-table>
    </el-card>
    <el-card class="list-page" shadow="hover">
      <el-pagination
        v-model:page-size="listQuery.page_size"
        v-model:current-page="listQuery.page"
        background
        layout="prev, pager, next, sizes, jumper"
        :page-sizes="[10, 20, 50, 100]"
        :total="listRes.total"
      >
      </el-pagination>
    </el-card>
    <el-dialog v-model="formVisible" :title="T('Information')" width="800" :style="{ textAlign: 'center' }">
      <el-form ref="form" class="dialog-form" :model="formData" label-width="120px">
        <el-form-item label="ID" prop="id">
          <el-input v-model="formData.id" disabled></el-input>
        </el-form-item>
        <el-form-item :label="T('Username')" prop="username">
          <el-input v-model="formData.username" disabled></el-input>
        </el-form-item>
        <el-form-item :label="T('Hostname')" prop="hostname">
          <el-input v-model="formData.hostname" disabled></el-input>
        </el-form-item>
        <el-form-item label="CPU" prop="cpu">
          <el-input v-model="formData.cpu" disabled></el-input>
        </el-form-item>
        <el-form-item :label="T('Memory')" prop="memory">
          <el-input v-model="formData.memory" disabled></el-input>
        </el-form-item>
        <el-form-item :label="T('Os')" prop="os">
          <el-input v-model="formData.os" disabled></el-input>
        </el-form-item>
        <el-form-item :label="T('Uuid')" prop="uuid">
          <el-input v-model="formData.uuid" disabled></el-input>
        </el-form-item>
        <el-form-item :label="T('Version')" prop="version">
          <el-input v-model="formData.version" disabled></el-input>
        </el-form-item>
      </el-form>
    </el-dialog>

    <el-dialog v-model="ABFormVisible" width="800" :title="T('Create')">
      <el-form ref="form" class="dialog-form" :model="ABFormData" label-width="120px">
        <el-form-item :label="T('AddressBookName')" required prop="collection_id">
          <el-select v-model="ABFormData.collection_id" clearable @change="changeCollectionForUpdate">
            <el-option :value="0" :label="T('MyAddressBook')"></el-option>
            <el-option
              v-for="c in collectionListResForUpdate.list"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="ID" prop="id" required>
          <el-input v-model="ABFormData.id"></el-input>
        </el-form-item>
        <el-form-item :label="T('Username')" prop="username">
          <el-input v-model="ABFormData.username"></el-input>
        </el-form-item>
        <el-form-item :label="T('Alias')" prop="alias">
          <el-input v-model="ABFormData.alias"></el-input>
        </el-form-item>
        <el-form-item :label="T('Hostname')" prop="hostname">
          <el-input v-model="ABFormData.hostname"></el-input>
        </el-form-item>
        <el-form-item :label="T('Platform')" prop="platform">
          <el-select v-model="ABFormData.platform">
            <el-option
              v-for="item in ABPlatformList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item :label="T('Tags')" prop="tags">
          <el-select v-model="ABFormData.tags" multiple>
            <el-option
              v-for="item in tagListRes.list"
              :key="item.name"
              :label="item.name"
              :value="item.name"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="ABFormVisible = false">{{ T('Cancel') }}</el-button>
          <el-button type="primary" @click="ABSubmit">{{ T('Submit') }}</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <el-dialog v-model="batchABFormVisible" width="800" :title="T('Create')">
      <el-form ref="form" class="dialog-form" :model="batchABFormData" label-width="120px">
        <el-form-item :label="T('AddressBookName')" required prop="collection_id">
          <el-select v-model="batchABFormData.collection_id" clearable @change="changeCollectionForBatchCreateAB">
            <el-option :value="0" :label="T('MyAddressBook')"></el-option>
            <el-option
              v-for="c in collectionListResForUpdate.list"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="T('Tags')" prop="tags">
          <el-select v-model="batchABFormData.tags" multiple>
            <el-option
              v-for="item in tagListRes.list"
              :key="item.name"
              :label="item.name"
              :value="item.name"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="batchABFormVisible = false">{{ T('Cancel') }}</el-button>
          <el-button type="primary" @click="submitBatchAddToAB">{{ T('Submit') }}</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup>
  import { computed, onMounted, reactive, ref, watch, watchEffect } from 'vue'
  import { useQuery } from '@tanstack/vue-query'
  import { list } from '@/api/my/peer'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { toWebClientLink } from '@/utils/webclient'
  import { T } from '@/utils/i18n'
  import { timeAgo } from '@/utils/time'
  import { jsonToCsv, downBlob } from '@/utils/file'
  import { useRepositories as useABRepositories } from '@/views/address_book/index'
  import { useAppStore } from '@/store/app'
  import { connectByClient, peersQueryKey } from '@/utils/peer'
  import { CopyDocument, Grid, Menu, MoreFilled } from '@element-plus/icons-vue'
  import { handleClipboard } from '@/utils/clipboard'
  import { batchCreateFromPeers } from '@/api/my/address_book'
  import DeviceCard from '@/components/DeviceCard.vue'
  import DeviceTable from '@/components/DeviceTable.vue'
  import { useLocalStorage } from '@vueuse/core'

  const appStore = useAppStore()
  // режим отображения: плитки / таблица (сохраняется через VueUse)
  const viewMode = useLocalStorage('my_peer_view_mode', 'cards')

  // колонки таблицы (настраиваются/перетаскиваются в DeviceTable)
  const peerColumns = [
    { name: 'id', label: 'ID', raw: true, width: 150, visible: true },
    { name: 'hostname', label: 'Hostname', width: 120, visible: true },
    { name: 'memory', label: 'Memory', width: 100, visible: true },
    { name: 'os', label: 'Os', minWidth: 150, visible: true },
    { name: 'last_online_time', label: 'LastOnlineTime', minWidth: 150, visible: true },
    { name: 'last_online_ip', label: 'LastOnlineIp', width: 130, visible: true },
    { name: 'username', label: 'Username', width: 120, visible: true },
    { name: 'version', label: 'Version', width: 90, visible: true },
    { name: 'cpu', label: 'CPU', raw: true, minWidth: 160, visible: false },
    { name: 'uuid', label: 'Uuid', minWidth: 150, visible: false },
    { name: 'alias', label: 'Alias', width: 100, visible: false },
    { name: 'created_at', label: 'CreatedAt', width: 160, visible: false },
    { name: 'updated_at', label: 'UpdatedAt', width: 160, visible: false },
  ]
  const listRes = reactive({
    list: [],
    total: 0,
    loading: false,
  })
  const listQuery = reactive({
    page: 1,
    page_size: 10,
    time_ago: null,
    id: '',
    hostname: '',
  })

  // загрузка через TanStack Query: кэш, дедуп и авто-обновление онлайна каждые 30с.
  // Ключ содержит сами поля фильтра: иначе смена фильтра со страницы >1
  // отдавала закэшированную нефильтрованную первую страницу, а фоновое
  // обновление применяло недопечатанный текст из поля поиска. listQuery
  // остаётся живым — привязан к полям формы, набор текста не должен вызывать запросов.
  const appliedQuery = ref({ ...listQuery })
  const {
    data: peersData,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: computed(() => peersQueryKey('my-peers', appliedQuery.value)),
    queryFn: () => list({ ...appliedQuery.value }),
    refetchInterval: 30000,
    placeholderData: prev => prev,
  })
  watchEffect(() => {
    listRes.list = peersData.value?.data?.list || []
    listRes.total = peersData.value?.data?.total || 0
    listRes.loading = isFetching.value
  })
  const handlerQuery = () => {
    listQuery.page = 1
    appliedQuery.value = { ...listQuery }
  }

  /*const del = async (row) => {
    const cf = await ElMessageBox.confirm(T('Confirm?', { param: T('Delete') }), {
      confirmButtonText: T('Confirm'),
      cancelButtonText: T('Cancel'),
      type: 'warning',
    }).catch(_ => false)
    if (!cf) {
      return false
    }

    const res = await remove({ row_id: row.row_id }).catch(_ => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      getList()
    }
  }*/
  // смена размера страницы — вернуться на первую и сразу применить снимок
  // (queryKey зависит от appliedQuery, а не от listQuery — без этого явного
  // присваивания смена page_size не вызвала бы рефетч)
  watch(
    () => listQuery.page_size,
    () => {
      listQuery.page = 1
      appliedQuery.value = { ...listQuery }
    },
  )
  // смена страницы через пагинацию — применить снимок по той же причине
  watch(
    () => listQuery.page,
    () => {
      appliedQuery.value = { ...listQuery }
    },
  )

  const formVisible = ref(false)
  const formData = reactive({
    row_id: 0,
    cpu: '',
    hostname: '',
    id: '',
    memory: '',
    os: '',
    username: '',
    uuid: '',
    version: '',
  })

  const toView = row => {
    formVisible.value = true
    //将row中的数据赋值给formData
    Object.keys(formData).forEach(key => {
      formData[key] = row[key]
    })
  }

  const timeDis = time => {
    let now = new Date().getTime()
    let after = new Date(time * 1000).getTime()
    return (now - after) / 1000
  }

  const timeFilters = computed(() => [
    { text: T('MinutesLess', { param: 1 }, 1), value: -60 },
    { text: T('HoursLess', { param: 1 }, 1), value: -3600 },
    { text: T('DaysLess', { param: 1 }, 1), value: -86400 },
    { text: '---------', value: 0 },
    { text: T('MinutesAgo', { param: 1 }, 1), value: 60 },
    { text: T('HoursAgo', { param: 1 }, 1), value: 3600 },
    { text: T('DaysAgo', { param: 1 }, 1), value: 86400 },
    { text: T('MonthsAgo', { param: 1 }, 1), value: 2592000 },
    // { text: T('YearsAgo', { param: 1 }, 1), value: 31536000 },
  ])

  const toExport = async () => {
    const q = { ...listQuery }
    q.page_size = 10000
    q.page = 1
    const res = await list(q).catch(_ => false)
    if (res) {
      const data = res.data.list.map(item => {
        item.last_online_time = item.last_online_time ? new Date(item.last_online_time * 1000).toLocaleString() : '-'
        delete item.user_id
        delete item.user
        return item
      })
      const csv = jsonToCsv(data)
      downBlob(csv, 'peers.csv')
    }
  }

  const {
    platformList: ABPlatformList,
    formVisible: ABFormVisible,
    formData: ABFormData,
    collectionListResForUpdate,
    getCollectionListForUpdate,
    tagListRes,
    changeCollectionForUpdate,
    submit: ABSubmit,
    fromPeer,
  } = useABRepositories('my')
  onMounted(getCollectionListForUpdate)
  const toAddressBook = peer => {
    fromPeer(peer)
    ABFormVisible.value = true
  }

  const multipleSelection = ref([])
  const handleSelectionChange = val => {
    multipleSelection.value = val
  }
  /*const toBatchDelete = async () => {
    if (!multipleSelection.value.length) {
      ElMessage.warning(T('PleaseSelectData'))
      return false
    }
    const cf = await ElMessageBox.confirm(T('Confirm?', { param: T('BatchDelete') }), {
      confirmButtonText: T('Confirm'),
      cancelButtonText: T('Cancel'),
      type: 'warning',
    }).catch(_ => false)
    if (!cf) {
      return false
    }

    const res = await batchRemove({ row_ids: multipleSelection.value.map(i => i.row_id) }).catch(_ => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      getList()
    }
  }*/

  const batchABFormVisible = ref(false)
  const toBatchAddToAB = () => {
    batchABFormVisible.value = true
  }
  const batchABFormData = ref({
    collection_id: 0,
    tags: [],
    peer_ids: [],
  })
  const changeCollectionForBatchCreateAB = val => {
    batchABFormData.value.tags = []
    changeCollectionForUpdate(val)
  }
  const submitBatchAddToAB = async () => {
    if (multipleSelection.value.length === 0) {
      ElMessage.warning(T('PleaseSelectData'))
      return false
    }
    batchABFormData.value.peer_ids = multipleSelection.value.map(i => i.row_id)
    if (!batchABFormData.value.peer_ids.length) {
      ElMessage.warning(T('PleaseSelectData'))
      return false
    }

    const res = await batchCreateFromPeers(batchABFormData.value).catch(_ => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      batchABFormVisible.value = false
    }
  }
</script>

<style scoped lang="scss">
  .list-query .el-select {
    --el-select-width: 180px;
  }

  .lb-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .peer-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
    min-height: 80px;
  }

  .pc-web {
    min-width: 60px;
  }

  .last_oline_time {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .dot {
    width: 6px;
    height: 6px;
    display: block;
    border-radius: 50%;
    margin-left: 10px;

    &.red {
      background-color: red;
    }

    &.green {
      background-color: green;
    }
  }
</style>
