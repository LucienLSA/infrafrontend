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
  Input,
  Select,
  SelectOption,
  Form,
  FormItem,
  Radio,
  RadioGroup,
  Divider,
  Progress,
  Tooltip,
  Badge,
  Tabs,
  TabPane
} from 'ant-design-vue';

defineOptions({ name: 'LinkTest' });

// 链路测试状态
type TestStatus = '未执行' | '测试中' | '通过' | '失败' | '超时';

// 链路测试结果接口
interface LinkTestResult {
  id: string;
  serverName: string;
  portName: string;
  status: TestStatus;
  latency: number; // 延迟(ms)
  bandwidth: number; // 带宽(Mbps)
  packetLoss: number; // 丢包率(%)
  testTime: string;
  duration: number; // 测试时长(秒)
  errorMessage?: string;
}

// 服务器接口
interface Server {
  id: string;
  name: string;
  ip: string;
  status: '在线' | '离线';
  networkCards: NetworkCard[];
}

// 网卡接口
interface NetworkCard {
  id: string;
  name: string;
  type: string;
  status: '正常' | '异常';
  ip: string;
}

// 响应式数据
const loading = ref(false);
const testRunning = ref(false);
const testMode = ref<'all' | 'custom'>('all');
const customForm = reactive({
  selectedServers: [] as string[],
  selectedNetworkCards: [] as string[]
});

// 模拟服务器数据
const servers = ref<Server[]>([
  {
    id: '1',
    name: 'GPU-Server-001',
    ip: '192.168.1.101',
    status: '在线',
    networkCards: [
      { id: '1-1', name: 'eth0', type: '千兆网卡', status: '正常', ip: '192.168.1.101' },
      { id: '1-2', name: 'eth1', type: '万兆网卡', status: '正常', ip: '192.168.1.102' },
      { id: '1-3', name: 'ib0', type: 'InfiniBand', status: '正常', ip: '192.168.1.103' }
    ]
  },
  {
    id: '2',
    name: 'GPU-Server-002',
    ip: '192.168.1.201',
    status: '在线',
    networkCards: [
      { id: '2-1', name: 'eth0', type: '千兆网卡', status: '正常', ip: '192.168.1.201' },
      { id: '2-2', name: 'eth1', type: '万兆网卡', status: '正常', ip: '192.168.1.202' },
      { id: '2-3', name: 'ib0', type: 'InfiniBand', status: '异常', ip: '192.168.1.203' }
    ]
  },
  {
    id: '3',
    name: 'Storage-Server-001',
    ip: '192.168.1.301',
    status: '在线',
    networkCards: [
      { id: '3-1', name: 'eth0', type: '千兆网卡', status: '正常', ip: '192.168.1.301' },
      { id: '3-2', name: 'eth1', type: '万兆网卡', status: '正常', ip: '192.168.1.302' }
    ]
  }
]);

// 测试结果数据
const testResults = ref<LinkTestResult[]>([]);

// 统计信息
const stats = computed(() => {
  const totalTests = testResults.value.length;
  const passedTests = testResults.value.filter(r => r.status === '通过').length;
  const failedTests = testResults.value.filter(r => r.status === '失败').length;
  const runningTests = testResults.value.filter(r => r.status === '测试中').length;
  const avgLatency = testResults.value.length > 0 
    ? (testResults.value.reduce((sum, r) => sum + r.latency, 0) / testResults.value.length).toFixed(2)
    : '0';
  const avgBandwidth = testResults.value.length > 0
    ? (testResults.value.reduce((sum, r) => sum + r.bandwidth, 0) / testResults.value.length).toFixed(2)
    : '0';
  
  return {
    totalTests,
    passedTests,
    failedTests,
    runningTests,
    avgLatency,
    avgBandwidth
  };
});

// 可选择的网卡列表
const availableNetworkCards = computed(() => {
  const allCards: Array<{serverName: string, card: NetworkCard}> = [];
  customForm.selectedServers.forEach(serverName => {
    const server = servers.value.find(s => s.name === serverName);
    if (server) {
      server.networkCards.forEach(card => {
        if (card.status === '正常') {
          allCards.push({ serverName, card });
        }
      });
    }
  });
  return allCards;
});

// 获取所有可选择的服务器
const availableServers = computed(() => {
  return servers.value.filter(s => s.status === '在线');
});

