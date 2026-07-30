import * as THREE from 'three'
export function setUv(geometry: THREE.BufferGeometry, width: number, height: number) {
  const uv = geometry.attributes.uv
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, uv.getX(i) * width, uv.getY(i) * height)
  }
}
