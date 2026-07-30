// 游泳池
import { onBeforeUnmount } from 'vue'
import * as THREE from 'three'

export function poolModel(scene: THREE.Scene) {
  let waterNum = 100
  const r = 2
  const scene1 = scene

  function renderPoolBoard() {
    // 绘制泳池边缘
  }

  function renderPoolbtm() {
    // 绘制池底
    const btm = new THREE.CircleGeometry(1, 32)
    const material = new THREE.MeshStandardMaterial({ color: 0x6697fc })
    const poolbtm = new THREE.Mesh(btm, material)
    poolbtm.position.set(0, -1, 0)
    poolbtm.rotation.x = -Math.PI / 2
    scene1.add(poolbtm)
  }

  function initPool() {
    renderPoolbtm()
  }
  return { initPool }
}
