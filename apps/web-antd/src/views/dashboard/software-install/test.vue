<template>
  <div>
    <h1>软件安装测试页面</h1>
    <p>如果您能看到这个页面，说明路由配置正常</p>
    <Button type="primary" @click="testClick">测试按钮</Button>
  </div>
</template>

<script setup>
import { Button } from 'ant-design-vue';

const testClick = () => {
  console.log('测试按钮被点击');
};
</script>

