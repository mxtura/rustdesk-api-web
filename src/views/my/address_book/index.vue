<template>
  <div>
    <el-card class="list-query" shadow="hover">
      <el-form inline label-width="120px">
        <el-form-item :label="T('AddressBookName')">
          <el-select v-model="listQuery.collection_id" clearable>
            <el-option :value="0" :label="T('MyAddressBook')"></el-option>
            <el-option v-for="c in collectionListRes.list" :key="c.id" :label="c.name" :value="c.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="T('Id')">
          <el-input v-model="listQuery.id" clearable></el-input>
        </el-form-item>
        <el-form-item :label="T('Username')">
          <el-input v-model="listQuery.username" clearable></el-input>
        </el-form-item>
        <el-form-item :label="T('Hostname')">
          <el-input v-model="listQuery.hostname" clearable></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handlerQuery">{{ T('Filter') }}</el-button>
          <el-button type="danger" @click="toAdd">{{ T('Add') }}</el-button>
          <el-button type="primary" @click="showBatchEditTags">{{ T('BatchEditTags') }}</el-button>
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
      <div v-if="viewMode==='cards'" class="ab-grid" v-loading="listRes.loading">
        <div v-for="row in listRes.list" :key="row.row_id || row.id" class="ab-card">
          <div class="ab-head">
            <div class="ab-badge">
              <PlatformIcons :name="platIcon(row)" style="width:24px;height:24px;display:inline-block" color="var(--basicBlack)"/>
            </div>
            <div class="ab-title">
              <div class="ab-name">{{ row.alias || row.hostname || row.id }}</div>
              <div class="ab-id" @click="handleClipboard(row.id, $event)">
                {{ row.id }} <el-icon class="copy-ic"><CopyDocument/></el-icon>
              </div>
            </div>
          </div>
          <div class="ab-statusrow">
            <el-tag size="small" effect="plain" class="ab-col">{{ colName(row) }}</el-tag>
            <span v-if="row.peer?.version" class="ab-ver">v{{ row.peer.version }}</span>
          </div>
          <div v-if="tagArr(row).length" class="ab-tags">
            <el-tag v-for="t in tagArr(row)" :key="t" size="small">{{ t }}</el-tag>
          </div>
          <div class="ab-specs">
            <div v-if="row.username" class="spec"><el-icon><User/></el-icon><span>{{ row.username }}</span></div>
            <div v-if="row.hostname" class="spec"><el-icon><Monitor/></el-icon><span>{{ row.hostname }}</span></div>
          </div>
          <div class="ab-actions">
            <el-button type="primary" class="ab-connect" @click="connectByClient(row.id)">{{ T('Link') }}</el-button>
            <el-dropdown trigger="click" class="ab-more">
              <el-button :icon="MoreFilled"></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="appStore.setting.appConfig.web_client" @click="toWebClientLink(row)">Web Client</el-dropdown-item>
                  <el-dropdown-item v-if="appStore.setting.appConfig.web_client" @click="toShowShare(row)">{{ T('ShareByWebClient') }}</el-dropdown-item>
                  <el-dropdown-item @click="toEdit(row)">{{ T('Edit') }}</el-dropdown-item>
                  <el-dropdown-item divided @click="del(row)">{{ T('Delete') }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
        <el-empty v-if="!listRes.loading && !listRes.list.length" description="—"/>
      </div>

      <el-table v-else :data="listRes.list" v-loading="listRes.loading" border @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center"></el-table-column>
        <el-table-column prop="id" label="ID" align="center" width="200">
          <template #default="{row}">
            <div>
              <PlatformIcons :name="platformList.find(p=>p.label===row.platform)?.icon" style="width: 20px;height: 20px;display: inline-block" color="var(--basicBlack)"/>
              {{ row.id }}
              <el-icon @click="handleClipboard(row.id, $event)">
                <CopyDocument/>
              </el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="collection_id" :label="T('AddressBookName')" align="center" width="150">
          <template #default="{row}">
            <span v-if="row.collection_id === 0">{{ T('MyAddressBook') }}</span>
            <span v-else>{{ collectionListRes.list.find(c => c.id === row.collection_id)?.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="username" :label="T('Username')" align="center" width="150"/>
        <el-table-column prop="hostname" :label="T('Hostname')" align="center" width="150"/>
        <!--        <el-table-column prop="platform" :label="T('Platform')" align="center" width="120"/>-->
        <el-table-column prop="tags" :label="T('Tags')" align="center"/>
        <!--        <el-table-column prop="created_at" label="创建时间" align="center"/>-->
        <!--        <el-table-column prop="updated_at" label="更新时间" align="center"/>-->
        <el-table-column prop="alias" :label="T('Alias')" align="center" width="150"/>
        <el-table-column prop="peer.version" :label="T('Version')" align="center" width="100"/>
        <el-table-column prop="hash" :label="T('Hash')" align="center" width="150" show-overflow-tooltip/>
        <el-table-column :label="T('Actions')" align="center" class-name="table-actions" width="600" fixed="right">
          <template #default="{row}">
            <el-button type="success" @click="connectByClient(row.id)">{{ T('Link') }}</el-button>
            <el-button v-if="appStore.setting.appConfig.web_client" type="success" @click="toWebClientLink(row)">Web Client</el-button>
            <el-button v-if="appStore.setting.appConfig.web_client" type="primary" @click="toShowShare(row)">{{ T('ShareByWebClient') }}</el-button>
            <el-button @click="toEdit(row)">{{ T('Edit') }}</el-button>
            <el-button type="danger" @click="del(row)">{{ T('Delete') }}</el-button>
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
    <el-dialog v-model="formVisible" width="800" :title="!formData.row_id?T('Create') :T('Update') ">
      <el-form class="dialog-form" ref="form" :model="formData" label-width="120px">
        <el-form-item :label="T('AddressBookName')" required prop="collection_id">
          <el-select v-model="formData.collection_id" clearable @change="changeCollectionForUpdate">
            <el-option :value="0" :label="T('MyAddressBook')"></el-option>
            <el-option v-for="c in collectionListResForUpdate.list" :key="c.id" :label="c.name" :value="c.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="ID" prop="id" required>
          <el-input v-model="formData.id"></el-input>
        </el-form-item>
        <el-form-item :label="T('Username')" prop="username">
          <el-input v-model="formData.username"></el-input>
        </el-form-item>
        <el-form-item :label="T('Alias')" prop="alias">
          <el-input v-model="formData.alias"></el-input>
        </el-form-item>
        <el-form-item :label="T('Hash')" prop="hash">
          <el-input v-model="formData.hash"></el-input>
        </el-form-item>
        <el-form-item :label="T('Hostname')" prop="hostname">
          <el-input v-model="formData.hostname"></el-input>
        </el-form-item>
        <!--        <el-form-item :label="T('LoginName')" prop="loginName">
                  <el-input v-model="formData.loginName"></el-input>
                </el-form-item>-->
        <!--        <el-form-item :label="T('Password')" prop="password">
                          <el-input v-model="formData.password"></el-input>
                        </el-form-item>-->
        <el-form-item :label="T('Platform')" prop="platform">
          <el-select v-model="formData.platform">
            <el-option
                v-for="item in platformList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item :label="T('Tags')" prop="tags">
          <el-select v-model="formData.tags" multiple>
            <el-option
                v-for="item in tagListRes.list"
                :key="item.name"
                :label="item.name"
                :value="item.name"
            ></el-option>
          </el-select>
        </el-form-item>
        <!-- <el-form-item label="强制中继" prop="forceAlwaysRelay" required>
                 <el-switch v-model="formData.forceAlwaysRelay"></el-switch>
               </el-form-item>
          <el-form-item label="在线" prop="online">
                 <el-switch v-model="formData.online"></el-switch>
               </el-form-item>
               <el-form-item label="rdp端口" prop="rdpPort">
                 <el-input v-model="formData.rdpPort"></el-input>
               </el-form-item>
               <el-form-item label="rdp用户名" prop="rdpUsername">
                 <el-input v-model="formData.rdpUsername"></el-input>
               </el-form-item>
               <el-form-item label="同一服务器" prop="sameServer">
                 <el-switch v-model="formData.sameServer"></el-switch>
               </el-form-item>-->


        <el-form-item>
          <el-button @click="formVisible = false">{{ T('Cancel') }}</el-button>
          <el-button @click="submit" type="primary">{{ T('Submit') }}</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
    <el-dialog v-model="shareToWebClientVisible" width="900" :close-on-click-modal="false">
      <shareByWebClient :id="shareToWebClientForm.id"
                        :hash="shareToWebClientForm.hash"
                        @cancel="shareToWebClientVisible=false"
                        @success=""/>
    </el-dialog>
    <el-dialog v-model="batchEditTagVisible" width="800">
      <el-form :model="batchEditTagsFormData" label-width="120px" class="dialog-form">
        <el-form-item :label="T('Tags')" prop="tags">
          <el-select v-model="batchEditTagsFormData.tags" multiple>
            <el-option
                v-for="item in tagListResForBatchEdit.list"
                :key="item.name"
                :label="item.name"
                :value="item.name"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="batchEditTagVisible = false">{{ T('Cancel') }}</el-button>
          <el-button @click="submitBatchEditTags" type="primary">{{ T('Submit') }}</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup>
  import { onActivated, onMounted, reactive, ref, watch } from 'vue'
  import { useBatchUpdateTagsRepositories, useRepositories } from '@/views/address_book'
  import { toWebClientLink } from '@/utils/webclient'
  import { T } from '@/utils/i18n'
  import shareByWebClient from '@/views/address_book/components/shareByWebClient.vue'
  import { useAppStore } from '@/store/app'
  import { connectByClient } from '@/utils/peer'
  import { handleClipboard } from '@/utils/clipboard'
  import { CopyDocument, MoreFilled, Grid, Menu, User, Monitor } from '@element-plus/icons'
  import PlatformIcons from '@/components/icons/platform.vue'

  const viewMode = ref(localStorage.getItem('ab_view_mode') || 'cards')
  watch(viewMode, (v) => localStorage.setItem('ab_view_mode', v))
  const tagArr = (row) => Array.isArray(row.tags) ? row.tags : (row.tags ? String(row.tags).split(',').filter(Boolean) : [])
  const colName = (row) => row.collection_id === 0 ? T('MyAddressBook') : (collectionListRes.list.find(c => c.id === row.collection_id)?.name || '')
  const platIcon = (row) => platformList.find(p => p.label === row.platform)?.icon

  const appStore = useAppStore()
  const {
    listRes,
    listQuery,
    getList,
    handlerQuery,
    collectionListRes,
    getCollectionList,

    del,

    formVisible,
    platformList,
    formData,
    toEdit,
    toAdd,
    submit,
    tagListRes,
    changeCollectionForUpdate,
    getCollectionListForUpdate,
    collectionListResForUpdate,
    // collectionListQuery,

  } = useRepositories('my')

  onMounted(getCollectionList)
  onMounted(getCollectionListForUpdate)
  onMounted(getList)
  onActivated(getList)

  watch(() => listQuery.page, getList)

  watch(() => listQuery.page_size, handlerQuery)

  const shareToWebClientVisible = ref(false)
  const shareToWebClientForm = reactive({
    id: '',
    hash: '',
  })
  const toShowShare = (row) => {
    shareToWebClientForm.id = row.id
    shareToWebClientForm.hash = row.hash
    shareToWebClientVisible.value = true
  }
  const {
    tagListRes: tagListResForBatchEdit,
    getTagList: getTagListForBatchEdit,
    visible: batchEditTagVisible,
    show: showBatchEditTags,
    formData: batchEditTagsFormData,
    submit: _submitBatchEditTags,
  } = useBatchUpdateTagsRepositories()
  onMounted(getTagListForBatchEdit)
  const submitBatchEditTags = async () => {
    const res = await _submitBatchEditTags().catch(_ => false)
    if (res) {
      getList()
    }
  }

  const multipleSelection = ref([])
  const handleSelectionChange = (val) => {
    multipleSelection.value = val

    batchEditTagsFormData.value.row_ids = val.map(v => v.row_id)
  }


</script>

<style scoped lang="scss">
.lb-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }

.ab-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  min-height: 80px;
}
.ab-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}
.ab-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lift); border-color: var(--glass-border-strong); }

