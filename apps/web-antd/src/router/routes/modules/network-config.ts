import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:network',
      order: 0.5,
      title: '网络配置',
    },
    name: 'NetworkConfig',
    path: '/network-config',
    children: [
      {
        name: 'ComputeSwitch',
        path: 'compute-switch',
        component: () => import('#/views/dashboard/network-config/compute-switch/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:router',
          title: '计算交换机',
        },
      },
      {
        name: 'StorageSwitch',
        path: 'storage-switch',
        component: () => import('#/views/dashboard/network-config/storage-switch/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:hard-drive',
          title: '存储交换机',
        },
      },
      {
        name: 'InbandSwitch',
        path: 'inband-switch',
        component: () => import('#/views/dashboard/network-config/inband-switch/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:wifi',
          title: '带内交换机',
        },
      },
      {
        name: 'OutbandSwitch',
        path: 'outband-switch',
        component: () => import('#/views/dashboard/network-config/outband-switch/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:shield',
          title: '带外交换机',
        },
      },
    ],
  },
];

export default routes;
