# Vue 3 + Three.js 代码架构设计

## 一、核心问题

Three.js 在 Vue 3 项目中的痛点：

1. **样板代码泛滥**——每个 demo 都要写 `new Scene()`、`new WebGLRenderer()`、resize、requestAnimationFrame、dispose，80% 代码是重复的
2. **内存泄漏**——Three.js 的 GPU 资源（Geometry、Material、Texture）不受 Vue 响应式系统管理，组件卸载时不会自动释放
3. **职责混乱**——页面组件里同时出现路由逻辑、UI 布局、Three.js 初始化，单文件 300+ 行
4. **资源加载耦合**——模型、纹理、着色器的加载逻辑和场景搭建逻辑混在一起

架构设计的核心目标：**让写一个 Three.js Demo 像写一个 Vue 组件一样简单。**

---

## 二、目录结构

```
src/
├── composables/            # 共享 Vue 3 Hook（通用，跨 Demo 复用）
│   ├── useThreeSetup.js    #   Scene + Camera + Renderer 生命周期管理
│   ├── useThreeLoop.js     #   requestAnimationFrame 循环管理
│   ├── useThreeResize.js   #   响应式窗口尺寸同步
│   ├── useThreeCleanup.js  #   GPU 资源追踪与自动回收
│   ├── useOrbitControls.js #   轨道控制器封装（懒加载）
│   ├── useLightPreset.js   #   光照预设组合（三灯 / 影棚 / 户外）
│   ├── useAxesHelper.js    #   调试辅助线开关
│   └── useStats.js         #   Stats 性能面板（可选）
│
├── demos/                  # 每个 Demo 一个文件夹，自包含
│   ├── basic-geometry/
│   │   ├── index.vue       #   路由页面（薄，只组装）
│   │   ├── scene.js        #   场景搭建逻辑（厚，业务核心）
│   │   ├── config.js       #   可调参数定义
│   │   └── textures/       #   此 Demo 专用纹理（可选）
│   │
│   ├── material-showcase/
│   │   ├── index.vue
│   │   ├── scene.js
│   │   └── shaders/        #   此 Demo 专用着色器
│   │       ├── vertex.glsl
│   │       └── fragment.glsl
│   │
│   └── model-viewer/
│       ├── index.vue
│       ├── scene.js
│       ├── controls.js     #   Demo 专属交互逻辑（如 GUI 面板）
│       └── README.md       #   可选：Demo 说明
│
├── utils/                  # 纯函数工具（无 Vue 依赖，无响应式）
│   ├── geometry-factory.js #   常用几何体工厂函数
│   ├── material-presets.js #   预设材质配置
│   ├── texture-loader.js   #   纹理加载 Promise 化封装
│   └── model-loader.js     #   模型加载 Promise 化封装
│
├── router/
│   └── index.js            #   每个 Demo 一条懒加载路由
│
└── layouts/
    └── DefaultLayout.vue   #   主布局（上 / 下左树 / 下右画布）
```

```
public/
├── models/                 # 大型 3D 模型文件（不进 Vite 打包）
│   ├── robot/
│   │   ├── scene.glb
│   │   └── textures/
│   └── car/
│       └── scene.gltf
│
└── hdr/                    # 环境贴图 HDR
    ├── studio.hdr
    └── sunset.hdr
```

---

## 三、分层架构与职责边界

```
┌──────────────────────────────────────────────────┐
│                 <demo>/index.vue                  │  ← 路由页面（组装层）
│  职责：引入 hooks + 传入 scene.js，自身无逻辑     │
├──────────────────────────────────────────────────┤
│                  <demo>/scene.js                  │  ← 场景逻辑（业务核心）
│  职责：创建物体、设置材质、布置灯光、动画逻辑      │
├──────────┬──────────┬──────────┬─────────────────┤
│   useA   │   useB   │   useC   │   use...        │  ← composables（Hook 层）
│  职责：封装 Three.js 生命周期，与 Vue 集成        │
├──────────┴──────────┴──────────┴─────────────────┤
│                  utils/                           │  ← 纯工具层
│  职责：纯函数，无副作用，无 Vue 依赖              │
├──────────────────────────────────────────────────┤
│              THREE (Three.js Core)                │  ← 渲染引擎
└──────────────────────────────────────────────────┘
```

