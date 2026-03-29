import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: 1000,
      title: $t('page.softwarePackage.title'),
    },
    name: 'SoftwarePackage',
    path: '/software-package',
    component: () => import('#/views/dashboard/software-package/index.vue'),
    
  },
];

export default routes;