<script lang="ts" setup>
import { ref, reactive, onMounted, computed, h } from 'vue';
import { 
  Card, 
  Button, 
  Space, 
  Table, 
  Tag,
  message,
  Row,
  Col,
  Statistic,
  Alert,
  Collapse,
  CollapsePanel,
  Progress,
  Tooltip,
  Badge
} from 'ant-design-vue';

defineOptions({ name: 'ErrorRateTest' });

// 误码率测试状态
type TestStatus = '未执行' | '测试中' | '通过' | '失败';

// 服务器端口接口
interface ServerPort {
  id: string;
  serverId: string;
  serverName: string;
  serverIp: string;
  portName: string;
  portType: string;
  errorRate: number;
  threshold: number;
  status: TestStatus;
  lastTestTime: string;
  testDuration: number;
  errorCount: number;
  totalCount: number;
}

// 服务器分组接口
interface ServerGroup {
  id: string;
  name: string;
  ip: string;
  status: '在线' | '离线' | '错误';
  ports: ServerPort[];
  totalPorts: number;
  failedPorts: number;
  errorRate: number;
}

// 响应式数据
const loading = ref(false);
const testRunning = ref(false);
const clearDataLoading = ref(false);
const activeCollapseKeys = ref(['1', '2', '3']);

// 模拟服务器分组数据
const serverGroups = ref<ServerGroup[]>([
  {
    id: '1',
    name: 'GPU-Server-001',
    ip: '192.168.1.101',
    status: '在线',
    totalPorts: 4,
    failedPorts: 2,
    errorRate: 0.15,
    ports: [
      {
        id: '1-1',
        serverId: '1',
        serverName: 'GPU-Server-001',
        serverIp: '192.168.1.101',
        portName: 'eth0',
        portType: '网络端口',
        errorRate: 0.12,
        threshold: 0.1,
        status: '失败',
        lastTestTime: '2024-01-15 14:30:25',
        testDuration: 300,
        errorCount: 1200,
        totalCount: 10000
      },
      {
        id: '1-2',
        serverId: '1',
        serverName: 'GPU-Server-001',
        serverIp: '192.168.1.101',
        portName: 'eth1',
        portType: '网络端口',
        errorRate: 0.08,
        threshold: 0.1,
        status: '通过',
        lastTestTime: '2024-01-15 14:30:25',
        testDuration: 300,
        errorCount: 800,
        totalCount: 10000
      },
      {
        id: '1-3',
        serverId: '1',
        serverName: 'GPU-Server-001',
        serverIp: '192.168.1.101',
        portName: 'PCIe-1',
        portType: 'PCIe端口',
        errorRate: 0.15,
        threshold: 0.1,
        status: '失败',
        lastTestTime: '2024-01-15 14:30:25',
        testDuration: 300,
        errorCount: 1500,
        totalCount: 10000
      },
      {
        id: '1-4',
        serverId: '1',
        serverName: 'GPU-Server-001',
        serverIp: '192.168.1.101',
        portName: 'PCIe-2',
        portType: 'PCIe端口',
        errorRate: 0.05,
        threshold: 0.1,
        status: '通过',
        lastTestTime: '2024-01-15 14:30:25',
        testDuration: 300,
        errorCount: 500,
        totalCount: 10000
      }
    ]
  },
  {
    id: '2',
    name: 'GPU-Server-002',
    ip: '192.168.1.102',
    status: '在线',
    totalPorts: 6,
    failedPorts: 1,
    errorRate: 0.08,
    ports: [
      {
        id: '2-1',
        serverId: '2',
        serverName: 'GPU-Server-002',
        serverIp: '192.168.1.102',
        portName: 'eth0',
        portType: '网络端口',
        errorRate: 0.12,
        threshold: 0.1,
        status: '失败',
        lastTestTime: '2024-01-15 14:28:15',
        testDuration: 300,
        errorCount: 1200,
        totalCount: 10000
      },
      {
        id: '2-2',
        serverId: '2',
        serverName: 'GPU-Server-002',
        serverIp: '192.168.1.102',
        portName: 'eth1',
        portType: '网络端口',
        errorRate: 0.06,
        threshold: 0.1,
        status: '通过',
        lastTestTime: '2024-01-15 14:28:15',
        testDuration: 300,
        errorCount: 600,
        totalCount: 10000
      },
      {
        id: '2-3',
        serverId: '2',
        serverName: 'GPU-Server-002',
        serverIp: '192.168.1.102',
        portName: 'PCIe-1',
        portType: 'PCIe端口',
        errorRate: 0.05,
        threshold: 0.1,
        status: '通过',
        lastTestTime: '2024-01-15 14:28:15',
        testDuration: 300,
        errorCount: 500,
        totalCount: 10000
      },
      {
        id: '2-4',
        serverId: '2',
        serverName: 'GPU-Server-002',
        serverIp: '192.168.1.102',
        portName: 'PCIe-2',
        portType: 'PCIe端口',
        errorRate: 0.07,
        threshold: 0.1,
        status: '通过',
        lastTestTime: '2024-01-15 14:28:15',
        testDuration: 300,
        errorCount: 700,
        totalCount: 10000
      },
      {
        id: '2-5',
        serverId: '2',
        serverName: 'GPU-Server-002',
        serverIp: '192.168.1.102',
        portName: 'PCIe-3',
        portType: 'PCIe端口',
        errorRate: 0.08,
        threshold: 0.1,
        status: '通过',
        lastTestTime: '2024-01-15 14:28:15',
        testDuration: 300,
        errorCount: 800,
        totalCount: 10000
      },
      {
        id: '2-6',
        serverId: '2',
        serverName: 'GPU-Server-002',
        serverIp: '192.168.1.102',
        portName: 'PCIe-4',
        portType: 'PCIe端口',
        errorRate: 0.09,
        threshold: 0.1,
        status: '通过',
        lastTestTime: '2024-01-15 14:28:15',
        testDuration: 300,
        errorCount: 900,
        totalCount: 10000
      }
    ]
  },
  {
    id: '3',
    name: 'Storage-Server-001',
    ip: '192.168.1.201',
    status: '在线',
    totalPorts: 3,
    failedPorts: 0,
    errorRate: 0.03,
    ports: [
      {
        id: '3-1',
        serverId: '3',
        serverName: 'Storage-Server-001',
        serverIp: '192.168.1.201',
        portName: 'eth0',
        portType: '网络端口',
        errorRate: 0.03,
        threshold: 0.1,
        status: '通过',
        lastTestTime: '2024-01-15 14:25:10',
        testDuration: 300,
        errorCount: 300,
        totalCount: 10000
      },
      {
        id: '3-2',
        serverId: '3',
        serverName: 'Storage-Server-001',
        serverIp: '192.168.1.201',
        portName: 'SAS-1',
        portType: 'SAS端口',
        errorRate: 0.02,
        threshold: 0.1,
        status: '通过',
        lastTestTime: '2024-01-15 14:25:10',
        testDuration: 300,
        errorCount: 200,
        totalCount: 10000
      },
      {
        id: '3-3',
        serverId: '3',
        serverName: 'Storage-Server-001',
        serverIp: '192.168.1.201',
        portName: 'SAS-2',
        portType: 'SAS端口',
        errorRate: 0.04,
        threshold: 0.1,
        status: '通过',
        lastTestTime: '2024-01-15 14:25:10',
        testDuration: 300,
        errorCount: 400,
        totalCount: 10000
      }
    ]
  }
]);