// 表格列配置
const getResultColumns = () => [
  {
    title: '服务器名称',
    dataIndex: 'serverName',
    key: 'serverName',
    width: 150,
  },
  {
    title: '端口名称',
    dataIndex: 'portName',
    key: 'portName',
    width: 120,
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
        '失败': 'error',
        '超时': 'warning'
      };
      return h(Tag, { color: colorMap[text] }, () => text);
    }
  },
  {
    title: '延迟(ms)',
    dataIndex: 'latency',
    key: 'latency',
    width: 100,
    customRender: ({ record }: { record: LinkTestResult }) => {
      if (record.status === '测试中') {
        return h(Progress, { percent: 50, size: 'small', status: 'active' });
      }
      return record.latency.toFixed(2);
    }
  },
  {
    title: '带宽(Mbps)',
    dataIndex: 'bandwidth',
    key: 'bandwidth',
    width: 120,
    customRender: ({ record }: { record: LinkTestResult }) => {
      if (record.status === '测试中') {
        return h(Progress, { percent: 50, size: 'small', status: 'active' });
      }
      return record.bandwidth.toFixed(2);
    }
  },
  {
    title: '丢包率(%)',
    dataIndex: 'packetLoss',
    key: 'packetLoss',
    width: 100,
    customRender: ({ record }: { record: LinkTestResult }) => {
      if (record.status === '测试中') {
        return h(Progress, { percent: 50, size: 'small', status: 'active' });
      }
      const color = record.packetLoss > 5 ? '#ff4d4f' : record.packetLoss > 1 ? '#faad14' : '#52c41a';
      return h('span', { style: { color } }, record.packetLoss.toFixed(2));
    }
  },
  {
    title: '测试时间',
    dataIndex: 'testTime',
    key: 'testTime',
    width: 160,
  },
  {
    title: '测试时长(秒)',
    dataIndex: 'duration',
    key: 'duration',
    width: 120,
  },
  {
    title: '错误信息',
    dataIndex: 'errorMessage',
    key: 'errorMessage',
    width: 200,
    customRender: ({ record }: { record: LinkTestResult }) => {
      if (!record.errorMessage) return '-';
      return h(Tooltip, { title: record.errorMessage }, () => 
        h('span', { style: { color: '#ff4d4f', cursor: 'pointer' } }, '查看详情')
      );
    }
  }
];

// 检测所有链路
const detectAllLinks = async () => {
  loading.value = true;
  testRunning.value = true;
  
  try {
    message.info('开始检测所有链路...');
    
    // 清空之前的结果
    testResults.value = [];
    
    // 模拟检测过程
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 生成所有服务器的链路测试结果
    const allResults: LinkTestResult[] = [];
    let resultId = 1;
    
    servers.value.forEach(server => {
      if (server.status === '在线') {
        server.networkCards.forEach(card => {
          if (card.status === '正常') {
            allResults.push({
              id: resultId.toString(),
              serverName: server.name,
              portName: card.name,
              status: '测试中',
              latency: 0,
              bandwidth: 0,
              packetLoss: 0,
              testTime: '',
              duration: 0
            });
            resultId++;
          }
        });
      }
    });
    
    testResults.value = allResults;
    message.success(`已检测到 ${allResults.length} 条链路，开始测试...`);
    
    // 开始测试
    await startLinkTest();
    
  } catch (error) {
    message.error('检测链路失败！');
  } finally {
    loading.value = false;
  }
};

// 检测特定链路
const detectCustomLinks = async () => {
  if (customForm.selectedServers.length === 0 || customForm.selectedNetworkCards.length === 0) {
    message.warning('请选择至少一台服务器和一个网卡！');
    return;
  }
  
  loading.value = true;
  testRunning.value = true;
  
  try {
    const serverNames = customForm.selectedServers.join('、');
    const cardNames = customForm.selectedNetworkCards.join('、');
    message.info(`开始检测特定链路：${serverNames} - ${cardNames}`);
    
    // 清空之前的结果
    testResults.value = [];
    
    // 模拟检测过程
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 生成特定链路的测试结果
    const customResults: LinkTestResult[] = [];
    let resultId = 1;
    
    customForm.selectedServers.forEach(serverName => {
      const server = servers.value.find(s => s.name === serverName);
      if (server) {
        server.networkCards.forEach(card => {
          if (customForm.selectedNetworkCards.includes(card.name)) {
            customResults.push({
              id: resultId.toString(),
              serverName: server.name,
              portName: card.name,
              status: '测试中',
              latency: 0,
              bandwidth: 0,
              packetLoss: 0,
              testTime: '',
              duration: 0
            });
            resultId++;
          }
        });
      }
    });
    
    testResults.value = customResults;
    message.success(`已检测到 ${customResults.length} 条特定链路，开始测试...`);
    
    // 开始测试
    await startLinkTest();
    
  } catch (error) {
    message.error('检测特定链路失败！');
  } finally {
    loading.value = false;
  }
};

