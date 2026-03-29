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
  Divider,
  Progress,
  Tooltip,
  Badge,
  Tabs,
  TabPane,
  InputNumber,
  Modal,
  Drawer,
  Radio,
  RadioGroup,
  Upload
} from 'ant-design-vue';

defineOptions({ name: 'NcclTest' });

// NCCL测试状态
type TestStatus = '未执行' | '测试中' | '通过' | '失败' | '超时' | '不达标';

// 测试模式类型
type TestMode = 'normal' | 'probe' | 'binary-search' | 'single-rail';

// NCCL测试结果接口
interface NcclTestResult {
  id: string;
  testMode: TestMode;
  testType: string;
  nodeCount: number;
  nodes: string[];
  status: TestStatus;
  bandwidth: number; // 带宽(GB/s)
  latency: number; // 延迟(ms)
  efficiency: number; // 效率(%)
  testTime: string;
  duration: number; // 测试时长(秒)
  errorMessage?: string;
  verb: string; // 通信操作
  algo: string; // NCCL算法
  proto: string; // 通信协议
  channels: number; // 最小通道数
  qps: number; // QPS per connection
  pxnDisable: boolean; // PXN disable
  level: string; // 环境变量级别
  group: number; // 探测组大小
  cudaVisibleDevices: string; // CUDA可见设备
}

// 测试结果数据
const testResults = ref<NcclTestResult[]>([]);

// 测试模式配置
const testModeConfig: Record<TestMode, { name: string; description: string; icon: string; color: string }> = {
  'normal': {
    name: '标准全量测试',
    description: '标准全节点性能测试，全面评估集群通信性能',
    icon: '🚀',
    color: 'blue'
  },
  'probe': {
    name: '节点探测测试',
    description: '小规模节点检测测试，快速评估节点状态',
    icon: '🔍',
    color: 'green'
  },
  'binary-search': {
    name: '二分查找测试',
    description: '二分递归搜索低性能节点，定位性能瓶颈',
    icon: '🔎',
    color: 'orange'
  },
  'single-rail': {
    name: '单轨通信测试',
    description: '单GPU通信测试模式，测试基础通信能力',
    icon: '⚡',
    color: 'purple'
  }
};

// 通信操作配置
const verbConfig: Record<string, { name: string; description: string }> = {
  'ar': { name: 'AllReduce', description: '全归约操作' },
  'ag': { name: 'AllGather', description: '全收集操作' },
  'a2a': { name: 'AllToAll', description: '全到全操作' },
  'br': { name: 'Broadcast', description: '广播操作' },
  'rs': { name: 'ReduceScatter', description: '归约分散操作' }
};

// 性能标准
const performanceStandards: Record<TestMode, { minBandwidth: number; minEfficiency: number }> = {
  'normal': { minBandwidth: 50, minEfficiency: 80 },
  'probe': { minBandwidth: 30, minEfficiency: 70 },
  'binary-search': { minBandwidth: 40, minEfficiency: 75 },
  'single-rail': { minBandwidth: 20, minEfficiency: 60 }
};

// 可用服务器列表
const availableServers = ref([
  { name: 'node1', status: 'online', gpu: 8 },
  { name: 'node2', status: 'online', gpu: 8 },
  { name: 'node3', status: 'online', gpu: 8 },
  { name: 'node4', status: 'online', gpu: 8 },
  { name: 'node5', status: 'online', gpu: 8 },
  { name: 'node6', status: 'online', gpu: 8 },
  { name: 'node7', status: 'online', gpu: 8 },
  { name: 'node8', status: 'online', gpu: 8 }
]);

// 测试配置
const testConfig = reactive({
  // 基础配置
  framework: 'nccl' as 'nccl' | 'vccl', // 选择测试框架
  selectedServers: [] as string[],
  testModes: [] as TestMode[],
  hostfile: null as File | null, // 集群hostfile
  
  // 公共测试参数
  verbList: ['ar'] as string[],
  workNums: [4, 16] as number[],
  loopCount: 1,
  ncclAlgo: ['ring'] as string[],
  ncclProto: ['Simple'] as string[],
  minChannels: [32] as number[],
  qpsPerConnection: [8] as number[],
  pxnDisable: [1] as number[],
  slotsNum: 8,
  sizeNum: ['1G', '8G', 2] as (string | number)[],
  
  // probe 类型专用参数
  probeNum: 2,
  
  // single-rail 类型专用参数
  cudaVisibleDevices: [0, 1, 2, 3, 4, 5, 6, 7] as number[],
  
  // 环境变量配置（可以为空，使用默认值）
  env: {
    NCCL_NET_GDR_LEVEL: '', // 可以为空
    NCCL_IB_GID_INDEX: '', // 可以为空
    NCCL_IB_TC: '', // 可以为空
    NCCL_SOCKET_IFNAME: '', // 可以为空
    UCX_NET_DEVICES: '', // 可以为空
    NCCL_TOPO_DUMP_FILE: '', // 可以为空
    NCCL_DEBUG: '', // 可以为空
    NCCL_DEBUG_SUBSYS: '', // 可以为空
    NCCL_DEBUG_FILE: '', // 可以为空
    LD_LIBRARY_PATH: '', // 可以为空
    NCCL_CUMEM_ENABLE: '' // 可以为空
  }
});

