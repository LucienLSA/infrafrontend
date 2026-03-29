import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:server',
      order: 2,
      title: '集群测试',
    },
    name: 'ClusterTest',
    path: '/cluster-test',
    children: [
      {
        name: 'NcclTest',
        path: '/nccl-test',
        component: () => import('#/views/dashboard/cluster-test/nccl-test/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:cpu',
          title: 'NCCL测试',
        },
      },
      {
        name: 'ComputeTest',
        path: '/compute-test',
        component: () => import('#/views/dashboard/cluster-test/compute-test/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:zap',
          title: '算力测试',
        },
      },
    ],
  },
];

export default routes;
