import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:hard-drive-download',
      order: -1,
      title: '批量装机',
    },
    name: 'BatchInstall',
    path: '/batch-install',
    children: [
      {
        name: 'InstallTemplates',
        path: '/install-templates',
        component: () => import('#/views/dashboard/install-templates/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:template',
          title: '安装模板',
        },
      },
      {
        name: 'ServerSelection',
        path: '/server-selection',
        component: () => import('#/views/dashboard/server-selection/index.vue'),
        meta: {
          icon: 'lucide:server',
          title: '服务器选择',
        },
      },
      {
        name: 'InstallProgress',
        path: '/install-progress',
        component: () => import('#/views/dashboard/install-progress/index.vue'),
        meta: {
          icon: 'lucide:activity',
          title: '安装进度',
        },
      },
      {
        name: 'InstallHistory',
        path: '/install-history',
        component: () => import('#/views/dashboard/install-history/index.vue'),
        meta: {
          icon: 'lucide:history',
          title: '安装历史',
        },
      },
      {
        name: 'SoftwareInstall',
        path: '/software-install',
        component: () => import('#/views/dashboard/software-install/simple.vue'),
        meta: {
          icon: 'lucide:package',
          title: '软件功能模块安装',
        },
      },
    ],
  },
];

export default routes;