// 统计信息
const stats = computed(() => {
  const totalServers = serverGroups.value.length;
  const onlineServers = serverGroups.value.filter(s => s.status === '在线').length;
  const totalPorts = serverGroups.value.reduce((sum, s) => sum + s.totalPorts, 0);
  const failedPorts = serverGroups.value.reduce((sum, s) => sum + s.failedPorts, 0);
  const avgErrorRate = serverGroups.value.reduce((sum, s) => sum + s.errorRate, 0) / totalServers;
  
  return {
    totalServers,
    onlineServers,
    totalPorts,
    failedPorts,
    avgErrorRate: (avgErrorRate * 100).toFixed(2)
  };
});

// 端口表格列配置
const getPortColumns = () => [
  {
    title: '端口名称',
    dataIndex: 'portName',
    key: 'portName',
    width: 120,
  },
  {
    title: '端口类型',
    dataIndex: 'portType',
    key: 'portType',
    width: 100,
  },
  {
    title: '误码率',
    dataIndex: 'errorRate',
    key: 'errorRate',
    width: 120,
    customRender: ({ record }: { record: ServerPort }) => {
      const percentage = (record.errorRate * 100).toFixed(2);
      const isFailed = record.errorRate > record.threshold;
      return h('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
        h(Progress, {
          percent: Math.min(record.errorRate * 1000, 100),
          size: 'small',
          status: isFailed ? 'exception' : 'success',
          style: 'width: 60px;'
        }),
        h('span', { 
          style: { 
            color: isFailed ? '#ff4d4f' : '#52c41a',
            fontWeight: 'bold'
          } 
        }, `${percentage}%`)
      ]);
    }
  },
  {
    title: '阈值',
    dataIndex: 'threshold',
    key: 'threshold',
    width: 80,
    customRender: ({ record }: { record: ServerPort }) => {
      return `${(record.threshold * 100).toFixed(1)}%`;
    }
  },
  {
    title: '测试状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    customRender: ({ text }: { text: TestStatus }) => {
      const colorMap = {
        '未执行': 'default',
        '测试中': 'processing',
        '通过': 'success',
        '失败': 'error'
      };
      return h(Tag, { color: colorMap[text] }, () => text);
    }
  },
  {
    title: '错误计数',
    key: 'errorCount',
    width: 120,
    customRender: ({ record }: { record: ServerPort }) => {
      return h('div', { style: 'text-align: center;' }, [
        h('div', { style: 'font-weight: bold; color: #ff4d4f;' }, record.errorCount),
        h('div', { style: 'font-size: 12px; color: #666;' }, `/ ${record.totalCount}`)
      ]);
    }
  },
  {
    title: '最后测试时间',
    dataIndex: 'lastTestTime',
    key: 'lastTestTime',
    width: 160,
  },
  {
    title: '测试时长(秒)',
    dataIndex: 'testDuration',
    key: 'testDuration',
    width: 100,
  }
];

