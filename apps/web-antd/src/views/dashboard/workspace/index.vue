<script lang="ts" setup>
import type {
  WorkbenchQuickNavItem,
  WorkbenchTodoItem,
  WorkbenchTrendItem,
} from '@vben/common-ui';

import {
  WorkbenchHeader,
  WorkbenchQuickNav,
  WorkbenchTodo,
  WorkbenchTrends,
} from '@vben/common-ui';

defineOptions({ name: 'Workspace' });

// 同样，这里的 url 也可以使用以 http 开头的外部链接
const quickNavItems: WorkbenchQuickNavItem[] = [
  {
    color: '#1fdaca',
    icon: 'ion:home-outline',
    title: '首页',
    url: '/',
  },
  {
    color: '#bf0c2c',
    icon: 'ion:grid-outline',
    title: '仪表盘',
    url: '/dashboard',
  },
  {
    color: '#e18525',
    icon: 'ion:layers-outline',
    title: '组件',
    url: '/demos/features/icons',
  },
  {
    color: '#3fb27f',
    icon: 'ion:settings-outline',
    title: '系统管理',
    url: '/demos/features/login-expired', // 这里的 URL 是示例，实际项目中需要根据实际情况进行调整
  },
  {
    color: '#4daf1bc9',
    icon: 'ion:key-outline',
    title: '权限管理',
    url: '/demos/access/page-control',
  },
  {
    color: '#00d8ff',
    icon: 'ion:bar-chart-outline',
    title: '图表',
    url: '/analytics',
  },
];

const todoItems = ref<WorkbenchTodoItem[]>([
  {
    completed: false,
    content: `审查最近提交到Git仓库的前端代码，确保代码质量和规范。`,
    date: '2024-07-30 11:00:00',
    title: '审查前端代码提交',
  },
  {
    completed: true,
    content: `检查并优化系统性能，降低CPU使用率。`,
    date: '2024-07-30 11:00:00',
    title: '系统性能优化',
  },
  {
    completed: false,
    content: `进行系统安全检查，确保没有安全漏洞或未授权的访问。 `,
    date: '2024-07-30 11:00:00',
    title: '安全检查',
  },
  {
    completed: false,
    content: `更新项目中的所有npm依赖包，确保使用最新版本。`,
    date: '2024-07-30 11:00:00',
    title: '更新项目依赖',
  },
  {
    completed: false,
    content: `修复用户报告的页面UI显示问题，确保在不同浏览器中显示一致。 `,
    date: '2024-07-30 11:00:00',
    title: '修复UI显示问题',
  },
]);
const trendItems: WorkbenchTrendItem[] = [
  {
    date: '2024-07-30',
    title: 'Vue 3.4.0 发布',
    content: 'Vue 3.4.0 正式发布，带来了许多新特性和性能优化。',
    link: 'https://github.com/vuejs/core/releases/tag/v3.4.0',
  },
  {
    date: '2024-07-29',
    title: 'TypeScript 5.0 发布',
    content: 'TypeScript 5.0 正式发布，带来了许多新特性和性能优化。',
    link: 'https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/',
  },
  {
    date: '2024-07-28',
    title: 'Vite 5.0 发布',
    content: 'Vite 5.0 正式发布，带来了许多新特性和性能优化。',
    link: 'https://vitejs.dev/blog/announcing-vite5',
  },
];
</script>

<template>
  <div class="p-5">
    <WorkbenchHeader />

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
      <WorkbenchQuickNav :items="quickNavItems" />

      <WorkbenchTodo :items="todoItems" />
    </div>

    <WorkbenchTrends :items="trendItems" class="mt-5" />
  </div>
</template>


