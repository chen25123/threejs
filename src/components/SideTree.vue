<script setup lang="ts">
import { useRouter, type RouteRecordNormalized } from 'vue-router'

const router = useRouter()

interface TreeNode {
  path: string
  title: string
  name: string | symbol | undefined
}

// 从路由表中自动提取需要展示的节点（过滤掉没有 meta.title 的）
const treeNodes: TreeNode[] = router
  .getRoutes()
  .filter((r: RouteRecordNormalized) => r.meta?.title)
  .map((r: RouteRecordNormalized) => ({
    path: r.path,
    title: r.meta.title as string,
    name: r.name,
  }))
</script>

<template>
  <div class="side-tree">
    <div class="tree-title">页面导航</div>
    <nav class="tree-nav">
      <router-link
        v-for="node in treeNodes"
        :key="node.name"
        :to="node.path"
        class="tree-node"
        active-class="tree-node--active"
      >
        <span class="tree-node__icon">📄</span>
        <span class="tree-node__label">{{ node.title }}</span>
      </router-link>
    </nav>
  </div>
</template>

<style scoped>
.side-tree {
  padding: 1rem 0;
}

.tree-title {
  padding: 0 1rem 0.75rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #888;
  letter-spacing: 0.05em;
}

.tree-nav {
  display: flex;
  flex-direction: column;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  color: #ccc;
  text-decoration: none;
  font-size: 0.9rem;
  border-left: 3px solid transparent;
  transition: all 0.15s;
}

.tree-node:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.tree-node--active {
  background: rgba(66, 184, 131, 0.1);
  color: #42b883;
  border-left-color: #42b883;
}

.tree-node__icon {
  font-size: 0.85rem;
  flex-shrink: 0;
}

.tree-node__label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
