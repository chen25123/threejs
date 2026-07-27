import * as THREE from 'three'
import grassImg from '@/assets/green/grass.jpg'
// 添加草的纹理
const textLoader = new THREE.TextureLoader()
const ad = textLoader.load(grassImg)

export function caoModel() {
  function createCaoByPoint(x: number, y: number, z: number, width: number, height: number) {
    const planCao = new THREE.PlaneGeometry(width, height)
    const material = new THREE.MeshStandardMaterial({ map: ad })
    const caoMesh = new THREE.Mesh(planCao, material)
    caoMesh.position.set(x, y, z)
    caoMesh.rotation.x = -Math.PI / 2
    return caoMesh
  }

  function createCaoByArr(
    pointInfo: Array<{ x: number; y: number; z: number; width: number; height: number }>
  ) {
    const caoArr = pointInfo.map((point) =>
      createCaoByPoint(point.x, point.y, point.z, point.width, point.height)
    )
    return caoArr
  }

  return { createCaoByPoint, createCaoByArr }
}