// 界面状态
const loading = ref(false);
const testRunning = ref(false);
const showAdvancedConfig = ref(false);
const showLogs = ref(false);
const showEnvConfig = ref(false);
const currentStep = ref(0);
const testLogs = ref<string[]>([]);

// 当前活跃的结果标签
const activeResultTab = ref<TestMode>('normal');

// 判断性能是否达标
const isPerformancePassed = (result: NcclTestResult) => {
  if (result.status !== '通过') return false;
  const standard = performanceStandards[result.testMode];
  return result.bandwidth >= standard.minBandwidth && result.efficiency >= standard.minEfficiency;
};

// 按测试模式分组的结果
const groupedResults = computed(() => {
  const groups: Record<string, NcclTestResult[]> = {};
  testResults.value.forEach(result => {
    if (!groups[result.testMode]) {
      groups[result.testMode] = [];
    }
    groups[result.testMode]!.push(result);
  });
  return groups;
});

// 获取所有测试模式
const testModes = computed(() => {
  return Object.keys(groupedResults.value).sort((a, b) => {
    const order = ['normal', 'probe', 'binary-search', 'single-rail'];
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
  const avgBandwidth = testResults.value.length > 0 
    ? (testResults.value.reduce((sum, r) => sum + r.bandwidth, 0) / testResults.value.length).toFixed(2)
    : '0';
  const avgEfficiency = testResults.value.length > 0
    ? (testResults.value.reduce((sum, r) => sum + r.efficiency, 0) / testResults.value.length).toFixed(2)
    : '0';
  
  // 按测试模式统计
  const modeStats = testModes.value.map(mode => ({
    mode,
    count: groupedResults.value[mode]?.length || 0,
    passed: groupedResults.value[mode]?.filter(r => r.status === '通过').length || 0,
    failed: groupedResults.value[mode]?.filter(r => r.status === '失败').length || 0
  }));
  
  return {
    totalTests,
    passedTests,
    failedTests,
    runningTests,
    performanceFailed,
    avgBandwidth,
    avgEfficiency,
    modeStats
  };
});

// 表格列配置
const getResultColumns = () => [
  {
    title: '测试模式',
    dataIndex: 'testMode',
    key: 'testMode',
    width: 120,
    customRender: ({ record }: { record: NcclTestResult }) => {
      const config = testModeConfig[record.testMode];
      return h(Tag, { color: config.color }, () => 
        h('span', {}, [config.icon, ' ', config.name])
      );
    }
  },
  {
    title: '测试类型',
    dataIndex: 'testType',
    key: 'testType',
    width: 120
  },
  {
    title: '节点数',
    dataIndex: 'nodeCount',
    key: 'nodeCount',
    width: 80
  },
  {
    title: '节点列表',
    dataIndex: 'nodes',
    key: 'nodes',
    width: 200,
    customRender: ({ record }: { record: NcclTestResult }) => {
      if (record.nodes.length <= 3) {
        return record.nodes.join(', ');
      }
      return h(Tooltip, { title: record.nodes.join(', ') }, () => 
        h('span', {}, `${record.nodes[0]}, ${record.nodes[1]}, ... (+${record.nodes.length - 2})`)
      );
    }
  },
  {
    title: '通信操作',
    dataIndex: 'verb',
    key: 'verb',
    width: 100,
    customRender: ({ record }: { record: NcclTestResult }) => {
      const config = verbConfig[record.verb as keyof typeof verbConfig];
      return h(Tooltip, { title: config?.description }, () => 
        h('span', {}, config?.name || record.verb)
      );
    }
  },
  {
    title: '算法/协议',
    dataIndex: 'algo_proto',
    key: 'algo_proto',
    width: 120,
    customRender: ({ record }: { record: NcclTestResult }) => {
      return h('div', { style: { fontSize: '12px' } }, [
        h('div', { style: { marginBottom: '2px' } }, `算法: ${record.algo}`),
        h('div', {}, `协议: ${record.proto}`)
      ]);
    }
  },
  {
    title: '通道/QPS',
    dataIndex: 'channels_qps',
    key: 'channels_qps',
    width: 100,
    customRender: ({ record }: { record: NcclTestResult }) => {
      return h('div', { style: { fontSize: '12px' } }, [
        h('div', { style: { marginBottom: '2px' } }, `通道: ${record.channels}`),
        h('div', {}, `QPS: ${record.qps}`)
      ]);
    }
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    customRender: ({ record }: { record: NcclTestResult }) => {
      let status = record.status;
      let color = 'default';
      
      if (status === '通过') {
        if (isPerformancePassed(record)) {
          color = 'success';
        } else {
          status = '不达标';
          color = 'warning';
        }
      } else if (status === '失败') {
        color = 'error';
      } else if (status === '测试中') {
        color = 'processing';
      }
      
      return h(Tag, { color }, () => status);
    }
  },
  {
    title: '带宽(GB/s)',
    dataIndex: 'bandwidth',
    key: 'bandwidth',
    width: 120,
    customRender: ({ record }: { record: NcclTestResult }) => {
      if (record.status === '测试中') {
        return h(Progress, { percent: 50, size: 'small', status: 'active' });
      }
      const isPassed = isPerformancePassed(record);
      return h('span', { 
        style: { 
          color: isPassed ? '#52c41a' : '#faad14',
          fontWeight: 'bold'
        } 
      }, record.bandwidth.toFixed(2));
    }
  },
  {
    title: '延迟(ms)',
    dataIndex: 'latency',
    key: 'latency',
    width: 100,
    customRender: ({ record }: { record: NcclTestResult }) => {
      if (record.status === '测试中') {
        return h(Progress, { percent: 50, size: 'small', status: 'active' });
      }
      return record.latency.toFixed(2);
    }
  },
  {
    title: '效率(%)',
    dataIndex: 'efficiency',
    key: 'efficiency',
    width: 100,
    customRender: ({ record }: { record: NcclTestResult }) => {
      if (record.status === '测试中') {
        return h(Progress, { percent: 50, size: 'small', status: 'active' });
      }
      const isPassed = isPerformancePassed(record);
      return h('span', { 
        style: { 
          color: isPassed ? '#52c41a' : '#faad14',
          fontWeight: 'bold'
        } 
      }, record.efficiency.toFixed(1));
    }
  },
  {
    title: '测试时间',
    dataIndex: 'testTime',
    key: 'testTime',
    width: 150
  },
  {
    title: '错误信息',
    dataIndex: 'errorMessage',
    key: 'errorMessage',
    width: 200,
    customRender: ({ record }: { record: NcclTestResult }) => {
      if (!record.errorMessage) return '-';
      return h(Tooltip, { title: record.errorMessage }, () => 
        h('span', { style: { color: '#ff4d4f' } }, '查看错误')
      );
    }
  }
];

// 开始NCCL测试
const startNcclTest = async () => {
  loading.value = true;
  testRunning.value = true;
  currentStep.value = 0;
  
  try {
    message.info('开始NCCL测试...');
    
    // 清空之前的结果
    testResults.value = [];
    testLogs.value = [];
    
    // 添加日志
    addLog('开始NCCL测试配置...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 生成测试结果
    const allResults: NcclTestResult[] = [];
    let resultId = 1;
    
    // 为每个测试模式生成结果
    for (const mode of testConfig.testModes) {
      addLog(`配置${testModeConfig[mode].name}...`);
      
      if (mode === 'normal') {
        // 标准测试模式
        for (const workNum of testConfig.workNums) {
          const selectedNodes = availableServers.value.slice(0, workNum).map(s => s.name);
          for (const verb of testConfig.verbList) {
            for (const algo of testConfig.ncclAlgo) {
              for (const proto of testConfig.ncclProto) {
                for (const channels of testConfig.minChannels) {
                  for (const qps of testConfig.qpsPerConnection) {
                    allResults.push({
                      id: resultId.toString(),
                      testMode: mode,
                      testType: `${workNum}节点测试`,
                      nodeCount: workNum,
                      nodes: selectedNodes,
                      status: '测试中',
                      bandwidth: 0,
                      latency: 0,
                      efficiency: 0,
                      testTime: '',
                      duration: 0,
                      verb,
                      algo,
                      proto,
                      channels,
                      qps,
                      pxnDisable: testConfig.pxnDisable[0] === 1,
                      level: testConfig.env.NCCL_NET_GDR_LEVEL,
                      group: testConfig.probeNum,
                      cudaVisibleDevices: testConfig.cudaVisibleDevices.join(',')
                    });
                    resultId++;
                  }
                }
              }
            }
          }
        }
      } else if (mode === 'probe') {
        // 探测测试模式
        for (const verb of testConfig.verbList) {
          allResults.push({
            id: resultId.toString(),
            testMode: mode,
            testType: `探测测试`,
            nodeCount: testConfig.probeNum,
            nodes: availableServers.value.slice(0, testConfig.probeNum).map(s => s.name),
            status: '测试中',
            bandwidth: 0,
            latency: 0,
            efficiency: 0,
            testTime: '',
            duration: 0,
            verb,
            algo: testConfig.ncclAlgo[0] ?? 'ring',
            proto: testConfig.ncclProto[0] ?? 'Simple',
            channels: testConfig.minChannels[0] ?? 1,
            qps: testConfig.qpsPerConnection[0] ?? 1,
            pxnDisable: testConfig.pxnDisable[0] === 1,
            level: testConfig.env.NCCL_NET_GDR_LEVEL,
            group: testConfig.probeNum,
            cudaVisibleDevices: testConfig.cudaVisibleDevices.join(',')
          });
          resultId++;
        }
      } else if (mode === 'binary-search') {
        // 二分查找测试模式
        for (const verb of testConfig.verbList) {
          allResults.push({
            id: resultId.toString(),
            testMode: mode,
            testType: `二分查找测试`,
            nodeCount: 8,
            nodes: availableServers.value.slice(0, 8).map(s => s.name),
            status: '测试中',
            bandwidth: 0,
            latency: 0,
            efficiency: 0,
            testTime: '',
            duration: 0,
            verb,
            algo: testConfig.ncclAlgo[0] ?? 'ring',
            proto: testConfig.ncclProto[0] ?? 'Simple',
            channels: testConfig.minChannels[0] ?? 1,
            qps: testConfig.qpsPerConnection[0] ?? 1,
            pxnDisable: testConfig.pxnDisable[0] === 1,
            level: testConfig.env.NCCL_NET_GDR_LEVEL,
            group: 4,
            cudaVisibleDevices: testConfig.cudaVisibleDevices.join(',')
          });
          resultId++;
        }
      } else if (mode === 'single-rail') {
        // 单轨通信测试模式
        for (const verb of testConfig.verbList) {
          allResults.push({
            id: resultId.toString(),
            testMode: mode,
            testType: `单轨通信测试`,
            nodeCount: 2,
            nodes: availableServers.value.slice(0, 2).map(s => s.name),
            status: '测试中',
            bandwidth: 0,
            latency: 0,
            efficiency: 0,
            testTime: '',
            duration: 0,
            verb,
            algo: testConfig.ncclAlgo[0] ?? 'ring',
            proto: testConfig.ncclProto[0] ?? 'Simple',
            channels: 1,
            qps: 1,
            pxnDisable: testConfig.pxnDisable[0] === 1,
            level: testConfig.env.NCCL_NET_GDR_LEVEL,
            group: 1,
            cudaVisibleDevices: '0,1'
          });
          resultId++;
        }
      }
    }
    
    // 执行测试
    await executeTests(allResults);
    
    message.success('NCCL测试完成！');
  } catch (error) {
    message.error('NCCL测试失败：' + (error as Error).message);
  } finally {
    loading.value = false;
    testRunning.value = false;
    currentStep.value = 0;
  }
};

// 执行测试
const executeTests = async (results: NcclTestResult[]) => {
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (!result) continue;
    
    currentStep.value = i + 1;
    
    addLog(`执行测试 ${i + 1}/${results.length}: ${testModeConfig[result.testMode].name} - ${result.testType}`);
    
    // 模拟测试执行
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // 生成测试结果
    const isSuccess = Math.random() > 0.1; // 90% 成功率
    const bandwidth = getBaseBandwidth(result.testMode) * (0.8 + Math.random() * 0.4);
    const latency = 0.1 + Math.random() * 2;
    const efficiency = isSuccess ? 70 + Math.random() * 25 : 30 + Math.random() * 20;
    
    result.status = isSuccess ? '通过' : '失败';
    result.bandwidth = bandwidth;
    result.latency = latency;
    result.efficiency = efficiency;
    result.testTime = new Date().toLocaleString();
    result.duration = 1 + Math.random() * 3;
    
    if (!isSuccess) {
      result.errorMessage = '网络超时或节点故障';
    }
    
    // 更新结果
    testResults.value = [...testResults.value, result];
  }
};

// 获取基础带宽值
const getBaseBandwidth = (mode: TestMode): number => {
  const baseValues = {
    'normal': 80,
    'probe': 60,
    'binary-search': 70,
    'single-rail': 40
  };
  return baseValues[mode];
};

// 添加日志
const addLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  testLogs.value.push(`[${timestamp}] ${message}`);
};

// 处理hostfile上传
const handleHostfileUpload = (info: any) => {
  if (info.file.status === 'done') {
    testConfig.hostfile = info.file.originFileObj;
    message.success('Hostfile上传成功');
    addLog(`已上传hostfile: ${info.file.name}`);
  } else if (info.file.status === 'error') {
    message.error('Hostfile上传失败');
  }
};

// 重置环境变量为默认值
const resetEnvToDefault = () => {
  testConfig.env = {
    NCCL_NET_GDR_LEVEL: '4',
    NCCL_IB_GID_INDEX: '3',
    NCCL_IB_TC: '106',
    NCCL_SOCKET_IFNAME: 'bond0',
    UCX_NET_DEVICES: 'bond0',
    NCCL_TOPO_DUMP_FILE: 'topo.%h.xml',
    NCCL_DEBUG: 'VERSION',
    NCCL_DEBUG_SUBSYS: 'ALL',
    NCCL_DEBUG_FILE: 'debug.log',
    LD_LIBRARY_PATH: '/workspace/infrawaves/vccl_2.26.6/build/lib',
    NCCL_CUMEM_ENABLE: '1'
  };
  message.success('已重置环境变量为默认值');
};

// 清空环境变量
const clearEnvVariables = () => {
  testConfig.env = {
    NCCL_NET_GDR_LEVEL: '',
    NCCL_IB_GID_INDEX: '',
    NCCL_IB_TC: '',
    NCCL_SOCKET_IFNAME: '',
    UCX_NET_DEVICES: '',
    NCCL_TOPO_DUMP_FILE: '',
    NCCL_DEBUG: '',
    NCCL_DEBUG_SUBSYS: '',
    NCCL_DEBUG_FILE: '',
    LD_LIBRARY_PATH: '',
    NCCL_CUMEM_ENABLE: ''
  };
  message.success('已清空环境变量，将使用系统默认值');
};

// 切换测试模式
const toggleTestMode = (mode: TestMode) => {
  const index = testConfig.testModes.indexOf(mode);
  if (index > -1) {
    testConfig.testModes.splice(index, 1);
  } else {
    testConfig.testModes.push(mode);
  }
};

// 清空结果
const clearResults = () => {
  testResults.value = [];
  testLogs.value = [];
  message.info('已清空测试结果');
};


// 导出结果
const exportResults = () => {
  if (testResults.value.length === 0) {
    message.warning('没有测试结果可导出');
    return;
  }
  
  const csvContent = [
    ['ID', '测试模式', '测试类型', '节点数', '节点列表', '状态', '带宽(GB/s)', '延迟(ms)', '效率(%)', '测试时间'],
    ...testResults.value.map(r => [
      r.id,
      testModeConfig[r.testMode].name,
      r.testType,
      r.nodeCount,
      r.nodes.join(','),
      r.status,
      r.bandwidth.toFixed(2),
      r.latency.toFixed(2),
      r.efficiency.toFixed(1),
      r.testTime
    ])
  ].map(row => row.join(',')).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `nccl-test-results-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
  link.click();
  
  message.success('测试结果已导出');
};

onMounted(() => {
  addLog('NCCL测试平台已就绪');
});
</script>

<template>
  <div class="nccl-test-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>VCCL/NCCL测试平台</h1>
      <p>基于VCCL-Tests的四种测试模式，支持NCCL/VCCL框架选择、环境变量自定义配置、集群hostfile导入</p>
    </div>

    <!-- 统计信息 -->
    <Row :gutter="16" class="stats-row">
      <Col :span="6">
        <Card>
          <Statistic title="总测试数" :value="stats.totalTests" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="通过测试" :value="stats.passedTests" :value-style="{ color: '#52c41a' }" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="失败测试" :value="stats.failedTests" :value-style="{ color: '#ff4d4f' }" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="性能不达标" :value="stats.performanceFailed" :value-style="{ color: '#faad14' }" />
        </Card>
      </Col>
    </Row>

    <!-- 测试配置区域 -->
    <Card title="测试配置" class="config-card">
      <!-- 基础配置 -->
      <div class="basic-config">
        <h3>基础配置</h3>
        <Row :gutter="16">
          <Col :span="12">
            <FormItem label="测试框架">
              <RadioGroup v-model:value="testConfig.framework">
                <Radio value="nccl">NCCL</Radio>
                <Radio value="vccl">VCCL</Radio>
              </RadioGroup>
              <div class="config-tip">
                <small>选择测试框架类型，路径配置将在Docker中自动处理</small>
              </div>
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem label="集群Hostfile">
              <Upload
                :file-list="[]"
                :before-upload="() => false"
                @change="handleHostfileUpload"
                accept=".txt,.hostfile"
              >
                <Button>
                  <template #icon>📁</template>
                  上传Hostfile
                </Button>
              </Upload>
              <div class="config-tip">
                <small>{{ testConfig.hostfile ? `已上传: ${testConfig.hostfile.name}` : '支持.txt和.hostfile格式' }}</small>
              </div>
            </FormItem>
          </Col>
        </Row>
      </div>

      <!-- 选择测试模式 -->
      <Divider />
      <div class="test-mode-selection">
        <h3>选择测试模式</h3>
        <Row :gutter="16">
          <Col :span="6" v-for="(config, mode) in testModeConfig" :key="mode">
            <Card 
              :class="['test-mode-card', { 'selected-mode': testConfig.testModes.includes(mode as TestMode) }]"
              @click="toggleTestMode(mode as TestMode)"
              hoverable
            >
              <div class="mode-content">
                <div class="mode-icon">{{ config.icon }}</div>
                <div class="mode-name">{{ config.name }}</div>
                <div class="mode-desc">{{ config.description }}</div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      <!-- 公共测试参数 -->
      <Divider />
      <h3>公共测试参数</h3>
      <Row :gutter="16">
        <Col :span="6">
          <FormItem label="通信操作">
            <Select v-model:value="testConfig.verbList" mode="multiple" placeholder="选择通信操作">
              <SelectOption v-for="(config, verb) in verbConfig" :key="verb" :value="verb">
                {{ config.name }} ({{ config.description }})
              </SelectOption>
            </Select>
          </FormItem>
        </Col>
        <Col :span="6">
          <FormItem label="工作节点数">
            <Select v-model:value="testConfig.workNums" mode="multiple" placeholder="选择节点数">
              <SelectOption :value="2">2节点</SelectOption>
              <SelectOption :value="4">4节点</SelectOption>
              <SelectOption :value="8">8节点</SelectOption>
              <SelectOption :value="16">16节点</SelectOption>
              <SelectOption :value="32">32节点</SelectOption>
            </Select>
          </FormItem>
        </Col>
        <Col :span="6">
          <FormItem label="循环次数">
            <InputNumber v-model:value="testConfig.loopCount" :min="1" :max="100" />
          </FormItem>
        </Col>
        <Col :span="6">
          <FormItem label="每台机器GPU数">
            <InputNumber v-model:value="testConfig.slotsNum" :min="1" :max="16" />
          </FormItem>
        </Col>
      </Row>
      
      <Row :gutter="16">
        <Col :span="6">
          <FormItem label="NCCL算法">
            <Select v-model:value="testConfig.ncclAlgo" mode="multiple">
              <SelectOption value="ring">Ring</SelectOption>
              <SelectOption value="tree">Tree</SelectOption>
              <SelectOption value="nvlstree">NVLS Tree</SelectOption>
            </Select>
          </FormItem>
        </Col>
        <Col :span="6">
          <FormItem label="通信协议">
            <Select v-model:value="testConfig.ncclProto" mode="multiple">
              <SelectOption value="Simple">Simple</SelectOption>
              <SelectOption value="LL">LL</SelectOption>
              <SelectOption value="LL128">LL128</SelectOption>
            </Select>
          </FormItem>
        </Col>
        <Col :span="6">
          <FormItem label="最小通道数">
            <Select v-model:value="testConfig.minChannels" mode="multiple">
              <SelectOption :value="16">16</SelectOption>
              <SelectOption :value="32">32</SelectOption>
              <SelectOption :value="64">64</SelectOption>
            </Select>
          </FormItem>
        </Col>
        <Col :span="6">
          <FormItem label="QPS per Connection">
            <Select v-model:value="testConfig.qpsPerConnection" mode="multiple">
              <SelectOption :value="4">4</SelectOption>
              <SelectOption :value="8">8</SelectOption>
              <SelectOption :value="16">16</SelectOption>
            </Select>
          </FormItem>
        </Col>
      </Row>

      <!-- 动态配置区域 -->
      <div v-if="testConfig.testModes.length > 0">
        <Divider />
        <h3>专用配置</h3>
        
        <!-- Probe 专用配置 -->
        <div v-if="testConfig.testModes.includes('probe')">
          <Alert 
            message="Probe测试专用配置" 
            description="主机探测测试用于自动探测慢节点，需要配置探测组大小"
            type="info" 
            show-icon 
            class="config-alert"
          />
          <Row :gutter="16">
            <Col :span="6">
              <FormItem label="探测组大小">
                <InputNumber v-model:value="testConfig.probeNum" :min="1" :max="8" />
              </FormItem>
            </Col>
          </Row>
        </div>

        <!-- Single-rail 专用配置 -->
        <div v-if="testConfig.testModes.includes('single-rail')">
          <Alert 
            message="Single-rail测试专用配置" 
            description="单轨通信测试用于测试基础通信能力，需要指定CUDA可见设备"
            type="info" 
            show-icon 
            class="config-alert"
          />
          <Row :gutter="16">
            <Col :span="12">
              <FormItem label="CUDA可见设备">
                <Select v-model:value="testConfig.cudaVisibleDevices" mode="multiple">
                  <SelectOption :value="0">GPU 0</SelectOption>
                  <SelectOption :value="1">GPU 1</SelectOption>
                  <SelectOption :value="2">GPU 2</SelectOption>
                  <SelectOption :value="3">GPU 3</SelectOption>
                  <SelectOption :value="4">GPU 4</SelectOption>
                  <SelectOption :value="5">GPU 5</SelectOption>
                  <SelectOption :value="6">GPU 6</SelectOption>
                  <SelectOption :value="7">GPU 7</SelectOption>
                </Select>
              </FormItem>
            </Col>
          </Row>
        </div>
      </div>

      <!-- 操作按钮 -->
      <Divider />
      <Space>
        <Button 
          type="primary" 
          size="large"
          :loading="loading"
          :disabled="testRunning || testConfig.testModes.length === 0"
          @click="startNcclTest"
        >
          <template #icon>
            <span>🚀</span>
          </template>
          开始测试
        </Button>
        <Button @click="showEnvConfig = true">
          <template #icon>
            <span>⚙️</span>
          </template>
          环境变量配置
        </Button>
        <Button @click="showAdvancedConfig = true">高级配置</Button>
        <Button @click="showLogs = true">查看日志</Button>
        <Button @click="clearResults">清空结果</Button>
        <Button @click="exportResults" :disabled="testResults.length === 0">导出结果</Button>
      </Space>
    </Card>

    <!-- 测试状态 -->
    <Alert 
      v-if="testRunning" 
      type="info" 
      :message="`正在执行测试 (${currentStep}/${testResults.length})`"
      class="test-status-alert"
    >
      <template #description>
        <Progress :percent="Math.round((currentStep / testResults.length) * 100)" />
      </template>
    </Alert>

    <!-- 测试结果区域 -->
    <Card v-if="testResults.length > 0" title="测试结果" class="results-card">
      <Tabs v-model:activeKey="activeResultTab">
        <TabPane 
          v-for="mode in testModes" 
          :key="mode" 
          :tab="`${testModeConfig[mode as TestMode].icon} ${testModeConfig[mode as TestMode].name}`"
        >
          <template #tab>
            <Badge 
              :count="groupedResults[mode]?.filter(r => r.status === '通过' && !isPerformancePassed(r)).length || 0"
              :offset="[10, 0]"
            >
              <span>{{ testModeConfig[mode as TestMode].icon }} {{ testModeConfig[mode as TestMode].name }}</span>
            </Badge>
          </template>
          
          <!-- 性能标准提示 -->
          <Alert 
            :message="`${testModeConfig[mode as TestMode].name}性能标准`"
            :description="`最低带宽: ${performanceStandards[mode as TestMode].minBandwidth} GB/s, 最低效率: ${performanceStandards[mode as TestMode].minEfficiency}%`"
            type="info"
            show-icon
            class="performance-standard"
          />
          
          <Table 
            :columns="getResultColumns()"
            :data-source="groupedResults[mode] || []"
            :pagination="{ pageSize: 10 }"
            row-key="id"
            size="small"
          />
        </TabPane>
      </Tabs>
    </Card>

    <!-- 空状态 -->
    <Card v-else class="empty-state">
      <div class="empty-content">
        <div class="empty-icon">🚀</div>
        <h3>开始NCCL测试</h3>
        <p>请先选择测试模式并开始NCCL测试</p>
        <Space>
          <Button type="primary" @click="startNcclTest" :disabled="testRunning">
            开始测试
          </Button>
        </Space>
      </div>
    </Card>

    <!-- 环境变量配置模态框 -->
    <Modal
      v-model:open="showEnvConfig"
      title="环境变量配置"
      width="900px"
      :footer="null"
    >
      <Alert 
        message="环境变量配置说明" 
        description="所有环境变量都可以留空，留空时将使用系统默认值。您也可以自定义设置这些参数来优化测试性能。"
        type="info" 
        show-icon 
        class="env-config-alert"
      />
      
      <Form layout="vertical" class="env-form">
        <Tabs>
          <TabPane key="network" tab="网络配置">
            <Row :gutter="16">
              <Col :span="12">
                <FormItem label="NCCL_NET_GDR_LEVEL">
                  <Input v-model:value="testConfig.env.NCCL_NET_GDR_LEVEL" placeholder="留空使用默认值 (0-4)" />
                  <div class="env-tip">GDR支持等级，4表示尽量使用GPU直连</div>
                </FormItem>
              </Col>
              <Col :span="12">
                <FormItem label="NCCL_IB_GID_INDEX">
                  <Input v-model:value="testConfig.env.NCCL_IB_GID_INDEX" placeholder="留空使用默认值" />
                  <div class="env-tip">RoCEv2协议时的GID index，默认一般为3</div>
                </FormItem>
              </Col>
            </Row>
            <Row :gutter="16">
              <Col :span="12">
                <FormItem label="NCCL_IB_TC">
                  <Input v-model:value="testConfig.env.NCCL_IB_TC" placeholder="留空使用默认值" />
                  <div class="env-tip">服务器侧PFC配置，队列3使用106，队列5使用102</div>
                </FormItem>
              </Col>
              <Col :span="12">
                <FormItem label="NCCL_SOCKET_IFNAME">
                  <Input v-model:value="testConfig.env.NCCL_SOCKET_IFNAME" placeholder="留空使用默认值" />
                  <div class="env-tip">用于通信的网卡名，如bond0</div>
                </FormItem>
              </Col>
            </Row>
            <Row :gutter="16">
              <Col :span="12">
                <FormItem label="UCX_NET_DEVICES">
                  <Input v-model:value="testConfig.env.UCX_NET_DEVICES" placeholder="留空使用默认值" />
                  <div class="env-tip">UCX使用的网络设备</div>
                </FormItem>
              </Col>
            </Row>
          </TabPane>
          
          <TabPane key="debug" tab="调试配置">
            <Row :gutter="16">
              <Col :span="12">
                <FormItem label="NCCL_TOPO_DUMP_FILE">
                  <Input v-model:value="testConfig.env.NCCL_TOPO_DUMP_FILE" placeholder="留空使用默认值" />
                  <div class="env-tip">拓扑结构输出文件，如topo.%h.xml</div>
                </FormItem>
              </Col>
              <Col :span="12">
                <FormItem label="NCCL_DEBUG">
                  <Input v-model:value="testConfig.env.NCCL_DEBUG" placeholder="留空使用默认值" />
                  <div class="env-tip">调试日志等级，如VERSION、INFO</div>
                </FormItem>
              </Col>
            </Row>
            <Row :gutter="16">
              <Col :span="12">
                <FormItem label="NCCL_DEBUG_SUBSYS">
                  <Input v-model:value="testConfig.env.NCCL_DEBUG_SUBSYS" placeholder="留空使用默认值" />
                  <div class="env-tip">输出哪些子系统的调试信息，如ALL</div>
                </FormItem>
              </Col>
              <Col :span="12">
                <FormItem label="NCCL_DEBUG_FILE">
                  <Input v-model:value="testConfig.env.NCCL_DEBUG_FILE" placeholder="留空使用默认值" />
                  <div class="env-tip">调试日志保存路径，如debug.log</div>
                </FormItem>
              </Col>
            </Row>
          </TabPane>
          
          <TabPane key="library" tab="库配置">
            <Row :gutter="16">
              <Col :span="12">
                <FormItem label="LD_LIBRARY_PATH">
                  <Input v-model:value="testConfig.env.LD_LIBRARY_PATH" placeholder="留空使用默认值" />
                  <div class="env-tip">NCCL/VCCL库加载路径</div>
                </FormItem>
              </Col>
              <Col :span="12">
                <FormItem label="NCCL_CUMEM_ENABLE">
                  <Input v-model:value="testConfig.env.NCCL_CUMEM_ENABLE" placeholder="留空使用默认值" />
                  <div class="env-tip">启用CUDA memory管理，一般设置为1</div>
                </FormItem>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
        
        <Divider />
        <Space>
          <Button @click="resetEnvToDefault">重置为默认值</Button>
          <Button @click="clearEnvVariables">清空所有值</Button>
        </Space>
      </Form>
    </Modal>

    <!-- 高级配置模态框 -->
    <Modal
      v-model:open="showAdvancedConfig"
      title="高级配置"
      width="800px"
      :footer="null"
    >
      <Form layout="vertical">
        <Row :gutter="16">
          <Col :span="12">
            <FormItem label="NCCL算法">
              <Select v-model:value="testConfig.ncclAlgo" mode="multiple">
                <SelectOption value="ring">Ring</SelectOption>
                <SelectOption value="tree">Tree</SelectOption>
                <SelectOption value="nvlstree">NVLS Tree</SelectOption>
              </Select>
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem label="通信协议">
              <Select v-model:value="testConfig.ncclProto" mode="multiple">
                <SelectOption value="Simple">Simple</SelectOption>
                <SelectOption value="LL">LL</SelectOption>
                <SelectOption value="LL128">LL128</SelectOption>
              </Select>
            </FormItem>
          </Col>
        </Row>
        <Row :gutter="16">
          <Col :span="12">
            <FormItem label="最小通道数">
              <Select v-model:value="testConfig.minChannels" mode="multiple">
                <SelectOption value="1">1</SelectOption>
                <SelectOption value="2">2</SelectOption>
                <SelectOption value="4">4</SelectOption>
                <SelectOption value="8">8</SelectOption>
              </Select>
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem label="QPS per Connection">
              <Select v-model:value="testConfig.qpsPerConnection" mode="multiple">
                <SelectOption value="1">1</SelectOption>
                <SelectOption value="2">2</SelectOption>
                <SelectOption value="4">4</SelectOption>
                <SelectOption value="8">8</SelectOption>
              </Select>
            </FormItem>
          </Col>
        </Row>
        <Row :gutter="16">
          <Col :span="12">
            <FormItem label="探测组大小">
              <InputNumber v-model:value="testConfig.probeNum" :min="1" :max="8" />
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem label="CUDA可见设备">
              <Select v-model:value="testConfig.cudaVisibleDevices" mode="multiple">
                <SelectOption :value="0">GPU 0</SelectOption>
                <SelectOption :value="1">GPU 1</SelectOption>
                <SelectOption :value="2">GPU 2</SelectOption>
                <SelectOption :value="3">GPU 3</SelectOption>
                <SelectOption :value="4">GPU 4</SelectOption>
                <SelectOption :value="5">GPU 5</SelectOption>
                <SelectOption :value="6">GPU 6</SelectOption>
                <SelectOption :value="7">GPU 7</SelectOption>
              </Select>
            </FormItem>
          </Col>
        </Row>
      </Form>
    </Modal>

    <!-- 日志抽屉 -->
    <Drawer
      v-model:open="showLogs"
      title="测试日志"
      width="600px"
    >
      <div class="log-content">
        <div v-for="(log, index) in testLogs" :key="index" class="log-item">
          {{ log }}
        </div>
        <div v-if="testLogs.length === 0" class="no-logs">
          暂无日志
        </div>
      </div>
    </Drawer>
  </div>
</template>

<style scoped>
.nccl-test-page {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.stats-row {
  margin-bottom: 24px;
}

.config-card {
  margin-bottom: 24px;
}

.test-mode-selection {
  margin-bottom: 24px;
}

.test-mode-selection h3 {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
}

.test-mode-card {
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.test-mode-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.selected-mode {
  border-color: #1890ff;
  background: #f0f8ff;
}

.mode-content {
  text-align: center;
  padding: 16px;
}

.mode-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.mode-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.mode-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.test-status-alert {
  margin-bottom: 24px;
}

.results-card {
  margin-bottom: 24px;
}

.performance-standard {
  margin-bottom: 16px;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
}

.empty-content {
  max-width: 400px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-content h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #333;
}

.empty-content p {
  margin: 0 0 24px 0;
  color: #666;
}

.log-content {
  max-height: 500px;
  overflow-y: auto;
}

.log-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #333;
}

.log-item:last-child {
  border-bottom: none;
}

.no-logs {
  text-align: center;
  color: #999;
  padding: 24px;
}

.basic-config h3 {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
}

.config-tip {
  margin-top: 4px;
  color: #666;
  font-size: 12px;
}

.config-alert {
  margin-bottom: 16px;
}

.env-config-alert {
  margin-bottom: 16px;
}

.env-form .env-tip {
  margin-top: 4px;
  color: #666;
  font-size: 12px;
  line-height: 1.4;
}
</style>