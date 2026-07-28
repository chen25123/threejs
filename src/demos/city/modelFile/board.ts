// 建立地板
import { onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import dmwl from '@/assets/board/surface.jpg'

const textLoader = new THREE.TextureLoader()
const dimian = textLoader.load(dmwl)

export function boardModel() {
  // 创建地板
  const createBoard = (
    width: number,
    height: number,
    widthSegments: number,
    heightSegments: number
  ): THREE.Mesh => {
    const boardGometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments) // 创建了 二维平面
    const materials = new THREE.MeshStandardMaterial({ color: 0x474747, side: THREE.DoubleSide })
    const boardMesh = new THREE.Mesh(boardGometry, materials)
    boardMesh.rotation.x = -Math.PI / 2
    return boardMesh
  }

  onBeforeUnmount(() => {
    dimian.dispose()
  })

  return { createBoard }
}