每一层的职责边界非常清晰：

| 层级 | 可以有 Vue 依赖？ | 可以有 Three.js 依赖？ | 职责 |
|------|-------------------|------------------------|------|
| `index.vue` | ✅ | ✅（通过 hooks 间接） | 组装，自身无逻辑 |
| `scene.js` | ❌（参数通过 hooks 传入） | ✅ | 纯场景搭建 |
| `composables/` | ✅ | ✅ | Vue 与 Three.js 的桥接层 |
| `utils/` | ❌ | ✅ | 纯函数工具 |

---

## 四、Composable 设计——Vue 3 Hook 与 Three.js 生命周期桥接

### 4.1 为什么用 Composable？

Three.js 有自己的生命周期：`init → animate → resize → dispose`，和 Vue 组件的 `setup → onMounted → onUnmounted` 生命周期是两个独立体系。Composable 的作用就是把这两个生命周期精确对齐，让 Three.js 的资源随 Vue 组件自动创建和销毁。

### 4.2 核心 Hook：`useThreeSetup`

这是所有 Demo 的入口 Hook，组合了多个子 Hook：

```js
// composables/useThreeSetup.js

import * as THREE from 'three'
import { useThreeResize } from './useThreeResize'
import { useThreeLoop } from './useThreeLoop'
import { useThreeCleanup } from './useThreeCleanup'

/**
 * 创建 Three.js 基础设施，返回场景、相机、渲染器。
 * 自动处理：渲染循环、窗口 resize、组件卸载时的 GPU 资源回收。
 *
 * @param {Ref<HTMLElement>} containerRef - 挂载容器的模板引用
 * @param {Object} options - 可选配置
 * @returns {{ scene, camera, renderer, disposeTracker }}
 */
export function useThreeSetup(containerRef, options = {}) {
  const {
    antialias = true,
    alpha = false,
    fov = 45,
    near = 0.1,
    far = 1000,
  } = options

  // ---- 创建核心对象 ----
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(fov, 1, near, far)
  const renderer = new THREE.WebGLRenderer({ antialias, alpha })
  const disposeTracker = useThreeCleanup() // GPU 资源追踪器

  // ---- 挂载到 DOM ----
  // 使用 watchEffect 等待 containerRef 就绪（模板 ref 在 setup 阶段未挂载）
  watchEffect(() => {
    if (containerRef.value) {
      containerRef.value.appendChild(renderer.domElement)
    }
  })

  // ---- 组合子 Hook ----
  useThreeResize(camera, renderer, containerRef)   // 窗口 resize → 相机+渲染器同步
  useThreeLoop(scene, camera, renderer)             // RAF 渲染循环

  // ---- 卸载时清理 ----
  onBeforeUnmount(() => {
    disposeTracker.disposeAll()                     // 回收所有注册的 GPU 资源
    renderer.dispose()
    renderer.domElement.remove()
  })

  return { scene, camera, renderer, disposeTracker }
}
```

### 4.3 为什么拆分成多个子 Hook？

**单一职责原则。** 如果所有逻辑塞在一个 `useThreeSetup` 里：

- 不想用 OrbitControls 时也要带进来（tree-shaking 无效）
- 想用自定义的动画循环时改不动
- 单元测试一个 Hook 时被迫 mock 全部

拆开后，每个 Demo 按需组合：

```js
// 简单 Demo：只要基础三件套
const { scene, camera, renderer } = useThreeSetup(container)

// 复杂 Demo：叠加更多能力
const { scene, camera, renderer, disposeTracker } = useThreeSetup(container)
const controls = useOrbitControls(camera, renderer, { enableDamping: true })
const stats = useStats(container)
```

### 4.4 子 Hook 设计

#### `useThreeResize` —— 响应式尺寸同步

```js
// composables/useThreeResize.js

import { onBeforeUnmount } from 'vue'

export function useThreeResize(camera, renderer, containerRef) {
  function onResize() {
    if (!containerRef.value) return
    const { clientWidth, clientHeight } = containerRef.value
    camera.aspect = clientWidth / clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(clientWidth, clientHeight, false)
  }

  window.addEventListener('resize', onResize, { passive: true })
  // 初始化时立即同步一次
  onResize()

  onBeforeUnmount(() => window.removeEventListener('resize', onResize))
}
```

