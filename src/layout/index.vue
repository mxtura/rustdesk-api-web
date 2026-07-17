<template>
  <el-config-provider :locale="appStore.setting.locale.value">
    <el-container :style="{'--sideBarWidth': sideBarWidth}">
      <el-aside :width="leftWidth" class="app-left">
        <g-aside></g-aside>
      </el-aside>
      <el-container class="app-container ">
        <el-header class="app-header">
          <g-header></g-header>
        </el-header>

        <el-main class="app-main">
          <router-view v-slot="{ Component }">
            <transition mode="out-in" name="el-fade-in-linear">
              <component :is="Component"/>
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
    <g-search></g-search>
  </el-config-provider>
</template>

<script setup>
  import { useAppStore } from '@/store/app'
  import { ref, computed } from 'vue'
  import GAside from '@/layout/components/aside.vue'
  import GHeader from '@/layout/components/header.vue'
  import GSearch from '@/components/GSearch.vue'

  const appStore = useAppStore()
  const sideBarWidth = computed(() => appStore.setting.locale.sideBarWidth)
  const leftWidth = computed(() => appStore.setting.sideIsCollapse ? '64px' : 'var(--sideBarWidth)')
</script>

<style lang="scss" scoped>
.app-header {
  color: var(--el-text-color-primary);
  display: flex;
  height: 56px;
}

.app-left {
  transition: width 0.5s;
}

.app-container {
  min-height: 100vh;
}

.app-main {
  padding: 20px;
}
</style>
