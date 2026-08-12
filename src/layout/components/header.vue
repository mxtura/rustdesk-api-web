<template>
  <el-icon class="ex-icon" @click="expandOrFoldSlider">
    <el-icon-expand v-if="setting.sideIsCollapse"></el-icon-expand>
    <el-icon-fold v-else></el-icon-fold>
  </el-icon>
  <div class="header-logo">
    <img :src="setting.logo" alt="" class="logo" />
    <div class="title">{{ title }}</div>
  </div>
  <Setting></Setting>
</template>

<script>
  import { defineComponent, computed } from 'vue'
  import Setting from '@/layout/components/setting/index.vue'
  import { useAppStore } from '@/store/app'

  export default defineComponent({
    name: 'LayerHeader',
    components: { Setting },
    setup() {
      const appStore = useAppStore()
      const setting = computed(() => appStore.setting)
      // название панели из настроек сервера (/admin-config), с запасным вариантом
      const title = computed(() => appStore.setting.title || 'RustDesk')
      const expandOrFoldSlider = () => {
        appStore.sideCollapse()
      }
      return {
        setting,
        title,
        expandOrFoldSlider,
      }
    },
    watch: {},
    created() {},
  })
</script>

<style scoped lang="scss">
  .ex-icon {
    height: 100%;
    display: flex;
    align-items: center;
    margin-right: 10px;
    font-size: 16px;
    cursor: pointer;
  }

  .header-logo {
    display: flex;
    height: 100%;
    align-items: center;

    .title {
      display: block;
      margin-left: 10px;
    }

    .logo {
      display: block;
      width: 30px;
      height: 30px;
    }
  }
</style>
<style lang="scss"></style>
