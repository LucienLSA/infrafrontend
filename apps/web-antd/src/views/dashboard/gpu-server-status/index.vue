<script lang="ts" setup>
import { ref, onMounted, nextTick } from 'vue';
import { Card, Row, Col, Tag, Button, Space, Statistic, Alert, Modal, Spin, message } from 'ant-design-vue';
import {
  getMuxiServers,
  getMuxiServerStats,
  refreshMuxiServer,
  getMuxiServerDetail,
  type MuxiServer
} from '@/api/muxi-server';

// 沐曦服务器接口(带监控数据)
interface ServerWithMetrics extends MuxiServer {
  // 性能监控信息
  gpuUsage?: string;
  memoryUsage?: string;
  temperature?: string;
  powerUsage?: string;
  fanSpeed?: string;
  processesCount?: number;
  uptime?: string;
  driverVersion?: string;
  cudaVersion?: string;
  // 基本系统信息
  os?: string;
  kernel?: string;
  totalMemory?: string;
  cpuCores?: number;
  lastUpdate?: string;
}

// 数据状态
const servers = ref<ServerWithMetrics[]>([]);
const stats = ref<MuxiServer.Stats>({
  total: 0,
  online: 0,
  offline: 0,
  error: 0
});
const loading = ref(false);
const selectedServer = ref<ServerWithMetrics | null>(null);
const modalVisible = ref(false);

// 页面配置
const PAGE_TITLE = 'GPU服务器状态';
const PAGE_DESCRIPTION = '监控沐曦GPU服务器的运行状态和资源使用情况';

// 将后端snake_case数据转换为前端所需格式
const transformServerData = (data: MuxiServer): ServerWithMetrics => {
  return {
    ...data,
    // 字段映射 (snake_case -> camelCase)
    gpuCount: data.gpu_count,
    gpuModel: data.gpu_model,
    lastSeen: data.last_seen,
  };
};

// 获取服务器列表
const fetchServers = async () => {
  try {
    loading.value = true;
    const data = await getMuxiServers();
    servers.value = data.map(transformServerData);
    console.log(`${PAGE_TITLE}数据获取成功:`, servers.value);
  } catch (error: any) {
    console.error(`获取${PAGE_TITLE}数据失败:`, error);
    if (error.response?.status === 401) {
      message.error('请重新登录');
    } else {
      message.error(`获取${PAGE_TITLE}数据失败`);
    }
  } finally {
    loading.value = false;
  }
};

// 获取统计数据
const fetchStats = async () => {
  try {
    const data = await getMuxiServerStats();
    stats.value = data;
    console.log('统计数据获取成功:', stats.value);
  } catch (error: any) {
    console.error('获取统计数据失败:', error);
    if (error.response?.status === 401) {
      message.error('请重新登录');
    } else {
      message.error('获取统计数据失败');
    }
  }
};

// 刷新数据(简化为普通请求刷新)
const refreshData = async () => {
  try {
    loading.value = true;
    message.loading(`正在刷新${PAGE_TITLE}数据...`, 0);

    await refreshMuxiServer();

    message.destroy();
    message.success('刷新成功');

    // 重新获取数据和统计
    await Promise.all([fetchServers(), fetchStats()]);
  } catch (error: any) {
    console.error(`刷新${PAGE_TITLE}数据失败:`, error);
    message.destroy();
    if (error.response?.status === 401) {
      message.error('请重新登录');
    } else {
      message.error(`刷新${PAGE_TITLE}数据失败`);
    }
  } finally {
    loading.value = false;
  }
};

// 显示服务器详细信息弹窗
const showServerDetails = (server: ServerWithMetrics) => {
  selectedServer.value = server;
  modalVisible.value = true;
};

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    online: '#52c41a',
    offline: '#d9d9d9',
    error: '#ff4d4f',
    maintenance: '#faad14'
  };
  return colorMap[status] || '#d9d9d9';
};

// 获取状态文本
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    online: '在线',
    offline: '离线',
    error: '错误',
    maintenance: '维护中'
  };
  return textMap[status] || '未知';
};

// 格式化时间
const formatTime = (timeString: string) => {
  if (!timeString) return '未知';
  const date = new Date(timeString);
  return date.toLocaleString('zh-CN');
};

// 获取使用率颜色
const getUsageColor = (usage?: string) => {
  if (!usage) return 'text-gray-500';
  const value = parseFloat(usage.replace('%', ''));
  if (value >= 90) return 'text-red-600';
  if (value >= 70) return 'text-orange-600';
  if (value >= 50) return 'text-yellow-600';
  return 'text-green-600';
};

// 获取温度颜色
const getTemperatureColor = (temp?: string) => {
  if (!temp) return 'text-gray-500';
  const value = parseFloat(temp.replace('°C', ''));
  if (value >= 80) return 'text-red-600';
  if (value >= 60) return 'text-orange-600';
  if (value >= 40) return 'text-yellow-600';
  return 'text-green-600';
};

