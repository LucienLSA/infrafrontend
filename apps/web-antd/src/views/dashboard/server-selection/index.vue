<script lang="ts" setup>
import { ref, reactive, computed, onMounted, h } from 'vue';
import { serverListApi, type Server } from '@/api/server-list';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Input, 
  InputPassword,
  Select, 
  SelectOption,
  Checkbox, 
  Tag, 
  Modal, 
  Form, 
  FormItem, 
  message, 
  Tabs,
  TabPane,
  Descriptions,
  DescriptionsItem,
  Badge,
  RadioGroup,
  Radio,
  Alert
} from 'ant-design-vue';

// 响应式数据
const loading = ref(false);
const selectedRowKeys = ref<string[]>([]);
const selectedRows = ref<any[]>([]);
const searchText = ref('');
const serverTypeFilter = ref<string>('all');
const statusFilter = ref<string>('all');

// 服务器列表数据
const serverList = ref<any[]>([]);

// 配置模板数据
const configTemplates = ref([
  {
    id: '1',
    name: 'GPU计算节点标准配置',
    type: 'gpu',
    os: 'Ubuntu 20.04 LTS',
    gpuDriver: 'NVIDIA Driver 525.85.12',
    frameworks: ['CUDA 11.8', 'PyTorch 2.0', 'TensorFlow 2.12'],
    network: '10Gbps Ethernet',
    description: '适用于AI训练和推理的标准GPU计算节点配置'
  },
  {
    id: '2',
    name: '存储节点标准配置',
    type: 'storage', 
    os: 'CentOS 7.9',
    gpuDriver: 'N/A',
    frameworks: ['Ceph', 'GlusterFS'],
    network: '25Gbps Ethernet',
    description: '适用于分布式存储的存储节点配置'
  },
  {
    id: '3',
    name: '混合计算节点配置',
    type: 'gpu',
    os: 'Ubuntu 22.04 LTS',
    gpuDriver: 'NVIDIA Driver 535.86.10',
    frameworks: ['CUDA 12.0', 'PyTorch 2.1', 'TensorFlow 2.13', 'JAX'],
    network: '25Gbps Ethernet',
    description: '高性能混合计算节点，支持最新AI框架'
  }
]);

// 表格列配置
const columns = [
  {
    title: '服务器名称',
    dataIndex: 'name',
    key: 'name',
    width: 150,
    sorter: (a: any, b: any) => a.name.localeCompare(b.name),
  },
  {
    title: 'IP地址',
    dataIndex: 'ip',
    key: 'ip',
    width: 120,
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 100,
    customRender: ({ record }: any) => {
      const typeMap = {
        gpu: { color: 'blue', text: 'GPU服务器' },
        storage: { color: 'green', text: '存储服务器' },
        cpu: { color: 'orange', text: 'CPU服务器' }
      };
      const type = typeMap[record.type as keyof typeof typeMap];
      return h(Tag, { color: type.color }, () => type.text);
    }
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    customRender: ({ record }: any) => {
      const statusMap = {
        online: { status: 'success' as const, text: '在线' },
        offline: { status: 'default' as const, text: '离线' },
        error: { status: 'error' as const, text: '错误' },
        unknown: { status: 'default' as const, text: '未知' },
        maintenance: { status: 'warning' as const, text: '维护中' }
      };
      const status = statusMap[record.status as keyof typeof statusMap] || { status: 'default' as const, text: record.status };
      return h(Badge, { status: status.status, text: status.text });
    }
  },
  {
    title: '硬件配置',
    key: 'hardware',
    width: 200,
    customRender: ({ record }: any) => {
      return h('div', [
        h('div', `CPU: ${record.cpu}`),
        h('div', `内存: ${record.memory}`),
        h('div', `GPU: ${record.gpu}`),
        h('div', `存储: ${record.storage}`)
      ]);
    }
  },
  {
    title: '操作系统',
    dataIndex: 'os',
    key: 'os',
    width: 150,
  },
  {
    title: '位置',
    dataIndex: 'location',
    key: 'location',
    width: 120,
  },
  {
    title: '最后检查',
    dataIndex: 'lastCheck',
    key: 'lastCheck',
    width: 150,
  }
];

