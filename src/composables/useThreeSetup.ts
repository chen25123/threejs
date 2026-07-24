import { watchEffect, onBeforeUnmount, type Ref } from 'vue'
import * as THREE from 'three'
import { useThreeResize } from './useThreeResize'
import { useThreeLoop } from './useThreeLoop'
import { useThreeCleanup } from './useThreeCleanup'

interface SetupOptions {
  antialias?: boolean
  alpha?: boolean
  fov?: number
  near?: number
  far?: number
}

export function useThreeSetup(containerRef: Ref<HTMLElement | null>, options: SetupOptions = {}) {
  const { antialias = true, alpha = false, fov = 45, near = 0.1, far = 1000 } = options

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(fov, 1, near, far)
  const renderer = new THREE.WebGLRenderer({ antialias, alpha })
  const disposeTracker = useThreeCleanup()

  watchEffect(() => {
    if (containerRef.value) {
      containerRef.value.appendChild(renderer.domElement)
    }
  })

  useThreeResize(camera, renderer, containerRef)
  const { addCallback } = useThreeLoop(scene, camera, renderer)

  onBeforeUnmount(() => {
    disposeTracker.disposeAll()
    renderer.dispose()
    renderer.domElement.remove()
  })

  return { scene, camera, renderer, disposeTracker, addCallback }
}