// 开始误码率测试
const startErrorRateTest = async () => {
  testRunning.value = true;
  loading.value = true;
  
  try {
    message.info('开始执行误码率测试...');
    
    // 模拟测试过程
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 模拟更新测试结果
    serverGroups.value.forEach(server => {
      server.ports.forEach(port => {
        // 随机生成测试结果
        const randomErrorRate = Math.random() * 0.2;
        port.errorRate = randomErrorRate;
        port.status = randomErrorRate > port.threshold ? '失败' : '通过';
        port.lastTestTime = new Date().toLocaleString();
        port.errorCount = Math.floor(randomErrorRate * port.totalCount);
      });
      
      // 更新服务器统计
      const failedPorts = server.ports.filter(p => p.status === '失败').length;
      server.failedPorts = failedPorts;
      server.errorRate = server.ports.reduce((sum, p) => sum + p.errorRate, 0) / server.ports.length;
    });
    
    message.success('误码率测试完成！');
  } catch (error) {
    message.error('误码率测试失败！');
  } finally {
    testRunning.value = false;
    loading.value = false;
  }
};

// 清除误码率数据
const clearErrorRateData = async () => {
  clearDataLoading.value = true;
  
  try {
    message.info('正在清除误码率数据...');
    
    // 模拟清除过程
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 重置所有数据
    serverGroups.value.forEach(server => {
      server.ports.forEach(port => {
        port.errorRate = 0;
        port.status = '未执行';
        port.lastTestTime = '';
        port.errorCount = 0;
      });
      server.failedPorts = 0;
      server.errorRate = 0;
    });
    
    message.success('误码率数据已清除！');
  } catch (error) {
    message.error('清除数据失败！');
  } finally {
    clearDataLoading.value = false;
  }
};

