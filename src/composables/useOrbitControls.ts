import { onBeforeUnmount } from 'vue'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import * as THREE from 'three'

export function useOrbitControls(
  camera: THREE.PerspectiveCamera,
  renderDomElement: HTMLCanvasElement | null
) {
  const controlsExp = new OrbitControls(camera, renderDomElement)
  controlsExp.enableDamping = true
  controlsExp.dampingFactor = 0.8

  onBeforeUnmount(() => {
    controlsExp.dispose()
  })
  return { controlsExp }
}
