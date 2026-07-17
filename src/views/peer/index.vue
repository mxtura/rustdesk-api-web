<template>
  <div>
    <el-card class="list-query" shadow="hover">
      <el-form inline label-width="60px">
        <el-form-item label="ID">
          <el-input v-model="listQuery.id" clearable/>
        </el-form-item>
        <el-form-item :label="T('Hostname')">
          <el-input v-model="listQuery.hostname" clearable/>
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
          <el-input v-model="listQuery.username" clearable/>
        </el-form-item>
        <el-form-item label="IP">
          <el-input v-model="listQuery.ip" clearable/>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handlerQuery">{{ T('Filter') }}</el-button>
          <el-button type="danger" @click="toAdd">{{ T('Add') }}</el-button>
          <el-button type="success" @click="toExport">{{ T('Export') }}</el-button>
          <el-popover :visible="showImport" placement="bottom" :width="600">
            <el-upload
                class="upload-demo"
                drag
                accept=".csv"
                :before-upload="parseCsv"
            >
              <el-icon class="el-icon--upload">
                <upload-filled/>
              </el-icon>
              <div class="el-upload__text">
                {{ T('Drop file here or click to upload') }}
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  {{ T('Please upload csv file') }} <br>
                  {{ T('Columns') }}: <span style="font-weight: bold;font-size: 15px">id,cpu,hostname,memory,os,username,uuid,version,group_id</span>
                  <br>
                  <span>{{ T('You can reference export file') }}</span>
                </div>
              </template>
            </el-upload>
            <el-button @click="showImport=false" type="primary">{{ T('Cancel') }}</el-button>
            <template #reference>
              <el-button @click="showImport=true" type="danger" :icon="ArrowDown">{{ T('Import') }}</el-button>
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
          <el-radio-button label="cards"><el-icon><Grid/></el-icon></el-radio-button>
          <el-radio-button label="table"><el-icon><Menu/></el-icon></el-radio-button>
        </el-radio-group>
        <el-button v-if="viewMode==='table'" :type="editCols ? 'primary' : ''" :icon="Setting" @click="editCols = !editCols">
          {{ editCols ? T('Done') : T('Columns') }}
        </el-button>
      </div>
      <transition name="el-fade-in-linear">
        <div v-if="viewMode==='table' && editCols" class="col-edit-panel">
          <span class="cep-tip">{{ T('ColumnsHint') }}</span>
          <div class="col-add-bar">
            <el-tag v-for="c in hiddenColumns" :key="c.name" class="cab-chip" effect="plain" @click="showCol(c)">
              + {{ colLabel(c) }}
            </el-tag>
            <span v-if="!hiddenColumns.length" class="cab-empty">{{ T('AllColumnsShown') }}</span>
          </div>
        </div>
      </transition>

      <!-- ПЛИТКИ -->
      <div v-if="viewMode==='cards'" class="peer-grid" v-loading="listRes.loading">
        <div v-for="row in listRes.list" :key="row.row_id" class="peer-card" :class="{online: isOnline(row), selected: isSelected(row)}">
          <el-checkbox class="pc-check" :model-value="isSelected(row)" @change="v => toggleSelect(row, v)" @click.stop/>
          <div class="pc-head">
            <div class="pc-osbadge" :class="{on: isOnline(row)}">{{ osIcon(row.os) }}</div>
            <div class="pc-title">
              <div class="pc-host" :title="row.alias || row.hostname">{{ row.alias || row.hostname || '—' }}</div>
              <div class="pc-id" @click="handleClipboard(row.id, $event)">
                {{ row.id }} <el-icon class="copy-ic"><CopyDocument/></el-icon>
              </div>
            </div>
          </div>

          <div class="pc-statusrow">
            <span class="pc-badge" :class="isOnline(row) ? 'on' : 'off'">
              <i class="bd"></i>{{ isOnline(row) ? T('Online') : (row.last_online_time ? timeAgo(row.last_online_time * 1000) : T('Offline')) }}
            </span>
            <span v-if="row.version" class="pc-ver">v{{ row.version }}</span>
          </div>

          <div class="pc-specs">
            <div class="spec" :title="row.cpu"><el-icon><Cpu/></el-icon><span>{{ row.cpu || '—' }}</span></div>
            <div class="spec"><el-icon><Coin/></el-icon><span>{{ row.memory || '—' }}</span></div>
            <div class="spec" :title="row.os"><el-icon><Monitor/></el-icon><span>{{ row.os || '—' }}</span></div>
            <div class="spec"><el-icon><Connection/></el-icon><span>{{ row.last_online_ip || '—' }}</span></div>
          </div>

          <div class="pc-actions">
            <el-button type="primary" class="pc-connect" @click="connectByClient(row.id)">{{ T('Link') }}</el-button>
            <el-button v-if="appStore.setting.appConfig.web_client" class="pc-web" @click="toWebClientLink(row)">Web</el-button>
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
          </div>
        </div>
        <el-empty v-if="!listRes.loading && !listRes.list.length" description="—"/>
      </div>

      <el-table v-else ref="peerTable" :data="listRes.list" v-loading="listRes.loading" border size="small" @selection-change="handleSelectionChange" row-key="row_id">
        <el-table-column type="selection" width="45" align="center"/>
        <el-table-column v-for="c in shownColumns" :key="c.name" :prop="c.name" :min-width="colWidth(c)" align="center" show-overflow-tooltip>
          <template #header>
            <span class="col-h" :class="{editing: editCols}" :data-col="c.name">
              {{ colLabel(c) }}
              <el-icon v-if="editCols" class="col-x" @click.stop="hideCol(c)"><Close/></el-icon>
            </span>
          </template>
          <template #default="{row}">
            <template v-if="c.name==='id'">
              {{ row.id }} <el-icon class="copy-ic" @click="handleClipboard(row.id, $event)"><CopyDocument/></el-icon>
            </template>
            <template v-else-if="c.name==='last_online_time'">
              <div class="last_oline_time">
                <span>{{ row.last_online_time ? timeAgo(row.last_online_time * 1000) : '-' }}</span>
                <span class="dot" :class="{red: timeDis(row.last_online_time) >= 60, green: timeDis(row.last_online_time) < 60}"></span>
              </div>
            </template>
            <template v-else-if="c.name==='group_id'">
              <el-tag v-if="row.group_id">{{ groupListRes.list?.find(g => g.id === row.group_id)?.name }}</el-tag>
              <span v-else>-</span>
            </template>
            <template v-else>{{ row[c.name] || '-' }}</template>
          </template>
        </el-table-column>

        <el-table-column :label="T('Actions')" align="center" width="170" class-name="table-actions">
          <template #default="{row}">
            <el-button type="primary" size="small" @click="connectByClient(row.id)">{{ T('Link') }}</el-button>
            <el-dropdown trigger="click">
              <el-button size="small" :icon="MoreFilled"></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="appStore.setting.appConfig.web_client" @click="toWebClientLink(row)">Web Client</el-dropdown-item>
                  <el-dropdown-item @click="doWol(row)">⚡ {{ T('Wol') }}</el-dropdown-item>
                  <el-dropdown-item @click="toAddressBook(row)">{{ T('AddToAddressBook') }}</el-dropdown-item>
                  <el-dropdown-item @click="toEdit(row)">{{ T('Edit') }}</el-dropdown-item>
                  <el-dropdown-item divided @click="del(row)">{{ T('Delete') }}</el-dropdown-item>
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
    <el-dialog v-model="formVisible" :title="!formData.row_id?T('Create'):T('Update')" width="800">
      <el-form class="dialog-form" ref="form" :model="formData" label-width="120px">
        <el-form-item label="ID" prop="id" required>
          <el-input v-model="formData.id"></el-input>
        </el-form-item>
        <el-form-item :label="T('Group')" prop="group_id">
          <el-select v-model="formData.group_id">
            <el-option
                v-for="item in groupListRes.list"
                :key="item.id"
                :label="item.name"
                :value="item.id"
            ></el-option>
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
          <el-button @click="submit" type="primary">{{ T('Submit') }}</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <el-dialog v-model="ABFormVisible" width="800" :title="T('Create')" destroy-on-close>
      <createABForm :peer="clickRow" @success="ABFormVisible=false" @cancel="ABFormVisible=false"></createABForm>
    </el-dialog>

    <el-dialog v-model="batchABFormVisible" width="800" :title="T('Create')">
      <el-form class="dialog-form" ref="form" :model="batchABFormData" label-width="120px">
        <el-form-item :label="T('Owner')" prop="user_id" required>
          <el-select v-model="batchABFormData.user_id" @change="changeUserForBatchCreateAB">
            <el-option
                v-for="item in allUsers"
                :key="item.id"
                :label="item.username"
                :value="item.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="T('AddressBookName')" required prop="collection_id">
          <el-select v-model="batchABFormData.collection_id" clearable>
            <el-option :value="0" :label="T('MyAddressBook')"></el-option>
            <el-option v-for="c in collectionListResForBatchCreateAB.list" :key="c.id" :label="c.name" :value="c.id"></el-option>
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
          <el-button @click="submitBatchAddToAB" type="primary">{{ T('Submit') }}</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

  </div>
