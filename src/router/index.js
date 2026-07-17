import { createRouter, createWebHashHistory } from 'vue-router'

const constantRoutes = [
  {
    path: '/login',
    name: 'Login',
    meta: { title: 'Login' },
    component: () => import('@/views/login/login.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    meta: { title: 'Register' },
    component: () => import('@/views/register/index.vue'),
  },
  {
    path: '/404',
    component: () => import('@/views/error-page/404.vue'),
    hidden: true,
  },
  {
    path: '/oauth/:code',
    meta: { title: 'OauthLogin' },
    component: () => import('@/views/oauth/login.vue'),
    hidden: true,
  },
  {
    path: '/oauth/bind/:code',
    meta: { title: 'OauthBind' },
    component: () => import('@/views/oauth/bind.vue'),
    hidden: true,
  },
]
export const asyncRoutes = [
  {
    path: '/g-dash',
    name: 'DashboardGroup',
    redirect: '/dashboard',
    meta: { title: 'Dashboard', icon: 'Odometer' },
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        meta: { title: 'Dashboard', icon: 'Odometer' },
        component: () => import('@/views/dashboard/index.vue'),
      },
    ],
  },
  // {
  //   path: '/',
  //   name: 'Index',
  //   redirect: '/Home',
  //   meta: { title: '首页', icon: 'house' },
  //   component: () => import('@/layout/index.vue'),
  //   children: [
  //     {
  //       path: '/Home',
  //       name: 'Home',
  //       meta: { title: '首页', icon: 'house' },
  //       component: () => import('@/views/index/index.vue'),
  //     },
  //
  //   ],
  // },
  {
    path: '/my',
    name: 'My',
    redirect: '/',
    meta: { title: 'My', icon: 'UserFilled' },
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: '/',
        name: 'MyInfo',
        meta: { title: 'Userinfo', icon: 'User', hide: true /*keepAlive: true*/ },
        component: () => import('@/views/my/info.vue'),
      },
      {
        path: 'peer',
        name: 'MyPeer',
        meta: { title: 'MyPeer', icon: 'Monitor' /*keepAlive: true*/ },
        component: () => import('@/views/my/peer/index.vue'),
      },
      {
        path: 'address_book_collection',
        name: 'MyAddressBookCollection',
        meta: { title: 'AddressBookName', icon: 'Collection', hide: true },
        component: () => import('@/views/my/address_book/collection.vue'),
      },
      {
        path: 'address_book',
        name: 'MyAddressBookList',
        meta: { title: 'AddressBook', icon: 'Notebook' },
        component: () => import('@/views/my/address_book/index.vue'),
      },
      {
        path: 'tag',
        name: 'MyTagList',
        meta: { title: 'Tags', icon: 'CollectionTag', hide: true },
        component: () => import('@/views/my/tag/index.vue'),
      },
      {
        path: 'shareRecord',
        name: 'MyShareRecordList',
        meta: { title: 'ShareRecord', icon: 'Share' /*keepAlive: true*/ },
        component: () => import('@/views/my/share_record/index.vue'),
      },
      {
        path: 'loginLog',
        name: 'MyLoginLog',
        meta: { title: 'LoginLog', icon: 'List' /*keepAlive: true*/ },
        component: () => import('@/views/my/login_log/index.vue'),
      },
    ],
  },
  // ===== Устройства =====
  {
    path: '/g-devices',
    name: 'GroupDevices',
    redirect: '/user/peer',
    meta: { title: 'MenuDevices', icon: 'Monitor' },
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: '/user/peer',
        name: 'Peer',
        meta: { title: 'PeerManage', icon: 'Monitor' },
        component: () => import('@/views/peer/index.vue'),
      },
      {
        path: '/user/group',
        name: 'UserGroup',
        meta: { title: 'GroupManage', icon: 'ChatRound' },
        component: () => import('@/views/group/index.vue'),
      },
      {
        path: '/user/deviceGroup',
        name: 'DeviceGroup',
        meta: { title: 'DeviceGroupManage', icon: 'Grid' },
        component: () => import('@/views/group/deviceGroupList.vue'),
      },
    ],
  },
  // ===== Адресная книга =====
  {
    path: '/g-addrbook',
    name: 'GroupAddrBook',
    redirect: '/user/addressBook',
    meta: { title: 'MenuAddressBook', icon: 'Notebook', hide: true },
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: '/user/addressBookName',
        name: 'UserAddressBookName',
        meta: { title: 'AddressBookNameManage', icon: 'Collection', hide: true },
        component: () => import('@/views/address_book/collection.vue'),
      },
      {
        path: '/user/addressBook',
        name: 'UserAddressBook',
        meta: { title: 'AddressBookManage', icon: 'Notebook', hide: true },
        component: () => import('@/views/address_book/index.vue'),
      },
      {
        path: '/user/tag',
        name: 'UserTag',
        meta: { title: 'TagsManage', icon: 'CollectionTag', hide: true },
        component: () => import('@/views/tag/index.vue'),
      },
    ],
  },
  // ===== Пользователи и доступ =====
  {
    path: '/g-users',
    name: 'GroupUsers',
    redirect: '/user/index',
    meta: { title: 'MenuUsers', icon: 'User' },
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: '/user/index',
        name: 'UserList',
        meta: { title: 'UserManage', icon: 'User' },
        component: () => import('@/views/user/index.vue'),
      },
      {
        path: '/user/add',
        name: 'UserAdd',
        meta: { title: 'UserAdd', hide: true },
        component: () => import('@/views/user/edit.vue'),
      },
      {
        path: '/user/edit/:id',
        name: 'UserEdit',
        meta: { title: 'UserEdit', hide: true },
        component: () => import('@/views/user/edit.vue'),
      },
      {
        path: '/oauth',
        name: 'Oauth',
        meta: { title: 'OauthManage', icon: 'Link' },
        component: () => import('@/views/oauth/index.vue'),
      },
      {
        path: '/userToken',
        name: 'UserToken',
        meta: { title: 'UserToken', icon: 'Ticket' },
        component: () => import('@/views/user/token.vue'),
      },
    ],
  },
  // ===== Логи и аудит =====
  {
    path: '/g-logs',
    name: 'GroupLogs',
    redirect: '/loginLog',
    meta: { title: 'MenuLogs', icon: 'Tickets' },
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: '/loginLog',
        name: 'LoginLog',
        meta: { title: 'LoginLog', icon: 'List' },
        component: () => import('@/views/login/log.vue'),
      },
      {
        path: '/auditConn',
        name: 'AuditConn',
        meta: { title: 'AuditConnLog', icon: 'Tickets' },
        component: () => import('@/views/audit/connList.vue'),
      },
      {
        path: '/auditFile',
        name: 'AuditFile',
        meta: { title: 'AuditFileLog', icon: 'Files' },
        component: () => import('@/views/audit/fileList.vue'),
      },
      {
        path: '/shareRecord',
        name: 'ShareRecord',
        meta: { title: 'ShareRecord', icon: 'Share' },
        component: () => import('@/views/share_record/index.vue'),
      },
    ],
  },
  // ===== Сервер =====
  {
    path: '/g-server',
    name: 'GroupServer',
    redirect: '/serverCmd',
    meta: { title: 'MenuServer', icon: 'Tools' },
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: '/serverCmd',
        name: 'ServerCmd',
        meta: { title: 'ServerCmd', icon: 'Tools' },
        component: () => import('@/views/rustdesk/control.vue'),
      },
    ],
  },
]
export const lastRoutes = [
  { path: '/:catchAll(.*)', redirect: '/404', meta: { hide: true } },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes,
})

