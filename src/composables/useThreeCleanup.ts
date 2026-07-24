import { onBeforeUnmount } from 'vue'

interface Disposable {
  dispose?: () => void
}

interface Traversable {
  traverse?: (callback: (child: Traversable) => void) => void
  geometry?: Disposable
  material?: Disposable | Disposable[]
}

export function useThreeCleanup() {
  const disposables = new Set<Disposable>()

  function track<T extends Disposable>(resource: T): T {
    if (resource && typeof resource.dispose === 'function') {
      disposables.add(resource)
    }
    return resource
  }

  function trackTraverse(object: Traversable): Traversable {
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

  function disposeAll(): void {
    disposables.forEach((r) => r.dispose?.())
    disposables.clear()
  }

  onBeforeUnmount(disposeAll)

  return { track, trackTraverse, disposeAll }
}