// 获取服务器状态标签
const getServerStatusTag = (status: string) => {
  const colorMap = {
    '在线': 'success',
    '离线': 'default',
    '错误': 'error'
  };
  return h(Tag, { color: colorMap[status] }, () => status);
};

onMounted(() => {
  // 初始化数据
});
</script>

<template>
  <div class="error-rate-test-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="main-title">
            <span class="title-icon">⚡</span>
            误码率测试
            <div class="title-underline"></div>
          </h1>
          <p class="subtitle">对服务器端口进行误码率测试，检测数据传输质量</p>
        </div>
        <div class="tech-decoration">
          <div class="tech-line"></div>
          <div class="tech-dot"></div>
          <div class="tech-line"></div>
        </div>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-section">
      <Row :gutter="16">
        <Col :span="4">
          <Card class="stat-card stat-card-primary">
            <div class="stat-icon">🖥️</div>
            <Statistic
              title="总服务器数"
              :value="stats.totalServers"
              :value-style="{ color: '#1890ff' }"
            />
            <div class="stat-glow"></div>
          </Card>
        </Col>
        <Col :span="4">
          <Card class="stat-card stat-card-success">
            <div class="stat-icon">✅</div>
            <Statistic
              title="在线服务器"
              :value="stats.onlineServers"
              :value-style="{ color: '#52c41a' }"
            />
            <div class="stat-glow"></div>
          </Card>
        </Col>
        <Col :span="4">
          <Card class="stat-card stat-card-purple">
            <div class="stat-icon">🔌</div>
            <Statistic
              title="总端口数"
              :value="stats.totalPorts"
              :value-style="{ color: '#722ed1' }"
            />
            <div class="stat-glow"></div>
          </Card>
        </Col>
        <Col :span="4">
          <Card class="stat-card stat-card-danger">
            <div class="stat-icon">⚠️</div>
            <Statistic
              title="不达标端口"
              :value="stats.failedPorts"
              :value-style="{ color: '#ff4d4f' }"
            />
            <div class="stat-glow"></div>
          </Card>
        </Col>
        <Col :span="4">
          <Card class="stat-card stat-card-warning">
            <div class="stat-icon">📊</div>
            <Statistic
              title="平均误码率"
              :value="`${stats.avgErrorRate}%`"
              :value-style="{ color: '#faad14' }"
            />
            <div class="stat-glow"></div>
          </Card>
        </Col>
        <Col :span="4">
          <Card class="stat-card stat-card-info">
            <div class="stat-icon">🎯</div>
            <Statistic
              title="达标率"
              :value="`${((stats.totalPorts - stats.failedPorts) / stats.totalPorts * 100).toFixed(1)}%`"
              :value-style="{ color: '#13c2c2' }"
            />
            <div class="stat-glow"></div>
          </Card>
        </Col>
      </Row>
    </div>

    <!-- 操作按钮区域 -->
    <Card class="action-card">
      <div class="action-content">
        <div class="action-info">
          <h3 class="action-title">
            <span class="action-icon">⚙️</span>
            测试操作
          </h3>
          <p class="action-desc">执行误码率测试或清除历史数据</p>
        </div>
        <div class="action-buttons">
          <Button 
            class="tech-button tech-button-primary"
            size="large"
            :loading="testRunning"
            :disabled="loading"
            @click="startErrorRateTest"
          >
            <template #icon>
              <span class="button-icon">🔍</span>
            </template>
            <span class="button-text">误码率测试</span>
            <div class="button-glow"></div>
          </Button>
          <Button 
            class="tech-button tech-button-secondary"
            size="large"
            :loading="clearDataLoading"
            :disabled="loading || testRunning"
            @click="clearErrorRateData"
          >
            <template #icon>
              <span class="button-icon">🗑️</span>
            </template>
            <span class="button-text">清除误码率数据</span>
            <div class="button-glow"></div>
          </Button>
        </div>
      </div>
    </Card>

    <!-- 警告信息 -->
    <Alert
      v-if="stats.failedPorts > 0"
      class="tech-alert"
      type="warning"
      show-icon
    >
      <template #message>
        <div class="alert-content">
          <div class="alert-text">
            <span class="alert-icon">⚠️</span>
            发现 <span class="alert-count">{{ stats.failedPorts }}</span> 个端口误码率不达标，请及时处理！
          </div>
          <Button class="tech-button-small" type="link" @click="startErrorRateTest">
            <span class="button-icon">🔄</span>
            重新测试
          </Button>
        </div>
      </template>
    </Alert>

    <!-- 服务器分组展示 -->
    <Card class="results-card">
      <template #title>
        <div class="results-title">
          <div class="title-content">
            <span class="title-icon">📊</span>
            <span class="title-text">服务器端口误码率详情</span>
          </div>
          <Badge 
            class="tech-badge"
            :count="stats.failedPorts" 
            :number-style="{ backgroundColor: '#ff4757', boxShadow: '0 0 10px rgba(255, 71, 87, 0.5)' }"
          />
        </div>
      </template>
      
      <Collapse v-model:activeKey="activeCollapseKeys" ghost>
        <CollapsePanel 
          v-for="server in serverGroups" 
          :key="server.id"
          :header="`${server.name} (${server.ip})`"
        >
          <template #extra>
            <div style="display: flex; align-items: center; gap: 12px;">
              <component :is="getServerStatusTag(server.status)" />
              <span style="color: #666; font-size: 12px;">
                端口: {{ server.totalPorts }} | 不达标: {{ server.failedPorts }}
              </span>
            </div>
          </template>
          
          <div style="margin-bottom: 16px;">
            <Row :gutter="16">
              <Col :span="6">
                <Statistic
                  title="总端口数"
                  :value="server.totalPorts"
                  :value-style="{ fontSize: '16px' }"
                />
              </Col>
              <Col :span="6">
                <Statistic
                  title="不达标端口"
                  :value="server.failedPorts"
                  :value-style="{ color: '#ff4d4f', fontSize: '16px' }"
                />
              </Col>
              <Col :span="6">
                <Statistic
                  title="平均误码率"
                  :value="`${(server.errorRate * 100).toFixed(2)}%`"
                  :value-style="{ color: server.errorRate > 0.1 ? '#ff4d4f' : '#52c41a', fontSize: '16px' }"
                />
              </Col>
              <Col :span="6">
                <Statistic
                  title="达标率"
                  :value="`${((server.totalPorts - server.failedPorts) / server.totalPorts * 100).toFixed(1)}%`"
                  :value-style="{ color: '#13c2c2', fontSize: '16px' }"
                />
              </Col>
            </Row>
          </div>
          
          <Table
            :columns="getPortColumns()"
            :data-source="server.ports"
            :loading="loading"
            :pagination="false"
            row-key="id"
            size="small"
            :scroll="{ x: 800 }"
          />
        </CollapsePanel>
      </Collapse>
    </Card>
  </div>
