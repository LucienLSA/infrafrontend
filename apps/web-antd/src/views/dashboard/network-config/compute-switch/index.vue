<script lang="ts" setup>
import { ref } from 'vue';
import { Card, Button, Space } from 'ant-design-vue';

defineOptions({ name: 'ComputeSwitch' });

const loading = ref(false);

const generateConfig = () => {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    console.log('配置生成成功！');
  }, 2000);
};
</script>

<template>
  <div style="padding: 24px;">
    <!-- 页面标题 -->
    <div style="margin-bottom: 24px;">
      <h1 style="font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">计算交换机配置</h1>
      <p style="color: #666; margin: 0;">配置计算网络的交换机设备，包括端口分配、VLAN配置和网络参数设置。</p>
    </div>

    <!-- 操作菜单 -->
    <Card style="margin-bottom: 24px;">
      <Space size="large">
        <Button type="primary">
          确认端接表
        </Button>
        <Button>
          确认网络配置方案
        </Button>
        <Button>
          编辑模板
        </Button>
        <div style="margin-left: auto;">
          <Button 
            type="primary" 
            size="large"
            :loading="loading"
            @click="generateConfig"
          >
            生成配置
          </Button>
        </div>
      </Space>
    </Card>

    <!-- 配置内容 -->
    <Card>
      <p>计算交换机配置页面内容将在这里显示...</p>
    </Card>
  </div>
</template>

<style scoped>
.ant-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>