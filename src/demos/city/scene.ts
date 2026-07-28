import * as THREE from 'three'
import { boardModel } from './modelFile/board'
import { caoModel } from './modelFile/cao'

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
  // // 空间坐标系辅助线
  // const axes = new THREE.AxesHelper(10) // 20 单位长，覆盖你 40x40 地皮的一半
  // scene.add(axes)
  // disposeTracker.track(axes)
  // 地面网格辅助线
  const helperLine = new THREE.GridHelper(20, 20, 0x444444, 0x333333)
  scene.add(helperLine)
  disposeTracker.track(helperLine)
  // ---- 自然光：环境光 + 半球光（天空蓝 / 地面棕） ----
  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)
  disposeTracker.track(ambient)

  const hemi = new THREE.HemisphereLight(0x87ceeb, 0x362907, 0.5)
  scene.add(hemi)
  disposeTracker.track(hemi)

  // 创建地板
  const { createBoard } = boardModel()
  const boardMesh = createBoard(20, 20, 20, 20)
  scene.add(boardMesh)

  // 调用草模块
  caoModel().initCao(scene)

  // ---- 相机位置 ----
  camera.position.set(0, 0.5, 6)
  camera.lookAt(0, 0, 0)
}
