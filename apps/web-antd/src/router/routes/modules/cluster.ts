import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:server',
      order: -2,
      title: '集群管理',
    },
    name: 'ClusterManagement',
    path: '/cluster',
    children: [
      {
        name: 'ClusterImport',
        path: '/cluster-import',
        component: () => import('#/views/dashboard/cluster-import/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:upload',
          title: '集群信息导入',
        },
      },
      {
        name: 'GpuServerStatus',
        path: '/gpu-server-status',
        component: () => import('#/views/dashboard/gpu-server-status/index.vue'),
        meta: {
          icon: 'lucide:cpu',
          title: 'GPU服务器状态',
        },
      },
      {
        name: 'StorageServerStatus',
        path: '/storage-server-status',
        component: () => import('#/views/dashboard/storage-server-status/index.vue'),
        meta: {
          icon: 'lucide:hard-drive',
          title: '存储服务器状态',
        },
      },
      {
        name: 'CpuServerStatus',
        path: '/cpu-server-status',
        component: () => import('#/views/dashboard/cpu-server-status/index.vue'),
        meta: {
          icon: 'lucide:server',
          title: 'CPU服务器状态',
        },
      },
      {
        name: 'SwitchStatus',
        path: '/switch-status',
        component: () => import('#/views/dashboard/cluster/switch-status/index.vue'),
        meta: {
          icon: 'lucide:network',
          title: '交换机连接状态',
        },
      },
    ],
  },
];

export default routes;