// 计算属性
const filteredServerList = computed(() => {
  let filtered = serverList.value;
  
  // 按搜索文本过滤（本地过滤，因为API已经按类型和状态过滤了）
  if (searchText.value) {
    filtered = filtered.filter(server => 
      server.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
      server.ip.includes(searchText.value) ||
      server.location.toLowerCase().includes(searchText.value.toLowerCase())
    );
  }
  
  return filtered;
});

// 选择配置
const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: (string | number)[], rows: any[]) => {
    console.log('选择变化:', keys, rows);
    selectedRowKeys.value = keys.map(k => String(k));
    selectedRows.value = rows;
  },
  onSelect: (record: any, selected: boolean, selectedRows: any[]) => {
    console.log('单行选择:', record, selected, selectedRows);
  },
  onSelectAll: (selected: boolean, selectedRows: any[], changeRows: any[]) => {
    console.log('全选/取消全选:', selected, selectedRows, changeRows);
  },
  getCheckboxProps: (record: any) => ({
    disabled: record.status === 'offline',
  }),
}));

// 方法
const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
};

// 监听筛选器变化
const handleFilterChange = () => {
  handleRefresh();
};

const handleRefresh = async () => {
  loading.value = true;
  try {
    const response = await serverListApi.getAllServers(serverTypeFilter.value, statusFilter.value);
    // 由于requestClient配置了responseReturn: 'data'，response直接是data字段的内容
    serverList.value = response.servers;
    message.success('数据刷新成功');
  } catch (error) {
    console.error('获取服务器列表失败:', error);
    message.error('获取服务器列表失败');
  } finally {
    loading.value = false;
  }
};

const handleBatchConfig = () => {
  if (selectedRows.value.length === 0) {
    message.warning('请先选择要配置的服务器');
    return;
  }
  showConfigModal.value = true;
};

const handleBatchInstall = () => {
  if (selectedRows.value.length === 0) {
    message.warning('请先选择要安装的服务器');
    return;
  }
  showInstallModal.value = true;
};

const handleViewHistory = () => {
  message.info('跳转到安装历史页面');
};

// 配置模态框
const showConfigModal = ref(false);
const showInstallModal = ref(false);
const configForm = reactive({
  templateId: '',
  templateConfig: {
    os: '',
    gpuDriver: '',
    frameworks: [] as string[],
    network: '',
    description: ''
  },
  customConfig: {
    os: '',
    gpuDriver: '',
    frameworks: [] as string[],
    network: ''
  },
  isTemplateMode: true
});

// 批量安装配置
const installForm = reactive({
  hostname: 'host',
  username: 'user',
  password: '',
  network_interface: 'ens33',
  boot_mode: 'uefi',
  disk_path: '/dev/sda',
  timezone: 'Asia/Shanghai',
  keyboard_layout: 'us',
  packages: ['ipmitool'],
  iso_path: '/home/pxe/ubuntu-22.04.5-live-server-amd64.iso'
});

// 选择模板
const handleTemplateSelect = (templateId: string) => {
  configForm.templateId = templateId;
  const template = configTemplates.value.find(t => t.id === templateId);
  if (template) {
    configForm.templateConfig = {
      os: template.os,
      gpuDriver: template.gpuDriver,
      frameworks: [...template.frameworks],
      network: template.network,
      description: template.description
    };
    // 初始化微调配置为模板配置
    configForm.customConfig = {
      os: template.os,
      gpuDriver: template.gpuDriver,
      frameworks: [...template.frameworks],
      network: template.network
    };
  }
};

// 切换模式
const handleModeChange = (mode: string | number) => {
  configForm.isTemplateMode = mode === 'template';
  if (mode === 'custom') {
    // 切换到自定义模式时清空模板选择
    configForm.templateId = '';
  }
};

// 重置到模板默认值
const handleResetToTemplate = () => {
  if (configForm.templateId) {
    const template = configTemplates.value.find(t => t.id === configForm.templateId);
    if (template) {
      configForm.customConfig = {
        os: template.os,
        gpuDriver: template.gpuDriver,
        frameworks: [...template.frameworks],
        network: template.network
      };
      message.success('已重置到模板默认配置');
    }
  }
};