</template>

<style scoped>
/* 全局容器 */
.error-rate-test-container {
  padding: 24px;
  background: #ffffff;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

/* 页面标题 */
.page-header {
  margin-bottom: 32px;
  position: relative;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section {
  flex: 1;
}

.main-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: #333333;
  position: relative;
  display: inline-block;
}

.title-icon {
  font-size: 36px;
  margin-right: 12px;
  color: #1890ff;
}

.title-underline {
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 100%;
  height: 3px;
  background: #1890ff;
  border-radius: 2px;
}

.subtitle {
  color: #666666;
  margin: 0;
  font-size: 16px;
  font-weight: 400;
}

.tech-decoration {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tech-line {
  width: 40px;
  height: 2px;
  background: #1890ff;
  border-radius: 1px;
}

.tech-dot {
  width: 8px;
  height: 8px;
  background: #1890ff;
  border-radius: 50%;
}

@keyframes techPulse {
  0%, 100% { opacity: 0.3; transform: scaleX(0.8); }
  50% { opacity: 1; transform: scaleX(1.2); }
}

@keyframes techBlink {
  0%, 100% { opacity: 0.5; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* 统计卡片 */
.stats-section {
  margin-bottom: 32px;
}

.stat-card {
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.stat-card-primary { border-left: 4px solid #1890ff; }
.stat-card-success { border-left: 4px solid #52c41a; }
.stat-card-purple { border-left: 4px solid #722ed1; }
.stat-card-danger { border-left: 4px solid #ff4d4f; }
.stat-card-warning { border-left: 4px solid #faad14; }
.stat-card-info { border-left: 4px solid #13c2c2; }

.stat-icon {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 24px;
  opacity: 0.2;
}

/* 操作卡片 */
.action-card {
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  margin-bottom: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.action-info {
  flex: 1;
}

.action-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-icon {
  font-size: 20px;
  color: #1890ff;
}

.action-desc {
  margin: 0;
  color: #666666;
  font-size: 14px;
  font-weight: 400;
}

.action-buttons {
  display: flex;
  gap: 16px;
}

/* 按钮样式 */
.tech-button {
  position: relative;
  border: none;
  border-radius: 6px;
  padding: 12px 24px;
  font-weight: 500;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tech-button-primary {
  background: #1890ff;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.tech-button-primary:hover {
  background: #40a9ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.tech-button-secondary {
  background: #f5f5f5;
  color: #333333;
  border: 1px solid #d9d9d9;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tech-button-secondary:hover {
  background: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.button-icon {
  font-size: 18px;
}

.button-text {
  position: relative;
  z-index: 2;
}

.tech-button-small {
  background: #1890ff;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
  transition: all 0.3s ease;
}

.tech-button-small:hover {
  background: #40a9ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

/* 警告提示 */
.tech-alert {
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 6px;
  margin-bottom: 32px;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.1);
}

.alert-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-text {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #333333;
  font-weight: 500;
}

.alert-icon {
  font-size: 18px;
  color: #faad14;
}

.alert-count {
  color: #ff4d4f;
  font-weight: 700;
}

/* 结果卡片 */
.results-card {
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.results-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.title-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 20px;
  color: #1890ff;
}

.title-text {
  font-size: 18px;
  font-weight: 600;
  color: #333333;
}

.tech-badge {
  /* 保持默认样式 */
}

/* 折叠面板 */
.ant-collapse {
  background: transparent;
  border: none;
}

.ant-collapse-item {
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ant-collapse-header {
  background: #fafafa;
  color: #333333;
  font-weight: 600;
  font-size: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
}

.ant-collapse-content {
  background: #ffffff;
  border: none;
}

.ant-collapse-content-box {
  padding: 20px;
}

/* 表格样式 */
.ant-table {
  background: transparent;
  border-radius: 8px;
  overflow: hidden;
}

.ant-table-thead > tr > th {
  background: #fafafa;
  color: #333333;
  font-weight: 600;
  border-bottom: 1px solid #e8e8e8;
  text-align: center;
}

.ant-table-tbody > tr > td {
  background: #ffffff;
  color: #333333;
  border-bottom: 1px solid #f0f0f0;
  text-align: center;
}

.ant-table-tbody > tr:hover > td {
  background: #f5f5f5;
}

/* 标签样式 */
.ant-tag {
  border-radius: 4px;
  font-size: 12px;
  padding: 4px 8px;
  font-weight: 500;
  border: none;
}

.ant-tag-success {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.ant-tag-error {
  background: #fff2f0;
  color: #ff4d4f;
  border: 1px solid #ffccc7;
}

.ant-tag-processing {
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.ant-tag-default {
  background: #f5f5f5;
  color: #666666;
  border: 1px solid #d9d9d9;
}

/* 统计数字样式 */
.ant-statistic-title {
  font-size: 14px;
  color: #666666;
  font-weight: 500;
  margin-bottom: 8px;
}

.ant-statistic-content {
  font-size: 24px;
  font-weight: 700;
  color: #333333;
}

/* 进度条样式 */
.ant-progress-text {
  font-size: 12px;
  font-weight: 600;
  color: #333333;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .action-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .action-buttons {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .error-rate-test-container {
    padding: 16px;
  }
  
  .main-title {
    font-size: 24px;
  }
  
  .action-buttons {
    flex-direction: column;
    width: 100%;
  }
  
  .tech-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