**设计意图：**

- `passive: true` —— 不阻塞滚动性能
- `unmounted` 时移除监听 —— 防止内存泄漏
- `setSize(clientWidth, clientHeight, false)` 第三个参数 `false` —— 不设置 CSS 样式，由 Vue 的 CSS 层控制布局，Hook 只负责 WebGL 画布分辨率

#### `useThreeLoop` —— requestAnimationFrame 管理

```js
// composables/useThreeLoop.js

import { onBeforeUnmount } from 'vue'

export function useThreeLoop(scene, camera, renderer) {
  let animationId = null
  const callbacks = [] // 支持多个回调函数

  function loop() {
    animationId = requestAnimationFrame(loop)
    callbacks.forEach((fn) => fn())
    renderer.render(scene, camera)
  }

  loop()

  // 注册自定义逻辑（如动画更新），返回取消注册的函数
  function addCallback(fn) {
    callbacks.push(fn)
    return () => {
      const idx = callbacks.indexOf(fn)
      if (idx !== -1) callbacks.splice(idx, 1)
    }
  }

  onBeforeUnmount(() => {
    cancelAnimationFrame(animationId)
    callbacks.length = 0
  })

  return { addCallback }
}
```

**设计意图：**

- 支持多个回调——场景中有独立运动的物体时，各自注册自己的 update
- 返回取消注册的函数——物体被移除时清理对应的 animation 逻辑
- `onBeforeUnmount` 中 `cancelAnimationFrame` + 清空回调——双重保险

#### `useThreeCleanup` —— GPU 资源追踪器

这是最容易被忽视但最关键的部分。Three.js 的 GPU 资源不归 Vue 管，必须手动 `dispose()`。

```js
// composables/useThreeCleanup.js

import { onBeforeUnmount } from 'vue'

export function useThreeCleanup() {
  // 注册的待释放资源
  const disposables = new Set()

  /**
   * 注册任意可 dispose 的对象（Geometry、Material、Texture 等）
   *
   * 使用示例：
   *   const geo = new THREE.BoxGeometry(1, 1, 1)
   *   tracker.track(geo)       // 自动在组件卸载时 dispose
   *   tracker.track(material)
   */
  function track(resource) {
    if (resource && typeof resource.dispose === 'function') {
      disposables.add(resource)
    }
    return resource // 链式调用
  }

  /**
   * 注册需要特殊清理的资源（如包含子资源的 Group）
   */
  function trackTraverse(object) {
    object?.traverse?.((child) => {
      if (child.geometry) track(child.geometry)
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(track)
        } else {
          track(child.material)
        }
      }
    })
    return object
  }

  function disposeAll() {
    disposables.forEach((r) => r.dispose?.())
    disposables.clear()
  }

  onBeforeUnmount(disposeAll)

  return { track, trackTraverse, disposeAll }
}
```

**设计意图：**

- `Set` 而非 `Array`——同一资源只注册一次，不重复 dispose
- `track()` 模式而非自动追踪——显式注册比 Proxy 代理更安全，不会误追踪 Vue 的响应式对象
- `trackTraverse()`——处理复杂模型的递归清理，一条调用覆盖模型的所有子物体
- 返回值即资源本身——支持链式调用：`const geo = tracker.track(new THREE.BoxGeometry(1,1,1))`

### 4.5 `useOrbitControls` —— 按需懒加载

```js
// composables/useOrbitControls.js

import { onBeforeUnmount } from 'vue'

export function useOrbitControls(camera, renderer, options = {}) {
  let controls = null
  let loaded = false

  // 懒加载：只有调用了 init 才 import 包
  async function init() {
    if (loaded) return controls
    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls')
    controls = new OrbitControls(camera, renderer.domElement)
    Object.assign(controls, options)
    loaded = true
    return controls
  }

  onBeforeUnmount(() => {
    controls?.dispose()
  })

  return { init, controls }
}
```

**设计意图：**

- 懒加载——OrbitControls 会额外增加 ~80KB，不需要的 Demo 不加载
- 返回 `{ init, controls }`——由 scene.js 决定何时初始化

