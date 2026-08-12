export const connectByClient = id => {
  //不新开窗口打开url protocol ,格式是 rustdesk://<id>
  // window.open(`rustdesk://${row.id}`)
  let a = document.createElement('a')
  a.href = `rustdesk://${id}`
  a.target = '_self'
  a.click()
}

// Единый источник признаков устройства: иконка системы, признак «онлайн»
// и ключ запроса для списков. Раньше это было скопировано в пять файлов
// и разъезжалось (GSearch, DeviceCard, DeviceTable, peer/index, dashboard).

export const ONLINE_WINDOW_MS = 60_000

export function osIcon(os) {
  const s = (os || '').toLowerCase()
  // mac/ios/darwin — раньше проверки, иначе "darwin" ловится проверкой на "win"
  if (s.includes('mac') || s.includes('ios') || s.includes('darwin')) return '🍎'
  if (s.includes('win')) return '🪟'
  if (s.includes('android')) return '🤖'
  if (s.includes('linux') || s.includes('ubuntu') || s.includes('debian') || s.includes('fedora')) return '🐧'
  return '🖥️'
}

export function isPeerOnline(lastOnlineTime, now = Date.now()) {
  if (!lastOnlineTime) return false
  return now - lastOnlineTime * 1000 < ONLINE_WINDOW_MS
}

export function peersQueryKey(prefix, q) {
  return [prefix, q.page, q.page_size, q.id || '', q.hostname || '', q.time_ago ?? 0, q.user_id ?? 0]
}
