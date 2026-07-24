<script setup lang="ts">
import { ref } from 'vue'
import { useThreeSetup } from '@/composables/useThreeSetup'
import { buildScene } from './scene'

const container = ref<HTMLElement | null>(null)

const { scene, camera, disposeTracker, addCallback } = useThreeSetup(container, {
  antialias: true,
})

buildScene({ scene, camera, disposeTracker, addCallback })
</script>

<template>
  <div ref="container" class="demo-canvas"></div>
</template>

<style scoped>
.demo-canvas {
  width: 100%;
  height: 100%;
}
</style>