### 4.6 `useLightPreset` —— 光照可组合

```js
// composables/useLightPreset.js

import * as THREE from 'three'

const presets = {
  studio(scene) {
    // 经典三点布光
    const key = new THREE.DirectionalLight(0xffffff, 2)
    key.position.set(5, 10, 5)
    const fill = new THREE.DirectionalLight(0x4488ff, 0.5)
    fill.position.set(-3, 2, 0)
    const rim = new THREE.DirectionalLight(0xff8844, 0.8)
    rim.position.set(0, 2, -5)
    scene.add(key, fill, rim)
    return { key, fill, rim }
  },

  outdoor(scene) {
    const sun = new THREE.DirectionalLight(0xfff4e0, 3)
    sun.position.set(50, 30, 20)
    const ambient = new THREE.AmbientLight(0x404080, 0.6)
    const hemi = new THREE.HemisphereLight(0x87ceeb, 0x362907, 0.4)
    scene.add(sun, ambient, hemi)
    return { sun, ambient, hemi }
  },

  minimal(scene) {
    const ambient = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambient)
    return { ambient }
  },
}

export function useLightPreset(scene, presetName = 'studio') {
  const apply = presets[presetName]
  if (!apply) {
    console.warn(`[useLightPreset] Unknown preset: ${presetName}. Available: ${Object.keys(presets).join(', ')}`)
    return {}
  }
  return apply(scene)
}
```

---

## 五、Demo = 自包含文件夹

### 5.1 为什么每个 Demo 是一个文件夹而非单文件？

一个中等复杂度的 Three.js 场景会包含：

- 页面入口（.vue）
- 场景搭建逻辑（scene.js —— 100~300 行很常见）
- 可调参数（config.js）
- 专属着色器（.glsl）
- 专属纹理/贴图（.jpg/.png）
- 专属交互逻辑（controls.js / gui.js）

全部塞进一个 `.vue` 文件 → 800 行 SFC，不可维护。

**文件夹策略的核心收益：**

| 好处 | 说明 |
|------|------|
| **自包含** | 迁移/删除一个 Demo 只需操作一个文件夹，无跨目录依赖 |
| **按需加载** | 路由懒加载 `() => import('@/demos/xxx/index.vue')`，不访问的 Demo 零开销 |
| **独立 Git 历史** | 每个 Demo 修改只影响自己的文件夹，不会和其他 Demo 冲突 |
| **新人友好** | 看一个 Demo 文件夹就知道所有相关代码在哪 |

### 5.2 `index.vue` —— 越薄越好

```vue
<!-- demos/basic-geometry/index.vue -->
<script setup>
import { ref } from 'vue'
import { useThreeSetup } from '@/composables/useThreeSetup'
import { buildScene } from './scene'

const container = ref(null)

const { scene, camera, renderer, disposeTracker } = useThreeSetup(container, {
  antialias: true,
})

// 场景搭建委托给 scene.js
buildScene({ scene, disposeTracker })
</script>

<template>
  <div ref="container" class="demo-canvas" />
</template>

<style scoped>
.demo-canvas {
  width: 100%;
  height: 100%;
}
</style>
```

**这个组件只有 5 个职责：**
1. 提供挂载容器
2. 调用 Hook 获取 Three.js 对象
3. 委托给 scene.js 搭建场景
4. 一根 `ref` 绑定
5. 样式尺寸

> **不做的事：** 不创建几何体、不设材质、不布置灯光、不写动画循环、不处理 resize

### 5.3 `scene.js` —— 场景逻辑的单一所有者

