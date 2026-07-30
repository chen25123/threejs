// 实现四周栏杆
import { onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { setUv } from '@/utils/tools'

export function fanceBus() {
  let canvascTX: THREE.CanvasTexture<HTMLCanvasElement>

  function createCanvasCtx() {
    // 创建canvas纹理
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    // 设置canvas透明背景
    ctx!.clearRect(0, 0, 64, 64)
    // 绘制十字栏杆
    ctx!.fillStyle = '#333333'
    const boardWidth = 6
    ctx!.fillRect(9, 0, boardWidth, 64)
    ctx!.fillRect(42, 0, boardWidth, 64)
    ctx!.fillRect(0, 10, 64, boardWidth)
    // 开始创建贴图
    canvascTX = new THREE.CanvasTexture(canvas)
    canvascTX.wrapS = THREE.RepeatWrapping
    canvascTX.wrapT = THREE.RepeatWrapping
  }

  function initFance(scene: THREE.Scene) {
    // 创建围栏
    if (!canvascTX) {
      createCanvasCtx() // 不存在canvas纹理则创建
    }
    const material = new THREE.MeshStandardMaterial({
      map: canvascTX,
      side: THREE.DoubleSide,
      alphaTest: 0.5,
    })
    const geometry1 = new THREE.PlaneGeometry(20, 1)
    setUv(geometry1, 20, 1) // 设置uv
    const fance1 = new THREE.Mesh(geometry1, material)
    fance1.rotation.y = -Math.PI / 2
    fance1.position.set(-10, 0.5, 0)
    scene.add(fance1)

    const fance2 = new THREE.Mesh(geometry1, material)
    fance2.position.set(0, 0.5, -10)
    scene.add(fance2)
    const fance3 = new THREE.Mesh(geometry1, material)
    fance3.position.set(10, 0.5, 0)
    fance3.rotation.y = Math.PI / 2
    scene.add(fance3)
    const geometry2 = new THREE.PlaneGeometry(9.5, 1)
    setUv(geometry2, 9.5, 1)
    const fance4 = new THREE.Mesh(geometry2, material)
    fance4.position.set(-5.25, 0.5, 10)
    scene.add(fance4)
    const fance5 = new THREE.Mesh(geometry2, material)
    fance5.position.set(5.25, 0.5, 10)
    scene.add(fance5)
  }

  onBeforeUnmount(() => {
    canvascTX.dispose()
  })

  return { initFance }
}
