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
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#ffffff' },
              { offset: 0.5, color: '#7ec2f3' },
              { offset: 1, color: '#1890ff' },
            ],
          },
        },
        data: [15468, 16100, 15900, 17409, 17000, 31056, 31982, 32040, 33233],
        smooth: true,
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
