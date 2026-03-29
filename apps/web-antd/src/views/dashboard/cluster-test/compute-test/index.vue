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
  TabPane,
  Collapse,
  CollapsePanel
} from 'ant-design-vue';

defineOptions({ name: 'ComputeTest' });

// 算力测试状态
type TestStatus = '未执行' | '测试中' | '通过' | '失败' | '超时';

// 算力测试结果接口
interface ComputeTestResult {
  id: string;
  testType: '单机测试' | '2机测试' | '4机测试' | '8机测试' | '16机测试' | '32机测试' | '特定节点测试';
  nodeCount: number;
  nodes: string[];
  status: TestStatus;
  tflops: number; // 算力(TFlops)
  gpuUtilization: number; // GPU利用率(%)
  memoryUtilization: number; // 显存利用率(%)
  powerConsumption: number; // 功耗(W)
  testTime: string;
  duration: number; // 测试时长(秒)
  errorMessage?: string;
}

// 服务器接口
interface Server {
  id: string;
  name: string;
  ip: string;
  gpuCount: number;
  gpuModel: string;
  status: '在线' | '离线';
  cudaVersion: string;
  driverVersion: string;
}

// 响应式数据
const loading = ref(false);
const testRunning = ref(false);
const testMode = ref<'all' | 'custom'>('all');
const activeResultTab = ref('单机测试');
const customForm = reactive({
  selectedServers: [] as string[]
});

// 模拟服务器数据
const servers = ref<Server[]>([
  {
    id: '1',
    name: 'GPU-Server-001',
    ip: '192.168.1.101',
    gpuCount: 8,
    gpuModel: 'NVIDIA A100',
    status: '在线',
    cudaVersion: '11.8',
    driverVersion: '525.85.12'
  },
  {
    id: '2',
    name: 'GPU-Server-002',
    ip: '192.168.1.102',
    gpuCount: 8,
    gpuModel: 'NVIDIA A100',
    status: '在线',
    cudaVersion: '11.8',
    driverVersion: '525.85.12'
  },
  {
    id: '3',
    name: 'GPU-Server-003',
    ip: '192.168.1.103',
    gpuCount: 8,
    gpuModel: 'NVIDIA A100',
    status: '在线',
    cudaVersion: '11.8',
    driverVersion: '525.85.12'
  },
  {
    id: '4',
    name: 'GPU-Server-004',
    ip: '192.168.1.104',
    gpuCount: 8,
    gpuModel: 'NVIDIA A100',
    status: '在线',
    cudaVersion: '11.8',
    driverVersion: '525.85.12'
  },
  {
    id: '5',
    name: 'GPU-Server-005',
    ip: '192.168.1.105',
    gpuCount: 8,
    gpuModel: 'NVIDIA A100',
    status: '在线',
    cudaVersion: '11.8',
    driverVersion: '525.85.12'
  },
  {
    id: '6',
    name: 'GPU-Server-006',
    ip: '192.168.1.106',
    gpuCount: 8,
    gpuModel: 'NVIDIA A100',
    status: '在线',
    cudaVersion: '11.8',
    driverVersion: '525.85.12'
  },
  {
    id: '7',
    name: 'GPU-Server-007',
    ip: '192.168.1.107',
    gpuCount: 8,
    gpuModel: 'NVIDIA A100',
    status: '在线',
    cudaVersion: '11.8',
    driverVersion: '525.85.12'
  },
  {
    id: '8',
    name: 'GPU-Server-008',
    ip: '192.168.1.108',
    gpuCount: 8,
    gpuModel: 'NVIDIA A100',
    status: '在线',
    cudaVersion: '11.8',
    driverVersion: '525.85.12'
  }
]);

// 测试结果数据
const testResults = ref<ComputeTestResult[]>([]);

