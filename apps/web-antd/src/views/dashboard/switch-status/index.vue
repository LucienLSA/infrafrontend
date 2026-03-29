<script lang="ts" setup>
import { ref } from 'vue';
import { Card, Table, Tag, Button, Space, Input, Select, Row, Col, Statistic, Alert } from 'ant-design-vue';
import type { ColumnsType } from 'ant-design-vue/es/table';

// 简单的数据接口
interface SwitchConnection {
  id: string;
  name: string;
  ip: string;
  port: number;
  status: 'connected' | 'disconnected' | 'error';
  uptime: string;
  lastSeen: string;
  bandwidth: string;
  packets: number;
  errors: number;
  location: string;
  model: string;
  firmware: string;
}

// 模拟数据
const mockData: SwitchConnection[] = [
  {
    id: '1',
    name: '核心交换机-01',
    ip: '192.168.1.1',
    port: 24,
    status: 'connected',
    uptime: '15天 8小时 32分钟',
    lastSeen: '2024-01-15 14:30:25',
    bandwidth: '1Gbps',
    packets: 1250000,
    errors: 0,
    location: '机房A-机柜01',
    model: 'Cisco Catalyst 2960',
    firmware: '15.2(4)S6'
  },
  {
    id: '2',
    name: '接入交换机-02',
    ip: '192.168.1.2',
    port: 48,
    status: 'connected',
    uptime: '12天 5小时 15分钟',
    lastSeen: '2024-01-15 14:30:20',
    bandwidth: '100Mbps',
    packets: 890000,
    errors: 2,
    location: '机房A-机柜02',
    model: 'H3C S5120',
    firmware: '7.1.070, Release 2509P06'
  },
  {
    id: '3',
    name: '汇聚交换机-03',
    ip: '192.168.1.3',
    port: 24,
    status: 'disconnected',
    uptime: '0天 0小时 0分钟',
    lastSeen: '2024-01-15 10:15:30',
    bandwidth: '0Mbps',
    packets: 0,
    errors: 0,
    location: '机房B-机柜01',
    model: 'Huawei S5700',
    firmware: 'V200R010C00SPC600'
  },
  {
    id: '4',
    name: '边缘交换机-04',
    ip: '192.168.1.4',
    port: 16,
    status: 'error',
    uptime: '3天 12小时 45分钟',
    lastSeen: '2024-01-15 13:45:10',
    bandwidth: '50Mbps',
    packets: 450000,
    errors: 15,
    location: '机房C-机柜01',
    model: 'TP-Link T1600G',
    firmware: '1.0.0 Build 20171215'
  }
];

// 响应式数据
const loading = ref(false);
const searchText = ref('');
const statusFilter = ref<string>('all');
const switchData = ref<SwitchConnection[]>(mockData);
const filteredData = ref<SwitchConnection[]>(mockData);

// 统计数据
const stats = ref({
  total: mockData.length,
  connected: mockData.filter(item => item.status === 'connected').length,
  disconnected: mockData.filter(item => item.status === 'disconnected').length,
  error: mockData.filter(item => item.status === 'error').length,
  totalPackets: mockData.reduce((sum, item) => sum + item.packets, 0),
  totalErrors: mockData.reduce((sum, item) => sum + item.errors, 0)
});

