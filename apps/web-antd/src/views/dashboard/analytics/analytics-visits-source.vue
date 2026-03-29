<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

onMounted(() => {
  renderEcharts({
    series: [
      {
        data: [
          { name: '分类一', value: 27 },
          { name: '分类二', value: 25 },
          { name: '分类三', value: 18 },
          { name: '分类四', value: 15 },
          { name: '分类五', value: 10 },
          { name: '其他', value: 5 },
        ],
        label: {
          formatter: '{b}: {c} ({d}%)',
        },
        radius: ['40%', '70%'],
        type: 'pie',
      },
    ],
    tooltip: {
      trigger: 'item',
    },
  });
});
</script>

<template>
  <EchartsUI ref="chartRef" />
</template>