```js
// demos/basic-geometry/scene.js

import * as THREE from 'three'
import { useLightPreset } from '@/composables/useLightPreset'
import { createGridHelper } from '@/utils/geometry-factory'

/**
 * 搭建基础几何体展示场景
 */
export function buildScene({ scene, disposeTracker }) {
  // 光照
  const lights = useLightPreset(scene, 'studio')
  Object.values(lights).forEach(disposeTracker.track)

  // 网格地面
  const grid = createGridHelper(20, 20, 0x444466, 0x222244)
  scene.add(grid)

  // 几何体展示
  const geometries = [
    { shape: new THREE.BoxGeometry(1, 1, 1), color: 0x42b883, pos: [-2, 1, 0] },
    { shape: new THREE.SphereGeometry(0.7, 32, 32), color: 0x3498db, pos: [0, 1, 0] },
    { shape: new THREE.ConeGeometry(0.6, 1.4, 32), color: 0xe74c3c, pos: [2, 1, 0] },
  ]

  const meshes = geometries.map(({ shape, color, pos }) => {
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.1 })
    const mesh = new THREE.Mesh(shape, material)
    mesh.position.set(...pos)

    // 注册 GPU 资源（组件卸载时自动回收）
    disposeTracker.track(shape)
    disposeTracker.track(material)

    scene.add(mesh)
    return mesh
  })

  // 返回引用，方便外部控制（如 GUI 面板调节参数）
  return { meshes, lights }
}
```

### 5.4 `config.js` —— 可调参数

```js
// demos/basic-geometry/config.js

import { reactive } from 'vue'

/**
 * 可通过 GUI 面板实时调节的参数
 * 使用 reactive 确保 GUI 修改时视图响应
 */
export const demoConfig = reactive({
  rotationSpeed: 0.5,
  wireframe: false,
  showAxes: false,
  backgroundColor: '#1a1a2e',
})
```

---

## 六、纯工具层 `utils/`

为什么把工具从 composables 中分离出来？

> **Composable 可以有 Vue 的响应式副作用（ref/watch/onMounted），util 只是纯函数。**

| 特征 | Composable | Util |
|------|-----------|------|
| 可以 import vue 吗 | ✅ | ❌ |
| 可以在 Node 环境运行吗 | ❌（依赖 Vue 运行时） | ✅（纯 JS） |
| 可以写单元测试吗 | 需要 Vue Test Utils | `import { fn } from './xxx.js'` 直接测 |

示例：

```js
// utils/model-loader.js

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'

// 全局单例，避免重复初始化
let gltfLoader = null

function getGLTFLoader() {
  if (!gltfLoader) {
    gltfLoader = new GLTFLoader()
    const draco = new DRACOLoader()
    draco.setDecoderPath('/draco/') // public/draco/
    gltfLoader.setDRACOLoader(draco)
  }
  return gltfLoader
}

/**
 * 加载 GLTF/GLB 模型，返回 Promise
 * 内置 loading 进度回调支持
 */
export function loadModel(url, onProgress) {
  return new Promise((resolve, reject) => {
    getGLTFLoader().load(
      url,
      resolve,                                   // onLoad
      onProgress || ((e) => { /* noop */ }),     // onProgress
      reject                                      // onError
    )
  })
}
```

---

## 七、路由与 Code Splitting

```js
// router/index.js

import DefaultLayout from '@/layouts/DefaultLayout.vue'

const routes = [
  {
    path: '/',
    component: DefaultLayout,
    children: [
      // 每个 Demo 一条记录，全部懒加载
      {
        path: '',
        name: 'BasicGeometry',
        component: () => import('@/demos/basic-geometry/index.vue'),
        meta: { title: '基础几何体' },
      },
      {
        path: 'material-showcase',
        name: 'MaterialShowcase',
        component: () => import('@/demos/material-showcase/index.vue'),
        meta: { title: '材质展示' },
      },
      {
        path: 'model-viewer',
        name: 'ModelViewer',
        component: () => import('@/demos/model-viewer/index.vue'),
        meta: { title: '模型查看器' },
      },
      // 新增 Demo 只需在这里加一条
    ],
  },
]
```

**懒加载的实际效果：**

访问首页时，只有 `basic-geometry` 的代码被下载。点击"模型查看器"时，Vite 才异步加载 `model-viewer/index.vue` 及其依赖（scene.js、着色器、纹理等）。用户不访问的 Demo 完全不产生网络开销。

---

## 八、文件放置的资源类型对照表

