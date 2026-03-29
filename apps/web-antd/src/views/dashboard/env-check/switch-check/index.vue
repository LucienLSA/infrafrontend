<script lang="ts" setup>
import { ref, reactive, onMounted, h } from 'vue';
import { 
  Card, 
  Table, 
  Tag, 
  Button, 
  Space, 
  Row, 
  Col, 
  Statistic,
  Tabs,
  TabPane,
  message
} from 'ant-design-vue';

defineOptions({ name: 'SwitchCheck' });

// 交换机检查结果接口
interface SwitchCheckResult {
  id: string;
  name: string;
  ip: string;
  type: string;
  subType: string; // leaf 或 spine
  result: 'pass' | 'fail' | 'error';
  portsUp: number;
  bgpPeers: number;
  mlagStatus: boolean;
  lagStatus: boolean;
  lastCheckTime: string;
  details: string;
}

// 模拟数据
const mockData: SwitchCheckResult[] = [
  // 存储交换机
  { id: '1', name: '存储Leaf-01', ip: '192.168.10.1', type: '存储交换机', subType: 'Leaf', result: 'pass', portsUp: 24, bgpPeers: 2, mlagStatus: true, lagStatus: true, lastCheckTime: '2024-01-15 10:30:00', details: '所有检查项通过' },
  { id: '2', name: '存储Leaf-02', ip: '192.168.10.2', type: '存储交换机', subType: 'Leaf', result: 'pass', portsUp: 24, bgpPeers: 2, mlagStatus: true, lagStatus: true, lastCheckTime: '2024-01-15 10:30:00', details: '所有检查项通过' },
  { id: '3', name: '存储Spine-01', ip: '192.168.10.10', type: '存储交换机', subType: 'Spine', result: 'pass', portsUp: 48, bgpPeers: 4, mlagStatus: true, lagStatus: true, lastCheckTime: '2024-01-15 10:30:00', details: '所有检查项通过' },
  { id: '4', name: '存储Spine-02', ip: '192.168.10.11', type: '存储交换机', subType: 'Spine', result: 'fail', portsUp: 45, bgpPeers: 3, mlagStatus: false, lagStatus: true, lastCheckTime: '2024-01-15 10:30:00', details: 'MLAG状态异常' },
  
  // 计算交换机
  { id: '5', name: '计算Leaf-01', ip: '192.168.20.1', type: '计算交换机', subType: 'Leaf', result: 'pass', portsUp: 24, bgpPeers: 2, mlagStatus: true, lagStatus: true, lastCheckTime: '2024-01-15 10:30:00', details: '所有检查项通过' },
  { id: '6', name: '计算Leaf-02', ip: '192.168.20.2', type: '计算交换机', subType: 'Leaf', result: 'pass', portsUp: 24, bgpPeers: 2, mlagStatus: true, lagStatus: true, lastCheckTime: '2024-01-15 10:30:00', details: '所有检查项通过' },
  { id: '7', name: '计算Spine-01', ip: '192.168.20.10', type: '计算交换机', subType: 'Spine', result: 'pass', portsUp: 48, bgpPeers: 4, mlagStatus: true, lagStatus: true, lastCheckTime: '2024-01-15 10:30:00', details: '所有检查项通过' },
  { id: '8', name: '计算Spine-02', ip: '192.168.20.11', type: '计算交换机', subType: 'Spine', result: 'error', portsUp: 0, bgpPeers: 0, mlagStatus: false, lagStatus: false, lastCheckTime: '2024-01-15 10:30:00', details: '设备离线' },
  
  // 带外交换机
  { id: '9', name: '带外Leaf-01', ip: '192.168.30.1', type: '带外交换机', subType: 'Leaf', result: 'pass', portsUp: 12, bgpPeers: 1, mlagStatus: false, lagStatus: true, lastCheckTime: '2024-01-15 10:30:00', details: '所有检查项通过' },
  { id: '10', name: '带外Spine-01', ip: '192.168.30.10', type: '带外交换机', subType: 'Spine', result: 'pass', portsUp: 24, bgpPeers: 2, mlagStatus: false, lagStatus: true, lastCheckTime: '2024-01-15 10:30:00', details: '所有检查项通过' },
  
  // 带内交换机
  { id: '11', name: '带内Leaf-01', ip: '192.168.40.1', type: '带内交换机', subType: 'Leaf', result: 'pass', portsUp: 24, bgpPeers: 2, mlagStatus: true, lagStatus: true, lastCheckTime: '2024-01-15 10:30:00', details: '所有检查项通过' },
  { id: '12', name: '带内Leaf-02', ip: '192.168.40.2', type: '带内交换机', subType: 'Leaf', result: 'fail', portsUp: 20, bgpPeers: 1, mlagStatus: false, lagStatus: true, lastCheckTime: '2024-01-15 10:30:00', details: '端口Up数不足' },
  { id: '13', name: '带内Spine-01', ip: '192.168.40.10', type: '带内交换机', subType: 'Spine', result: 'pass', portsUp: 48, bgpPeers: 4, mlagStatus: true, lagStatus: true, lastCheckTime: '2024-01-15 10:30:00', details: '所有检查项通过' },
  
  // 安全设备
  { id: '14', name: '防火墙-01', ip: '192.168.50.1', type: '安全设备', subType: '防火墙', result: 'pass', portsUp: 8, bgpPeers: 2, mlagStatus: false, lagStatus: true, lastCheckTime: '2024-01-15 10:30:00', details: '所有检查项通过' },
  { id: '15', name: 'IDS-01', ip: '192.168.50.2', type: '安全设备', subType: 'IDS', result: 'pass', portsUp: 4, bgpPeers: 0, mlagStatus: false, lagStatus: false, lastCheckTime: '2024-01-15 10:30:00', details: '所有检查项通过' }
];

