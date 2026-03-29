import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:search-check',
      order: 0,
      title: '环境检查',
    },
    name: 'EnvCheck',
    path: '/env-check',
    children: [
      {
        name: 'CheckConfig',
        path: '/check-config',
        component: () => import('#/views/dashboard/env-check/check-config/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:settings',
          title: '检查项配置',
        },
      },
      {
        name: 'ServerCheck',
        path: '/server-check',
        component: () => import('#/views/dashboard/env-check/server-check/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:server',
          title: '服务器检查',
        },
      },
      {
        name: 'SwitchCheck',
        path: '/switch-check',
        component: () => import('#/views/dashboard/env-check/switch-check/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:network',
          title: '交换机检查',
        },
      },
    ],
  },
];

export default routes;