| 资源类型 | 放在哪 | 引用方式 | 原因 |
|----------|--------|----------|------|
| 小纹理（< 500KB jpg/png） | `src/demos/<name>/textures/` | `import img from './textures/wood.jpg'` | Vite 自动 hash、压缩、base64 小图 |
| 大纹理（> 500KB） | `public/textures/` | `/textures/wood.jpg` | 不进 JS bundle，浏览器独立缓存 |
| 着色器 .glsl | `src/demos/<name>/shaders/` | `import vert from './shaders/v.glsl?raw'` | `?raw` 以字符串导入 |
| GLTF/GLB 模型 | `public/models/` | `/models/robot/scene.glb` | 体积大（5-50MB），不进 bundle |
| Draco/WASM 解码器 | `public/draco/` | GLTFLoader 自动引用 | Three.js 官方要求的路径 |
| HDR 环境贴图 | `public/hdr/` | `/hdr/studio.hdr` | 通常 2-20MB，不进 bundle |
| 字体文件 | `public/fonts/` | `/fonts/helvetiker.json` | TextGeometry 依赖 |

---

## 九、数据流全图

```
用户访问 /demo/basic-geometry
    │
    ▼
DefaultLayout.vue  ──── 左侧 SideTree（显示"基础几何体"高亮）
    │
    ▼ <router-view> 渲染
demos/basic-geometry/index.vue
    │
    ├─ useThreeSetup(containerRef)
    │   ├─ useThreeResize()      →  窗口 resize 自动同步
    │   ├─ useThreeLoop()        →  RAF 循环自动启停
    │   └─ useThreeCleanup()     →  组件卸载时回收所有 GPU 资源
    │
    └─ buildScene({ scene, disposeTracker })
        ├─ useLightPreset()      →  一键布光
        ├─ 创建几何体 + 材质
        ├─ disposeTracker.track()→  注册需要自动清理的资源
        └─ 返回 { meshes }       →  供外部交互逻辑引用
```

---

## 十、新增 Demo 的标准化流程

只需 4 步，每一步都有固定的位置和格式：

```
1. 创建文件夹
   src/demos/新demo名称/

2. 创建 3 个文件
   ├── index.vue     ← 复制任意现有 Demo 的模板，改 import 路径
   ├── scene.js      ← 写场景搭建逻辑
   └── config.js     ← （可选）可调参数

3. 路由注册（router/index.js 的 children 中加一条）
   {
     path: 'new-demo',
     name: 'NewDemo',
     component: () => import('@/demos/新demo名称/index.vue'),
     meta: { title: '新 Demo 的中文名' },
   }

4. 左侧树自动出现新节点（SideTree 从 router.getRoutes() 提取）
```

---

## 十一、常见反模式

| 反模式 | 问题 | 正确做法 |
|--------|------|----------|
| 在 `index.vue` 中写 `new THREE.Scene()` | 页面组件变厚，布局和场景耦合 | 组件只用 Hook，场景逻辑放 scene.js |
| 手动管理 RAF 的 start/stop | 容易忘记 stop 导致后台空转 | `useThreeLoop` 统一管理，Vue 生命周期自动启停 |
| 模型直链 CDN 或硬编码路径 | 切换环境或迁移时全局搜索替换 | 路径集中定义为常量或环境变量 |
| dispose 写在 `finally` 或不写 | 内存泄漏，切换 Demo 后 GPU 内存持续增长 | `useThreeCleanup.track()` 模式，每个资源注册 |
| 一个 composable 做所有事 | 参数爆炸，测试困难 | 单一职责，每个 Hook 只做一件事，按需组合 |
| 所有模型放 `src/assets/` | Vite 会把 50MB 的 GLB 打进 bundle，构建 30 秒+ | 大型资源放 `public/` |
| 忽略着色器的 `?raw` 后缀 | Vite 尝试把 .glsl 当 JS 解析，构建失败 | `import shader from './x.glsl?raw'` |

---

## 十二、关键原则总结

1. **组件是壳，Hook 是桥，scene.js 是肉** —— 三层分离，各不越界
2. **Composable 单一职责，按需组合** —— 像搭积木，不用不加载
3. **Demo 自包含** —— 一个文件夹就是一个完整的功能单元，删除即清理
4. **显式资源管理** —— 每个 GPU 资源都显式注册到 disposeTracker，不依赖 GC
5. **大资源不进 bundle** —— `public/` 给模型和 HDR，`src/` 只放 JS 逻辑和小纹理
