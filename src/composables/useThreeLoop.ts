import { onBeforeUnmount } from 'vue'
import * as THREE from 'three'

type FrameCallback = () => void

export function useThreeLoop(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer
) {
  let animationId: number | null = null
  const callbacks: FrameCallback[] = []

  function loop(): void {
    animationId = requestAnimationFrame(loop)
    callbacks.forEach((fn) => fn())
    renderer.render(scene, camera)
  }

  loop()

  function addCallback(fn: FrameCallback): () => void {
    callbacks.push(fn)
    return () => {
      const idx = callbacks.indexOf(fn)
      if (idx !== -1) callbacks.splice(idx, 1)
    }
  }

  onBeforeUnmount(() => {
    if (animationId !== null) cancelAnimationFrame(animationId)
    callbacks.length = 0
  })

  return { addCallback }
}
