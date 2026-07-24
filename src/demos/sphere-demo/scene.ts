import * as THREE from 'three'

interface SceneContext {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  disposeTracker: ReturnType<typeof import('@/composables/useThreeCleanup').useThreeCleanup>
  addCallback: (fn: () => void) => () => void
}

/**
 * 最简场景：一个球体 + 环境光 + 半球光（模拟自然天光）
 */
export function buildScene({ scene, camera, disposeTracker, addCallback }: SceneContext) {
  // ---- 自然光：环境光 + 半球光（天空蓝 / 地面棕） ----
  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)
  disposeTracker.track(ambient)

  const hemi = new THREE.HemisphereLight(0x87ceeb, 0x362907, 0.5)
  scene.add(hemi)
  disposeTracker.track(hemi)

  // ---- 球体 ----
  const geometry = new THREE.SphereGeometry(1.5, 64, 64)
  const material = new THREE.MeshStandardMaterial({
    color: 0x42b883,
    roughness: 0.3,
    metalness: 0.1,
  })
  const sphere = new THREE.Mesh(geometry, material)
  scene.add(sphere)
  disposeTracker.track(geometry)
  disposeTracker.track(material)

  // ---- 相机位置 ----
  camera.position.set(0, 0.5, 6)
  camera.lookAt(0, 0, 0)

  // ---- 自转动画 ----
  addCallback(() => {
    sphere.rotation.y += 0.005
    sphere.rotation.x += 0.002
  })

  return { sphere }
}
