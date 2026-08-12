<template>
  <div>
    <el-card class="list-query" shadow="hover">
      <el-form inline label-width="60px">
        <el-form-item label="ID">
          <el-input v-model="listQuery.id" clearable />
        </el-form-item>
        <el-form-item :label="T('Hostname')">
          <el-input v-model="listQuery.hostname" clearable />
        </el-form-item>
        <el-form-item :label="T('LastOnlineTime')" label-width="100px">
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
        <el-form-item :label="T('Username')">
          <el-input v-model="listQuery.username" clearable />
        </el-form-item>
        <el-form-item label="IP">
          <el-input v-model="listQuery.ip" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handlerQuery">{{ T('Filter') }}</el-button>
          <el-button type="danger" @click="toAdd">{{ T('Add') }}</el-button>
          <el-button type="success" @click="toExport">{{ T('Export') }}</el-button>
          <el-popover :visible="showImport" placement="bottom" :width="600">
            <el-upload class="upload-demo" drag accept=".csv" :before-upload="parseCsv">
              <el-icon class="el-icon--upload">
                <upload-filled />
              </el-icon>
              <div class="el-upload__text">
                {{ T('Drop file here or click to upload') }}
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  {{ T('Please upload csv file') }} <br />
                  {{ T('Columns') }}:
                  <span style="font-weight: bold; font-size: 15px"
                    >id,cpu,hostname,memory,os,username,uuid,version,group_id</span
                  >
                  <br />
                  <span>{{ T('You can reference export file') }}</span>
                </div>
              </template>
            </el-upload>
            <el-button type="primary" @click="showImport = false">{{ T('Cancel') }}</el-button>
            <template #reference>
              <el-button type="danger" :icon="ArrowDown" @click="showImport = true">{{ T('Import') }}</el-button>
            </template>
          </el-popover>
          <el-button type="danger" @click="toBatchDelete">{{ T('BatchDelete') }}</el-button>
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
        <device-card
          v-for="row in listRes.list"
          :key="row.row_id"
          :row="row"
          selectable
          :selected="isSelected(row)"
          @toggle="v => toggleSelect(row, v)"
        >
          <template #actions="{ row }">
            <el-button type="primary" class="pc-connect" @click="connectByClient(row.id)">{{ T('Link') }}</el-button>
            <el-button v-if="appStore.setting.appConfig.web_client" class="pc-web" @click="toWebClientLink(row)"
              >Web</el-button
            >
            <el-dropdown trigger="click" class="pc-more">
              <el-button :icon="MoreFilled"></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="doWol(row)">⚡ {{ T('Wol') }}</el-dropdown-item>
                  <el-dropdown-item @click="toAddressBook(row)">{{ T('AddToAddressBook') }}</el-dropdown-item>
                  <el-dropdown-item @click="toEdit(row)">{{ T('Edit') }}</el-dropdown-item>
                  <el-dropdown-item divided @click="del(row)">{{ T('Delete') }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </device-card>
        <el-empty v-if="!listRes.loading && !listRes.list.length" description="—" />
      </div>

      <device-table
        v-else
        :list="listRes.list"
        :loading="listRes.loading"
        :columns="peerColumns"
        storage-key="peer_columns_v2"
        :actions-width="170"
        @selection-change="handleSelectionChange"
      >
        <template #col-group_id="{ row }">
          <el-tag v-if="row.group_id">{{ groupListRes.list?.find(g => g.id === row.group_id)?.name }}</el-tag>
          <span v-else>-</span>
        </template>
        <template #actions="{ row }">
          <el-button type="primary" size="small" @click="connectByClient(row.id)">{{ T('Link') }}</el-button>
          <el-dropdown trigger="click">
            <el-button size="small" :icon="MoreFilled"></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-if="appStore.setting.appConfig.web_client" @click="toWebClientLink(row)"
                  >Web Client</el-dropdown-item
                >
                <el-dropdown-item @click="doWol(row)">⚡ {{ T('Wol') }}</el-dropdown-item>
                <el-dropdown-item @click="toAddressBook(row)">{{ T('AddToAddressBook') }}</el-dropdown-item>
                <el-dropdown-item @click="toEdit(row)">{{ T('Edit') }}</el-dropdown-item>
                <el-dropdown-item divided @click="del(row)">{{ T('Delete') }}</el-dropdown-item>
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
    <el-dialog v-model="formVisible" :title="!formData.row_id ? T('Create') : T('Update')" width="800">
      <el-form ref="form" class="dialog-form" :model="formData" label-width="120px">
        <el-form-item label="ID" prop="id" required>
          <el-input v-model="formData.id"></el-input>
        </el-form-item>
        <el-form-item :label="T('Group')" prop="group_id">
          <el-select v-model="formData.group_id">
            <el-option v-for="item in groupListRes.list" :key="item.id" :label="item.name" :value="item.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="T('Username')" prop="username">
          <el-input v-model="formData.username"></el-input>
        </el-form-item>
        <el-form-item :label="T('Hostname')" prop="hostname">
          <el-input v-model="formData.hostname"></el-input>
        </el-form-item>
        <el-form-item label="CPU" prop="cpu">
          <el-input v-model="formData.cpu"></el-input>
        </el-form-item>
        <el-form-item :label="T('Memory')" prop="memory">
          <el-input v-model="formData.memory"></el-input>
        </el-form-item>
        <el-form-item :label="T('Os')" prop="os">
          <el-input v-model="formData.os"></el-input>
        </el-form-item>
        <el-form-item :label="T('Uuid')" prop="uuid">
          <el-input v-model="formData.uuid"></el-input>
        </el-form-item>
        <el-form-item :label="T('Version')" prop="version">
          <el-input v-model="formData.version"></el-input>
        </el-form-item>
        <el-form-item :label="T('Alias')" prop="alias">
          <el-input v-model="formData.alias"></el-input>
        </el-form-item>
        <el-form-item :label="T('MacWol')" prop="mac">
          <el-input v-model="formData.mac" placeholder="AA:BB:CC:DD:EE:FF"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button @click="formVisible = false">{{ T('Cancel') }}</el-button>
          <el-button type="primary" @click="submit">{{ T('Submit') }}</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <el-dialog v-model="ABFormVisible" width="800" :title="T('Create')" destroy-on-close>
      <createABForm :peer="clickRow" @success="ABFormVisible = false" @cancel="ABFormVisible = false"></createABForm>
    </el-dialog>

    <el-dialog v-model="batchABFormVisible" width="800" :title="T('Create')">
      <el-form ref="form" class="dialog-form" :model="batchABFormData" label-width="120px">
        <el-form-item :label="T('Owner')" prop="user_id" required>
          <el-select v-model="batchABFormData.user_id" @change="changeUserForBatchCreateAB">
            <el-option v-for="item in allUsers" :key="item.id" :label="item.username" :value="item.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="T('AddressBookName')" required prop="collection_id">
          <el-select v-model="batchABFormData.collection_id" clearable>
            <el-option :value="0" :label="T('MyAddressBook')"></el-option>
            <el-option
              v-for="c in collectionListResForBatchCreateAB.list"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <!--        <el-form-item :label="T('Tags')" prop="tags">
                  <el-select v-model="batchABFormData.tags" multiple>
                    <el-option
                        v-for="item in tagListRes.list"
                        :key="item.name"
                        :label="item.name"
                        :value="item.name"
                    ></el-option>
                  </el-select>
                </el-form-item>-->
        <el-form-item>
          <el-button @click="batchABFormVisible = false">{{ T('Cancel') }}</el-button>
          <el-button type="primary" @click="submitBatchAddToAB">{{ T('Submit') }}</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup>
  import { computed, onActivated, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
  import { useLocalStorage } from '@vueuse/core'
  import { batchRemove, create, list, remove, update, wol } from '@/api/peer'
  import { list as groupList } from '@/api/device_group'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { toWebClientLink } from '@/utils/webclient'
  import { T } from '@/utils/i18n'
  import { jsonToCsv, downBlob } from '@/utils/file'
  import { loadAllUsers } from '@/global'
  import { useAppStore } from '@/store/app'
  import { connectByClient } from '@/utils/peer'
  import { ArrowDown, ArrowUp, MoreFilled, Grid, Menu } from '@element-plus/icons-vue'
  import { batchCreateFromPeers } from '@/api/address_book'
  import { useRepositories as useCollectionRepositories } from '@/views/address_book/collection'
  import createABForm from '@/views/peer/createABForm.vue'
  import { UploadFilled } from '@element-plus/icons-vue'
  import DeviceCard from '@/components/DeviceCard.vue'
  import DeviceTable from '@/components/DeviceTable.vue'

  const appStore = useAppStore()

  // колонки таблицы (настраиваются/перетаскиваются в DeviceTable)
  const peerColumns = [
    { name: 'id', label: 'ID', raw: true, width: 150, visible: true },
    { name: 'hostname', label: 'Hostname', width: 120, visible: true },
    { name: 'memory', label: 'Memory', width: 100, visible: true },
    { name: 'os', label: 'Os', minWidth: 150, visible: true },
    { name: 'last_online_time', label: 'LastOnlineTime', minWidth: 150, visible: true },
    { name: 'last_online_ip', label: 'LastOnlineIp', width: 130, visible: true },
    { name: 'username', label: 'Username', width: 120, visible: true },
    { name: 'group_id', label: 'Group', width: 110, visible: true },
    { name: 'version', label: 'Version', width: 90, visible: true },
    { name: 'cpu', label: 'CPU', raw: true, minWidth: 160, visible: false },
    { name: 'uuid', label: 'Uuid', minWidth: 150, visible: false },
    { name: 'alias', label: 'Alias', width: 100, visible: false },
    { name: 'created_at', label: 'CreatedAt', width: 160, visible: false },
    { name: 'updated_at', label: 'UpdatedAt', width: 160, visible: false },
  ]

  //group
  const groupListRes = reactive({
    list: [],
    total: 0,
    loading: false,
  })
  const groupListQuery = reactive({
    page: 1,
    page_size: 999,
  })
  const getGroupList = async () => {
    groupListRes.loading = true
    const res = await groupList(groupListQuery).catch(_ => false)
    groupListRes.loading = false
    if (res) {
      groupListRes.list = res.data.list
      groupListRes.total = res.data.total
    }
  }
  onMounted(getGroupList)
  //

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
    username: '',
    ip: '',
  })

  const getList = async silent => {
    if (!silent) listRes.loading = true
    const res = await list(listQuery).catch(_ => false)
    listRes.loading = false
    if (res) {
      listRes.list = res.data.list
      listRes.total = res.data.total
    }
  }

  // живой статус: тихое автообновление каждые 15с
  let poll = null
  onMounted(() => {
    poll = setInterval(() => {
      if (!document.hidden) getList(true)
    }, 15000)
  })
  onUnmounted(() => {
    if (poll) clearInterval(poll)
  })
  const handlerQuery = () => {
    if (listQuery.page === 1) {
      getList()
    } else {
      listQuery.page = 1
    }
  }

  const del = async row => {
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
  }
  onMounted(getList)
  onActivated(getList)

  watch(() => listQuery.page, getList)

  watch(() => listQuery.page_size, handlerQuery)

  const formVisible = ref(false)
  const formData = reactive({
    row_id: 0,
    group_id: null,
    cpu: '',
    hostname: '',
    id: '',
    memory: '',
    os: '',
    username: '',
    uuid: '',
    version: '',
    mac: '',
  })

  // Wake-on-LAN
  const doWol = async row => {
    if (!row.mac) {
      ElMessage.warning(T('WolNoMac'))
      return
    }
    const res = await wol({ row_id: row.row_id }).catch(_ => false)
    if (res) ElMessage.success(T('WolSent'))
  }

  const toEdit = row => {
    formVisible.value = true
    //将row中的数据赋值给formData
    Object.keys(formData).forEach(key => {
      formData[key] = row[key]
    })
  }
  const toAdd = () => {
    formVisible.value = true
    //重置formData
    formData.row_id = 0
    formData.cpu = ''
    formData.hostname = ''
    formData.id = ''
    formData.memory = ''
    formData.os = ''
    formData.username = ''
    formData.uuid = ''
    formData.version = ''
    formData.mac = ''
  }
  const submit = async () => {
    const api = formData.row_id ? update : create
    const res = await api(formData).catch(_ => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      formVisible.value = false
      getList()
    }
  }

  // режим отображения: плитки / таблица
  const viewMode = useLocalStorage('peer_view_mode', 'cards')

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

  const showImport = ref(false)
  const canKeys = ['id', 'cpu', 'hostname', 'memory', 'os', 'username', 'uuid', 'version', 'group_id']
  const parseCsv = file => {
    const reader = new FileReader()
    reader.onload = async e => {
      const data = e.target.result
      //组装数据
      const rows = data.split('\n')
      const keys = rows[0].split(',')
      const values = rows
        .slice(1)
        .map(row => {
          const obj = {}
          row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).forEach((v, i) => {
            //去掉两边的"
            obj[keys[i]] = v.trim().replace(/^"|"$/g, '')
          })
          return obj
        })
        .filter(item => item.id)
      // console.log(values)
      //移除不需要的key
      values.forEach(item => {
        item.group_id = parseInt(item.group_id)
        Object.keys(item).forEach(key => {
          if (!canKeys.includes(key)) {
            delete item[key]
          }
        })
      })
      const pa = []
      values.map(item => {
        pa.push(create(item))
      })
      const res = await Promise.all(pa).catch(_ => false)
      if (res) {
        ElMessage.success(T('OperationSuccess'))
        getList()
      }
    }
    reader.readAsText(file)
    return false
  }
  const toImport = () => {
    ElMessage.warning('暂未实现')
  }

  const ABFormVisible = ref(false)
  const clickRow = ref({})
  const toAddressBook = row => {
    clickRow.value = row
    ABFormVisible.value = true
  }

  const multipleSelection = ref([])
  const handleSelectionChange = val => {
    multipleSelection.value = val
  }
  // мультивыбор для плиток
  const isSelected = row => multipleSelection.value.some(r => r.row_id === row.row_id)
  const toggleSelect = (row, val) => {
    if (val) {
      if (!isSelected(row)) multipleSelection.value.push(row)
    } else multipleSelection.value = multipleSelection.value.filter(r => r.row_id !== row.row_id)
  }
  const toBatchDelete = async () => {
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
  }

  // 批量添加到地址簿 start
  const { allUsers, getAllUsers } = loadAllUsers()
  onMounted(getAllUsers)
  const {
    listRes: collectionListResForBatchCreateAB,
    listQuery: collectionListQueryForBatchCreateAB,
    getList: getCollectionListForBatchCreateAB,
  } = useCollectionRepositories('admin')
  collectionListQueryForBatchCreateAB.page_size = 9999
  const changeUserForBatchCreateAB = val => {
    batchABFormData.value.collection_id = 0
    collectionListQueryForBatchCreateAB.user_id = val
    getCollectionListForBatchCreateAB()
  }
  const batchABFormVisible = ref(false)
  const toBatchAddToAB = () => {
    batchABFormVisible.value = true
  }
  const batchABFormData = ref({
    collection_id: 0,
    tags: [],
    peer_ids: [],
    user_id: null,
  })
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
  // 批量添加到地址簿 end
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
</style>