const handleConfigSubmit = () => {
  if (configForm.isTemplateMode && !configForm.templateId) {
    message.warning('请选择配置模板');
    return;
  }
  
  if (!configForm.isTemplateMode && !configForm.customConfig.os) {
    message.warning('请完成自定义配置');
    return;
  }
  
  const finalConfig = configForm.isTemplateMode ? configForm.customConfig : configForm.customConfig;
  
  message.success(`开始为 ${selectedRows.value.length} 台服务器应用配置`);
  showConfigModal.value = false;
  
  // 这里可以调用后端API开始配置
  console.log('配置参数:', {
    serverIds: selectedRowKeys.value,
    templateId: configForm.templateId,
    isTemplateMode: configForm.isTemplateMode,
    finalConfig: finalConfig
  });
};

// 批量安装相关方法
const handleInstallSubmit = async () => {
  if (!installForm.password) {
    message.warning('请输入密码');
    return;
  }
  
  try {
    const targetIPs = selectedRows.value.map(server => server.ip);
    
    // 这里调用批量安装API
    const response = await fetch('/api/v1/batch-install/start-batch-install', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target_ips: targetIPs,
        config: installForm,
        iso_path: installForm.iso_path,
        autoinstall_template: 'default'
      })
    });
    
    if (response.ok) {
      message.success(`开始为 ${selectedRows.value.length} 台服务器进行批量安装`);
      showInstallModal.value = false;
      // 跳转到安装进度页面
      message.info('跳转到安装进度页面');
    } else {
      message.error('启动批量安装失败');
    }
  } catch (error) {
    message.error('启动批量安装失败');
  }
};

const addPackage = () => {
  installForm.packages.push('');
};

const removePackage = (index: number) => {
  installForm.packages.splice(index, 1);
};

// 全选/取消全选
const handleSelectAll = () => {
  if (selectedRowKeys.value.length === filteredServerList.value.length) {
    selectedRowKeys.value = [];
    selectedRows.value = [];
  } else {
    selectedRowKeys.value = filteredServerList.value.map(server => server.id);
    selectedRows.value = filteredServerList.value;
  }
};

// 清空选择
const handleClearSelection = () => {
  selectedRowKeys.value = [];
  selectedRows.value = [];
};

onMounted(() => {
  // 初始化数据
  handleRefresh();
});
</script>

