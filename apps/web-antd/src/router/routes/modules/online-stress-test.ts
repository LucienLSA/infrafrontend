import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:zap',
      order: 1,
      title: '在线压测',
    },
    name: 'OnlineStressTest',
    path: '/online-stress-test',
    children: [
      {
        name: 'GpuStressTest',
        path: '/gpu-stress-test',
        component: () => import('#/views/dashboard/online-stress-test/gpu-stress-test/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:cpu',
          title: 'GPU压测',
        },
      },
      {
        name: 'ErrorRateTest',
        path: '/error-rate-test',
        component: () => import('#/views/dashboard/online-stress-test/error-rate-test/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:alert-triangle',
          title: '误码率测试',
        },
      },
      {
        name: 'LinkTest',
        path: '/link-test',
        component: () => import('#/views/dashboard/online-stress-test/link-test/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:network',
          title: '链路测试',
        },
      },
    ],
  },
];

export default routes;

