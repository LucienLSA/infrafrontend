<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue';
import {
  Card,
  Button,
  Row,
  Col,
  Statistic,
  Alert,
  Progress,
  Space,
} from 'ant-design-vue';



// 集群信息接口
interface DeviceInfo {
  id: string;
  name: string;
  type: 'switch' | 'router' | 'server' | 'firewall' | 'gpu_server' | 'storage_server' | 'cpu_server' | 'other';
  ip: string;
  username: string;
  password: string;
  port: number;
  location: string;
  description: string;
  status: 'active' | 'inactive';
  rackName?: string;
  uPosition?: number;
  coordinates?: {
    x: number;
    y: number;
    z: number;
  };
  managementIP?: string;
  businessIP?: string;
  iboIP?: string;
  roceIP?: string;
  os?: string;
  loginMethod?: string;
}

// 集群信息接口
interface ClusterInfo {
  name: string;
  description: string;
  devices: DeviceInfo[];
  connections: any[];
}

// 响应式数据
const loading = ref(false);

// 进度数据
const progressData = reactive({
  rackMounting: { completed: 0, total: 0, percentage: 0 }, // 上架进度
  osInstallation: { completed: 0, total: 0, percentage: 0 }, // 操作系统安装
  networkRackMounting: { completed: 0, total: 0, percentage: 0 }, // 网络设备上架
  softwareConfig: { completed: 0, total: 0, percentage: 0 }, // 软件配置
  singleNodeTesting: { completed: 0, total: 0, percentage: 0 }, // 单机压测
  clusterTesting: { completed: 0, total: 0, percentage: 0 } // 集群测试
});

// 集群数据
const clusterData = reactive({
  name: '生产集群-01',
  description: '主要生产环境集群',
  devices: [],
  connections: []
});

// 获取部署进度数据
const loadProgressData = async () => {
  try {
    console.log('📊 开始加载部署进度数据...');

    const response = await fetch('/api/v1/env-check/deployment-progress');
    if (!response.ok) {
      console.error('❌ 获取进度数据失败:', response.status, response.statusText);
      return;
    }

    const result = await response.json();
    if (result.code === 0 && result.data) {
      const progress = result.data;

      // 更新进度数据
      progressData.rackMounting = progress.rackMounting || { completed: 0, total: 0, percentage: 0 };
      progressData.osInstallation = progress.osInstallation || { completed: 0, total: 0, percentage: 0 };
      progressData.networkRackMounting = progress.networkRackMounting || { completed: 0, total: 0, percentage: 0 };
      progressData.softwareConfig = progress.softwareConfig || { completed: 0, total: 0, percentage: 0 };
      progressData.singleNodeTesting = progress.singleNodeTesting || { completed: 0, total: 0, percentage: 0 };
      progressData.clusterTesting = progress.clusterTesting || { completed: 0, total: 0, percentage: 0 };

      console.log('✅ 部署进度数据加载完成');
    }
  } catch (error) {
    console.error('❌ 加载部署进度数据失败:', error);
  }
};

