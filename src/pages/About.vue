<script setup lang="ts">
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()
</script>

<template>
  <div class="about">
    <h1>ℹ️ 关于</h1>
    <p>当前计数：{{ counter.count }}</p>
    <p class="desc">
      此项目使用 Vue 3 Composition API + Vite 构建，集成了 Vue Router 路由管理 和 Pinia
      状态管理，配合 ESLint + Prettier 保证代码质量。
    </p>

    <div class="tech-stack">
      <span class="tag vue">Vue 3</span>
      <span class="tag vite">Vite</span>
      <span class="tag router">Vue Router</span>
      <span class="tag pinia">Pinia</span>
      <span class="tag eslint">ESLint</span>
      <span class="tag prettier">Prettier</span>
    </div>
  </div>
</template>

<style scoped>
.about {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

h1 {
  font-size: 2.5rem;
}

.desc {
  color: #aaa;
  max-width: 480px;
  text-align: center;
  line-height: 1.6;
}

.tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.tag {
  padding: 0.3rem 0.8rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
}

.tag.vue {
  background: #42b88322;
  color: #42b883;
}
.tag.vite {
  background: #bd34fe22;
  color: #bd34fe;
}
.tag.router {
  background: #ff6b6b22;
  color: #ff6b6b;
}
.tag.pinia {
  background: #ffd93d22;
  color: #ffd93d;
}
.tag.eslint {
  background: #4b32c322;
  color: #4b32c3;
}
.tag.prettier {
  background: #f7ba3e22;
  color: #f7ba3e;
}
</style>
