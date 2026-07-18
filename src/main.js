import { createApp } from 'vue'
import 'element-plus/dist/index.css'
import App from './App.vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { router } from '@/router'
import 'normalize.css/normalize.css'
import { pinia } from '@/store'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { i18n } from '@/utils/i18n'
import '@/permission'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@/styles/style.scss'
import * as ElementIcons from '@element-plus/icons-vue'

// Тема по умолчанию — тёмная (glass premium). vueuse хранит выбор в localStorage.
if (!localStorage.getItem('vueuse-color-scheme')) {
  localStorage.setItem('vueuse-color-scheme', 'dark')
}
if (localStorage.getItem('vueuse-color-scheme') === 'dark') {
  document.documentElement.classList.add('dark')
}

const app = createApp(App)
app.use(ElementPlus, { locale: zhCn })
app.use(pinia)
app.use(i18n)
app.use(router)
app.use(VueQueryPlugin, {
  queryClientConfig: {
    defaultOptions: {
      queries: { refetchOnWindowFocus: false, staleTime: 10_000, retry: 1 },
    },
  },
})
for (let icon in ElementIcons){
  app.component("ElIcon" +icon ,ElementIcons[icon])
}
app.mount('#app')