// 从数据库加载已保存的数据
const loadSavedData = async () => {
  try {
    console.log('🔄 开始加载已保存的数据...');

    // 添加时间戳防止缓存
    const timestamp = Date.now();
    const response = await fetch(`/api/v1/env-check/excel-data?_t=${timestamp}`);

    if (!response.ok) {
      console.error('❌ API请求失败:', response.status, response.statusText);
      return;
    }

    const result = await response.json();

    if (result.code === 0 && result.data && result.data.data && result.data.data.length > 0) {
      // 将数据库中的Excel数据转换为前端设备格式
      const excelData = result.data.data;
      console.log(`📊 准备加载 ${excelData.length} 条设备数据`);

      // 清空现有数据
      clusterData.devices = [];

      excelData.forEach((row: any, index: number) => {
        const device: DeviceInfo = {
          id: `excel_${row.id || index}`,
          name: row['主机名_设备标签名'] || row['设备名称'] || `设备-${index + 1}`,
          type: getDeviceTypeFromText(row['设备角色'] || 'server'),
          ip: row['带外IP'] || row['业务管理IP'] || 'unknown',
          username: 'admin',
          password: 'password',
          port: 22,
          location: row['设备机柜'] || '未分配',
          description: row['设备用途'] || '设备',
          status: 'active',
          rackName: row['设备机柜'] || `Excel机柜-${Math.floor(index / 8) + 1}`,
          uPosition: row['设备U位'] || (index % 8) + 1,
          coordinates: {
            x: Math.floor(index / 8) * 2.4,
            y: 0,
            z: (index % 8) * 0.44
          },
          managementIP: row['业务管理IP'],
          businessIP: row['业务管理IP'],
          iboIP: row['IB0计算IP地址'],
          roceIP: row['RoCE0存储IP地址'],
          os: row['操作系统版本']
        };
        clusterData.devices.push(device);
      });

      console.log(`✅ 成功加载 ${excelData.length} 条设备数据到前端`);

      // 强制触发Vue响应式更新
      clusterData.devices = [...clusterData.devices];

      // 同时加载进度数据
      await loadProgressData();
    }
  } catch (error) {
    console.error('❌ 加载已保存数据失败:', error);
  }
};

// 设备类型转换函数
const getDeviceTypeFromText = (roleText: string): DeviceInfo['type'] => {
  const role = roleText.toLowerCase();
  if (role.includes('服务器') || role.includes('server')) return 'server';
  if (role.includes('交换机') || role.includes('switch')) return 'switch';
  if (role.includes('路由器') || role.includes('router')) return 'router';
  if (role.includes('防火墙') || role.includes('firewall')) return 'firewall';
  if (role.includes('存储') || role.includes('storage')) return 'storage_server';
  return 'other';
};

// 刷新数据
const refreshData = async () => {
  loading.value = true;
  try {
    console.log('🔄 手动刷新数据...');
    await loadSavedData();
    await loadProgressData();
  } catch (error) {
    console.error('❌ 刷新数据失败:', error);
  } finally {
    loading.value = false;
  }
};

// 组件挂载时加载数据
onMounted(async () => {
  await loadSavedData();
});
</script>

