<template>
  <el-dialog v-model="open" :show-close="false" width="560" top="12vh" append-to-body class="cmdk-dialog">
    <el-input
        ref="inp"
        v-model="q"
        :placeholder="T('SearchPlaceholder')"
        :prefix-icon="Search"
        size="large"
        clearable
        @keyup.enter="enter"
    />
    <div class="cmdk-list">
      <template v-if="q">
        <div v-if="!results.length" class="cmdk-empty">{{ T('NothingFound') }}</div>
        <div v-for="p in results" :key="p.id" class="cmdk-item" @click="go(p)">
          <span class="ci-os">{{ osIcon(p.os) }}</span>
          <div class="ci-main">
            <div class="ci-h">{{ p.alias || p.hostname || '—' }}</div>
            <div class="ci-id">{{ p.id }} · {{ p.username || '—' }}</div>
          </div>
          <el-icon class="ci-star" :class="{ on: isFav(p.id) }" @click.stop="toggleFav(p)"><StarFilled/></el-icon>
        </div>
      </template>
      <template v-else>
        <template v-if="favPeers.length">
          <div class="cmdk-sec">★ {{ T('Favorites') }}</div>
          <div v-for="p in favPeers" :key="'f' + p.id" class="cmdk-item" @click="go(p)">
            <span class="ci-os">{{ osIcon(p.os) }}</span>
            <div class="ci-main">
              <div class="ci-h">{{ p.alias || p.hostname || '—' }}</div>
              <div class="ci-id">{{ p.id }}</div>
            </div>
            <el-icon class="ci-star on" @click.stop="toggleFav(p)"><StarFilled/></el-icon>
          </div>
        </template>
        <template v-if="recent.length">
          <div class="cmdk-sec">{{ T('Recent') }}</div>
          <div v-for="p in recent" :key="'r' + p.id" class="cmdk-item" @click="go(p)">
            <span class="ci-os">{{ osIcon(p.os) }}</span>
            <div class="ci-main">
              <div class="ci-h">{{ p.hostname || '—' }}</div>
              <div class="ci-id">{{ p.id }}</div>
            </div>
          </div>
        </template>
        <div v-if="!favPeers.length && !recent.length" class="cmdk-empty">{{ T('SearchStart') }}</div>
      </template>
    </div>
    <div class="cmdk-foot">
      <span><kbd>Enter</kbd> {{ T('KbdConnect') }}</span>
      <span><kbd>Esc</kbd> {{ T('KbdClose') }}</span>
      <span><kbd>Ctrl</kbd>+<kbd>K</kbd> {{ T('KbdOpen') }}</span>
    </div>
  </el-dialog>
</template>

<script setup>
  import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
  import { Search, StarFilled } from '@element-plus/icons-vue'
  import { T } from '@/utils/i18n'
  import { list as peerList } from '@/api/peer'
  import { connectByClient } from '@/utils/peer'

  const open = ref(false)
  const q = ref('')
  const inp = ref(null)
  const peers = ref([])
  const favIds = ref(JSON.parse(localStorage.getItem('peer_favorites') || '[]'))
  const recent = ref(JSON.parse(localStorage.getItem('peer_recent') || '[]'))

  const osIcon = (os) => {
    const s = (os || '').toLowerCase()
    if (s.includes('win')) return '🪟'
    if (s.includes('mac') || s.includes('ios') || s.includes('darwin')) return '🍎'
    if (s.includes('android')) return '🤖'
    if (s.includes('linux')) return '🐧'
    return '🖥️'
  }

  const results = computed(() => {
    const s = q.value.trim().toLowerCase()
    if (!s) return []
    return peers.value.filter(p =>
      String(p.id).includes(s) ||
      (p.hostname || '').toLowerCase().includes(s) ||
      (p.alias || '').toLowerCase().includes(s) ||
      (p.username || '').toLowerCase().includes(s),
    ).slice(0, 8)
  })
  const favPeers = computed(() => peers.value.filter(p => favIds.value.includes(p.id)))
  const isFav = (id) => favIds.value.includes(id)
  const toggleFav = (p) => {
    const i = favIds.value.indexOf(p.id)
    if (i >= 0) favIds.value.splice(i, 1)
    else favIds.value.push(p.id)
    localStorage.setItem('peer_favorites', JSON.stringify(favIds.value))
  }

  const loadPeers = async () => {
    const res = await peerList({ page: 1, page_size: 1000 }).catch(() => null)
    if (res) peers.value = res.data.list || []
  }

  const go = (p) => {
    // записать в недавние
    const r = recent.value.filter(x => x.id !== p.id)
    r.unshift({ id: p.id, hostname: p.hostname || p.alias || '' })
    recent.value = r.slice(0, 6)
    localStorage.setItem('peer_recent', JSON.stringify(recent.value))
    connectByClient(p.id)
    open.value = false
  }
  const enter = () => {
    if (results.value.length) go(results.value[0])
    else if (q.value.trim()) { connectByClient(q.value.trim()); open.value = false }
  }

  const onKey = (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault()
      open.value = !open.value
      if (open.value) {
        q.value = ''
        loadPeers()
        nextTick(() => inp.value?.focus())
      }
    }
  }
  onMounted(() => window.addEventListener('keydown', onKey))
  onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped lang="scss">
.cmdk-list { margin-top: 12px; max-height: 52vh; overflow-y: auto; }
.cmdk-sec {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--el-text-color-secondary);
  padding: 10px 8px 4px;
}
.cmdk-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.12s ease;
}
.cmdk-item:hover { background: var(--el-color-primary-light-9); }
.ci-os { font-size: 22px; }
.ci-main { flex: 1; min-width: 0; }
.ci-h { font-size: 14px; font-weight: 500; }
.ci-id { font-size: 12px; color: var(--el-text-color-secondary); }
.ci-star { color: var(--el-text-color-placeholder); font-size: 16px; }
.ci-star:hover { color: #f5a623; }
.ci-star.on { color: #f5a623; }
.cmdk-empty { text-align: center; color: var(--el-text-color-secondary); padding: 28px; }
.cmdk-foot {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--glass-border);
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
kbd {
  background: var(--glass-bg-strong);
  border: 1px solid var(--glass-border);
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 10px;
}
</style>
