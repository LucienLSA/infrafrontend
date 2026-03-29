<script lang="ts" setup>
import { ref, reactive, computed, onMounted, h } from 'vue';
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  Row,
  Col,
  Statistic,
  Alert,
  Tabs,
  TabPane,
  Upload,
  message,
  Progress,
  Modal
} from 'ant-design-vue';
import type { ColumnsType } from 'ant-design-vue/es/table';

// 设备信息接口
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
  // 机柜相关字段
  rackName?: string;        // 机柜名称，如 "A1", "B1", "C1"
  uPosition?: number;       // U位位置，如 1-42
  coordinates?: {           // 坐标信息
    x: number;
    y: number;
    z: number;
  };
  // 网络信息
  managementIP?: string;    // 管理IP
  businessIP?: string;      // 业务IP
  iboIP?: string;          // IBO IP
  roceIP?: string;         // RoCE IP
  // 系统信息
  os?: string;             // 操作系统
  loginMethod?: string;    // 登录方式
}

// 拓扑连接接口
interface TopologyConnection {
  id: string;
  sourceDevice: string;
  targetDevice: string;
  sourcePort: string;
  targetPort: string;
  connectionType: 'ethernet' | 'fiber' | 'wireless';
  bandwidth: string;
  status: 'up' | 'down' | 'unknown';
}

// 集群信息接口（暂时未使用，保留以备将来扩展）
// interface ClusterInfo {
//   name: string;
//   description: string;
//   devices: DeviceInfo[];
//   connections: TopologyConnection[];
// }

// 响应式数据
const loading = ref(false);
const activeTab = ref('overview');


// 机柜视图相关状态
const viewMode = ref<'table' | 'rack'>('rack'); // 视图模式：表格视图或机柜视图
const selectedRack = ref<string>(''); // 选中的机柜
const searchKeyword = ref(''); // 搜索关键词
const deviceFilter = ref<string>(''); // 设备类型筛选

// LLD文件上传相关状态
const lldUploadLoading = ref(false);
const lldUploadProgress = ref(0);
const lldUploadResult = ref<any>(null);
const lldFileList = ref<any[]>([]);

// 初始空数据 - 只有通过上传LLD文件才会添加数据
const clusterData = reactive({
  name: '生产集群-01',
  description: '主要生产环境集群',
  devices: [] as DeviceInfo[], // 初始为空，通过LLD文件解析后添加
  connections: [] as TopologyConnection[] // 初始为空，通过LLD文件解析后添加
});

// 优化：使用计算属性减少重复计算
const deviceTypeStats = computed(() => ({
  switch: clusterData.devices.filter((d: DeviceInfo) => d.type === 'switch').length,
  server: clusterData.devices.filter((d: DeviceInfo) => d.type === 'server').length,
  router: clusterData.devices.filter((d: DeviceInfo) => d.type === 'router').length
}));

const connectionStatusStats = computed(() => ({
  up: clusterData.connections.filter((c: TopologyConnection) => c.status === 'up').length,
  down: clusterData.connections.filter((c: TopologyConnection) => c.status === 'down').length,
  unknown: clusterData.connections.filter((c: TopologyConnection) => c.status === 'unknown').length
}));