<template>
  <div class="p-5">
    <!-- 页面标题和操作 -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold mb-2">集群概览</h1>
        <p class="text-gray-600">集群部署进度和状态监控</p>
      </div>
      <Space>
        <Button type="primary" :loading="loading" @click="refreshData">
          刷新数据
        </Button>
      </Space>
    </div>

    <!-- 集群概览 -->
    <Card class="mb-6">
      <template #title>
        <span class="text-lg font-semibold">集群概览</span>
      </template>

      <Row :gutter="16">
        <Col :span="6">
          <Statistic title="集群名称" :value="clusterData.name" />
        </Col>
        <Col :span="6">
          <Statistic title="设备数量" :value="clusterData.devices.length" />
        </Col>
        <Col :span="6">
          <Statistic title="连接数量" :value="clusterData.connections.length" />
        </Col>
        <Col :span="6">
          <Statistic title="活跃设备" :value="clusterData.devices.filter(d => d.status === 'active').length" />
        </Col>
      </Row>

      <Alert
        :message="clusterData.description"
        type="info"
        show-icon
        class="mt-4"
      />
    </Card>

    <!-- 部署进度 -->
    <Card class="mb-6">
      <template #title>
        <span class="text-lg font-semibold">部署进度</span>
      </template>

      <Row :gutter="24">
        <Col :span="8" class="mb-6">
          <div class="circular-progress-container rack-mounting">
            <div class="progress-content">
              <div class="circular-progress" :style="{ '--progress': progressData.rackMounting.percentage }">
                <div class="progress-circle">
                  <div class="progress-text">{{ Math.round(progressData.rackMounting.percentage) }}%</div>
                </div>
              </div>
              <div class="progress-info">
                <div class="progress-label">上架进度</div>
                <div class="progress-detail">{{ progressData.rackMounting.completed }}/{{ progressData.rackMounting.total }}</div>
                <div class="progress-description">以BMC是否联通为标准</div>
              </div>
            </div>
          </div>
        </Col>

        <Col :span="8" class="mb-6">
          <div class="circular-progress-container os-installation">
            <div class="progress-content">
              <div class="circular-progress" :style="{ '--progress': progressData.osInstallation.percentage }">
                <div class="progress-circle">
                  <div class="progress-text">{{ Math.round(progressData.osInstallation.percentage) }}%</div>
                </div>
              </div>
              <div class="progress-info">
                <div class="progress-label">操作系统完成进度</div>
                <div class="progress-detail">{{ progressData.osInstallation.completed }}/{{ progressData.osInstallation.total }}</div>
                <div class="progress-description">以业务网联通为标准</div>
              </div>
            </div>
          </div>
        </Col>

        <Col :span="8" class="mb-6">
          <div class="circular-progress-container network-mounting">
            <div class="progress-content">
              <div class="circular-progress" :style="{ '--progress': progressData.networkRackMounting.percentage }">
                <div class="progress-circle">
                  <div class="progress-text">{{ Math.round(progressData.networkRackMounting.percentage) }}%</div>
                </div>
              </div>
              <div class="progress-info">
                <div class="progress-label">网络设备上架进度</div>
                <div class="progress-detail">{{ progressData.networkRackMounting.completed }}/{{ progressData.networkRackMounting.total }}</div>
                <div class="progress-description">以交换机管理网联通为标准</div>
              </div>
            </div>
          </div>
        </Col>

        <Col :span="8" class="mb-6">
          <div class="circular-progress-container software-config">
            <div class="progress-content">
              <div class="circular-progress" :style="{ '--progress': progressData.softwareConfig.percentage }">
                <div class="progress-circle">
                  <div class="progress-text">{{ Math.round(progressData.softwareConfig.percentage) }}%</div>
                </div>
              </div>
              <div class="progress-info">
                <div class="progress-label">软件配置进度</div>
                <div class="progress-detail">{{ progressData.softwareConfig.completed }}/{{ progressData.softwareConfig.total }}</div>
                <div class="progress-description">设备检测通过台数</div>
              </div>
            </div>
          </div>
        </Col>

        <Col :span="8" class="mb-6">
          <div class="circular-progress-container single-testing">
            <div class="progress-content">
              <div class="circular-progress" :style="{ '--progress': progressData.singleNodeTesting.percentage }">
                <div class="progress-circle">
                  <div class="progress-text">{{ Math.round(progressData.singleNodeTesting.percentage) }}%</div>
                </div>
              </div>
              <div class="progress-info">
                <div class="progress-label">单机压测进度</div>
                <div class="progress-detail">{{ progressData.singleNodeTesting.completed }}/{{ progressData.singleNodeTesting.total }}</div>
                <div class="progress-description">压测通过台数</div>
              </div>
            </div>
          </div>
        </Col>

        <Col :span="8" class="mb-6">
          <div class="circular-progress-container cluster-testing">
            <div class="progress-content">
              <div class="circular-progress" :style="{ '--progress': progressData.clusterTesting.percentage }">
                <div class="progress-circle">
                  <div class="progress-text">{{ Math.round(progressData.clusterTesting.percentage) }}%</div>
                </div>
              </div>
              <div class="progress-info">
                <div class="progress-label">集群测试进度</div>
                <div class="progress-detail">{{ progressData.clusterTesting.completed }}/{{ progressData.clusterTesting.total }}</div>
                <div class="progress-description">集群压测数据汇总</div>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Card>

  </div>
</template>

<style scoped>
/* 圆形进度条样式 */
.circular-progress-container {
  padding: 24px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
  height: 100%;
}

.circular-progress-container:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: #dee2e6;
}

.progress-content {
  display: flex;
  align-items: center;
  gap: 20px;
  height: 100%;
}

