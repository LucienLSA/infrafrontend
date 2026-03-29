<script lang="ts" setup>
import { ref } from 'vue';
import { Card, Row, Col, Tag, Button, Space, Statistic, Alert } from 'ant-design-vue';

// 存储服务器接口
interface StorageServer {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'error' | 'maintenance';
  ip: string;
  storageType: string;
  totalCapacity: string;
  usedCapacity: string;
  location: string;
  lastSeen: string;
}

// 模拟数据
const storageServers = ref<StorageServer[]>([
  {
    id: '1',
    name: 'Storage-Server-01',
    status: 'online',
    ip: '192.168.1.20',
    storageType: 'SAN',
    totalCapacity: '100TB',
    usedCapacity: '65TB',
    location: '机房A-机柜03',
    lastSeen: '2024-01-15 14:30:25'
  },
  {
    id: '2',
    name: 'Storage-Server-02',
    status: 'online',
    ip: '192.168.1.21',
    storageType: 'NAS',
    totalCapacity: '50TB',
    usedCapacity: '32TB',
    location: '机房A-机柜04',
    lastSeen: '2024-01-15 14:30:20'
  },
  {
    id: '3',
    name: 'Storage-Server-03',
    status: 'error',
    ip: '192.168.1.22',
    storageType: 'DAS',
    totalCapacity: '20TB',
    usedCapacity: '18TB',
    location: '机房B-机柜03',
    lastSeen: '2024-01-15 10:15:30'
  },
  {
    id: '4',
    name: 'Storage-Server-04',
    status: 'offline',
    ip: '192.168.1.23',
    storageType: 'SAN',
    totalCapacity: '80TB',
    usedCapacity: '45TB',
    location: '机房B-机柜04',
    lastSeen: '2024-01-15 08:45:10'
  },
  {
    id: '5',
    name: 'Storage-Server-05',
    status: 'maintenance',
    ip: '192.168.1.24',
    storageType: 'NAS',
    totalCapacity: '200TB',
    usedCapacity: '120TB',
    location: '机房C-机柜03',
    lastSeen: '2024-01-15 12:30:15'
  },
  {
    id: '6',
    name: 'Storage-Server-06',
    status: 'online',
    ip: '192.168.1.25',
    storageType: 'SAN',
    totalCapacity: '150TB',
    usedCapacity: '90TB',
    location: '机房C-机柜04',
    lastSeen: '2024-01-15 14:25:40'
  }
]);

// 统计数据
const stats = ref({
  total: storageServers.value.length,
  online: storageServers.value.filter(s => s.status === 'online').length,
  offline: storageServers.value.filter(s => s.status === 'offline').length,
  error: storageServers.value.filter(s => s.status === 'error').length,
  maintenance: storageServers.value.filter(s => s.status === 'maintenance').length,
  totalCapacity: '600TB',
  usedCapacity: '370TB'
});

// 展开/折叠状态
const expandedCards = ref<Set<string>>(new Set());

// 切换卡片展开状态
const toggleCard = (serverId: string) => {
  if (expandedCards.value.has(serverId)) {
    expandedCards.value.delete(serverId);
  } else {
    expandedCards.value.add(serverId);
  }
};

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colorMap = {
    online: '#52c41a',
    offline: '#d9d9d9',
    error: '#ff4d4f',
    maintenance: '#faad14'
  };
  return colorMap[status] || '#d9d9d9';
};

// 获取状态文本
const getStatusText = (status: string) => {
  const textMap = {
    online: '在线',
    offline: '离线',
    error: '错误',
    maintenance: '维护中'
  };
  return textMap[status] || '未知';
};

// 计算使用率
const getUsagePercentage = (used: string, total: string) => {
  const usedNum = parseFloat(used.replace('TB', ''));
  const totalNum = parseFloat(total.replace('TB', ''));
  return Math.round((usedNum / totalNum) * 100);
};

// 刷新数据
const refreshData = () => {
  console.log('刷新存储服务器数据');
};
</script>

