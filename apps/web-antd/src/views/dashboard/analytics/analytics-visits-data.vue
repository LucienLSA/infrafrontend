<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

onMounted(() => {
  renderEcharts({
    grid: {
      bottom: 0,
      containLabel: true,
      left: '1%',
      right: '1%',
      top: '2%',
    },
    series: [
      {
        barMaxWidth: 80,
        data: [27, 25, 18, 15, 10, 5, 15, 20, 35],
        type: 'bar',
      },
    ],
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月'],
      type: 'category',
    },
    yAxis: {
      type: 'value',
    },
  });
});
</script>

<template>
  <EchartsUI ref="chartRef" />
</template>