.progress-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.circular-progress {
  position: relative;
  width: 120px;
  height: 120px;
  margin-bottom: 16px;
}

.progress-circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(
    #1890ff 0deg,
    #1890ff calc(var(--progress) * 3.6deg),
    #f0f0f0 calc(var(--progress) * 3.6deg),
    #f0f0f0 360deg
  );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.progress-circle::before {
  content: '';
  position: absolute;
  width: 80px;
  height: 80px;
  background: white;
  border-radius: 50%;
  z-index: 1;
}

.progress-text {
  position: relative;
  z-index: 2;
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
  text-align: center;
}

.progress-label {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin-bottom: 10px;
  line-height: 1.3;
}

.progress-detail {
  font-size: 22px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 600;
}

.progress-description {
  font-size: 16px;
  color: #999;
  line-height: 1.4;
}

/* 不同进度条的颜色 - 使用更鲜明的颜色区分 */
/* 上架进度 - 绿色系 */
.rack-mounting .progress-circle {
  background: conic-gradient(
    #00c851 0deg,
    #00c851 calc(var(--progress) * 3.6deg),
    #e8f5e8 calc(var(--progress) * 3.6deg),
    #e8f5e8 360deg
  );
}

.rack-mounting .progress-text {
  color: #00c851;
}

.rack-mounting .progress-label {
  color: #00c851;
}

/* 操作系统完成进度 - 蓝色系 */
.os-installation .progress-circle {
  background: conic-gradient(
    #007bff 0deg,
    #007bff calc(var(--progress) * 3.6deg),
    #e3f2fd calc(var(--progress) * 3.6deg),
    #e3f2fd 360deg
  );
}

.os-installation .progress-text {
  color: #007bff;
}

.os-installation .progress-label {
  color: #007bff;
}

/* 网络设备上架进度 - 橙色系 */
.network-mounting .progress-circle {
  background: conic-gradient(
    #ff6b35 0deg,
    #ff6b35 calc(var(--progress) * 3.6deg),
    #fff3e0 calc(var(--progress) * 3.6deg),
    #fff3e0 360deg
  );
}

.network-mounting .progress-text {
  color: #ff6b35;
}

.network-mounting .progress-label {
  color: #ff6b35;
}

/* 软件配置进度 - 紫色系 */
.software-config .progress-circle {
  background: conic-gradient(
    #9c27b0 0deg,
    #9c27b0 calc(var(--progress) * 3.6deg),
    #f3e5f5 calc(var(--progress) * 3.6deg),
    #f3e5f5 360deg
  );
}

.software-config .progress-text {
  color: #9c27b0;
}

.software-config .progress-label {
  color: #9c27b0;
}

/* 单机压测进度 - 粉色系 */
.single-testing .progress-circle {
  background: conic-gradient(
    #e91e63 0deg,
    #e91e63 calc(var(--progress) * 3.6deg),
    #fce4ec calc(var(--progress) * 3.6deg),
    #fce4ec 360deg
  );
}

.single-testing .progress-text {
  color: #e91e63;
}

.single-testing .progress-label {
  color: #e91e63;
}

/* 集群测试进度 - 红色系 */
.cluster-testing .progress-circle {
  background: conic-gradient(
    #d32f2f 0deg,
    #d32f2f calc(var(--progress) * 3.6deg),
    #ffebee calc(var(--progress) * 3.6deg),
    #ffebee 360deg
  );
}

.cluster-testing .progress-text {
  color: #d32f2f;
}

.cluster-testing .progress-label {
  color: #d32f2f;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .progress-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .circular-progress {
    width: 100px;
    height: 100px;
  }

  .progress-circle::before {
    width: 70px;
    height: 70px;
  }

  .progress-text {
    font-size: 20px;
  }

  .progress-label {
    font-size: 18px;
  }

  .progress-detail {
    font-size: 16px;
  }

  .progress-description {
    font-size: 14px;
  }
}
</style>
