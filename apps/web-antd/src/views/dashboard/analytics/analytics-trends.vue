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
        data: [3, 4, 3.5, 5, 4.9, 6, 7, 9, 13],
        smooth: true,
        symbol: 'diamond',
        symbolSize: 8,
        type: 'line',
      },
    ],
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      data: ['1991', '1992', '1993', '1994', '1995', '1996', '1997', '1998', '1999'],
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
