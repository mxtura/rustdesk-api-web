<template>
  <div class="peer-card" :class="{ online: isOnline, selected }">
    <el-checkbox v-if="selectable" class="pc-check" :model-value="selected" @change="v => emit('toggle', v)" @click.stop/>
    <div class="pc-head">
      <div class="pc-osbadge" :class="{ on: isOnline }">{{ osIcon }}</div>
      <div class="pc-title">
        <div class="pc-host" :title="row.alias || row.hostname">{{ row.alias || row.hostname || '—' }}</div>
        <div class="pc-id" @click="copyId">
          {{ row.id }} <el-icon class="copy-ic"><CopyDocument/></el-icon>
        </div>
      </div>
    </div>

    <div class="pc-statusrow">
      <span class="pc-badge" :class="isOnline ? 'on' : 'off'">
        <i class="bd"></i>{{ isOnline ? T('Online') : (row.last_online_time ? timeAgo(row.last_online_time * 1000) : T('Offline')) }}
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
      <slot name="actions" :row="row" :online="isOnline"></slot>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { T } from '@/utils/i18n'
  import { timeAgo } from '@/utils/time'
  import { handleClipboard } from '@/utils/clipboard'
  import { CopyDocument, Cpu, Coin, Monitor, Connection } from '@element-plus/icons'

  // Единая карточка устройства для страниц пиров (админ и личные).
  const props = defineProps({
    row: { type: Object, required: true },
    selectable: { type: Boolean, default: false },
    selected: { type: Boolean, default: false },
  })
  const emit = defineEmits(['toggle'])

  const isOnline = computed(() =>
    !!props.row.last_online_time && (Date.now() / 1000 - props.row.last_online_time) < 60,
  )
  const osIcon = computed(() => {
    const s = (props.row.os || '').toLowerCase()
    if (s.includes('win')) return '🪟'
    if (s.includes('mac') || s.includes('ios') || s.includes('darwin')) return '🍎'
    if (s.includes('android')) return '🤖'
    if (s.includes('linux')) return '🐧'
    return '🖥️'
  })
  const copyId = (e) => handleClipboard(props.row.id, e)
</script>

<style scoped lang="scss">
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

.pc-check {
  position: absolute;
  top: 12px; right: 12px;
  opacity: 0;
  transition: opacity 0.15s ease;
  z-index: 2;
}
.peer-card:hover .pc-check,
.peer-card.selected .pc-check { opacity: 1; }

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

.pc-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  align-items: center;
}
/* стили для кнопок, приходящих из слота (действия задаёт страница) */
:slotted(.pc-connect) { flex: 1; }
:slotted(.pc-more) { margin-left: 0; }
</style>
