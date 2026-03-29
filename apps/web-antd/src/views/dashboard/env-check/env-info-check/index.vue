<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Card, Table, Tag, Button, Space, Input, Select, Row, Col, Statistic, Alert, Progress } from 'ant-design-vue';
import type { ColumnsType } from 'ant-design-vue/es/table';

defineOptions({ name: 'EnvInfoCheck' });

// 服务器环境信息接口
interface ServerEnvInfo {
  id: string;
  name: string;
  ip: string;
  result: 'pass' | 'fail' | 'error';
  os: string;
  kernel: string;
  driverVersion: string;
  gpuCount: number;
  diskCount: number;
  totalMemory: string;
  cpuCores: number;
  lastCheck: string;
  location: string;
}

// 模拟数据
const mockData: ServerEnvInfo[] = [
  {
    id: '1',
    name: 'GPU服务器-01',
    ip: '192.168.1.10',
    result: 'pass',
    os: 'Ubuntu 20.04 LTS',
    kernel: '5.4.0-74-generic',
    driverVersion: 'NVIDIA 470.57.02',
    gpuCount: 4,
    diskCount: 2,
    totalMemory: '64GB',
    cpuCores: 16,
    lastCheck: '2024-01-15 14:30:25',
    location: '机房A-机柜01'
  },
  {
    id: '2',
    name: 'GPU服务器-02',
    ip: '192.168.1.11',
    result: 'pass',
    os: 'CentOS 7.9',
    kernel: '3.10.0-1160.el7.x86_64',
    driverVersion: 'NVIDIA 460.80',
    gpuCount: 8,
    diskCount: 4,
    totalMemory: '128GB',
    cpuCores: 32,
    lastCheck: '2024-01-15 14:28:15',
    location: '机房A-机柜02'
  },
  {
    id: '3',
    name: '存储服务器-01',
    ip: '192.168.1.20',
    result: 'pass',
    os: 'Ubuntu 22.04 LTS',
    kernel: '5.15.0-88-generic',
    driverVersion: 'N/A',
    gpuCount: 0,
    diskCount: 12,
    totalMemory: '32GB',
    cpuCores: 8,
    lastCheck: '2024-01-15 14:25:10',
    location: '机房B-机柜01'
  },
  {
    id: '4',
    name: 'CPU服务器-01',
    ip: '192.168.1.30',
    result: 'fail',
    os: 'Ubuntu 20.04 LTS',
    kernel: '5.4.0-74-generic',
    driverVersion: 'N/A',
    gpuCount: 0,
    diskCount: 1,
    totalMemory: '16GB',
    cpuCores: 4,
    lastCheck: '2024-01-15 10:15:30',
    location: '机房C-机柜01'
  },
  {
    id: '5',
    name: 'GPU服务器-03',
    ip: '192.168.1.12',
    result: 'error',
    os: 'Ubuntu 20.04 LTS',
    kernel: '5.4.0-74-generic',
    driverVersion: 'NVIDIA 470.57.02',
    gpuCount: 2,
    diskCount: 2,
    totalMemory: '32GB',
    cpuCores: 8,
    lastCheck: '2024-01-15 13:45:10',
    location: '机房A-机柜03'
  }
];

// 响应式数据
const loading = ref(false);
const searchText = ref('');
const statusFilter = ref<string>('all');
const serverData = ref<ServerEnvInfo[]>(mockData);
const filteredData = ref<ServerEnvInfo[]>(mockData);

// 统计数据
const stats = ref({
  total: mockData.length,
  pass: mockData.filter(item => item.result === 'pass').length,
  fail: mockData.filter(item => item.result === 'fail').length,
  error: mockData.filter(item => item.result === 'error').length,
  totalGpus: mockData.reduce((sum, item) => sum + item.gpuCount, 0),
  totalDisks: mockData.reduce((sum, item) => sum + item.diskCount, 0),
  totalCores: mockData.reduce((sum, item) => sum + item.cpuCores, 0)
});

// 表格列配置
const columns: ColumnsType<ServerEnvInfo> = [
  {
    title: '服务器名称',
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
    title: '检查结果',
    dataIndex: 'result',
    key: 'result',
    width: 100,
  },
  {
    title: '操作系统',
    dataIndex: 'os',
    key: 'os',
    width: 150,
  },
  {
    title: '内核版本',
    dataIndex: 'kernel',
    key: 'kernel',
    width: 180,
  },
  {
    title: '驱动版本',
    dataIndex: 'driverVersion',
    key: 'driverVersion',
    width: 150,
  },
  {
    title: 'GPU数量',
    dataIndex: 'gpuCount',
    key: 'gpuCount',
    width: 100,
    sorter: (a, b) => a.gpuCount - b.gpuCount,
  },
  {
    title: '硬盘数量',
    dataIndex: 'diskCount',
    key: 'diskCount',
    width: 100,
    sorter: (a, b) => a.diskCount - b.diskCount,
  },
  {
    title: '内存',
    dataIndex: 'totalMemory',
    key: 'totalMemory',
    width: 100,
  },
  {
    title: 'CPU核心',
    dataIndex: 'cpuCores',
    key: 'cpuCores',
    width: 100,
    sorter: (a, b) => a.cpuCores - b.cpuCores,
  },
  {
    title: '最后检查',
    dataIndex: 'lastCheck',
    key: 'lastCheck',
    width: 160,
  },
  {
    title: '位置',
    dataIndex: 'location',
    key: 'location',
    width: 150,
  },
];

