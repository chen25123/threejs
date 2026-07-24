<script setup lang="ts">
import SideTree from '@/components/SideTree.vue'
</script>

<template>
  <div class="layout">
    <!-- 顶部：预留空白 -->
    <header class="layout-top"></header>

    <!-- 下部：左树 + 右内容 -->
    <div class="layout-bottom">
      <aside class="layout-left">
        <SideTree />
      </aside>
      <main class="layout-right">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-top {
  height: 48px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: #16213e;
}

.layout-bottom {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.layout-left {
  width: 260px;
  flex-shrink: 0;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  background: #0f3460;
  overflow-y: auto;
}

.layout-right {
  flex: 1;
  overflow-y: auto;
  background: #1a1a2e;
  padding: 2rem;
}
</style>