// 响应式数据
const loading = ref(false);
const activeTab = ref('storage-switch');
const data = ref<SwitchCheckResult[]>(mockData);

// 统计数据
const stats = ref({
  total: mockData.length,
  pass: mockData.filter(item => item.result === 'pass').length,
  fail: mockData.filter(item => item.result === 'fail').length,
  error: mockData.filter(item => item.result === 'error').length,
  storage: mockData.filter(item => item.type === '存储交换机').length,
  compute: mockData.filter(item => item.type === '计算交换机').length,
  oob: mockData.filter(item => item.type === '带外交换机').length,
  inband: mockData.filter(item => item.type === '带内交换机').length,
  security: mockData.filter(item => item.type === '安全设备').length
});

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    'pass': 'green',
    'fail': 'orange',
    'error': 'red'
  };
  return colorMap[status] || 'default';
};

// 获取状态文本
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    'pass': '通过',
    'fail': '失败',
    'error': '错误'
  };
  return textMap[status] || status;
};

// 获取设备类型颜色
const getDeviceTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    '存储交换机': '#1890ff',
    '计算交换机': '#f093fb',
    '带外交换机': '#52c41a',
    '带内交换机': '#fa8c16',
    '安全设备': '#ff4d4f'
  };
  return colorMap[type] || '#666';
};

// 页签切换处理
const handleTabChange = (key: string) => {
  activeTab.value = key;
};

// 刷新数据
const refreshData = () => {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    message.success('数据已刷新');
  }, 1000);
};

// 按设备类型过滤数据
const getFilteredData = (deviceType: string) => {
  return data.value.filter(item => item.type === deviceType);
};

// 表格列配置
const columns = [
  {
    title: '设备名称',
    dataIndex: 'name',
    key: 'name',
    width: 150,
  },
  {
    title: 'IP地址',
    dataIndex: 'ip',
    key: 'ip',
    width: 120,
  },
  {
    title: '子类型',
    dataIndex: 'subType',
    key: 'subType',
    width: 100,
  },
  {
    title: '端口Up数',
    dataIndex: 'portsUp',
    key: 'portsUp',
    width: 100,
  },
  {
    title: 'BGP Peer数',
    dataIndex: 'bgpPeers',
    key: 'bgpPeers',
    width: 120,
  },
  {
    title: 'MLAG状态',
    dataIndex: 'mlagStatus',
    key: 'mlagStatus',
    width: 100,
  },
  {
    title: '聚合状态',
    dataIndex: 'lagStatus',
    key: 'lagStatus',
    width: 100,
  },
  {
    title: '检查结果',
    dataIndex: 'result',
    key: 'result',
    width: 100,
  },
  {
    title: '最后检查时间',
    dataIndex: 'lastCheckTime',
    key: 'lastCheckTime',
    width: 160,
  },
  {
    title: '详情',
    dataIndex: 'details',
    key: 'details',
    width: 200,
  }
];

onMounted(() => {
  // 初始化数据
});
</script>