<template>
  <div class="p-4">
    <!-- 页面标题和操作区 -->
    <div class="mb-4">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">服务器选择配置</h1>
          <p class="text-gray-600 mt-1">选择服务器并配置操作系统、GPU驱动、网卡驱动和计算框架</p>
        </div>
        <Space>
          <Button @click="handleViewHistory">
            安装历史
          </Button>
          <Button @click="handleRefresh" :loading="loading">
            刷新数据
          </Button>
        </Space>
      </div>
    </div>

    <!-- 筛选和搜索区 -->
    <Card class="mb-4">
      <div class="flex flex-wrap gap-4 items-center">
        <div class="flex items-center gap-2">
          <span class="font-medium">搜索:</span>
          <Input
            v-model:value="searchText"
            style="width: 250px"
            @pressEnter="handleSearch"
          />
        </div>
        
        <div class="flex items-center gap-2">
          <span class="font-medium">类型:</span>
          <Select v-model:value="serverTypeFilter" style="width: 120px" @change="handleFilterChange">
            <SelectOption value="all">全部</SelectOption>
            <SelectOption value="gpu">GPU服务器</SelectOption>
            <SelectOption value="storage">存储服务器</SelectOption>
            <SelectOption value="cpu">CPU服务器</SelectOption>
          </Select>
        </div>
        
        <div class="flex items-center gap-2">
          <span class="font-medium">状态:</span>
          <Select v-model:value="statusFilter" style="width: 120px" @change="handleFilterChange">
            <SelectOption value="all">全部</SelectOption>
            <SelectOption value="online">在线</SelectOption>
            <SelectOption value="offline">离线</SelectOption>
            <SelectOption value="maintenance">维护中</SelectOption>
          </Select>
        </div>
        
        <div class="flex-1"></div>
        
        <div class="flex items-center gap-4">
          <div class="text-sm text-gray-500">
            已选择 {{ selectedRows.length }} 台服务器
          </div>
          <Button size="small" @click="handleSelectAll">
            {{ selectedRowKeys.length === filteredServerList.length ? '取消全选' : '全选' }}
          </Button>
          <Button size="small" @click="handleClearSelection" :disabled="selectedRows.length === 0">
            清空选择
          </Button>
        </div>
      </div>
    </Card>

    <!-- 服务器列表 -->
    <Card>
      <template #title>
        <div class="flex justify-between items-center">
          <span>服务器列表</span>
          <Space>
            <Button 
              type="primary" 
              :disabled="selectedRows.length === 0"
              @click="handleBatchConfig"
            >
              批量配置 ({{ selectedRows.length }})
            </Button>
            <Button 
              type="primary" 
              danger
              :disabled="selectedRows.length === 0"
              @click="handleBatchInstall"
            >
              批量安装 ({{ selectedRows.length }})
            </Button>
          </Space>
        </div>
      </template>
      
      <Table
        :columns="columns"
        :data-source="filteredServerList"
        :row-selection="rowSelection"
        :loading="loading"
        :pagination="{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }"
        row-key="id"
        size="middle"
      />
    </Card>

    <!-- 配置模态框 -->
    <Modal
      v-model:open="showConfigModal"
      title="服务器配置"
      width="1000px"
      :ok-button-props="{ disabled: configForm.isTemplateMode ? !configForm.templateId : !configForm.customConfig.os }"
      @ok="handleConfigSubmit"
    >
      <Tabs default-active-key="template" @change="handleModeChange">
        <TabPane key="template" tab="配置模板">
          <div class="space-y-4">
            <div class="text-sm text-gray-600 mb-4">
              已选择 {{ selectedRows.length }} 台服务器进行配置
            </div>
            
            <!-- 模板选择 -->
            <div class="mb-6">
              <h4 class="font-medium text-lg mb-4">选择配置模板</h4>
              <div class="grid grid-cols-1 gap-4">
                <Card 
                  v-for="template in configTemplates" 
                  :key="template.id"
                  :class="['cursor-pointer transition-all', configForm.templateId === template.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md']"
                  @click="handleTemplateSelect(template.id)"
                >
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <h4 class="font-medium text-lg mb-2">{{ template.name }}</h4>
                      <p class="text-gray-600 text-sm mb-3">{{ template.description }}</p>
                      
                      <Descriptions size="small" :column="2">
                        <DescriptionsItem label="操作系统">{{ template.os }}</DescriptionsItem>
                        <DescriptionsItem label="GPU驱动">{{ template.gpuDriver }}</DescriptionsItem>
                        <DescriptionsItem label="计算框架">
                          <div class="flex flex-wrap gap-1">
                            <Tag v-for="framework in template.frameworks" :key="framework" size="small">
                              {{ framework }}
                            </Tag>
                          </div>
                        </DescriptionsItem>
                        <DescriptionsItem label="网络">{{ template.network }}</DescriptionsItem>
                      </Descriptions>
                    </div>
                    
                    <div class="ml-4">
                      <Checkbox :checked="configForm.templateId === template.id" />
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            <!-- 模板微调配置 -->
            <div v-if="configForm.templateId" class="border-t pt-6">
              <div class="flex justify-between items-center mb-4">
                <div>
                  <h4 class="font-medium text-lg">调整配置参数</h4>
                  <p class="text-sm text-gray-600 mt-1">基于选中的模板，您可以调整以下参数：</p>
                </div>
                <Button size="small" @click="handleResetToTemplate">
                  重置到模板默认值
                </Button>
              </div>
              
              <Form :model="configForm.customConfig" layout="vertical" class="max-w-2xl">
                <div class="grid grid-cols-2 gap-4">
                  <FormItem label="操作系统" name="os">
                    <Select v-model:value="configForm.customConfig.os" placeholder="选择操作系统">
                      <SelectOption value="ubuntu20.04">Ubuntu 20.04 LTS</SelectOption>
                      <SelectOption value="ubuntu22.04">Ubuntu 22.04 LTS</SelectOption>
                      <SelectOption value="centos7.9">CentOS 7.9</SelectOption>
                      <SelectOption value="centos8">CentOS 8</SelectOption>
                    </Select>
                  </FormItem>
                  
                  <FormItem label="GPU驱动版本" name="gpuDriver">
                    <Select v-model:value="configForm.customConfig.gpuDriver" placeholder="选择GPU驱动版本">
                      <SelectOption value="525.85.12">NVIDIA Driver 525.85.12</SelectOption>
                      <SelectOption value="535.86.10">NVIDIA Driver 535.86.10</SelectOption>
                      <SelectOption value="545.23.08">NVIDIA Driver 545.23.08</SelectOption>
                      <SelectOption value="550.54.15">NVIDIA Driver 550.54.15</SelectOption>
                    </Select>
                  </FormItem>
                </div>
                
                <FormItem label="计算框架" name="frameworks">
                  <Select 
                    v-model:value="configForm.customConfig.frameworks" 
                    mode="multiple" 
                    placeholder="选择计算框架"
                    class="w-full"
                  >
                    <SelectOption value="cuda11.8">CUDA 11.8</SelectOption>
                    <SelectOption value="cuda12.0">CUDA 12.0</SelectOption>
                    <SelectOption value="cuda12.1">CUDA 12.1</SelectOption>
                    <SelectOption value="pytorch2.0">PyTorch 2.0</SelectOption>
                    <SelectOption value="pytorch2.1">PyTorch 2.1</SelectOption>
                    <SelectOption value="pytorch2.2">PyTorch 2.2</SelectOption>
                    <SelectOption value="tensorflow2.12">TensorFlow 2.12</SelectOption>
                    <SelectOption value="tensorflow2.13">TensorFlow 2.13</SelectOption>
                    <SelectOption value="tensorflow2.14">TensorFlow 2.14</SelectOption>
                    <SelectOption value="jax">JAX</SelectOption>
                    <SelectOption value="huggingface">Hugging Face Transformers</SelectOption>
                    <SelectOption value="onnx">ONNX Runtime</SelectOption>
                  </Select>
                </FormItem>
                
                <FormItem label="网络配置" name="network">
                  <Select v-model:value="configForm.customConfig.network" placeholder="选择网络配置">
                    <SelectOption value="10g">10Gbps Ethernet</SelectOption>
                    <SelectOption value="25g">25Gbps Ethernet</SelectOption>
                    <SelectOption value="100g">100Gbps Ethernet</SelectOption>
                    <SelectOption value="infiniband">InfiniBand HDR</SelectOption>
                  </Select>
                </FormItem>
              </Form>
            </div>

            <!-- 配置预览 -->
            <div v-if="configForm.templateId" class="border-t pt-6">
              <h4 class="font-medium text-lg mb-4">配置预览</h4>
              <Card class="bg-gray-50">
                <Descriptions :column="2" bordered>
                  <DescriptionsItem label="配置模式">模板配置修改</DescriptionsItem>
                  <DescriptionsItem label="基础模板">{{ configTemplates.find(t => t.id === configForm.templateId)?.name }}</DescriptionsItem>
                  <DescriptionsItem label="操作系统">{{ configForm.customConfig.os }}</DescriptionsItem>
                  <DescriptionsItem label="GPU驱动">{{ configForm.customConfig.gpuDriver }}</DescriptionsItem>
                  <DescriptionsItem label="计算框架">
                    <div class="flex flex-wrap gap-1">
                      <Tag v-for="framework in configForm.customConfig.frameworks" :key="framework" size="small">
                        {{ framework }}
                      </Tag>
                    </div>
                  </DescriptionsItem>
                  <DescriptionsItem label="网络配置">{{ configForm.customConfig.network }}</DescriptionsItem>
                </Descriptions>
              </Card>
            </div>
          </div>
        </TabPane>
        
        <TabPane key="custom" tab="自定义配置">
          <Form :model="configForm.customConfig" layout="vertical">
            <FormItem label="操作系统" name="os">
              <Select v-model:value="configForm.customConfig.os" placeholder="选择操作系统">
                <SelectOption value="ubuntu20.04">Ubuntu 20.04 LTS</SelectOption>
                <SelectOption value="ubuntu22.04">Ubuntu 22.04 LTS</SelectOption>
                <SelectOption value="centos7.9">CentOS 7.9</SelectOption>
                <SelectOption value="centos8">CentOS 8</SelectOption>
              </Select>
            </FormItem>
            
            <FormItem label="GPU驱动" name="gpuDriver">
              <Select v-model:value="configForm.customConfig.gpuDriver" placeholder="选择GPU驱动版本">
                <SelectOption value="525.85.12">NVIDIA Driver 525.85.12</SelectOption>
                <SelectOption value="535.86.10">NVIDIA Driver 535.86.10</SelectOption>
                <SelectOption value="545.23.08">NVIDIA Driver 545.23.08</SelectOption>
              </Select>
            </FormItem>
            
            <FormItem label="计算框架" name="frameworks">
              <Select 
                v-model:value="configForm.customConfig.frameworks" 
                mode="multiple" 
                placeholder="选择计算框架"
              >
                <SelectOption value="cuda11.8">CUDA 11.8</SelectOption>
                <SelectOption value="cuda12.0">CUDA 12.0</SelectOption>
                <SelectOption value="pytorch2.0">PyTorch 2.0</SelectOption>
                <SelectOption value="pytorch2.1">PyTorch 2.1</SelectOption>
                <SelectOption value="tensorflow2.12">TensorFlow 2.12</SelectOption>
                <SelectOption value="tensorflow2.13">TensorFlow 2.13</SelectOption>
                <SelectOption value="jax">JAX</SelectOption>
              </Select>
            </FormItem>
            
            <FormItem label="网络配置" name="network">
              <Select v-model:value="configForm.customConfig.network" placeholder="选择网络配置">
                <SelectOption value="10g">10Gbps Ethernet</SelectOption>
                <SelectOption value="25g">25Gbps Ethernet</SelectOption>
                <SelectOption value="100g">100Gbps Ethernet</SelectOption>
              </Select>
            </FormItem>
          </Form>
        </TabPane>
      </Tabs>
    </Modal>

    <!-- 批量安装模态框 -->
    <Modal
      v-model:open="showInstallModal"
      title="批量安装操作系统"
      width="800px"
      @ok="handleInstallSubmit"
    >
      <div class="space-y-4">
        <Alert
          message="警告"
          description="批量安装将重新安装选中服务器的操作系统，此操作不可撤销！"
          type="warning"
          show-icon
        />
        
        <div class="text-sm text-gray-600 mb-4">
          已选择 {{ selectedRows.length }} 台服务器进行批量安装
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">主机名前缀</label>
            <Input v-model:value="installForm.hostname" placeholder="host" />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">用户名</label>
            <Input v-model:value="installForm.username" placeholder="user" />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">密码</label>
            <InputPassword v-model:value="installForm.password" placeholder="请输入密码" />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">网络接口</label>
            <Select v-model:value="installForm.network_interface" class="w-full">
              <SelectOption value="ens33">ens33</SelectOption>
              <SelectOption value="eth0">eth0</SelectOption>
              <SelectOption value="enp0s3">enp0s3</SelectOption>
            </Select>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">启动模式</label>
            <RadioGroup v-model:value="installForm.boot_mode">
              <Radio value="uefi">UEFI</Radio>
              <Radio value="legacy">Legacy BIOS</Radio>
            </RadioGroup>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">磁盘路径</label>
            <Select v-model:value="installForm.disk_path" class="w-full">
              <SelectOption value="/dev/sda">/dev/sda</SelectOption>
              <SelectOption value="/dev/nvme0n1">/dev/nvme0n1</SelectOption>
              <SelectOption value="/dev/vda">/dev/vda</SelectOption>
            </Select>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">时区</label>
            <Select v-model:value="installForm.timezone" class="w-full">
              <SelectOption value="Asia/Shanghai">Asia/Shanghai</SelectOption>
              <SelectOption value="UTC">UTC</SelectOption>
              <SelectOption value="America/New_York">America/New_York</SelectOption>
            </Select>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">键盘布局</label>
            <Select v-model:value="installForm.keyboard_layout" class="w-full">
              <SelectOption value="us">US</SelectOption>
              <SelectOption value="cn">Chinese</SelectOption>
            </Select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">预装软件包</label>
          <div class="space-y-2">
            <div v-for="(pkg, index) in installForm.packages" :key="index" class="flex items-center space-x-2">
              <Input v-model:value="installForm.packages[index]" class="flex-1" />
              <Button @click="removePackage(index)" type="text" danger>
                删除
              </Button>
            </div>
            <Button @click="addPackage" type="dashed" class="w-full">
              添加软件包
            </Button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">ISO镜像路径</label>
          <Input v-model:value="installForm.iso_path" placeholder="/home/pxe/ubuntu-22.04.5-live-server-amd64.iso" />
        </div>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.ant-card {
  margin-bottom: 16px;
}

.ant-table-thead > tr > th {
  background-color: #fafafa;
  font-weight: 600;
}

.ant-descriptions-item-label {
  font-weight: 500;
}

.grid {
  display: grid;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.gap-4 {
  gap: 1rem;
}

.space-y-4 > * + * {
  margin-top: 1rem;
}
</style>