// 获取功率颜色
const getPowerColor = (power?: string) => {
  if (!power) return 'text-gray-500';
  const value = parseFloat(power.replace('W', ''));
  if (value >= 300) return 'text-red-600';
  if (value >= 200) return 'text-orange-600';
  if (value >= 100) return 'text-yellow-600';
  return 'text-green-600';
};

// 获取风扇转速颜色
const getFanSpeedColor = (speed?: string) => {
  if (!speed) return 'text-gray-500';
  const value = parseFloat(speed.replace('%', '').replace('RPM', ''));
  if (value >= 80) return 'text-orange-600';
  if (value >= 50) return 'text-yellow-600';
  return 'text-green-600';
};

// 组件挂载时获取数据
onMounted(async () => {
  await Promise.all([fetchServers(), fetchStats()]);
});
</script>

<template>
  <div class="p-5">
    <!-- 页面标题和操作 -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold mb-2">{{ PAGE_TITLE }}</h1>
        <p class="text-gray-600">{{ PAGE_DESCRIPTION }}</p>
      </div>
      <Space>
        <Button type="primary" @click="refreshData" :loading="loading">
          刷新数据
        </Button>
      </Space>
    </div>

    <!-- 统计概览 -->
    <Row :gutter="16" class="mb-6">
      <Col :span="6">
        <Card>
          <Statistic
            title="总服务器数"
            :value="stats.total"
            :value-style="{ color: '#1890ff' }"
          />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic
            title="在线服务器"
            :value="stats.online"
            :value-style="{ color: '#52c41a' }"
          />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic
            title="离线服务器"
            :value="stats.offline"
            :value-style="{ color: '#d9d9d9' }"
          />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic
            title="错误服务器"
            :value="stats.error"
            :value-style="{ color: '#ff4d4f' }"
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

    <!-- GPU服务器自适应矩形网格 -->
    <div class="server-grid">
      <Spin v-if="loading" tip="加载中..." style="width: 100%; height: 400px; display: flex; align-items: center; justify-content: center;">
        <div style="width: 100%; height: 100%;"></div>
      </Spin>
      <template v-else>
        <div
          v-for="server in servers"
          :key="server.id"
          class="server-rectangle"
          :style="{ borderLeftColor: getStatusColor(server.status), borderLeftWidth: '4px' }"
          @click="showServerDetails(server)"
        >
          <!-- 服务器名称和状态 -->
          <div class="server-header">
            <div class="server-name">{{ server.name }}</div>
                <Tag :color="getStatusColor(server.status)" size="small">
                  {{ getStatusText(server.status) }}
                </Tag>
              </div>

          <!-- 基本信息展示 -->
          <div class="server-info-grid">
            <div class="info-item">
              <div class="info-label">IP地址</div>
              <div class="info-value font-mono">{{ server.ip }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">GPU数量</div>
              <div class="info-value">{{ server.gpu_count }} 个</div>
              </div>
            <div class="info-item">
              <div class="info-label">显存</div>
              <div class="info-value">{{ server.memory }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">位置</div>
              <div class="info-value">{{ server.location }}</div>
                </div>
              </div>

          <!-- 性能指标预览 -->
          <div class="performance-preview">
            <div class="perf-item">
              <span class="perf-label">GPU:</span>
              <span class="perf-value" :class="getUsageColor(server.gpuUsage)">{{ server.gpuUsage || '未知' }}</span>
            </div>
            <div class="perf-item">
              <span class="perf-label">显存:</span>
              <span class="perf-value" :class="getUsageColor(server.memoryUsage)">{{ server.memoryUsage || '未知' }}</span>
            </div>
            <div class="perf-item">
              <span class="perf-label">温度:</span>
              <span class="perf-value" :class="getTemperatureColor(server.temperature)">{{ server.temperature || '未知' }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 详细信息弹窗 -->
    <Modal
      v-model:open="modalVisible"
      :title="selectedServer ? `${selectedServer.name} - 详细信息` : ''"
      width="600px"
      :footer="null"
      class="server-details-modal"
    >
      <div v-if="selectedServer" class="compact-modal-content">
        <!-- 服务器状态概览 -->
        <div class="server-overview">
          <div class="status-badge" :style="{ backgroundColor: getStatusColor(selectedServer.status) }">
            {{ getStatusText(selectedServer.status) }}
          </div>
          <div class="server-ip">{{ selectedServer.ip }}</div>
          <div class="server-location">{{ selectedServer.location }}</div>
        </div>

        <!-- 关键指标卡片 -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">GPU使用率</div>
            <div class="metric-value" :class="getUsageColor(selectedServer.gpuUsage)">
              {{ selectedServer.gpuUsage || '未知' }}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">显存使用率</div>
            <div class="metric-value" :class="getUsageColor(selectedServer.memoryUsage)">
              {{ selectedServer.memoryUsage || '未知' }}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">GPU温度</div>
            <div class="metric-value" :class="getTemperatureColor(selectedServer.temperature)">
              {{ selectedServer.temperature || '未知' }}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">功率消耗</div>
            <div class="metric-value" :class="getPowerColor(selectedServer.powerUsage)">
              {{ selectedServer.powerUsage || '未知' }}
            </div>
          </div>
        </div>

        <!-- 硬件信息 -->
        <div class="hardware-info">
          <div class="info-row">
            <span class="label">GPU型号:</span>
            <span class="value">{{ selectedServer.gpu_model }}</span>
          </div>
          <div class="info-row">
            <span class="label">GPU数量:</span>
            <span class="value">{{ selectedServer.gpu_count }} 个</span>
          </div>
          <div class="info-row">
            <span class="label">总显存:</span>
            <span class="value">{{ selectedServer.memory }}</span>
          </div>
          <div class="info-row">
            <span class="label">CPU核心:</span>
            <span class="value">{{ selectedServer.cpuCores || '未知' }} 核</span>
          </div>
          <div class="info-row">
            <span class="label">操作系统:</span>
            <span class="value">{{ selectedServer.os || '未知' }}</span>
          </div>
          <div class="info-row">
            <span class="label">驱动版本:</span>
            <span class="value">{{ selectedServer.driverVersion || '未知' }}</span>
          </div>
          <div class="info-row">
            <span class="label">CUDA版本:</span>
            <span class="value">{{ selectedServer.cudaVersion || '未知' }}</span>
          </div>
        </div>

        <!-- 系统状态 -->
        <div class="system-status">
          <div class="status-item">
            <span class="status-label">运行时间:</span>
            <span class="status-value">{{ selectedServer.uptime || '未知' }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">进程数量:</span>
            <span class="status-value">{{ selectedServer.processesCount || '未知' }} 个</span>
          </div>
          <div class="status-item">
            <span class="status-label">风扇转速:</span>
            <span class="status-value" :class="getFanSpeedColor(selectedServer.fanSpeed)">
              {{ selectedServer.fanSpeed || '未知' }}
            </span>
          </div>
        </div>

        <!-- 最后检测时间 -->
        <div class="last-check">
          最后检测: {{ formatTime(selectedServer.last_seen) }}
        </div>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
/* 自适应服务器网格 */
.server-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px 0;
}

/* 服务器矩形卡片 */
.server-rectangle {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.server-rectangle:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #3b82f6;
}

.server-rectangle::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.server-rectangle:hover::before {
  opacity: 1;
}

/* 服务器头部 */
.server-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.server-name {
  font-size: 26px;
  font-weight: 600;
  color: #1e293b;
}

/* 服务器信息网格 */
.server-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.info-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.info-label {
  color: #64748b;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
  display: block;
}

.info-value {
  color: #1e293b;
  font-size: 18px;
  font-weight: 600;
  display: block;
}

/* 性能预览 */
.performance-preview {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.perf-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.perf-label {
  color: #64748b;
  font-size: 15px;
  margin-bottom: 2px;
}

.perf-value {
  font-size: 17px;
  font-weight: 600;
}

/* 弹窗样式 */
.server-details-modal .ant-modal-body {
  padding: 20px;
}

.compact-modal-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 服务器概览 */
.server-overview {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.status-badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
}

.server-ip {
  font-size: 26px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
  font-family: 'Courier New', monospace;
}

.server-location {
  color: #64748b;
  font-size: 18px;
}

/* 关键指标网格 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.metric-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  transition: all 0.2s ease;
}

.metric-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.metric-label {
  color: #64748b;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
}

/* 硬件信息 */
.hardware-info {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .label {
  color: #64748b;
  font-size: 18px;
  font-weight: 500;
}

.info-row .value {
  color: #1e293b;
  font-size: 18px;
  font-weight: 600;
}

/* 系统状态 */
.system-status {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.status-label {
  color: #64748b;
  font-size: 18px;
}

.status-value {
  color: #1e293b;
  font-size: 18px;
  font-weight: 600;
}

/* 最后检测时间 */
.last-check {
  text-align: center;
  color: #9ca3af;
  font-size: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
}

/* 统计卡片样式 */
.ant-card {
  margin-bottom: 0;
}

.ant-statistic-title {
  font-size: 18px;
  color: #666;
}

.ant-statistic-content {
  font-size: 28px;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .server-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .server-info-grid {
    grid-template-columns: 1fr;
  }

  .performance-preview {
    flex-direction: column;
    gap: 8px;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 1200px) {
  .server-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
}

@media (min-width: 1600px) {
  .server-grid {
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  }
}
</style>