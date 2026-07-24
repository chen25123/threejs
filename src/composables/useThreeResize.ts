import { onBeforeUnmount, type Ref } from 'vue'
import * as THREE from 'three'

export function useThreeResize(
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  containerRef: Ref<HTMLElement | null>
): void {
  function onResize() {
    if (!containerRef.value) return
    const { clientWidth, clientHeight } = containerRef.value
    camera.aspect = clientWidth / clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(clientWidth, clientHeight, false)
  }

  window.addEventListener('resize', onResize, { passive: true })
  onResize()

  onBeforeUnmount(() => window.removeEventListener('resize', onResize))
}
