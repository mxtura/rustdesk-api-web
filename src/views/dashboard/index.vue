<template>
  <div class="dash" v-loading="loading">
    <!-- быстрое подключение -->
    <el-card class="quick-connect" shadow="never">
      <div class="qc-row">
        <el-icon class="qc-ic"><Monitor/></el-icon>
        <el-input v-model="quickId" :placeholder="T('QuickConnectPlaceholder')" class="qc-input" clearable @keyup.enter="doConnect"/>
        <el-button type="primary" :disabled="!quickId" @click="doConnect">{{ T('Connect') }}</el-button>
        <el-popover placement="bottom-end" :width="212" trigger="click" @show="genQr">
          <template #reference>
            <el-button :disabled="!quickId" :icon="Grid">QR</el-button>
          </template>
          <div class="qc-qr">
            <img v-if="qrData" :src="qrData" alt="qr"/>
            <div class="qc-qr-cap">rustdesk://{{ quickId }}</div>
          </div>
        </el-popover>
      </div>
    </el-card>

    <!-- статы -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-ic ic-green">🖥️</div>
        <div class="stat-body">
          <div class="stat-val">{{ onlineCount }}<span class="stat-sub">/ {{ peerTotal }}</span></div>
          <div class="stat-label">{{ T('DevicesOnline') }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-ic ic-blue">👥</div>
        <div class="stat-body">
          <div class="stat-val">{{ userTotal }}</div>
          <div class="stat-label">{{ T('MenuUsers') }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-ic ic-violet">🔗</div>
        <div class="stat-body">
          <div class="stat-val">{{ loginsToday }}</div>
          <div class="stat-label">{{ T('LoginsToday') }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-ic ic-amber">📋</div>
        <div class="stat-body">
          <div class="stat-val">{{ logTotal }}</div>
          <div class="stat-label">{{ T('LoginsTotal') }}</div>
        </div>
      </div>
    </div>

    <div class="dash-row">
      <!-- график активности -->
      <el-card class="dash-chart" shadow="never">
        <div class="card-title">{{ T('LoginActivity14d') }}</div>
        <div class="chart">
          <div v-for="(d, i) in activity" :key="i" class="bar-col" :title="`${d.label}: ${d.count}`">
            <div class="bar" :style="{ height: barH(d.count) + '%' }"></div>
            <div class="bar-x">{{ d.short }}</div>
          </div>
        </div>
      </el-card>

      <!-- последние входы -->
      <el-card class="dash-recent" shadow="never">
        <div class="card-title">{{ T('RecentLogins') }}</div>
        <div v-if="!recent.length" class="recent-empty">—</div>
        <div v-for="(r, i) in recent" :key="i" class="recent-item">
          <span class="ri-dot" :class="r.type === 'oauth' ? 'v' : 'b'"></span>
          <div class="ri-main">
            <div class="ri-user">{{ r.username || r.owner || '—' }}</div>
            <div class="ri-meta">{{ r.type }} · {{ r.ip }}</div>
          </div>
          <div class="ri-time">{{ r.created_at }}</div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, computed } from 'vue'
  import { T } from '@/utils/i18n'
  import { list as peerList } from '@/api/peer'
  import { list as userList } from '@/api/user'
  import { list as loginLogList } from '@/api/login_log'
  import { connectByClient } from '@/utils/peer'
  import { Monitor, Grid } from '@element-plus/icons-vue'
  import QRCode from 'qrcode'

  const quickId = ref('')
  const qrData = ref('')
  const doConnect = () => { if (quickId.value) connectByClient(quickId.value.trim()) }
  const genQr = async () => {
    if (!quickId.value) return
    qrData.value = await QRCode.toDataURL(`rustdesk://${quickId.value.trim()}`, { width: 184, margin: 1 })
  }

  const loading = ref(false)
  const peers = ref([])
  const peerTotal = ref(0)
  const userTotal = ref(0)
  const logTotal = ref(0)
  const logs = ref([])

  const onlineCount = computed(() =>
    peers.value.filter(p => p.last_online_time && (Date.now() - p.last_online_time * 1000) / 1000 < 60).length,
  )

  const pad = (n) => (n < 10 ? '0' + n : '' + n)
  const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

  const loginsToday = computed(() => {
    const t = dayKey(new Date())
    return logs.value.filter(l => (l.created_at || '').startsWith(t)).length
  })

  // активность за 14 дней (из created_at логов)
  const activity = computed(() => {
    const days = []
    const map = {}
    logs.value.forEach(l => {
      const k = (l.created_at || '').slice(0, 10)
      if (k) map[k] = (map[k] || 0) + 1
    })
    // построить 14 дней назад по дате «сегодня» из данных (без Date.now в цикле)
    const base = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(base.getTime() - i * 86400000)
      const k = dayKey(d)
      days.push({
        label: k,
        short: pad(d.getDate()) + '.' + pad(d.getMonth() + 1),
        count: map[k] || 0,
      })
    }
    return days
  })
  const maxCount = computed(() => Math.max(1, ...activity.value.map(d => d.count)))
  const barH = (c) => Math.round((c / maxCount.value) * 100)

  const recent = computed(() => logs.value.slice(0, 8))

  const load = async () => {
    loading.value = true
    const [p, u, l] = await Promise.all([
      peerList({ page: 1, page_size: 1000 }).catch(() => null),
      userList({ page: 1, page_size: 1 }).catch(() => null),
      loginLogList({ page: 1, page_size: 500 }).catch(() => null),
    ])
    if (p) { peers.value = p.data.list || []; peerTotal.value = p.data.total || 0 }
    if (u) { userTotal.value = u.data.total || 0 }
    if (l) { logs.value = l.data.list || []; logTotal.value = l.data.total || 0 }
    loading.value = false
  }
  onMounted(load)
</script>

<style scoped lang="scss">
.dash { display: flex; flex-direction: column; gap: 20px; }

/* быстрое подключение */
.quick-connect :deep(.el-card__body) { padding: 16px 20px; }
.qc-row { display: flex; align-items: center; gap: 12px; }
.qc-ic { font-size: 22px; color: var(--accent); flex-shrink: 0; }
.qc-input { flex: 1; }
.qc-qr { text-align: center; }
.qc-qr img { width: 184px; height: 184px; border-radius: 8px; display: block; }
.qc-qr-cap { font-size: 11px; color: var(--el-text-color-secondary); margin-top: 8px; word-break: break-all; }

/* статы */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: var(--radius-lg);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-soft);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.stat-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lift); }
.stat-ic {
  width: 52px; height: 52px;
  display: flex; align-items: center; justify-content: center;
  font-size: 26px;
  border-radius: 14px;
  flex-shrink: 0;
}
.ic-green { background: rgba(34, 197, 94, 0.15); }
.ic-blue { background: rgba(0, 113, 255, 0.15); }
.ic-violet { background: rgba(124, 92, 255, 0.15); }
.ic-amber { background: rgba(245, 158, 11, 0.15); }
.stat-val { font-size: 28px; font-weight: 700; line-height: 1.1; }
.stat-sub { font-size: 15px; font-weight: 500; color: var(--el-text-color-secondary); margin-left: 4px; }
.stat-label { font-size: 13px; color: var(--el-text-color-secondary); margin-top: 4px; }

/* строка график + последние */
.dash-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}
@media (max-width: 1100px) { .dash-row { grid-template-columns: 1fr; } }

.card-title { font-weight: 600; margin-bottom: 18px; }

/* график */
.chart {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 200px;
}
.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  gap: 6px;
}
.bar {
  width: 100%;
  max-width: 26px;
  min-height: 3px;
  border-radius: 6px 6px 0 0;
  background: var(--accent-grad);
  transition: height 0.3s ease;
}
.bar-x { font-size: 10px; color: var(--el-text-color-secondary); white-space: nowrap; }

/* последние входы */
.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--glass-border);
}
.recent-item:last-child { border-bottom: none; }
.ri-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.ri-dot.b { background: var(--accent); }
.ri-dot.v { background: #7c5cff; }
.ri-main { flex: 1; min-width: 0; }
.ri-user { font-size: 13px; font-weight: 500; }
.ri-meta { font-size: 11px; color: var(--el-text-color-secondary); }
.ri-time { font-size: 11px; color: var(--el-text-color-secondary); white-space: nowrap; }
.recent-empty { color: var(--el-text-color-secondary); text-align: center; padding: 20px; }
</style>