<template>
  <div style="padding: 24px;">
    <!-- 页面标题 -->
    <div style="margin-bottom: 24px;">
      <h1 style="font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">交换机检查</h1>
      <p style="color: #666; margin: 0;">检查各类交换机和网络设备的状态，包括端口状态、BGP连接、MLAG和聚合状态等关键指标。</p>
    </div>

    <!-- 统计信息 -->
    <Row :gutter="16" style="margin-bottom: 24px;">
      <Col :span="6">
        <Card>
          <Statistic title="总设备数" :value="stats.total" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="检查通过" :value="stats.pass" value-style="color: #52c41a" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="检查失败" :value="stats.fail" value-style="color: #fa8c16" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="设备错误" :value="stats.error" value-style="color: #ff4d4f" />
        </Card>
      </Col>
    </Row>

    <!-- 操作按钮 -->
    <div style="margin-bottom: 24px; text-align: right;">
      <Space>
        <Button @click="refreshData" :loading="loading">
          刷新数据
        </Button>
        <Button type="primary">
          开始检查
        </Button>
      </Space>
    </div>

    <!-- 设备类型页签 -->
    <Card>
      <Tabs 
        v-model:activeKey="activeTab" 
        @change="handleTabChange"
        type="card"
        size="large"
      >
        <TabPane key="storage-switch" tab="存储交换机">
          <template #tab>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #1890ff;"></div>
              <span>存储交换机 ({{ stats.storage }})</span>
            </div>
          </template>
          
          <Table
            :columns="columns"
            :data-source="getFilteredData('存储交换机')"
            :loading="loading"
            :pagination="{ pageSize: 10, showSizeChanger: true }"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'mlagStatus'">
                <Tag :color="record.mlagStatus ? 'green' : 'red'">
                  {{ record.mlagStatus ? '启用' : '禁用' }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'lagStatus'">
                <Tag :color="record.lagStatus ? 'green' : 'red'">
                  {{ record.lagStatus ? '启用' : '禁用' }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'result'">
                <Tag :color="getStatusColor(record.result)">
                  {{ getStatusText(record.result) }}
                </Tag>
              </template>
            </template>
          </Table>
        </TabPane>

        <TabPane key="compute-switch" tab="计算交换机">
          <template #tab>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #f093fb;"></div>
              <span>计算交换机 ({{ stats.compute }})</span>
            </div>
          </template>
          
          <Table
            :columns="columns"
            :data-source="getFilteredData('计算交换机')"
            :loading="loading"
            :pagination="{ pageSize: 10, showSizeChanger: true }"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'mlagStatus'">
                <Tag :color="record.mlagStatus ? 'green' : 'red'">
                  {{ record.mlagStatus ? '启用' : '禁用' }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'lagStatus'">
                <Tag :color="record.lagStatus ? 'green' : 'red'">
                  {{ record.lagStatus ? '启用' : '禁用' }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'result'">
                <Tag :color="getStatusColor(record.result)">
                  {{ getStatusText(record.result) }}
                </Tag>
              </template>
            </template>
          </Table>
        </TabPane>

        <TabPane key="oob-switch" tab="带外交换机">
          <template #tab>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #52c41a;"></div>
              <span>带外交换机 ({{ stats.oob }})</span>
            </div>
          </template>
          
          <Table
            :columns="columns"
            :data-source="getFilteredData('带外交换机')"
            :loading="loading"
            :pagination="{ pageSize: 10, showSizeChanger: true }"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'mlagStatus'">
                <Tag :color="record.mlagStatus ? 'green' : 'red'">
                  {{ record.mlagStatus ? '启用' : '禁用' }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'lagStatus'">
                <Tag :color="record.lagStatus ? 'green' : 'red'">
                  {{ record.lagStatus ? '启用' : '禁用' }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'result'">
                <Tag :color="getStatusColor(record.result)">
                  {{ getStatusText(record.result) }}
                </Tag>
              </template>
            </template>
          </Table>
        </TabPane>

        <TabPane key="inband-switch" tab="带内交换机">
          <template #tab>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #fa8c16;"></div>
              <span>带内交换机 ({{ stats.inband }})</span>
            </div>
          </template>
          
          <Table
            :columns="columns"
            :data-source="getFilteredData('带内交换机')"
            :loading="loading"
            :pagination="{ pageSize: 10, showSizeChanger: true }"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'mlagStatus'">
                <Tag :color="record.mlagStatus ? 'green' : 'red'">
                  {{ record.mlagStatus ? '启用' : '禁用' }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'lagStatus'">
                <Tag :color="record.lagStatus ? 'green' : 'red'">
                  {{ record.lagStatus ? '启用' : '禁用' }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'result'">
                <Tag :color="getStatusColor(record.result)">
                  {{ getStatusText(record.result) }}
                </Tag>
              </template>
            </template>
          </Table>
        </TabPane>

        <TabPane key="security-device" tab="安全设备">
          <template #tab>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #ff4d4f;"></div>
              <span>安全设备 ({{ stats.security }})</span>
            </div>
          </template>
          
          <Table
            :columns="columns"
            :data-source="getFilteredData('安全设备')"
            :loading="loading"
            :pagination="{ pageSize: 10, showSizeChanger: true }"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'mlagStatus'">
                <Tag :color="record.mlagStatus ? 'green' : 'red'">
                  {{ record.mlagStatus ? '启用' : '禁用' }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'lagStatus'">
                <Tag :color="record.lagStatus ? 'green' : 'red'">
                  {{ record.lagStatus ? '启用' : '禁用' }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'result'">
                <Tag :color="getStatusColor(record.result)">
                  {{ getStatusText(record.result) }}
                </Tag>
              </template>
            </template>
          </Table>
        </TabPane>
      </Tabs>
    </Card>
  </div>
</template>

<style scoped>
.ant-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ant-statistic-title {
  color: #666;
  font-size: 14px;
}

.ant-statistic-content {
  font-size: 24px;
  font-weight: 600;
}
</style>
