import { list as adminList } from '@/api/peer'
import { list as myList } from '@/api/my/peer'

// Обычный пользователь не имеет права на /api/admin/peer/list: middleware
// отвечает code 403, а перехватчик в utils/request.js на 403 стирает токен
// и перезагружает страницу — то есть выбрасывает человека из панели.
export function peerListApi(isAdmin) {
  return isAdmin ? adminList : myList
}
