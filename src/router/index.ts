import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: DefaultLayout,
    children: [
      {
        path: '/demo',
        redirect: 'SphereDemo',
        children: [
          {
            path: 'SphereDemo',
            name: 'SphereDemo',
            component: () => import('@/demos/sphere-demo/index.vue'),
            meta: { title: '旋转球体' },
          },
          {
            path: 'city',
            name: 'city',
            component: () => import('@/demos/city/index.vue'),
            meta: { title: '城市' },
          },
        ],
      },

      {
        path: 'about',
        name: 'About',
        component: () => import('@/pages/About.vue'),
        meta: { title: '关于' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