// 表格列配置
const columns: ColumnsType<SwitchConnection> = [
  {
    title: '交换机名称',
    dataIndex: 'name',
    key: 'name',
    width: 150,
    sorter: (a, b) => a.name.localeCompare(b.name),
  },
  {
    title: 'IP地址',
    dataIndex: 'ip',
    key: 'ip',
    width: 120,
    sorter: (a, b) => a.ip.localeCompare(b.ip),
  },
  {
    title: '端口数',
    dataIndex: 'port',
    key: 'port',
    width: 80,
    sorter: (a, b) => a.port - b.port,
  },
  {
    title: '连接状态',
    dataIndex: 'status',
    key: 'status',
    width: 120,
  },
  {
    title: '运行时间',
    dataIndex: 'uptime',
    key: 'uptime',
    width: 150,
  },
  {
    title: '最后检测',
    dataIndex: 'lastSeen',
    key: 'lastSeen',
    width: 160,
  },
  {
    title: '带宽',
    dataIndex: 'bandwidth',
    key: 'bandwidth',
    width: 100,
  },
  {
    title: '数据包',
    dataIndex: 'packets',
    key: 'packets',
    width: 120,
    sorter: (a, b) => a.packets - b.packets,
  },
  {
    title: '错误数',
    dataIndex: 'errors',
    key: 'errors',
    width: 100,
    sorter: (a, b) => a.errors - b.errors,
  },
  {
    title: '位置',
    dataIndex: 'location',
    key: 'location',
    width: 150,
  },
  {
    title: '型号',
    dataIndex: 'model',
    key: 'model',
    width: 200,
  },
  {
    title: '固件版本',
    dataIndex: 'firmware',
    key: 'firmware',
    width: 150,
  },
];

// 简单的刷新函数
const refreshData = () => {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
  }, 1000);
};
</script>

<template>
  <div class="p-5">
    <!-- 页面标题和操作 -->
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-2xl font-bold">交换机连接状态</h1>
      <Space>
        <Button 
          type="primary" 
          :loading="loading"
          @click="refreshData"
        >
          刷新
        </Button>
      </Space>
    </div>

    <!-- 统计卡片 -->
    <Row :gutter="16" class="mb-4">
      <Col :span="6">
        <Card>
          <Statistic
            title="总交换机数"
            :value="stats.total"
            :value-style="{ color: '#1890ff' }"
          />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic
            title="已连接"
            :value="stats.connected"
            :value-style="{ color: '#52c41a' }"
          />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic
            title="未连接"
            :value="stats.disconnected"
            :value-style="{ color: '#d9d9d9' }"
          />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic
            title="错误状态"
            :value="stats.error"
            :value-style="{ color: '#ff4d4f' }"
          />
        </Card>
      </Col>
    </Row>

    <!-- 网络统计 -->
    <Row :gutter="16" class="mb-4">
      <Col :span="12">
        <Card>
          <Statistic
            title="总数据包"
            :value="stats.totalPackets"
            :formatter="(value) => value.toLocaleString()"
            :value-style="{ color: '#722ed1' }"
          />
        </Card>
      </Col>
      <Col :span="12">
        <Card>
          <Statistic
            title="总错误数"
            :value="stats.totalErrors"
            :value-style="{ color: stats.totalErrors > 0 ? '#ff4d4f' : '#52c41a' }"
          />
        </Card>
      </Col>
    </Row>

    <!-- 状态警告 -->
    <Alert
      v-if="stats.error > 0 || stats.disconnected > 0"
      :message="`检测到 ${stats.error} 个错误状态和 ${stats.disconnected} 个未连接设备`"
      type="warning"
      show-icon
      class="mb-4"
    />

    <!-- 搜索和过滤 -->
    <Card class="mb-4">
      <Row :gutter="16">
        <Col :span="8">
          <Input
            v-model:value="searchText"
            placeholder="搜索交换机名称、IP、位置或型号"
            allow-clear
          />
        </Col>
        <Col :span="6">
          <Select
            v-model:value="statusFilter"
            placeholder="选择状态"
            style="width: 100%"
          >
            <SelectOption value="all">全部状态</SelectOption>
            <SelectOption value="connected">已连接</SelectOption>
            <SelectOption value="disconnected">未连接</SelectOption>
            <SelectOption value="error">错误状态</SelectOption>
          </Select>
        </Col>
      </Row>
    </Card>

    <!-- 数据表格 -->
    <Card>
      <Table
        :columns="columns"
        :data-source="switchData"
        :pagination="{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
        }"
        row-key="id"
        :scroll="{ x: 1500 }"
      />
    </Card>
  </div>
</template>

<style scoped>
.ant-card {
  margin-bottom: 16px;
}

.ant-statistic-title {
  font-size: 14px;
  color: #666;
}

.ant-statistic-content {
  font-size: 24px;
  font-weight: 600;
}
</style>