// 刷新数据
const refreshData = () => {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    // 这里可以调用API获取最新数据
  }, 1000);
};

// 搜索和过滤
const handleSearch = () => {
  let filtered = [...serverData.value];
  
  if (searchText.value) {
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
      item.ip.includes(searchText.value) ||
      item.location.toLowerCase().includes(searchText.value.toLowerCase()) ||
      item.os.toLowerCase().includes(searchText.value.toLowerCase())
    );
  }
  
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(item => item.result === statusFilter.value);
  }
  
  filteredData.value = filtered;
};

// 获取状态标签颜色
const getStatusColor = (result: string) => {
  const statusMap = {
    pass: 'success',
    fail: 'default',
    error: 'error'
  };
  return statusMap[result as keyof typeof statusMap] || 'default';
};

// 获取检查结果文本
const getStatusText = (result: string) => {
  const statusMap = {
    pass: '通过',
    fail: '失败',
    error: '错误'
  };
  return statusMap[result as keyof typeof statusMap] || result;
};

onMounted(() => {
  handleSearch();
});
</script>

<template>
  <div style="padding: 24px;">
    <!-- 页面标题和操作 -->
    <div style="margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
      <h1 style="font-size: 24px; font-weight: bold; margin: 0;">环境信息核对</h1>
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
    <Row :gutter="16" style="margin-bottom: 16px;">
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
            title="检查通过服务器"
            :value="stats.pass"
            :value-style="{ color: '#52c41a' }"
          />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic
            title="检查失败服务器"
            :value="stats.fail"
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

    <!-- 硬件统计 -->
    <Row :gutter="16" style="margin-bottom: 16px;">
      <Col :span="8">
        <Card>
          <Statistic
            title="总GPU数量"
            :value="stats.totalGpus"
            :value-style="{ color: '#722ed1' }"
          />
        </Card>
      </Col>
      <Col :span="8">
        <Card>
          <Statistic
            title="总硬盘数量"
            :value="stats.totalDisks"
            :value-style="{ color: '#fa8c16' }"
          />
        </Card>
      </Col>
      <Col :span="8">
        <Card>
          <Statistic
            title="总CPU核心"
            :value="stats.totalCores"
            :value-style="{ color: '#13c2c2' }"
          />
        </Card>
      </Col>
    </Row>

    <!-- 搜索和过滤 -->
    <Card style="margin-bottom: 16px;">
      <Row :gutter="16" align="middle">
        <Col :span="8">
          <Input
            v-model:value="searchText"
            placeholder="搜索服务器名称、IP地址、位置或操作系统"
            allow-clear
            @press-enter="handleSearch"
          />
        </Col>
        <Col :span="4">
          <Select
            v-model:value="statusFilter"
            placeholder="选择结果"
            style="width: 100%"
          >
            <SelectOption value="all">全部结果</SelectOption>
            <SelectOption value="pass">通过</SelectOption>
            <SelectOption value="fail">失败</SelectOption>
            <SelectOption value="error">错误</SelectOption>
          </Select>
        </Col>
        <Col :span="4">
          <Button type="primary" @click="handleSearch">
            搜索
          </Button>
        </Col>
      </Row>
    </Card>

    <!-- 数据表格 -->
    <Card>
      <Table
        :columns="columns"
        :data-source="filteredData"
        :loading="loading"
        :pagination="{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
        }"
        row-key="id"
        :scroll="{ x: 1800 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'result'">
            <Tag :color="getStatusColor(record.result)">
              {{ getStatusText(record.result) }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'gpuCount'">
            <Tag v-if="record.gpuCount > 0" color="blue">
              {{ record.gpuCount }} 个
            </Tag>
            <span v-else style="color: #999;">无</span>
          </template>
          <template v-else-if="column.key === 'driverVersion'">
            <span v-if="record.driverVersion !== 'N/A'">{{ record.driverVersion }}</span>
            <span v-else style="color: #999;">无GPU</span>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 说明信息 -->
    <Alert
      message="环境信息说明"
      description="此页面显示所有服务器的环境信息，包括操作系统、内核版本、驱动版本、GPU数量、硬盘数量等详细信息。定期检查这些信息有助于确保系统环境的稳定性和一致性。"
      type="info"
      show-icon
      style="margin-top: 16px;"
    />
  </div>
</template>

<style scoped>
.ant-card {
  border-radius: 8px;
}

.ant-card-head {
  border-bottom: 1px solid #f0f0f0;
}

.ant-card-body {
  padding: 24px;
}
</style>