// 开始链路测试
const startLinkTest = async () => {
  testRunning.value = true;
  
  try {
    // 模拟测试过程
    for (let i = 0; i < testResults.value.length; i++) {
      const result = testResults.value[i];
      
      // 更新测试状态
      result.status = '测试中';
      result.testTime = new Date().toLocaleString();
      
      // 模拟测试过程（每个测试2-5秒）
      const testDuration = Math.random() * 3000 + 2000;
      await new Promise(resolve => setTimeout(resolve, testDuration));
      
      // 生成测试结果
      const isSuccess = Math.random() > 0.2; // 80% 成功率
      
      if (isSuccess) {
        result.status = '通过';
        result.latency = Math.random() * 10 + 1; // 1-11ms
        result.bandwidth = Math.random() * 900 + 100; // 100-1000 Mbps
        result.packetLoss = Math.random() * 2; // 0-2%
      } else {
        result.status = Math.random() > 0.5 ? '失败' : '超时';
        result.latency = Math.random() * 50 + 20; // 20-70ms
        result.bandwidth = Math.random() * 50 + 10; // 10-60 Mbps
        result.packetLoss = Math.random() * 10 + 5; // 5-15%
        result.errorMessage = result.status === '失败' ? '网络连接异常' : '测试超时';
      }
      
      result.duration = Math.round(testDuration / 1000);
    }
    
    message.success('链路测试完成！');
    
  } catch (error) {
    message.error('链路测试失败！');
  } finally {
    testRunning.value = false;
  }
};

// 清除测试结果
const clearResults = () => {
  testResults.value = [];
  message.success('测试结果已清除！');
};

// 重新测试
const retest = () => {
  if (testResults.value.length === 0) {
    message.warning('没有可重新测试的链路！');
    return;
  }
  
  testResults.value.forEach(result => {
    result.status = '未执行';
    result.latency = 0;
    result.bandwidth = 0;
    result.packetLoss = 0;
    result.testTime = '';
    result.duration = 0;
    result.errorMessage = undefined;
  });
  
  message.info('已重置测试状态，可以重新开始测试！');
};