.ab-head { display: flex; align-items: center; gap: 14px; }
.ab-badge {
  width: 46px; height: 46px;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border-radius: 13px;
  background: var(--glass-bg-strong);
  border: 1px solid var(--glass-border);
}
.ab-title { flex: 1; min-width: 0; }
.ab-name { font-weight: 600; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ab-id { font-size: 12px; color: var(--el-text-color-secondary); display: flex; align-items: center; gap: 5px; cursor: pointer; width: fit-content; margin-top: 2px; }
.ab-id:hover { color: var(--accent); }
.copy-ic { font-size: 13px; }

.ab-statusrow { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.ab-ver { font-size: 12px; color: var(--el-text-color-secondary); }
.ab-tags { display: flex; flex-wrap: wrap; gap: 6px; }

.ab-specs { display: flex; flex-direction: column; gap: 10px; border-top: 1px solid var(--glass-border); padding-top: 14px; }
.ab-specs .spec { display: flex; align-items: center; gap: 8px; min-width: 0; font-size: 13px; color: var(--el-text-color-regular); }
.ab-specs .spec .el-icon { font-size: 15px; color: var(--el-text-color-secondary); flex-shrink: 0; }
.ab-specs .spec span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.ab-actions { display: flex; gap: 8px; margin-top: auto; align-items: center; }
.ab-connect { flex: 1; }

.colors {
  display: flex;
  justify-content: center;
  align-items: center;

  .colorbox {
    width: 50px;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;

    .dot {
      width: 10px;
      height: 10px;
      display: block;
      border-radius: 50%;
    }
  }

}

</style>