// 机柜数据计算属性
const rackData = computed(() => {
  const racks: Record<string, DeviceInfo[]> = {};

  // 使用筛选后的设备数据，而不是全部设备
  filteredDevices.value.forEach((device: DeviceInfo) => {
    const rackName = device.rackName || '未分配机柜';
    if (!racks[rackName]) {
      racks[rackName] = [];
    }
    racks[rackName].push(device);
  });

  // 按U位排序
  Object.keys(racks).forEach(rackName => {
    if (racks[rackName]) {
      racks[rackName].sort((a, b) => (a.uPosition || 0) - (b.uPosition || 0));
    }
  });

  // 按机柜名称排序，确保A1, A2, A10, A11, B1, B2等正确排序
  const sortedRacks: Record<string, DeviceInfo[]> = {};
  Object.keys(racks).sort((a, b) => {
    // 提取机柜字母和数字部分进行排序
    const aMatch = a.match(/^([A-Z]+)(\d+)$/);
    const bMatch = b.match(/^([A-Z]+)(\d+)$/);
    
    if (aMatch && bMatch && aMatch[1] && aMatch[2] && bMatch[1] && bMatch[2]) {
      const aLetter = aMatch[1];
      const aNum = parseInt(aMatch[2]);
      const bLetter = bMatch[1];
      const bNum = parseInt(bMatch[2]);
      
      // 先按字母排序，再按数字排序
      if (aLetter !== bLetter) {
        return aLetter.localeCompare(bLetter);
      }
      return aNum - bNum;
    }
    
    // 如果格式不匹配，按字符串排序
    return a.localeCompare(b);
  }).forEach(rackName => {
    if (racks[rackName]) {
      sortedRacks[rackName] = racks[rackName];
    }
  });

  // 调试信息
  console.log('🔧 机柜分组结果:', Object.keys(sortedRacks).map(rackName => ({
    rackName,
    deviceCount: sortedRacks[rackName]?.length || 0,
    devices: sortedRacks[rackName]?.map((d: DeviceInfo) => ({name: d.name, rackName: d.rackName})) || []
  })));

  return sortedRacks;
});

// 筛选后的设备数据
const filteredDevices = computed(() => {
  let devices = clusterData.devices;

  // 搜索筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    devices = devices.filter((device: DeviceInfo) =>
      device.name.toLowerCase().includes(keyword) ||
      device.ip.includes(keyword) ||
      device.description.toLowerCase().includes(keyword)
    );
  }

  // 设备类型筛选
  if (deviceFilter.value) {
    devices = devices.filter((device: DeviceInfo) => device.type === deviceFilter.value);
  }

  return devices;
});

// 设备类型选项
const deviceTypeOptions = computed(() => {
  const types = [...new Set(clusterData.devices.map((d: DeviceInfo) => d.type))];
  return types.map(type => ({
    label: getDeviceTypeLabel(type),
    value: type
  }));
});

// 设备表格列配置
const deviceColumns: ColumnsType<DeviceInfo> = [
  {
    title: '设备名称',
    dataIndex: 'name',
    key: 'name',
    width: 150,
  },
  {
    title: '设备类型',
    dataIndex: 'type',
    key: 'type',
    width: 100,
  },
  {
    title: 'IP地址',
    dataIndex: 'ip',
    key: 'ip',
    width: 120,
  },
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username',
    width: 100,
  },
  {
    title: '端口',
    dataIndex: 'port',
    key: 'port',
    width: 80,
  },
  {
    title: '位置',
    dataIndex: 'location',
    key: 'location',
    width: 150,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
  }
];

// 连接表格列配置
const connectionColumns: ColumnsType<TopologyConnection> = [
  {
    title: '源设备',
    dataIndex: 'sourceDevice',
    key: 'sourceDevice',
    width: 120,
  },
  {
    title: '目标设备',
    dataIndex: 'targetDevice',
    key: 'targetDevice',
    width: 120,
  },
  {
    title: '源端口',
    dataIndex: 'sourcePort',
    key: 'sourcePort',
    width: 100,
  },
  {
    title: '目标端口',
    dataIndex: 'targetPort',
    key: 'targetPort',
    width: 100,
  },
  {
    title: '连接类型',
    dataIndex: 'connectionType',
    key: 'connectionType',
    width: 100,
  },
  {
    title: '带宽',
    dataIndex: 'bandwidth',
    key: 'bandwidth',
    width: 100,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
  }
];

// 工具函数
const getDeviceTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    'gpu_server': 'H200 GPU服务器',
    'storage_server': '高性能全闪存储',
    'cpu_server': '通用服务器',
    'switch': '交换机',
    'router': '路由器',
    'firewall': '防火墙',
    'server': '服务器',
    'other': '其他设备'
  };
  return typeMap[type] || type;
};

const getDeviceTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    'gpu_server': '#1890ff',      // 蓝色
    'storage_server': '#52c41a',  // 绿色
    'cpu_server': '#722ed1',      // 紫色
    'switch': '#fa8c16',          // 橙色
    'router': '#eb2f96',          // 粉色
    'firewall': '#f5222d',        // 红色
    'server': '#13c2c2',          // 青色
    'other': '#8c8c8c'            // 灰色
  };
  return colorMap[type] || '#8c8c8c';
};

// 简单的功能函数
const refreshData = async () => {
  loading.value = true;
  try {
    console.log('🔄 手动刷新数据...');
    await loadSavedData();
    message.success('数据刷新成功！');
  } catch (error) {
    console.error('❌ 刷新数据失败:', error);
    message.error('数据刷新失败，请查看控制台日志');
  } finally {
    loading.value = false;
  }
};


// 从数据库加载已保存的数据
const loadSavedData = async () => {
  try {
    console.log('🔄 开始加载已保存的数据...');

    // 添加时间戳防止缓存
    const timestamp = Date.now();
    const response = await fetch(`/api/v1/env-check/excel-data?_t=${timestamp}`);

    console.log('📡 API响应状态:', response.status, response.statusText);
    console.log('📡 响应头:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('❌ API请求失败:', response.status, response.statusText);
      // 显示错误信息给用户
      message.error(`加载数据失败: ${response.status} ${response.statusText}`);
      return;
    }

    const result = await response.json();
    console.log('📦 API响应数据:', result);
    console.log('📊 API返回设备数量:', result.data?.data?.length || 0);
    console.log('📋 前5个设备的机柜信息:', result.data?.data?.slice(0, 5).map((row: any, index: number) => ({
      index: index + 1,
      name: row['主机名_设备标签名'],
      rack: row['设备机柜'],
      rackType: typeof row['设备机柜']
    })));

    if (result.code === 0 && result.data && result.data.data && result.data.data.length > 0) {
      // 将数据库中的Excel数据转换为前端设备格式
      const excelData = result.data.data;
      console.log(`📊 准备加载 ${excelData.length} 条设备数据`);

      // 清空现有数据
      clusterData.devices = [];

      excelData.forEach((row: any, index: number) => {
        console.log(`🔧 处理设备 ${index + 1}:`, row['主机名_设备标签名'], row['设备角色'], '机柜:', row['设备机柜']);

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
        clusterData.devices.push(device as DeviceInfo);
      });

      console.log(`✅ 成功加载 ${excelData.length} 条设备数据到前端`);
      console.log('📋 当前设备列表:', clusterData.devices.map((d: DeviceInfo) => ({name: d.name, type: d.type, ip: d.ip, rackName: d.rackName})));
      
      // 检查机柜分布
      const rackDistribution: Record<string, number> = {};
      clusterData.devices.forEach((device: DeviceInfo) => {
        const rack = device.rackName || '未分配';
        rackDistribution[rack] = (rackDistribution[rack] || 0) + 1;
      });
      console.log('🏗️ 机柜分布统计:', rackDistribution);

      // 强制触发Vue响应式更新
      clusterData.devices = [...clusterData.devices];

      console.log('🔄 触发Vue响应式更新');
      console.log('📊 clusterData.devices.length:', clusterData.devices.length);
      console.log('📊 deviceTypeStats:', deviceTypeStats.value);

      message.success(`已从数据库加载 ${excelData.length} 条设备数据`);

    } else {
      console.log('ℹ️ 没有找到已保存的数据或数据为空');
      if (result.code !== 0) {
        message.warning(`API返回错误: ${result.error || result.message}`);
      }
    }
  } catch (error) {
    console.error('❌ 加载已保存数据失败:', error);
    message.error(`网络错误，无法加载数据: ${error}`);
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

// 清空筛选条件
const clearFilters = () => {
  searchKeyword.value = '';
  deviceFilter.value = '';
  selectedRack.value = '';
};

// 显示设备详情
const showDeviceDetail = (device: DeviceInfo) => {
  Modal.info({
    title: `设备详情 - ${device.name}`,
    width: 800,
    content: h('div', { style: 'padding: 16px;' }, [
      // 基本信息卡片
      h(Card, { 
        title: '基本信息', 
        size: 'small',
        style: 'margin-bottom: 16px;',
        headStyle: { backgroundColor: '#f0f2f5' }
      }, {
        default: () => [
          h('div', { style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px;' }, [
            h('div', [
              h('p', { style: 'margin: 8px 0;' }, [
                h('strong', '设备名称: '),
                device.name
              ]),
              h('p', { style: 'margin: 8px 0;' }, [
                h('strong', '设备分类: '),
                h(Tag, { color: getDeviceTypeColor(device.type) }, () => getDeviceTypeLabel(device.type))
              ]),
              h('p', { style: 'margin: 8px 0;' }, [
                h('strong', '设备用途: '),
                device.description
              ])
            ]),
            h('div', [
              h('p', { style: 'margin: 8px 0;' }, [
                h('strong', '机柜位置: '),
                `${device.rackName || '未分配'}-U${device.uPosition || '?'}`
              ]),
              h('p', { style: 'margin: 8px 0;' }, [
                h('strong', '状态: '),
                h(Tag, { color: device.status === 'active' ? 'green' : 'red' }, () => 
                  device.status === 'active' ? '活跃' : '非活跃'
                )
              ])
            ])
          ])
        ]
      }),
      
      // 网络信息卡片
      h(Card, { 
        title: '网络信息', 
        size: 'small',
        style: 'margin-bottom: 16px;',
        headStyle: { backgroundColor: '#f0f2f5' }
      }, {
        default: () => [
          h('div', { style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px;' }, [
            h('div', [
              h('p', { style: 'margin: 8px 0;' }, [
                h('strong', '管理IP: '),
                device.managementIP || device.ip
              ]),
              h('p', { style: 'margin: 8px 0;' }, [
                h('strong', '业务IP: '),
                device.businessIP || '未配置'
              ])
            ]),
            h('div', [
              h('p', { style: 'margin: 8px 0;' }, [
                h('strong', 'IBO IP: '),
                device.iboIP || '未配置'
              ]),
              h('p', { style: 'margin: 8px 0;' }, [
                h('strong', 'RoCE IP: '),
                device.roceIP || '未配置'
              ])
            ])
          ])
        ]
      }),
      
      // 系统信息卡片
      h(Card, { 
        title: '系统信息', 
        size: 'small',
        headStyle: { backgroundColor: '#f0f2f5' }
      }, {
        default: () => [
          h('div', { style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px;' }, [
            h('div', [
              h('p', { style: 'margin: 8px 0;' }, [
                h('strong', '操作系统: '),
                device.os || '未配置'
              ]),
              h('p', { style: 'margin: 8px 0;' }, [
                h('strong', '登录方式: '),
                device.loginMethod || '未配置'
              ])
            ]),
            h('div', [
              h('p', { style: 'margin: 8px 0;' }, [
                h('strong', '坐标位置: '),
                `X: ${device.coordinates?.x || 0}, Y: ${device.coordinates?.y || 0}, Z: ${device.coordinates?.z || 0}`
              ])
            ])
          ])
        ]
      })
    ]),
    okText: '确定'
  });
};

/**
 * 处理LLD文件上传
 * 将LLD文件发送到后端进行解析
 * @param info - 上传文件信息
 */
const handleLLDUpload = async (info: any) => {
  console.log('文件上传被触发:', info);
  const { file, fileList } = info;

  // 检查文件类型
  const allowedExtensions = ['.lld', '.txt', '.conf', '.cfg', '.xlsx', '.xls'];
  const fileName = file?.name || '';
  const fileExtension = fileName.split('.').pop()?.toLowerCase();

  console.log('文件名:', fileName, '扩展名:', fileExtension);

  if (!fileExtension || !allowedExtensions.includes(`.${fileExtension}`)) {
    message.error('请选择LLD文件（.lld、.txt、.conf、.cfg）或Excel文件（.xlsx、.xls）');
    return;
  }

  // 检查文件大小（10MB限制）
  if (file?.size && file.size > 10 * 1024 * 1024) {
    message.error('文件大小不能超过10MB');
    return;
  }

  lldUploadLoading.value = true;
  lldUploadProgress.value = 0;
  lldUploadResult.value = null;
  lldFileList.value = fileList;

  try {
    // 创建FormData对象
    const formData = new FormData();
    formData.append('file', file);

    // 优化：减少进度更新频率
    const progressInterval = setInterval(() => {
      if (lldUploadProgress.value < 90) {
        lldUploadProgress.value += 20;
      }
    }, 300);

    // 发送文件到后端
    const response = await fetch('/api/v1/env-check/upload-lld', {
      method: 'POST',
      body: formData
    });

    clearInterval(progressInterval);
    lldUploadProgress.value = 100;

    const result = await response.json();

    if (result.code === 0) {
      lldUploadResult.value = result.data;

      // 根据文件类型显示不同的成功消息
      const fileType = result.data.fileType;
      const summary = result.data.summary;

      if (fileType === 'excel') {
        message.success(`Excel文件上传成功！解析到 ${summary.recordCount || 0} 条记录，${summary.deviceCount || 0} 个设备`);
      } else {
        message.success(`LLD文件上传成功！解析到 ${summary.deviceCount || 0} 个设备，${summary.connectionCount || 0} 个连接`);
      }

      // 如果有解析错误，显示警告
      if (result.data.parseResult && result.data.parseResult.errors && Array.isArray(result.data.parseResult.errors) && result.data.parseResult.errors.length > 0) {
        message.warning(`解析过程中发现 ${result.data.parseResult.errors.length} 个问题，请检查文件格式`);
        console.warn('文件解析错误:', result.data.parseResult.errors);
      }

    } else {
      message.error('文件上传失败：' + (result.error || result.message || '未知错误'));
    }

  } catch (error) {
    console.error('LLD文件上传时出错:', error);
    message.error('网络连接失败，请检查后端服务是否启动');
  } finally {
    lldUploadLoading.value = false;
  }
};

/**
 * 应用LLD解析结果到本地数据
 * 将解析后的设备信息和连接关系合并到集群数据中
 */
const applyLLDResult = async () => {
  if (!lldUploadResult.value) {
    message.warning('没有可应用的LLD解析结果');
    return;
  }

  try {
    const response = await fetch('/api/v1/env-check/apply-parse-result', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(lldUploadResult.value)
    });

    const result = await response.json();

    if (result.code === 0) {
      const data = result.data;
      message.success(data.message || `成功添加数据到数据库`);

      // 保存成功后，重新从数据库加载所有数据
      // 这样可以确保显示最新的数据，包括新保存的数据
      await loadSavedData();

      // 清空上传结果
      lldUploadResult.value = null;
      lldFileList.value = [];
    } else {
      message.error(result.error || result.message || '保存数据失败');
    }
  } catch (error) {
    console.error('保存数据时出错:', error);
    message.error('网络连接失败，请检查后端服务是否启动');
  }
};

/**
 * 清除LLD上传结果
 */
const clearLLDResult = () => {
  lldUploadResult.value = null;
  lldFileList.value = [];
  lldUploadProgress.value = 0;
};

// 组件挂载时加载已保存的数据
onMounted(async () => {
  await loadSavedData();
});
</script>

<template>
  <div class="p-5">
    <!-- 页面标题和操作 -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold mb-2">集群信息管理</h1>
        <p class="text-gray-600">管理集群中的设备信息和拓扑连接关系</p>
      </div>
      <Space>
        <Button type="primary" :loading="loading" @click="refreshData">
          刷新数据
        </Button>
      </Space>
    </div>


    <!-- 页签内容 -->
    <Card>
      <Tabs v-model:activeKey="activeTab">
        <!-- 概览页签 -->
        <TabPane key="overview" tab="概览">
          <div class="space-y-4">
            <h3 class="text-lg font-semibold">集群概览</h3>
            <p>这是一个集群信息管理系统的概览页面，用于展示集群的基本信息和统计数据。</p>

            <Row :gutter="16">
              <Col :span="12">
                <Card title="设备类型分布" size="small">
                  <div class="space-y-2">
                    <div class="flex justify-between">
                      <span>交换机</span>
                      <Tag color="blue">{{ deviceTypeStats.switch }}</Tag>
                    </div>
                    <div class="flex justify-between">
                      <span>服务器</span>
                      <Tag color="purple">{{ deviceTypeStats.server }}</Tag>
                    </div>
                    <div class="flex justify-between">
                      <span>路由器</span>
                      <Tag color="green">{{ deviceTypeStats.router }}</Tag>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col :span="12">
                <Card title="连接状态" size="small">
                  <div class="space-y-2">
                    <div class="flex justify-between">
                      <span>正常连接</span>
                      <Tag color="success">{{ connectionStatusStats.up }}</Tag>
                    </div>
                    <div class="flex justify-between">
                      <span>断开连接</span>
                      <Tag color="error">{{ connectionStatusStats.down }}</Tag>
                    </div>
                    <div class="flex justify-between">
                      <span>未知状态</span>
                      <Tag color="default">{{ connectionStatusStats.unknown }}</Tag>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        </TabPane>

        <!-- 设备信息页签 -->
        <TabPane key="devices" tab="设备信息">
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold">设备信息管理</h3>
              <Tag color="blue">{{ filteredDevices.length }}/{{ clusterData.devices.length }} 个设备</Tag>
            </div>

            <!-- 提示信息 -->
            <Alert
              message="支持搜索筛选 | 表格/机柜视图切换 | 点击设备查看详情"
              type="info"
              show-icon
              class="mb-4"
            />

            <!-- 搜索和筛选栏 -->
            <div class="flex items-center space-x-4 mb-4">
              <div class="flex-1">
                <input
                  v-model="searchKeyword"
                  placeholder="搜索主机名/IP/设备名"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div class="w-48">
                <select
                  v-model="deviceFilter"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部设备类型</option>
                  <option v-for="option in deviceTypeOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div>
              <Button @click="clearFilters">清空筛选</Button>
            </div>

            <!-- 视图切换按钮 -->
            <div class="flex justify-between items-center mb-4">
              <div class="flex items-center space-x-2">
                <Button
                  :type="viewMode === 'table' ? 'primary' : 'default'"
                  @click="viewMode = 'table'"
                >
                  表格视图
                </Button>
                <Button
                  :type="viewMode === 'rack' ? 'primary' : 'default'"
                  @click="viewMode = 'rack'"
                >
                  机柜视图
                </Button>
              </div>
              <Alert
                v-if="viewMode === 'rack'"
                message="机柜视图:点击任意设备查看详细信息 | 颜色区分设备类型 | 高度表示U位"
                type="info"
                show-icon
                class="text-sm"
              />
            </div>

            <!-- 表格视图 -->
            <div v-if="viewMode === 'table'">
            <Table
              :columns="deviceColumns"
                :data-source="filteredDevices"
              :pagination="{ pageSize: 10 }"
              row-key="id"
                :scroll="{ x: 1200 }"
              />
            </div>

            <!-- 机柜视图 -->
            <div v-else class="rack-view">
              <!-- 空状态提示 -->
              <div v-if="clusterData.devices.length === 0" class="empty-state">
                <div class="empty-content">
                  <div class="empty-icon">📦</div>
                  <h3 class="empty-title">暂无设备数据</h3>
                  <p class="empty-description">
                    请先上传LLD文件来导入设备信息，然后就可以在机柜视图中查看设备的物理布局了。
                  </p>
                  <div class="empty-actions">
                    <Button type="primary" @click="activeTab = 'import'">
                      去上传LLD文件
                    </Button>
                  </div>
                </div>
              </div>

              <!-- 有数据时显示机柜 -->
              <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <div
                  v-for="(devices, rackName) in rackData"
                  :key="rackName"
                  class="rack-container"
                >
                  <div class="rack-header">
                    <h4 class="text-lg font-semibold">{{ rackName }}</h4>
                    <Tag color="blue">{{ devices.length }} 台设备</Tag>
                  </div>

                  <div class="rack-body">
                    <div
                      v-for="device in devices"
                      :key="device.id"
                      class="device-block"
                      :style="{
                        backgroundColor: getDeviceTypeColor(device.type),
                        height: '60px',
                        marginBottom: '4px'
                      }"
                      @click="showDeviceDetail(device)"
                    >
                      <div class="device-info">
                        <div class="device-name">{{ device.name }}</div>
                        <div class="device-type">{{ getDeviceTypeLabel(device.type) }}</div>
                        <div class="device-ip">{{ device.ip }}</div>
                        <div class="device-position" v-if="device.uPosition">
                          U{{ device.uPosition }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabPane>

        <!-- 连接关系页签 -->
        <TabPane key="connections" tab="连接关系">
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold">连接关系</h3>
              <Tag color="green">{{ clusterData.connections.length }} 个连接</Tag>
            </div>

            <Table
              :columns="connectionColumns"
              :data-source="clusterData.connections"
              :pagination="{ pageSize: 10 }"
              row-key="id"
              :scroll="{ x: 1000 }"
            />
          </div>
        </TabPane>

        <!-- 导入管理页签 -->
        <TabPane key="import" tab="导入管理">
          <div class="space-y-6">
            <h3 class="text-lg font-semibold">导入管理</h3>

            <!-- 文件上传 -->
            <Card title="文件上传" size="small">
              <div class="space-y-4">
                <Upload
                  :file-list="lldFileList"
                  :before-upload="() => false"
                  @change="handleLLDUpload"
                  accept=".lld,.txt,.conf,.cfg,.xlsx,.xls"
                  :disabled="lldUploadLoading"
                >
                  <Button type="primary" :loading="lldUploadLoading">
                    {{ lldUploadLoading ? '上传中...' : '选择LLD或Excel文件' }}
                  </Button>
                </Upload>

                <!-- 上传进度 -->
                <div v-if="lldUploadLoading" class="space-y-2">
                  <Progress :percent="lldUploadProgress" :show-info="true" />
                  <p class="text-sm text-gray-500">正在解析文件...</p>
                </div>

                <!-- 上传结果展示 -->
                <div v-if="lldUploadResult" class="space-y-4">
                  <Alert
                    :message="`文件解析完成`"
                    :description="`文件名: ${lldUploadResult.fileName} | 大小: ${(lldUploadResult.fileSize / 1024).toFixed(2)}KB | 上传时间: ${new Date(lldUploadResult.uploadTime).toLocaleString()}`"
                    type="success"
                    show-icon
                  />

                  <!-- 解析结果统计 -->
                  <Row :gutter="16">
                    <Col :span="8">
                      <Statistic
                        :title="lldUploadResult.fileType === 'excel' ? '解析记录' : '解析设备'"
                        :value="lldUploadResult.fileType === 'excel' ? (lldUploadResult.summary.recordCount || 0) : lldUploadResult.summary.deviceCount"
                        :value-style="{ color: '#1890ff' }"
                      />
                    </Col>
                    <Col :span="8" v-if="lldUploadResult.fileType !== 'excel'">
                      <Statistic
                        title="解析连接"
                        :value="lldUploadResult.summary.connectionCount"
                        :value-style="{ color: '#52c41a' }"
                      />
                    </Col>
                    <Col :span="8" v-else>
                      <Statistic
                        title="转换设备"
                        :value="lldUploadResult.summary.deviceCount"
                        :value-style="{ color: '#52c41a' }"
                      />
                    </Col>
                    <Col :span="8">
                      <Statistic
                        title="解析错误"
                        :value="lldUploadResult.summary.errorCount"
                        :value-style="{ color: lldUploadResult.summary.errorCount > 0 ? '#ff4d4f' : '#52c41a' }"
                      />
                    </Col>
                  </Row>

                  <!-- 错误信息展示 -->
                  <div v-if="lldUploadResult.parseResult.errors.length > 0">
                    <Alert
                      title="解析警告"
                      type="warning"
                      show-icon
                    >
                      <ul class="list-disc list-inside space-y-1">
                        <li v-for="(error, index) in lldUploadResult.parseResult.errors" :key="index" class="text-sm">
                          {{ error }}
                        </li>
                      </ul>
                    </Alert>
                  </div>

                  <!-- 操作按钮 -->
                  <div class="flex space-x-2">
                    <Button
                      type="primary"
                      @click="applyLLDResult"
                      :disabled="lldUploadResult.summary.deviceCount === 0 && lldUploadResult.summary.connectionCount === 0"
                    >
                      应用到集群
                    </Button>
                    <Button @click="clearLLDResult">
                      清除结果
                    </Button>
                  </div>
                </div>

                <p class="text-gray-500 mt-2">支持 .lld、.txt、.conf、.cfg 格式的LLD文件，以及 .xlsx、.xls 格式的Excel文件</p>
              </div>
            </Card>

            <!-- 导入说明 -->
            <Card title="导入说明" size="small">
              <div class="space-y-4">
                <div>
                  <h4 class="font-semibold mb-2">支持的文件格式：</h4>
                  <ul class="list-disc list-inside space-y-1 text-sm">
                    <li><strong>LLD文件：</strong>.lld、.txt、.conf、.cfg（最大5MB）</li>
                    <li><strong>Excel文件：</strong>.xlsx、.xls（最大10MB）</li>
                  </ul>
                </div>

                <div>
                  <h4 class="font-semibold mb-2">LLD文件格式示例：</h4>
                  <ul class="list-disc list-inside ml-4 space-y-1 text-sm">
                    <li>hostname=设备名 ip=IP地址 type=设备类型</li>
                    <li>device=设备名,IP地址,设备类型</li>
                    <li>IP地址 设备名 设备类型</li>
                    <li>设备名->目标设备 端口->目标端口</li>
                  </ul>
                </div>

                <div>
                  <h4 class="font-semibold mb-2">Excel文件要求：</h4>
                  <ul class="list-disc list-inside space-y-1 text-sm">
                    <li>设备信息应包含：设备名称、类型、IP地址、用户名、密码等</li>
                    <li>连接关系应包含：源设备、目标设备、端口信息等</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </TabPane>
      </Tabs>
    </Card>
  </div>
</template>

<style scoped>
.upload-demo {
  width: 100%;
}

.ant-card {
  margin-bottom: 16px;
}

.ant-statistic-title {
  font-size: 14px;
  color: #666;
}

.ant-statistic-content {
  font-size: 20px;
  font-weight: 600;
}

/* 机柜视图样式 */
.rack-view {
  min-height: 400px;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 40px 20px;
}

.empty-content {
  text-align: center;
  max-width: 400px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.empty-description {
  color: #666;
  line-height: 1.6;
  margin-bottom: 24px;
}

.empty-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.rack-container {
  border: 2px solid #d9d9d9;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
  min-height: 500px;
}

.rack-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #d9d9d9;
}

.rack-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 400px;
  overflow-y: auto;
}

.device-block {
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  position: relative;
  overflow: hidden;
}

.device-block:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: rgba(255, 255, 255, 0.6);
}

.device-info {
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
}

.device-name {
  font-weight: bold;
  font-size: 14px;
  line-height: 1.2;
}

.device-type {
  font-size: 12px;
  opacity: 0.9;
  line-height: 1.2;
}

.device-ip {
  font-size: 11px;
  opacity: 0.8;
  line-height: 1.2;
}

.device-position {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: bold;
}


/* 响应式设计 */
@media (max-width: 768px) {
  .rack-container {
    min-height: 300px;
  }

  .device-block {
    height: 50px !important;
  }

  .device-name {
    font-size: 12px;
  }

  .device-type {
    font-size: 10px;
  }

  .device-ip {
    font-size: 9px;
  }

}
</style>
