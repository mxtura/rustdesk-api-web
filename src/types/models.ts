// Доменные типы RustDesk-панели. Расширяются по мере миграции на TypeScript.

/** Единый конверт ответа API (см. utils/request). */
export interface ApiResponse<T = unknown> {
  code: number
  msg?: string
  message?: string
  data: T
}

/** Пагинированный список. */
export interface PageResult<T> {
  total: number
  list: T[]
}

/** Устройство (пир). */
export interface Peer {
  row_id: number
  id: string
  cpu?: string
  hostname?: string
  memory?: string
  os?: string
  username?: string
  uuid?: string
  version?: string
  alias?: string
  mac?: string
  last_online_time?: number
  last_online_ip?: string
  group_id?: number
  created_at?: string
  updated_at?: string
  // онлайн-статус адресной книги подмешивается отдельно
  peer?: { last_online_time?: number; last_online_ip?: string; version?: string }
}

/** Пользователь панели. */
export interface User {
  id: number
  username: string
  email?: string
  nickname?: string
  is_admin?: boolean
  status?: number
  group_id?: number
  remark?: string
  route_names?: string[]
  created_at?: string
}

/** Запись адресной книги. */
export interface AddressBookPeer {
  id: string
  username?: string
  hostname?: string
  alias?: string
  platform?: string
  tags?: string[]
  hash?: string
  peer?: Peer['peer']
}

/** Описание колонки для DeviceTable. */
export interface ColumnDef {
  name: string
  label?: string
  raw?: boolean
  width?: number
  minWidth?: number
  visible?: boolean
}
