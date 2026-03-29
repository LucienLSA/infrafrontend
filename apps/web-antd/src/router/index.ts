import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';

import { resetStaticRoutes } from '@vben/utils';

import { createRouterGuard } from './guard';
import { accessRoutes, routes } from './routes';

/**
 *  @zh_CN 创建vue-router实例
 */
const router = createRouter({
  history:
    import.meta.env.VITE_ROUTER_HISTORY === 'hash'
      ? createWebHashHistory(import.meta.env.VITE_BASE)
      : createWebHistory(import.meta.env.VITE_BASE),
  // 应该添加到路由的初始路由列表。
  routes,
  scrollBehavior: (to, _from, savedPosition) => {
    if (savedPosition) {
      return savedPosition;
    }
    return to.hash ? { behavior: 'smooth', el: to.hash } : { left: 0, top: 0 };
  },
  // 是否应该禁止尾部斜杠。
  // strict: true,
});

// 如果没有启用权限系统，手动添加动态路由到根路由
// 这样可以避免404问题
// 注意：由于路由守卫被禁用，动态路由不会自动添加，需要手动添加
accessRoutes.forEach((route) => {
  // 将动态路由作为根路由的子路由添加
  router.addRoute('Root', route);
});

const resetRoutes = () => resetStaticRoutes(router, routes);

// 创建路由守卫
createRouterGuard(router);

export { resetRoutes, router };
