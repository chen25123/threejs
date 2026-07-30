import { onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import grassImg from '@/assets/green/grass.jpg'
// 添加草的纹理
const textLoader = new THREE.TextureLoader()
const ad = textLoader.load(grassImg)
ad.colorSpace = THREE.SRGBColorSpace
ad.wrapS = THREE.RepeatWrapping
ad.wrapT = THREE.RepeatWrapping

/**
 * 使用 Shape 创建圆角矩形，可指定四角是否圆角
 * 顺时针描边：起点(左上角) → 顶边 → 右上角 → 右边 → 右下角 → 底边 → 左下角 → 左边 → 回到起点
 *
 * @param w  矩形总宽
 * @param h  矩形总高
 * @param r  圆角半径
 * @param corners  四角圆角开关
 */
function createRoundedRectShape(
  w: number,
  h: number,
  r: number,
  corners: ConersConfig
): THREE.Shape {
  const shape = new THREE.Shape()
  const hw = w / 2
  const hh = h / 2

  // 起点：左上角 → 沿顶边向右出发
  if (corners.topLeft) {
    shape.moveTo(-hw + r, hh)
  } else {
    shape.moveTo(-hw, hh)
  }

  // ① 顶边 → 右上角
  if (corners.topRight) {
    shape.lineTo(hw - r, hh)
    // 圆心 (hw-r, hh-r)，弧从 ↑(π/2) 顺时针画到 →(0)
    shape.absarc(hw - r, hh - r, r, Math.PI / 2, 0, true)
  } else {
    shape.lineTo(hw, hh)
  }

  // ② 右边 → 右下角
  if (corners.bottomRight) {
    shape.lineTo(hw, -hh + r)
    // 圆心 (hw-r, -hh+r)，弧从 →(0) 顺时针画到 ↓(-π/2)
    shape.absarc(hw - r, -hh + r, r, 0, -Math.PI / 2, true)
  } else {
    shape.lineTo(hw, -hh)
  }

  // ③ 底边 → 左下角
  if (corners.bottomLeft) {
    shape.lineTo(-hw + r, -hh)
    // 圆心 (-hw+r, -hh+r)，弧从 ↓(-π/2) 顺时针画到 ←(π)
    shape.absarc(-hw + r, -hh + r, r, -Math.PI / 2, Math.PI, true)
  } else {
    shape.lineTo(-hw, -hh)
  }

  // ④ 左边 → 回到起点（左上角闭合）
  if (corners.topLeft) {
    shape.lineTo(-hw, hh - r)
    // 圆心 (-hw+r, hh-r)，弧从 ←(π) 顺时针画到 ↑(π/2)，接回起点
    shape.absarc(-hw + r, hh - r, r, Math.PI, Math.PI / 2, true)
  } else {
    shape.lineTo(-hw, hh)
  }

  return shape
}

export function caoModel() {
  function createCaoByPoint(
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    corners: ConersConfig
  ) {
    // if (!corners.r || corners.r < 0) {
    //   planCao = new THREE.PlaneGeometry(width, height)
    //   const uv = planCao.attributes.uv
    //   for (let i = 0; i < uv.count; i++) {
    //     uv.setXY(i, uv.getX(i) * width, uv.getY(i) * height)
    //   }
    // } else {
    // 1/8 圆：圆角半径 = 短边的 1/8
    const radius = Math.min(width, height) / corners.r
    const shape = createRoundedRectShape(width, height, radius, corners)
    const planCao = new THREE.ShapeGeometry(shape)
    // }
    const material = new THREE.MeshStandardMaterial({ map: ad })
    const caoMesh = new THREE.Mesh(planCao, material)
    caoMesh.position.set(x, y, z)
    caoMesh.rotation.x = -Math.PI / 2
    return caoMesh
  }

  function createCaoByArr(
    pointInfo: Array<{
      x: number
      y: number
      z: number
      width: number
      height: number
      corners: ConersConfig
    }>
  ) {
    const caoArr = pointInfo.map((point) =>
      createCaoByPoint(point.x, point.y, point.z, point.width, point.height, point.corners)
    )
    return caoArr
  }

  function daolu1() {
    const ax = Math.sqrt(1.2 ** 2 - 0.5 ** 2)
    const wz = (ax - 0.5) / 2 + 0.5
    const angleA = Math.PI + Math.PI / 4 // 225°
    const angleB = Math.PI + Math.atan2(ax, 0.5) // ≈ 245.3°
    const shape1 = new THREE.Shape()
    shape1.moveTo(-wz, -wz)
    shape1.absarc(0, 0, 1.2, angleA, angleB, false) // 外圆弧 A→B
    shape1.lineTo(-0.5, -ax)
    shape1.lineTo(-0.5, -8)
    shape1.lineTo(-wz, -8)
    shape1.lineTo(-wz, -wz)
    const geometry = new THREE.ShapeGeometry(shape1)
    const material = new THREE.MeshStandardMaterial({ map: ad })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.y = 0.01
    return mesh
  }

  function daolu2() {
    const ax = Math.sqrt(1.2 ** 2 - 0.5 ** 2)
    const wz = (ax - 0.5) / 2 + 0.5
    const shape1 = new THREE.Shape()
    shape1.moveTo(-wz, -wz)
    shape1.lineTo(-ax, -0.5)
    shape1.lineTo(-9, -0.5)
    shape1.lineTo(-9, -wz)
    shape1.lineTo(-wz, -wz)
    const geometry = new THREE.ShapeGeometry(shape1)
    const material = new THREE.MeshStandardMaterial({ map: ad })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.y = 0.01
    return mesh
  }

  function daolu3() {
    const ax = Math.sqrt(1.2 ** 2 - 0.5 ** 2)
    const wz = (ax - 0.5) / 2 + 0.5
    const shape1 = new THREE.Shape()
    shape1.moveTo(wz, -wz)
    shape1.lineTo(0.5, -ax)
    shape1.lineTo(0.5, -8)
    shape1.lineTo(wz, -8)
    shape1.lineTo(wz, -wz)
    const geometry = new THREE.ShapeGeometry(shape1)
    const material = new THREE.MeshStandardMaterial({ map: ad })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.y = 0.01
    return mesh
  }

  function initCao(scene: THREE.Scene) {
    // 创建草
    const cao1 = createCaoByPoint(-4.75, 0.01, 9.5, 8.5, 1, { topRight: true, r: 8 })
    scene.add(cao1)
    const cao2 = createCaoByPoint(4.75, 0.01, 9.5, 8.5, 1, { topLeft: true, r: 8 })
    scene.add(cao2)
    const cao3 = createCaoByPoint(-4.75, 0.01, 8.25, 8.5, 0.5, { bottomRight: true, r: 4 })
    scene.add(cao3)
    const cao4 = createCaoByPoint(4.75, 0.01, 8.25, 8.5, 0.5, { bottomLeft: true, r: 4 })
    scene.add(cao4)
    const cao5 = createCaoByPoint(-9.5, 0.01, 0, 1, 20, { r: 0 })
    scene.add(cao5)
    const cao6 = createCaoByPoint(9.5, 0.01, 0, 1, 20, { r: 0 })
    scene.add(cao6)
    const cao7 = createCaoByPoint(0, 0.01, -9.5, 18, 1, { r: 0 })
    scene.add(cao7)
    const cao8 = daolu1()
    scene.add(cao8)
    const cao9 = daolu2()
    scene.add(cao9)
    const cao10 = daolu3()
    scene.add(cao10)
  }

  onBeforeUnmount(() => {
    ad.dispose()
  })

  return { initCao }
}