// 导出测试结果
const exportResults = () => {
  if (testResults.value.length === 0) {
    message.warning('没有测试结果可导出！');
    return;
  }
  
  // 模拟导出功能
  const csvContent = [
    '服务器名称,端口名称,测试状态,延迟(ms),带宽(Mbps),丢包率(%),测试时间,测试时长(秒),错误信息',
    ...testResults.value.map(result => 
      `${result.serverName},${result.portName},${result.status},${result.latency.toFixed(2)},${result.bandwidth.toFixed(2)},${result.packetLoss.toFixed(2)},${result.testTime},${result.duration},${result.errorMessage || ''}`
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `链路测试结果_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
  link.click();
  
  message.success('测试结果已导出！');
};

onMounted(() => {
  // 初始化数据
});
</script>

<template>
  <div style="padding: 24px;">
    <!-- 页面标题 -->
    <div style="margin-bottom: 24px;">
      <h1 style="font-size: 24px; font-weight: bold; margin: 0 0 8px 0; color: #333333;">
        <span style="font-size: 28px; margin-right: 12px; color: #1890ff;">🔗</span>
        链路测试
      </h1>
      <p style="color: #666666; margin: 0;">对服务器网络链路进行连通性和性能测试。</p>
    </div>

    <!-- 统计概览 -->
    <Row :gutter="16" style="margin-bottom: 24px;">
      <Col :span="4">
        <Card>
          <Statistic
            title="总测试数"
            :value="stats.totalTests"
            :value-style="{ color: '#1890ff' }"
          />
        </Card>
      </Col>
      <Col :span="4">
        <Card>
          <Statistic
            title="通过测试"
            :value="stats.passedTests"
            :value-style="{ color: '#52c41a' }"
          />
        </Card>
      </Col>
      <Col :span="4">
        <Card>
          <Statistic
            title="失败测试"
            :value="stats.failedTests"
            :value-style="{ color: '#ff4d4f' }"
          />
        </Card>
      </Col>
      <Col :span="4">
        <Card>
          <Statistic
            title="测试中"
            :value="stats.runningTests"
            :value-style="{ color: '#faad14' }"
          />
        </Card>
      </Col>
      <Col :span="4">
        <Card>
          <Statistic
            title="平均延迟(ms)"
            :value="stats.avgLatency"
            :value-style="{ color: '#722ed1' }"
          />
        </Card>
      </Col>
      <Col :span="4">
        <Card>
          <Statistic
            title="平均带宽(Mbps)"
            :value="stats.avgBandwidth"
            :value-style="{ color: '#13c2c2' }"
          />
        </Card>
      </Col>
    </Row>

    <!-- 测试配置区域 -->
    <Card style="margin-bottom: 24px;">
      <template #title>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 18px;">⚙️</span>
          <span>测试配置</span>
        </div>
      </template>
      
      <Tabs v-model:activeKey="testMode" type="card">
        <TabPane key="all" tab="检测所有链路">
          <div style="padding: 16px 0;">
            <p style="color: #666666; margin-bottom: 16px;">
              自动检测所有在线服务器的所有正常网卡，并进行链路测试。
            </p>
            <Button 
              type="primary" 
              size="large"
              :loading="loading"
              :disabled="testRunning"
              @click="detectAllLinks"
            >
              <template #icon>
                <span style="font-size: 16px;">🔍</span>
              </template>
              检测所有链路
            </Button>
          </div>
        </TabPane>
        
        <TabPane key="custom" tab="检测特定链路">
          <div style="padding: 16px 0;">
            <p style="color: #666666; margin-bottom: 16px;">
              选择多台服务器和多个网卡进行链路测试。支持批量选择。
            </p>
            
            <Form layout="vertical" :model="customForm">
              <Row :gutter="16">
                <Col :span="12">
                  <FormItem label="选择服务器（可多选）">
                    <Select
                      v-model:value="customForm.selectedServers"
                      mode="multiple"
                      placeholder="请选择服务器"
                      style="width: 100%;"
                      @change="customForm.selectedNetworkCards = []"
                    >
                      <SelectOption 
                        v-for="server in availableServers" 
                        :key="server.id" 
                        :value="server.name"
                      >
                        {{ server.name }} ({{ server.ip }})
                      </SelectOption>
                    </Select>
                    <div style="color: #999999; font-size: 12px; margin-top: 4px;">
                      已选择 {{ customForm.selectedServers.length }} 台服务器
                    </div>
                  </FormItem>
                </Col>
                
                <Col :span="12">
                  <FormItem label="选择网卡（可多选）">
                    <Select
                      v-model:value="customForm.selectedNetworkCards"
                      mode="multiple"
                      placeholder="请选择网卡"
                      style="width: 100%;"
                      :disabled="customForm.selectedServers.length === 0"
                    >
                      <SelectOption 
                        v-for="item in availableNetworkCards" 
                        :key="`${item.serverName}-${item.card.id}`" 
                        :value="item.card.name"
                      >
                        {{ item.card.name }} ({{ item.serverName }} - {{ item.card.type }})
                      </SelectOption>
                    </Select>
                    <div style="color: #999999; font-size: 12px; margin-top: 4px;">
                      已选择 {{ customForm.selectedNetworkCards.length }} 个网卡
                    </div>
                  </FormItem>
                </Col>
              </Row>
              
              <FormItem>
                <Space>
                  <Button 
                    type="primary" 
                    size="large"
                    :loading="loading"
                    :disabled="testRunning || customForm.selectedServers.length === 0 || customForm.selectedNetworkCards.length === 0"
                    @click="detectCustomLinks"
                  >
                    <template #icon>
                      <span style="font-size: 16px;">🎯</span>
                    </template>
                    检测特定链路
                  </Button>
                  
                  <Button 
                    :disabled="testRunning"
                    @click="customForm.selectedServers = []; customForm.selectedNetworkCards = []"
                  >
                    <template #icon>
                      <span style="font-size: 14px;">🔄</span>
                    </template>
                    重置选择
                  </Button>
                </Space>
              </FormItem>
              
              <!-- 选择预览 -->
              <div v-if="customForm.selectedServers.length > 0 || customForm.selectedNetworkCards.length > 0" style="margin-top: 16px; padding: 12px; background: #f5f5f5; border-radius: 6px;">
                <div style="font-weight: 500; margin-bottom: 8px; color: #333333;">选择预览：</div>
                <div v-if="customForm.selectedServers.length > 0" style="margin-bottom: 8px;">
                  <span style="color: #666666;">服务器：</span>
                  <Tag v-for="server in customForm.selectedServers" :key="server" color="blue" style="margin-right: 4px;">
                    {{ server }}
                  </Tag>
                </div>
                <div v-if="customForm.selectedNetworkCards.length > 0">
                  <span style="color: #666666;">网卡：</span>
                  <Tag v-for="card in customForm.selectedNetworkCards" :key="card" color="green" style="margin-right: 4px;">
                    {{ card }}
                  </Tag>
                </div>
                <div style="color: #1890ff; font-size: 12px; margin-top: 8px;">
                  将生成 {{ customForm.selectedServers.length * customForm.selectedNetworkCards.length }} 条测试链路
                </div>
              </div>
            </Form>
          </div>
        </TabPane>
      </Tabs>
    </Card>

    <!-- 测试状态提示 -->
    <Alert
      v-if="testRunning"
      type="info"
      show-icon
      style="margin-bottom: 24px;"
    >
      <template #message>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>链路测试正在进行中，请稍候...</span>
          <Progress :percent="50" size="small" status="active" style="width: 200px;" />
        </div>
      </template>
    </Alert>

    <!-- 测试结果区域 -->
    <Card v-if="testResults.length > 0">
      <template #title>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 18px;">📊</span>
            <span>测试结果</span>
            <Badge 
              :count="stats.failedTests" 
              :number-style="{ backgroundColor: '#ff4d4f' }"
            />
          </div>
          <Space>
            <Button 
              :disabled="testRunning"
              @click="retest"
            >
              <template #icon>
                <span style="font-size: 14px;">🔄</span>
              </template>
              重新测试
            </Button>
            <Button 
              :disabled="testRunning"
              @click="exportResults"
            >
              <template #icon>
                <span style="font-size: 14px;">📥</span>
              </template>
              导出结果
            </Button>
            <Button 
              :disabled="testRunning"
              @click="clearResults"
            >
              <template #icon>
                <span style="font-size: 14px;">🗑️</span>
              </template>
              清除结果
            </Button>
          </Space>
        </div>
      </template>
      
      <Table
        :columns="getResultColumns()"
        :data-source="testResults"
        :loading="testRunning"
        :pagination="{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }"
        row-key="id"
        size="middle"
        :scroll="{ x: 1200 }"
      />
    </Card>

    <!-- 空状态提示 -->
    <Card v-else>
      <div style="text-align: center; padding: 40px 0;">
        <div style="font-size: 48px; margin-bottom: 16px; color: #d9d9d9;">🔗</div>
        <h3 style="color: #666666; margin-bottom: 8px;">暂无测试结果</h3>
        <p style="color: #999999; margin-bottom: 24px;">请先选择检测模式并开始链路测试</p>
        <Space>
          <Button type="primary" @click="detectAllLinks" :disabled="testRunning">
            检测所有链路
          </Button>
          <Button @click="testMode = 'custom'" :disabled="testRunning">
            检测特定链路
          </Button>
        </Space>
      </div>
    </Card>
  </div>
</template>

<style scoped>
.ant-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ant-table-thead > tr > th {
  background: #fafafa;
  font-weight: 600;
}

.ant-tag {
  border-radius: 4px;
  font-size: 12px;
  padding: 4px 8px;
  font-weight: 500;
}

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

.ant-progress-text {
  font-size: 12px;
  font-weight: 600;
  color: #333333;
}

.ant-tabs-tab {
  font-weight: 500;
}

.ant-form-item {
  margin-bottom: 16px;
}

.ant-alert {
  border-radius: 6px;
}
</style>