// 性能标准配置
const performanceStandards = {
  '单机测试': { minTflops: 80, minGpuUtil: 85 },
  '2机测试': { minTflops: 150, minGpuUtil: 80 },
  '4机测试': { minTflops: 280, minGpuUtil: 75 },
  '8机测试': { minTflops: 520, minGpuUtil: 70 },
  '16机测试': { minTflops: 1000, minGpuUtil: 65 },
  '32机测试': { minTflops: 1900, minGpuUtil: 60 },
  '特定节点测试': { minTflops: 40, minGpuUtil: 80 }
};

// 判断性能是否达标
const isPerformancePassed = (result: ComputeTestResult) => {
  if (result.status !== '通过') return false;
  const standard = performanceStandards[result.testType];
  return result.tflops >= standard.minTflops && result.gpuUtilization >= standard.minGpuUtil;
};

// 按测试类型分组的结果
const groupedResults = computed(() => {
  const groups: Record<string, ComputeTestResult[]> = {};
  testResults.value.forEach(result => {
    if (!groups[result.testType]) {
      groups[result.testType] = [];
    }
    groups[result.testType].push(result);
  });
  return groups;
});

// 获取所有测试类型
const testTypes = computed(() => {
  return Object.keys(groupedResults.value).sort((a, b) => {
    const order = ['单机测试', '2机测试', '4机测试', '8机测试', '16机测试', '32机测试', '特定节点测试'];
    return order.indexOf(a) - order.indexOf(b);
  });
});

// 统计信息
const stats = computed(() => {
  const totalTests = testResults.value.length;
  const passedTests = testResults.value.filter(r => r.status === '通过').length;
  const failedTests = testResults.value.filter(r => r.status === '失败').length;
  const runningTests = testResults.value.filter(r => r.status === '测试中').length;
  const performanceFailed = testResults.value.filter(r => r.status === '通过' && !isPerformancePassed(r)).length;
  const avgTflops = testResults.value.length > 0 
    ? (testResults.value.reduce((sum, r) => sum + r.tflops, 0) / testResults.value.length).toFixed(2)
    : '0';
  const avgGpuUtil = testResults.value.length > 0
    ? (testResults.value.reduce((sum, r) => sum + r.gpuUtilization, 0) / testResults.value.length).toFixed(2)
    : '0';
  
  return {
    totalTests,
    passedTests,
    failedTests,
    runningTests,
    performanceFailed,
    avgTflops,
    avgGpuUtil
  };
});

// 获取所有可选择的服务器
const availableServers = computed(() => {
  return servers.value.filter(s => s.status === '在线');
});

// 获取集群上限
const clusterLimit = computed(() => {
  return availableServers.value.length;
});

// 生成全集群测试配置
const generateAllClusterTests = () => {
  const tests: Array<{type: string, nodeCount: number}> = [
    { type: '单机测试', nodeCount: 1 }
  ];
  let nodeCount = 2;
  
  while (nodeCount <= clusterLimit.value) {
    tests.push({
      type: `${nodeCount}机测试`,
      nodeCount
    });
    nodeCount *= 2;
  }
  
  return tests;
};

