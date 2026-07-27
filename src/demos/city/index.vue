<script setup lang="ts">
import { ref } from 'vue'
import { useThreeSetup } from '@/composables/useThreeSetup'
import { useOrbitControls } from '@/composables/useOrbitControls'
import { buildScene } from './scene'

const container = ref<HTMLElement | null>(null)

const { scene, camera, renderer, disposeTracker, addCallback } = useThreeSetup(container, {
  antialias: true,
})

const { controlsExp } = useOrbitControls(camera, renderer.domElement)
addCallback(() => {
  controlsExp.update()
})

buildScene({ scene, camera, disposeTracker, addCallback })
</script>

<template>
  <div class="city-view">
    <div id="city_three_box1" ref="container" class="city-three-box"></div>
  </div>
</template>

<style scoped>
.city-view {
  width: 100%;
  height: 100%;
  .city-three-box {
    width: 100%;
    height: 100%;
  }
}
</style>
