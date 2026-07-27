// 建立地板
import * as THREE from 'three'

export function boardModel() {
  // 创建地板
  const createBoard = (
    width: number,
    height: number,
    widthSegments: number,
    heightSegments: number
  ): THREE.Mesh => {
    const boardGometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments) // 创建了 二维平面
    const materials = new THREE.MeshStandardMaterial({ color: 0xc7c7c7, side: THREE.DoubleSide })
    const boardMesh = new THREE.Mesh(boardGometry, materials)
    boardMesh.rotation.x = -Math.PI / 2
    return boardMesh
  }
  return { createBoard }
}
