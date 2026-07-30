// 游泳池
import { onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import grassImg from '@/assets/green/grass.jpg'
// 添加草的纹理
const textLoader = new THREE.TextureLoader()
const ad = textLoader.load(grassImg)
ad.colorSpace = THREE.SRGBColorSpace
ad.wrapS = THREE.RepeatWrapping
ad.wrapT = THREE.RepeatWrapping

export function poolModel(scene: THREE.Scene) {
  const scene1 = scene

  // ========== ① 瓷砖纹理（Canvas 生成蓝白马赛克） ==========
  function createTileTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')!

    // 浅蓝基底
    ctx.fillStyle = '#d4eaf7'
    ctx.fillRect(0, 0, 128, 128)

    // 4×4 马赛克砖块
    const ts = 32
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? '#a8d8ea' : '#c5e8f3'
        ctx.fillRect(col * ts + 1, row * ts + 1, ts - 2, ts - 2)
      }
    }
    // 砖缝
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath()
      ctx.moveTo(i * ts, 0)
      ctx.lineTo(i * ts, 128)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * ts)
      ctx.lineTo(128, i * ts)
      ctx.stroke()
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.colorSpace = THREE.SRGBColorSpace
    tex.repeat.set(8, 1.2) // 圆周 8 块，纵向 1.2 排
    return tex
  }

  // ========== ③ 水面 bump 纹理（Canvas 生成软噪点） ==========
  function createWaterBumpTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!

    // 中灰底
    ctx.fillStyle = 'rgb(128,128,128)'
    ctx.fillRect(0, 0, 256, 256)

    // 随机软圆斑 → 高度场 → bump
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * 256
      const y = Math.random() * 256
      const r = Math.random() * 30 + 5
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      const b = Math.floor(Math.random() * 40 + 108) // 108~148
      g.addColorStop(0, `rgb(${b},${b},${b})`)
      g.addColorStop(1, 'rgb(128,128,128)')
      ctx.fillStyle = g
      ctx.fillRect(x - r, y - r, r * 2, r * 2)
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.colorSpace = THREE.LinearSRGBColorSpace
    tex.repeat.set(3, 3)
    return tex
  }

  // ========== 池底 ==========
  function renderPoolbtm() {
    const btm = new THREE.CircleGeometry(1, 32)
    const material = new THREE.MeshStandardMaterial({
      color: 0x3a7d9c,
      roughness: 0.5,
      side: THREE.DoubleSide,
    })
    const poolbtm = new THREE.Mesh(btm, material)
    poolbtm.position.set(0, -1, 0)
    poolbtm.rotation.x = -Math.PI / 2
    scene1.add(poolbtm)
  }

  // ========== ② 池壁（贴瓷砖纹理） ==========
  function renderPoolWall() {
    const tileTex = createTileTexture()
    const geometry = new THREE.CylinderGeometry(0.99, 0.99, 1.1, 32, 32, true, 0, Math.PI * 2)
    const material = new THREE.MeshStandardMaterial({
      map: tileTex,
      roughness: 0.25,
      side: THREE.DoubleSide,
    })
    const wall = new THREE.Mesh(geometry, material)
    wall.position.set(0, -0.45, 0)
    scene1.add(wall)
  }

  // ========== ① 池沿压顶石（圆环收边） ==========
  function renderPoolCoping() {
    // 主压顶环 — Torus 做圆润的收边石头
    const geometry = new THREE.TorusGeometry(0.99, 0.06, 12, 32)
    const material = new THREE.MeshStandardMaterial({
      color: 0xf5f2eb,
      roughness: 0.35,
      metalness: 0.05,
    })
    const coping = new THREE.Mesh(geometry, material)
    coping.rotation.x = -Math.PI / 2
    coping.position.set(0, 0.05, 0)
    scene1.add(coping)
  }

  // ========== ③ 水面（顶点波动 + bumpMap 波纹 + 高光） ==========
  function renderPoolWater(addCallback: (fn: () => void) => () => void) {
    const bumpTex = createWaterBumpTexture()
    const waterGeo = new THREE.CircleGeometry(1 - 0.05, 64)
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x4499cc,
      transparent: true,
      opacity: 0.55,
      roughness: 0.15,
      metalness: 0.05,
      bumpMap: bumpTex,
      bumpScale: 0.04,
      side: THREE.DoubleSide,
    })

    const water = new THREE.Mesh(waterGeo, waterMat)
    water.rotation.x = -Math.PI / 2
    water.position.set(0, 0.04, 0) // 略低于压顶石(0.1)

    // 顶点 buffer 波动
    let waveTime = 0
    addCallback(() => {
      const pos = waterGeo.attributes.position
      for (let i = 0; i < pos.count; i++) {
        pos.setZ(
          i,
          Math.sin(pos.getX(i) * 3.0 + waveTime) * 0.025 +
            Math.cos(pos.getY(i) * 3.5 + waveTime * 1.3) * 0.025
        )
      }
      pos.needsUpdate = true
      waveTime += 0.03
    })

    scene1.add(water)
  }

  // ========== 泳池周围四角草地 ==========
  function renderCao() {
    const innerR = 0.99
    const outerR = 1.2
    const d = 0.5

    // 计算交点坐标
    // b 点: 内圆上, y=d → x = √(r² - d²)
    const bx = Math.sqrt(innerR ** 2 - d ** 2) // ≈ 0.855
    // a 点: 外圆上, y=d
    const ax = Math.sqrt(outerR ** 2 - d ** 2) // ≈ 1.091

    // Q1 四个控制点
    const a = new THREE.Vector2(ax, d) // 外圆, y=0.5
    const b = new THREE.Vector2(bx, d) // 内圆, y=0.5
    const c = new THREE.Vector2(d, bx) // 内圆, x=0.5
    const dPt = new THREE.Vector2(d, ax) // 外圆, x=0.5

    // 各点对应圆心角
    const angleA = Math.atan2(a.y, a.x) // ≈ 24.6°
    const angleB = Math.atan2(b.y, b.x) // ≈ 30.4°
    const angleC = Math.atan2(c.y, c.x) // ≈ 59.7°
    const angleD = Math.atan2(dPt.y, dPt.x) // ≈ 65.3°

    // Shape: a→b(横) → b→c(内弧) → c→d(竖) → d→a(外弧闭合)
    const shape = new THREE.Shape()
    shape.moveTo(a.x, a.y)
    shape.lineTo(b.x, b.y) // 水平 a→b
    shape.absarc(0, 0, innerR, angleB, angleC, false) // 内圆弧 b→c (CCW)
    shape.lineTo(dPt.x, dPt.y) // 竖直 c→d
    shape.absarc(0, 0, outerR, angleD, angleA, true) // 外圆弧 d→a (CW)

    const geometry = new THREE.ShapeGeometry(shape)
    const material = new THREE.MeshStandardMaterial({
      map: ad,
      roughness: 0.6,
      side: THREE.DoubleSide,
    })

    // 镜像到 4 个象限: rotation.x 先拍平到 XZ, rotation.z 绕世界 Y 旋转
    for (let i = 0; i < 4; i++) {
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.y = 0.01
      mesh.rotation.x = -Math.PI / 2
      mesh.rotation.z = (i * Math.PI) / 2
      scene1.add(mesh)
    }
  }

  function initPool(addCallback: (fn: () => void) => () => void) {
    renderPoolbtm()
    renderPoolWall()
    renderPoolCoping()
    renderPoolWater(addCallback)
    renderCao()
  }

  onBeforeUnmount(() => {
    ad.dispose()
  })

  return { initPool }
}
