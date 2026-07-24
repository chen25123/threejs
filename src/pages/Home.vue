<script setup>
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()
</script>

<template>
  <div class="home">
    <h1>🏠 首页</h1>
    <p>Vue 3 + Vite + Vue Router + Pinia</p>

    <div class="counter-card">
      <p class="count">{{ counter.count }}</p>
      <p class="double">翻倍值：{{ counter.double }}</p>
      <div class="btn-group">
        <button @click="counter.increment()">+</button>
        <button @click="counter.decrement()">-</button>
        <button class="reset" @click="counter.reset()">重置</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

h1 {
  font-size: 2.5rem;
}

p {
  color: #aaa;
  font-size: 1.1rem;
}

.counter-card {
  background: #16213e;
  border-radius: 12px;
  padding: 2rem 3rem;
  text-align: center;
}

.count {
  font-size: 3rem;
  font-weight: bold;
  color: #42b883;
}

.double {
  color: #888;
  margin-bottom: 1.5rem;
}

.btn-group {
  display: flex;
  gap: 0.75rem;
}

button {
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 8px;
  background: #42b883;
  color: #fff;
  font-size: 1.25rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

button:hover {
  opacity: 0.8;
}

button.reset {
  width: auto;
  padding: 0 1.25rem;
  background: #e94560;
  font-size: 0.95rem;
}
</style>