<template>
  <div class="p-5">
    <!-- 页面标题和操作 -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold mb-2">存储服务器状态</h1>
        <p class="text-gray-600">监控存储服务器的运行状态和存储容量使用情况</p>
      </div>
      <Space>
        <Button type="primary" @click="refreshData">
          刷新数据
        </Button>
      </Space>
    </div>

    <!-- 统计概览 -->
    <Row :gutter="16" class="mb-6">
      <Col :span="4">
        <Card>
          <Statistic
            title="总服务器数"
            :value="stats.total"
            :value-style="{ color: '#1890ff' }"
          />
        </Card>
      </Col>
      <Col :span="4">
        <Card>
          <Statistic
            title="在线服务器"
            :value="stats.online"
            :value-style="{ color: '#52c41a' }"
          />
        </Card>
      </Col>
      <Col :span="4">
        <Card>
          <Statistic
            title="离线服务器"
            :value="stats.offline"
            :value-style="{ color: '#d9d9d9' }"
          />
        </Card>
      </Col>
      <Col :span="4">
        <Card>
          <Statistic
            title="错误服务器"
            :value="stats.error"
            :value-style="{ color: '#ff4d4f' }"
          />
        </Card>
      </Col>
      <Col :span="4">
        <Card>
          <Statistic
            title="维护中"
            :value="stats.maintenance"
            :value-style="{ color: '#faad14' }"
          />
        </Card>
      </Col>
      <Col :span="4">
        <Card>
          <Statistic
            title="总容量"
            :value="stats.totalCapacity"
            :value-style="{ color: '#722ed1' }"
          />
        </Card>
      </Col>
    </Row>

    <!-- 状态警告 -->
    <Alert
      v-if="stats.error > 0 || stats.offline > 0"
      :message="`检测到 ${stats.error} 个错误服务器和 ${stats.offline} 个离线服务器`"
      type="warning"
      show-icon
      class="mb-6"
    />

    <!-- 存储服务器卡片网格 -->
    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
      <Card
        v-for="server in storageServers"
        :key="server.id"
        class="server-card"
        :style="{ borderLeftColor: getStatusColor(server.status), borderLeftWidth: '4px' }"
        size="small"
      >
        <template #title>
          <div class="flex items-center justify-between">
            <span class="font-semibold text-sm">{{ server.name }}</span>
            <div class="flex items-center gap-2">
              <Tag :color="getStatusColor(server.status)" size="small">
                {{ getStatusText(server.status) }}
              </Tag>
              <button 
                @click="toggleCard(server.id)"
                class="text-blue-500 hover:text-blue-700 text-xs underline cursor-pointer bg-transparent border-none p-0"
              >
                {{ expandedCards.has(server.id) ? '收起' : '展开' }}
              </button>
            </div>
          </div>
        </template>

        <!-- 可折叠的详细信息 -->
        <div v-if="expandedCards.has(server.id)" class="space-y-2 text-xs">
          <!-- 基本信息 -->
          <div class="grid grid-cols-1 gap-1">
            <div>
              <span class="text-gray-500">IP地址:</span>
              <div class="font-mono">{{ server.ip }}</div>
            </div>
            <div>
              <span class="text-gray-500">位置:</span>
              <div>{{ server.location }}</div>
            </div>
          </div>

          <!-- 存储信息 -->
          <div class="bg-gray-50 p-2 rounded">
            <div class="space-y-1">
              <div class="flex justify-between">
                <span class="text-gray-500">存储类型:</span>
                <span class="font-semibold">{{ server.storageType }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">总容量:</span>
                <span>{{ server.totalCapacity }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">已使用:</span>
                <span>{{ server.usedCapacity }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">使用率:</span>
                <span :class="getUsagePercentage(server.usedCapacity, server.totalCapacity) > 80 ? 'text-red-500' : 'text-green-500'">
                  {{ getUsagePercentage(server.usedCapacity, server.totalCapacity) }}%
                </span>
              </div>
            </div>
          </div>

          <!-- 最后检测时间 -->
          <div class="text-xs text-gray-400">
            最后检测: {{ server.lastSeen }}
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.server-card {
  transition: all 0.3s ease;
  cursor: pointer;
}

.server-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.ant-card {
  margin-bottom: 0;
}

.ant-statistic-title {
  font-size: 14px;
  color: #666;
}

.ant-statistic-content {
  font-size: 20px;
  font-weight: 600;
}

.grid {
  display: grid;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 768px) {
  .md\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .lg\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .xl\:grid-cols-6 {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

.gap-4 {
  gap: 1rem;
}

.space-y-3 > * + * {
  margin-top: 0.75rem;
}

.space-y-1 > * + * {
  margin-top: 0.25rem;
}
</style>
