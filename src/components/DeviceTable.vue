<template>
  <div class="device-table">
    <div class="dt-toolbar">
      <el-button :type="editCols ? 'primary' : ''" :icon="Setting" size="small" @click="editCols = !editCols">
        {{ editCols ? T('Done') : T('Columns') }}
      </el-button>
    </div>

    <transition name="el-fade-in-linear">
      <div v-if="editCols" class="col-edit-panel">
        <span class="cep-tip">{{ T('ColumnsHint') }}</span>
        <div class="col-add-bar">
          <el-tag v-for="c in hiddenColumns" :key="c.name" class="cab-chip" effect="plain" @click="showCol(c)">
            + {{ colLabel(c) }}
          </el-tag>
          <span v-if="!hiddenColumns.length" class="cab-empty">{{ T('AllColumnsShown') }}</span>
        </div>
      </div>
    </transition>

    <el-table ref="peerTable" :data="list" v-loading="loading" border size="small"
              :row-key="rowKey" @selection-change="v => emit('selection-change', v)">
      <el-table-column v-if="selectable" type="selection" width="45" align="center"/>
      <el-table-column v-for="c in shownColumns" :key="c.name" :prop="c.name" :min-width="colWidth(c)"
                       align="center" show-overflow-tooltip>
        <template #header>
          <span class="col-h" :class="{ editing: editCols }" :data-col="c.name">
            {{ colLabel(c) }}
            <el-icon v-if="editCols" class="col-x" @click.stop="hideCol(c)"><Close/></el-icon>
          </span>
        </template>
        <template #default="{ row }">
          <template v-if="c.name === 'id'">
            {{ row.id }} <el-icon class="copy-ic" @click="copyId(row.id, $event)"><CopyDocument/></el-icon>
          </template>
          <template v-else-if="c.name === 'last_online_time'">
            <div class="last_oline_time">
              <span>{{ row.last_online_time ? timeAgo(row.last_online_time * 1000) : '-' }}</span>
              <span class="dot" :class="{ red: secAgo(row.last_online_time) >= 60, green: secAgo(row.last_online_time) < 60 }"></span>
            </div>
          </template>
          <slot v-else :name="'col-' + c.name" :row="row">{{ row[c.name] || '-' }}</slot>
        </template>
      </el-table-column>

      <el-table-column :label="T('Actions')" align="center" :width="actionsWidth" class-name="table-actions" fixed="right">
        <template #default="{ row }">
          <slot name="actions" :row="row"></slot>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
  import { ref, computed, watch, nextTick, onMounted } from 'vue'
  import { T } from '@/utils/i18n'
  import { timeAgo } from '@/utils/time'
  import { handleClipboard } from '@/utils/clipboard'
  import { Setting, Close, CopyDocument } from '@element-plus/icons'
  import Sortable from 'sortablejs'

  // Единая таблица устройств с настройкой/перетаскиванием колонок.
  // columns: [{name, label, raw?, width?, minWidth?, visible?}]
  const props = defineProps({
    list: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    columns: { type: Array, required: true },
    storageKey: { type: String, required: true },
    selectable: { type: Boolean, default: true },
    rowKey: { type: String, default: 'row_id' },
    actionsWidth: { type: [Number, String], default: 180 },
  })
  const emit = defineEmits(['selection-change'])

  const COL_META = {}
  const defaultColumns = props.columns.map(c => {
    COL_META[c.name] = { label: c.label || c.name, raw: c.raw, width: c.width, minWidth: c.minWidth }
    return { name: c.name, visible: c.visible !== false }
  })

  const loadColumns = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(props.storageKey))
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
  const persistCols = () => localStorage.setItem(props.storageKey, JSON.stringify(visibleColumns.value))
  const hideCol = (c) => { c.visible = false; persistCols() }
  const showCol = (c) => { c.visible = true; persistCols() }
  const secAgo = (t) => (Date.now() / 1000 - t)
  const copyId = (id, e) => handleClipboard(id, e)

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
  onMounted(() => nextTick(initColSortable))
  watch(shownColumns, initColSortable)
</script>

<style scoped lang="scss">
.dt-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

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
  &.red { background-color: red; }
  &.green { background-color: green; }
}
</style>