// 表格列配置
const getResultColumns = () => [
  {
    title: '测试类型',
    dataIndex: 'testType',
    key: 'testType',
    width: 120,
    customRender: ({ text }: { text: string }) => {
      const colorMap = {
        '单机测试': 'purple',
        '2机测试': 'blue',
        '4机测试': 'green',
        '8机测试': 'orange',
        '16机测试': 'red',
        '32机测试': 'magenta',
        '特定节点测试': 'cyan'
      };
      return h(Tag, { color: colorMap[text] }, () => text);
    }
  },
  {
    title: '节点数量',
    dataIndex: 'nodeCount',
    key: 'nodeCount',
    width: 100,
  },
  {
    title: '测试节点',
    dataIndex: 'nodes',
    key: 'nodes',
    width: 200,
    customRender: ({ record }: { record: ComputeTestResult }) => {
      if (record.nodes.length <= 3) {
        return record.nodes.join(', ');
      }
      return h(Tooltip, { 
        title: record.nodes.join(', ') 
      }, () => 
        h('span', { style: { cursor: 'pointer', color: '#1890ff' } }, 
          `${record.nodes.slice(0, 2).join(', ')} 等${record.nodes.length}个节点`
        )
      );
    }
  },
  {
    title: '测试状态',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    customRender: ({ record }: { record: ComputeTestResult }) => {
      let status = record.status;
      let color = 'default';
      
      if (record.status === '通过' && !isPerformancePassed(record)) {
        status = '不达标';
        color = 'warning';
      } else {
        const colorMap = {
          '未执行': 'default',
          '测试中': 'processing',
          '通过': 'success',
          '失败': 'error',
          '超时': 'warning'
        };
        color = colorMap[record.status];
      }
      
      return h(Tag, { color }, () => status);
    }
  },
  {
    title: '算力(TFlops)',
    dataIndex: 'tflops',
    key: 'tflops',
    width: 120,
    customRender: ({ record }: { record: ComputeTestResult }) => {
      if (record.status === '测试中') {
        return h(Progress, { percent: 50, size: 'small', status: 'active' });
      }
      const standard = performanceStandards[record.testType];
      const isPassed = record.tflops >= standard.minTflops;
      const color = isPassed ? '#52c41a' : '#ff4d4f';
      return h('span', { style: { color, fontWeight: isPassed ? 'normal' : 'bold' } }, 
        `${record.tflops.toFixed(2)}${!isPassed ? ' ⚠️' : ''}`
      );
    }
  },
  {
    title: 'GPU利用率(%)',
    dataIndex: 'gpuUtilization',
    key: 'gpuUtilization',
    width: 120,
    customRender: ({ record }: { record: ComputeTestResult }) => {
      if (record.status === '测试中') {
        return h(Progress, { percent: 50, size: 'small', status: 'active' });
      }
      const standard = performanceStandards[record.testType];
      const isPassed = record.gpuUtilization >= standard.minGpuUtil;
      const color = isPassed ? '#52c41a' : '#ff4d4f';
      return h('span', { style: { color, fontWeight: isPassed ? 'normal' : 'bold' } }, 
        `${record.gpuUtilization.toFixed(1)}%${!isPassed ? ' ⚠️' : ''}`
      );
    }
  },
  {
    title: '显存利用率(%)',
    dataIndex: 'memoryUtilization',
    key: 'memoryUtilization',
    width: 120,
    customRender: ({ record }: { record: ComputeTestResult }) => {
      if (record.status === '测试中') {
        return h(Progress, { percent: 50, size: 'small', status: 'active' });
      }
      const color = record.memoryUtilization > 80 ? '#52c41a' : record.memoryUtilization > 60 ? '#faad14' : '#ff4d4f';
      return h('span', { style: { color } }, `${record.memoryUtilization.toFixed(1)}%`);
    }
  },
  {
    title: '功耗(W)',
    dataIndex: 'powerConsumption',
    key: 'powerConsumption',
    width: 100,
    customRender: ({ record }: { record: ComputeTestResult }) => {
      if (record.status === '测试中') {
        return h(Progress, { percent: 50, size: 'small', status: 'active' });
      }
      return record.powerConsumption.toFixed(0);
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
    customRender: ({ record }: { record: ComputeTestResult }) => {
      if (!record.errorMessage) return '-';
      return h(Tooltip, { title: record.errorMessage }, () => 
        h('span', { style: { color: '#ff4d4f', cursor: 'pointer' } }, '查看详情')
      );
    }
  }
];

// 全集群测试
const runAllClusterTest = async () => {
  loading.value = true;
  testRunning.value = true;
  
  try {
    message.info('开始全集群算力测试...');
    
    // 清空之前的结果
    testResults.value = [];
    
    // 模拟检测过程
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 生成全集群测试结果
    const allTests = generateAllClusterTests();
    const allResults: ComputeTestResult[] = [];
    let resultId = 1;
    
    allTests.forEach(test => {
      const selectedNodes = availableServers.value.slice(0, test.nodeCount).map(s => s.name);
      allResults.push({
        id: resultId.toString(),
        testType: test.type as any,
        nodeCount: test.nodeCount,
        nodes: selectedNodes,
        status: '测试中',
        tflops: 0,
        gpuUtilization: 0,
        memoryUtilization: 0,
        powerConsumption: 0,
        testTime: '',
        duration: 0
      });
      resultId++;
    });
    
    testResults.value = allResults;
    message.success(`已生成 ${allResults.length} 个全集群测试，开始测试...`);
    
    // 开始测试
    await startComputeTest();
    
  } catch (error) {
    message.error('全集群测试失败！');
  } finally {
    loading.value = false;
  }
};

// 特定节点测试
const runCustomNodeTest = async () => {
  if (customForm.selectedServers.length < 1) {
    message.warning('至少需要选择1个节点进行算力测试！');
    return;
  }
  
  loading.value = true;
  testRunning.value = true;
  
  try {
    const nodeNames = customForm.selectedServers.join('、');
    message.info(`开始特定节点算力测试：${nodeNames}`);
    
    // 清空之前的结果
    testResults.value = [];
    
    // 模拟检测过程
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 生成特定节点测试结果
    const customResults: ComputeTestResult[] = [{
      id: '1',
      testType: '特定节点测试',
      nodeCount: customForm.selectedServers.length,
      nodes: customForm.selectedServers,
      status: '测试中',
      tflops: 0,
      gpuUtilization: 0,
      memoryUtilization: 0,
      powerConsumption: 0,
      testTime: '',
      duration: 0
    }];
    
    testResults.value = customResults;
    message.success(`已生成特定节点测试，开始测试...`);
    
    // 开始测试
    await startComputeTest();
    
  } catch (error) {
    message.error('特定节点测试失败！');
  } finally {
    loading.value = false;
  }
};

// 开始算力测试
const startComputeTest = async () => {
  testRunning.value = true;
  
  try {
    // 模拟测试过程
    for (let i = 0; i < testResults.value.length; i++) {
      const result = testResults.value[i];
      
      // 更新测试状态
      result.status = '测试中';
      result.testTime = new Date().toLocaleString();
      
      // 模拟测试过程（每个测试5-12秒）
      const testDuration = Math.random() * 7000 + 5000;
      await new Promise(resolve => setTimeout(resolve, testDuration));
      
      // 生成测试结果
      const isSuccess = Math.random() > 0.1; // 90% 成功率
      
      if (isSuccess) {
        result.status = '通过';
        // 根据节点数量生成不同的性能数据
        const baseTflops = 80; // 单机基础算力
        const scaleFactor = result.nodeCount * 0.9; // 节点数量缩放（考虑效率损失）
        result.tflops = baseTflops * scaleFactor + Math.random() * 20;
        result.gpuUtilization = Math.random() * 15 + 80; // 80-95%
        result.memoryUtilization = Math.random() * 20 + 70; // 70-90%
        result.powerConsumption = result.nodeCount * 300 + Math.random() * 100; // 每节点约300W
      } else {
        result.status = Math.random() > 0.5 ? '失败' : '超时';
        result.tflops = Math.random() * 30 + 10; // 10-40 TFlops
        result.gpuUtilization = Math.random() * 30 + 40; // 40-70%
        result.memoryUtilization = Math.random() * 40 + 30; // 30-70%
        result.powerConsumption = result.nodeCount * 200 + Math.random() * 50;
        result.errorMessage = result.status === '失败' ? 'GPU算力异常' : '测试超时';
      }
      
      result.duration = Math.round(testDuration / 1000);
    }
    
    message.success('算力测试完成！');
    
  } catch (error) {
    message.error('算力测试失败！');
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
    message.warning('没有可重新测试的项目！');
    return;
  }
  
  testResults.value.forEach(result => {
    result.status = '未执行';
    result.tflops = 0;
    result.gpuUtilization = 0;
    result.memoryUtilization = 0;
    result.powerConsumption = 0;
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
    '测试类型,节点数量,测试节点,测试状态,算力(TFlops),GPU利用率(%),显存利用率(%),功耗(W),测试时间,测试时长(秒),错误信息',
    ...testResults.value.map(result => 
      `${result.testType},${result.nodeCount},"${result.nodes.join(',')}",${result.status},${result.tflops.toFixed(2)},${result.gpuUtilization.toFixed(1)},${result.memoryUtilization.toFixed(1)},${result.powerConsumption.toFixed(0)},${result.testTime},${result.duration},${result.errorMessage || ''}`
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `算力测试结果_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
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
        <span style="font-size: 28px; margin-right: 12px; color: #1890ff;">⚡</span>
        算力测试
      </h1>
      <p style="color: #666666; margin: 0;">对GPU集群进行算力性能测试，验证多机多卡计算能力。</p>
    </div>

    <!-- 统计概览 -->
    <Row :gutter="16" style="margin-bottom: 24px;">
      <Col :span="3">
        <Card>
          <Statistic
            title="总测试数"
            :value="stats.totalTests"
            :value-style="{ color: '#1890ff' }"
          />
        </Card>
      </Col>
      <Col :span="3">
        <Card>
          <Statistic
            title="通过测试"
            :value="stats.passedTests"
            :value-style="{ color: '#52c41a' }"
          />
        </Card>
      </Col>
      <Col :span="3">
        <Card>
          <Statistic
            title="失败测试"
            :value="stats.failedTests"
            :value-style="{ color: '#ff4d4f' }"
          />
        </Card>
      </Col>
      <Col :span="3">
        <Card>
          <Statistic
            title="性能不达标"
            :value="stats.performanceFailed"
            :value-style="{ color: '#fa8c16' }"
          />
        </Card>
      </Col>
      <Col :span="3">
        <Card>
          <Statistic
            title="测试中"
            :value="stats.runningTests"
            :value-style="{ color: '#faad14' }"
          />
        </Card>
      </Col>
      <Col :span="3">
        <Card>
          <Statistic
            title="平均算力(TFlops)"
            :value="stats.avgTflops"
            :value-style="{ color: '#722ed1' }"
          />
        </Card>
      </Col>
      <Col :span="3">
        <Card>
          <Statistic
            title="平均GPU利用率(%)"
            :value="stats.avgGpuUtil"
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
        <TabPane key="all" tab="全集群测试">
          <div style="padding: 16px 0;">
            <p style="color: #666666; margin-bottom: 16px;">
              自动进行单机、2机、4机、8机等全集群算力测试，直到集群上限（{{ clusterLimit }}台服务器）。
            </p>
            
            <!-- 测试配置预览 -->
            <div style="margin-bottom: 16px; padding: 12px; background: #f5f5f5; border-radius: 6px;">
              <div style="font-weight: 500; margin-bottom: 8px; color: #333333;">将执行以下测试：</div>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                <Tag v-for="test in generateAllClusterTests()" :key="test.type" color="blue">
                  {{ test.type }}
                </Tag>
              </div>
              <div style="color: #1890ff; font-size: 12px; margin-top: 8px;">
                共 {{ generateAllClusterTests().length }} 个测试项目
              </div>
            </div>
            
            <Button 
              type="primary" 
              size="large"
              :loading="loading"
              :disabled="testRunning"
              @click="runAllClusterTest"
            >
              <template #icon>
                <span style="font-size: 16px;">⚡</span>
              </template>
              开始全集群测试
            </Button>
          </div>
        </TabPane>
        
        <TabPane key="custom" tab="特定节点测试">
          <div style="padding: 16px 0;">
            <p style="color: #666666; margin-bottom: 16px;">
              选择特定的GPU服务器进行算力测试。可以选择1个或多个节点。
            </p>
            
            <Form layout="vertical" :model="customForm">
              <FormItem label="选择服务器（可多选）">
                <Select
                  v-model:value="customForm.selectedServers"
                  mode="multiple"
                  placeholder="请选择服务器"
                  style="width: 100%;"
                >
                  <SelectOption 
                    v-for="server in availableServers" 
                    :key="server.id" 
                    :value="server.name"
                  >
                    {{ server.name }} ({{ server.ip }}) - {{ server.gpuCount }}×{{ server.gpuModel }}
                  </SelectOption>
                </Select>
                <div style="color: #999999; font-size: 12px; margin-top: 4px;">
                  已选择 {{ customForm.selectedServers.length }} 台服务器
                </div>
              </FormItem>
              
              <FormItem>
                <Space>
                  <Button 
                    type="primary" 
                    size="large"
                    :loading="loading"
                    :disabled="testRunning || customForm.selectedServers.length < 1"
                    @click="runCustomNodeTest"
                  >
                    <template #icon>
                      <span style="font-size: 16px;">🎯</span>
                    </template>
                    开始特定节点测试
                  </Button>
                  
                  <Button 
                    :disabled="testRunning"
                    @click="customForm.selectedServers = []"
                  >
                    <template #icon>
                      <span style="font-size: 14px;">🔄</span>
                    </template>
                    重置选择
                  </Button>
                </Space>
              </FormItem>
              
              <!-- 选择预览 -->
              <div v-if="customForm.selectedServers.length > 0" style="margin-top: 16px; padding: 12px; background: #f5f5f5; border-radius: 6px;">
                <div style="font-weight: 500; margin-bottom: 8px; color: #333333;">选择预览：</div>
                <div style="margin-bottom: 8px;">
                  <span style="color: #666666;">服务器：</span>
                  <Tag v-for="server in customForm.selectedServers" :key="server" color="blue" style="margin-right: 4px;">
                    {{ server }}
                  </Tag>
                </div>
                <div style="color: #1890ff; font-size: 12px; margin-top: 8px;">
                  将进行 {{ customForm.selectedServers.length }} 节点算力测试
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
          <span>算力测试正在进行中，请稍候...</span>
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
              :count="stats.performanceFailed" 
              :number-style="{ backgroundColor: '#fa8c16' }"
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
      
      <Tabs type="card" v-model:activeKey="activeResultTab">
        <TabPane 
          v-for="testType in testTypes" 
          :key="testType"
          :tab="testType"
        >
          <template #tab>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span>{{ testType }}</span>
              <Badge 
                :count="groupedResults[testType].filter(r => r.status === '通过' && !isPerformancePassed(r)).length"
                :number-style="{ backgroundColor: '#fa8c16' }"
                size="small"
              />
            </div>
          </template>
          
          <!-- 性能标准提示 -->
          <Alert
            type="info"
            show-icon
            style="margin-bottom: 16px;"
          >
            <template #message>
              <div style="display: flex; align-items: center; gap: 16px;">
                <span>{{ testType }}性能标准：</span>
                <Tag color="blue">
                  最低算力: {{ performanceStandards[testType].minTflops }} TFlops
                </Tag>
                <Tag color="green">
                  最低GPU利用率: {{ performanceStandards[testType].minGpuUtil }}%
                </Tag>
              </div>
            </template>
          </Alert>
          
          <Table
            :columns="getResultColumns()"
            :data-source="groupedResults[testType]"
            :loading="testRunning"
            :pagination="{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }"
            row-key="id"
            size="middle"
            :scroll="{ x: 1500 }"
          />
        </TabPane>
      </Tabs>
    </Card>

    <!-- 空状态提示 -->
    <Card v-else>
      <div style="text-align: center; padding: 40px 0;">
        <div style="font-size: 48px; margin-bottom: 16px; color: #d9d9d9;">⚡</div>
        <h3 style="color: #666666; margin-bottom: 8px;">暂无测试结果</h3>
        <p style="color: #999999; margin-bottom: 24px;">请先选择测试模式并开始算力测试</p>
        <Space>
          <Button type="primary" @click="runAllClusterTest" :disabled="testRunning">
            全集群测试
          </Button>
          <Button @click="testMode = 'custom'" :disabled="testRunning">
            特定节点测试
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