</template>

<script setup>
  import { computed, onActivated, onMounted, onUnmounted, nextTick, reactive, ref, watch } from 'vue'
  import Sortable from 'sortablejs'
  import { batchRemove, create, list, remove, update, wol } from '@/api/peer'
  import { list as groupList } from '@/api/device_group'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { toWebClientLink } from '@/utils/webclient'
  import { T } from '@/utils/i18n'
  import { timeAgo } from '@/utils/time'
  import { jsonToCsv, downBlob } from '@/utils/file'
  import { loadAllUsers } from '@/global'
  import { useAppStore } from '@/store/app'
  import { connectByClient } from '@/utils/peer'
  import { ArrowDown, ArrowUp, CopyDocument, Setting, MoreFilled, Grid, Menu, Close, Cpu, Coin, Monitor, Connection } from '@element-plus/icons'
  import { handleClipboard } from '@/utils/clipboard'
  import { batchCreateFromPeers } from '@/api/address_book'
  import { useRepositories as useCollectionRepositories } from '@/views/address_book/collection'
  import createABForm from '@/views/peer/createABForm.vue'
  import { UploadFilled } from '@element-plus/icons-vue'

  const appStore = useAppStore()

  //group
  const groupListRes = reactive({
    list: [], total: 0, loading: false,
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
    list: [], total: 0, loading: false,
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

  const getList = async (silent) => {
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
  onMounted(() => { poll = setInterval(() => { if (!document.hidden) getList(true) }, 15000) })
  onUnmounted(() => { if (poll) clearInterval(poll) })
  const handlerQuery = () => {
    if (listQuery.page === 1) {
      getList()
    } else {
      listQuery.page = 1
    }
  }

  const del = async (row) => {
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
  const doWol = async (row) => {
    if (!row.mac) {
      ElMessage.warning(T('WolNoMac'))
      return
    }
    const res = await wol({ row_id: row.row_id }).catch(_ => false)
    if (res) ElMessage.success(T('WolSent'))
  }

  const toEdit = (row) => {
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

  const timeDis = (time) => {
    let now = new Date().getTime()
    let after = new Date(time * 1000).getTime()
    return (now - after) / 1000
  }

  // режим отображения: плитки / таблица
  const viewMode = ref(localStorage.getItem('peer_view_mode') || 'cards')
  watch(viewMode, (v) => localStorage.setItem('peer_view_mode', v))

  const isOnline = (row) => !!row.last_online_time && timeDis(row.last_online_time) < 60

  const osIcon = (os) => {
    const s = (os || '').toLowerCase()
    if (s.includes('win')) return '🪟'
    if (s.includes('mac') || s.includes('ios') || s.includes('darwin')) return '🍎'
    if (s.includes('android')) return '🤖'
    if (s.includes('linux')) return '🐧'
    return '🖥️'
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

  const showImport = ref(false)
  const canKeys = ['id', 'cpu', 'hostname', 'memory', 'os', 'username', 'uuid', 'version', 'group_id']
  const parseCsv = (file) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const data = e.target.result
      console.log(data)
      //组装数据
      const rows = data.split('\n')
      const keys = rows[0].split(',')
      console.log(keys, rows.slice(1).map(row => row.split(',')))
      const values = rows.slice(1).map(row => {
        const obj = {}
        row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).forEach((v, i) => {
          //去掉两边的"
          obj[keys[i]] = v.trim().replace(/^"|"$/g, '')
        })
        return obj
      }).filter(item => item.id)
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
      console.log(values)
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
  const toAddressBook = (row) => {
    clickRow.value = row
    ABFormVisible.value = true
  }

  const multipleSelection = ref([])
  const handleSelectionChange = (val) => {
    multipleSelection.value = val
  }
  // мультивыбор для плиток
  const isSelected = (row) => multipleSelection.value.some(r => r.row_id === row.row_id)
  const toggleSelect = (row, val) => {
    if (val) { if (!isSelected(row)) multipleSelection.value.push(row) }
    else multipleSelection.value = multipleSelection.value.filter(r => r.row_id !== row.row_id)
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
  const changeUserForBatchCreateAB = (val) => {
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

  // метаданные колонок (label/ширина) — отдельно от порядка/видимости
  const COL_META = {
    id: { label: 'ID', raw: true, width: 150 },
    cpu: { label: 'CPU', raw: true, minWidth: 160 },
    hostname: { label: 'Hostname', width: 120 },
    memory: { label: 'Memory', width: 100 },
    os: { label: 'Os', minWidth: 150 },
    last_online_time: { label: 'LastOnlineTime', minWidth: 150 },
    last_online_ip: { label: 'LastOnlineIp', width: 130 },
    username: { label: 'Username', width: 120 },
    group_id: { label: 'Group', width: 110 },
    uuid: { label: 'Uuid', minWidth: 150 },
    version: { label: 'Version', width: 90 },
    alias: { label: 'Alias', width: 100 },
    created_at: { label: 'CreatedAt', width: 160 },
    updated_at: { label: 'UpdatedAt', width: 160 },
  }
  const defaultColumns = [
    { name: 'id', visible: true },
    { name: 'hostname', visible: true },
    { name: 'memory', visible: true },
    { name: 'os', visible: true },
    { name: 'last_online_time', visible: true },
    { name: 'last_online_ip', visible: true },
    { name: 'username', visible: true },
    { name: 'group_id', visible: true },
    { name: 'version', visible: true },
    { name: 'cpu', visible: false },
    { name: 'uuid', visible: false },
    { name: 'alias', visible: false },
    { name: 'created_at', visible: false },
    { name: 'updated_at', visible: false },
  ]
  const loadColumns = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('peer_columns_v2'))
      if (Array.isArray(saved) && saved.length) {
        const names = new Set(saved.map(c => c.name))
        const merged = saved.filter(c => COL_META[c.name])
        defaultColumns.forEach(dc => { if (!names.has(dc.name)) merged.push({ ...dc }) })
        return merged
      }
    } catch (e) { /* ignore */ }
    return defaultColumns.map(c => ({ ...c }))
  }
  const visibleColumns = ref(loadColumns())
  const shownColumns = computed(() => visibleColumns.value.filter(c => c.visible))
  const hiddenColumns = computed(() => visibleColumns.value.filter(c => !c.visible))
  const editCols = ref(false)
  const colLabel = (c) => { const m = COL_META[c.name] || {}; return m.raw ? m.label : T(m.label || c.name) }
  const colWidth = (c) => { const m = COL_META[c.name] || {}; return m.minWidth || m.width || 110 }
  const persistCols = () => localStorage.setItem('peer_columns_v2', JSON.stringify(visibleColumns.value))
  const hideCol = (c) => { c.visible = false; persistCols() }
  const showCol = (c) => { c.visible = true; persistCols() }

  // drag-reorder заголовков мышкой
  const peerTable = ref(null)
  let colSortable = null
  const applyDomOrder = () => {
    const el = peerTable.value?.$el?.querySelector('.el-table__header-wrapper thead tr')
    if (!el) return
    const order = [...el.querySelectorAll('.col-h[data-col]')].map(s => s.dataset.col)
    if (!order.length) return
    const seen = new Set(order)
    const reordered = order.map(n => visibleColumns.value.find(c => c.name === n)).filter(Boolean)
    const rest = visibleColumns.value.filter(c => !seen.has(c.name))
    visibleColumns.value = [...reordered, ...rest]
    persistCols()
  }
  const initColSortable = async () => {
    if (viewMode.value !== 'table') return
    await nextTick()
    const el = peerTable.value?.$el?.querySelector('.el-table__header-wrapper thead tr')
    if (!el) return
    if (colSortable) { colSortable.destroy(); colSortable = null }
    colSortable = Sortable.create(el, {
      animation: 180,
      draggable: 'th.el-table__cell',
      filter: '.el-table-column--selection, .table-actions',
      onMove: (e) => !(e.related.classList.contains('el-table-column--selection') || e.related.classList.contains('table-actions')),
      onEnd: applyDomOrder,
    })
  }
  onMounted(() => { nextTick(initColSortable) })
  watch(viewMode, initColSortable)
  watch(shownColumns, initColSortable)
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

/* сетка плиток */
.peer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  min-height: 80px;
}

.peer-card {
  position: relative;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}
/* акцентная полоса слева у онлайн-устройств */
.peer-card::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: transparent;
  transition: background 0.2s ease;
}
.peer-card.online::before { background: linear-gradient(180deg, #22c55e, #16a34a); }
.peer-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lift);
  border-color: var(--glass-border-strong);
}
.peer-card.selected { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent), var(--shadow-soft); }

/* чекбокс — в углу, проявляется на ховере/выборе */
.pc-check {
  position: absolute;
  top: 12px; right: 12px;
  opacity: 0;
  transition: opacity 0.15s ease;
  z-index: 2;
}
.peer-card:hover .pc-check,
.peer-card.selected .pc-check { opacity: 1; }

/* шапка: бейдж ОС + имя */
.pc-head { display: flex; align-items: center; gap: 14px; }
.pc-osbadge {
  width: 46px; height: 46px;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px;
  border-radius: 13px;
  background: var(--glass-bg-strong);
  border: 1px solid var(--glass-border);
  transition: all 0.2s ease;
}
.pc-osbadge.on {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.4);
}
.peer-card:not(.online) .pc-osbadge { opacity: 0.6; }
.pc-title { flex: 1; min-width: 0; }
.pc-host {
  font-weight: 600;
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pc-id {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  width: fit-content;
  margin-top: 2px;
}
.pc-id:hover { color: var(--accent); }
.copy-ic { font-size: 13px; }

/* строка статуса: пилюля + версия */
.pc-statusrow { display: flex; align-items: center; justify-content: space-between; }
.pc-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 999px;
}
.pc-badge .bd { width: 7px; height: 7px; border-radius: 50%; }
.pc-badge.on { background: rgba(34, 197, 94, 0.14); color: #22c55e; }
.pc-badge.on .bd { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
.pc-badge.off { background: var(--glass-bg-strong); color: var(--el-text-color-secondary); }
.pc-badge.off .bd { background: #6b7280; }
.pc-ver { font-size: 12px; color: var(--el-text-color-secondary); font-variant-numeric: tabular-nums; }

/* спеки: иконка + значение */
.pc-specs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 14px;
  padding: 4px 0;
  border-top: 1px solid var(--glass-border);
  padding-top: 14px;
}
.pc-specs .spec {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.pc-specs .spec .el-icon {
  font-size: 15px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}
.pc-specs .spec span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* действия */
.pc-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  align-items: center;
}
.pc-connect { flex: 1; }
.pc-actions .pc-more { margin-left: 0; }

/* панель редактирования колонок */
.col-edit-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  padding: 10px 14px;
  margin-bottom: 14px;
  border-radius: var(--radius-md);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--glass-border);
}
.cep-tip { font-size: 12px; color: var(--el-text-color-secondary); }
.col-add-bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.cab-chip { cursor: pointer; transition: all 0.15s ease; }
.cab-chip:hover { border-color: var(--accent); color: var(--accent); transform: translateY(-1px); }
.cab-empty { font-size: 12px; color: var(--el-text-color-secondary); }

/* заголовок колонки + крестик удаления */
:deep(.col-h) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
:deep(.col-h.editing) { cursor: grab; }
:deep(.col-x) {
  cursor: pointer;
  font-size: 13px;
  padding: 2px;
  border-radius: 50%;
  color: var(--el-text-color-secondary);
  transition: all 0.15s ease;
}
:deep(.col-x:hover) { color: #fff; background: var(--el-color-danger); }
/* в режиме правки — курсор перетаскивания на заголовках */
:deep(.el-table__header-wrapper thead th.el-table__cell) { transition: background 0.15s ease; }
.copy-ic { cursor: pointer; vertical-align: middle; }
:deep(.sortable-ghost) { opacity: 0.4; }
:deep(.sortable-chosen) { background: var(--el-color-primary-light-9); }

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
