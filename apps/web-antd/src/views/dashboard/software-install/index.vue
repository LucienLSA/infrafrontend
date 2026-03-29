<script lang="ts" setup>
import { ref, reactive, computed, onMounted, h } from 'vue';
import { serverListApi, type Server } from '@/api/server-list';
import { softwareInstallApi, type SoftwareInstallRequest, type SoftwarePackage } from '@/api/software-install';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Input, 
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
  Steps,
  Step,
  Progress,
  List,
  ListItem,
  Divider,
  Alert,
  InputNumber,
  Switch
} from 'ant-design-vue';
import { PlusOutlined, DeleteOutlined, DownloadOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons-vue';

// 响应式数据
const loading = ref(false);
const selectedRowKeys = ref<string[]>([]);
const selectedRows = ref<any[]>([]);
const searchText = ref('');
const serverTypeFilter = ref<string>('all');
const statusFilter = ref<string>('all');

// 服务器列表数据
const serverList = ref<any[]>([]);

// 软件安装相关数据
const showInstallModal = ref(false);
const installStep = ref(0);
const installForm = reactive({
  softwareType: 'system', // system, development, ai, custom
  softwareList: [] as any[],
  installMethod: 'apt', // apt, pip, conda, manual
  parallelInstall: true,
  timeout: 1800, // 30分钟
  retryCount: 3,
  customScript: '',
  packageManager: 'apt', // apt, yum, dnf, pacman
  updateSystem: true,
  installDependencies: true
});

// 软件包模板
const softwareTemplates = ref({
  system: [
    { name: 'htop', description: '系统监控工具', category: 'monitoring' },
    { name: 'vim', description: '文本编辑器', category: 'editor' },
    { name: 'curl', description: '网络工具', category: 'network' },
    { name: 'wget', description: '下载工具', category: 'network' },
    { name: 'git', description: '版本控制工具', category: 'development' },
    { name: 'tree', description: '目录树显示工具', category: 'utility' },
    { name: 'jq', description: 'JSON处理工具', category: 'utility' },
    { name: 'unzip', description: '解压工具', category: 'utility' }
  ],
  development: [
    { name: 'build-essential', description: '编译工具链', category: 'compiler' },
    { name: 'cmake', description: '构建工具', category: 'build' },
    { name: 'python3-dev', description: 'Python开发头文件', category: 'python' },
    { name: 'python3-pip', description: 'Python包管理器', category: 'python' },
    { name: 'nodejs', description: 'Node.js运行时', category: 'runtime' },
    { name: 'npm', description: 'Node.js包管理器', category: 'runtime' },
    { name: 'docker.io', description: '容器化平台', category: 'container' },
    { name: 'docker-compose', description: '容器编排工具', category: 'container' }
  ],
  ai: [
    { name: 'nvidia-driver-525', description: 'NVIDIA显卡驱动', category: 'gpu' },
    { name: 'cuda-toolkit-11-8', description: 'CUDA工具包', category: 'gpu' },
    { name: 'python3-pip', description: 'Python包管理器', category: 'python' },
    { name: 'python3-venv', description: 'Python虚拟环境', category: 'python' },
    { name: 'tensorflow', description: 'TensorFlow深度学习框架', category: 'ml' },
    { name: 'pytorch', description: 'PyTorch深度学习框架', category: 'ml' },
    { name: 'opencv-python', description: '计算机视觉库', category: 'cv' },
    { name: 'jupyter', description: 'Jupyter Notebook', category: 'notebook' }
  ]
});

// 安装任务状态
const installTasks = ref<any[]>([]);
const currentTask = ref<any>(null);
const taskProgress = ref(0);

// 计算属性
const filteredServerList = computed(() => {
  let filtered = serverList.value;
  
  if (searchText.value) {
    filtered = filtered.filter(server => 
      server.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
      server.ip.toLowerCase().includes(searchText.value.toLowerCase())
    );
  }
  
  if (serverTypeFilter.value !== 'all') {
    filtered = filtered.filter(server => server.type === serverTypeFilter.value);
  }
  
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(server => server.status === statusFilter.value);
  }
  
  return filtered;
});

const hasSelectedServers = computed(() => selectedRowKeys.value.length > 0);
const canStartInstall = computed(() => {
  return hasSelectedServers.value && installForm.softwareList.length > 0;
});

const statusMap = {
  online: { status: 'success' as const, text: '在线' },
  offline: { status: 'default' as const, text: '离线' },
  error: { status: 'error' as const, text: '错误' },
  unknown: { status: 'default' as const, text: '未知' },
  maintenance: { status: 'warning' as const, text: '维护中' }
};

// 方法
const handleRefresh = async () => {
  loading.value = true;
  try {
    const response = await serverListApi.getAllServers(serverTypeFilter.value, statusFilter.value);
    serverList.value = response.servers;
  } catch (error) {
    message.error('获取服务器列表失败');
    console.error('Error loading servers:', error);
  } finally {
    loading.value = false;
  }
};

const handleFilterChange = () => {
  handleRefresh();
};

const handleSelectionChange = (keys: string[], rows: any[]) => {
  selectedRowKeys.value = keys;
  selectedRows.value = rows;
};

const handleSoftwareInstall = () => {
  if (!hasSelectedServers.value) {
    message.warning('请先选择要安装软件的服务器');
    return;
  }
  showInstallModal.value = true;
  installStep.value = 0;
  resetInstallForm();
};

const resetInstallForm = () => {
  installForm.softwareType = 'system';
  installForm.softwareList = [];
  installForm.installMethod = 'apt';
  installForm.parallelInstall = true;
  installForm.timeout = 1800;
  installForm.retryCount = 3;
  installForm.customScript = '';
  installForm.packageManager = 'apt';
  installForm.updateSystem = true;
  installForm.installDependencies = true;
};

const addSoftware = (software: any) => {
  if (!installForm.softwareList.find(item => item.name === software.name)) {
    installForm.softwareList.push({
      ...software,
      selected: true,
      version: '',
      installMethod: installForm.installMethod
    });
  }
};

const removeSoftware = (index: number) => {
  installForm.softwareList.splice(index, 1);
};

const addCustomSoftware = () => {
  installForm.softwareList.push({
    name: '',
    description: '',
    category: 'custom',
    selected: true,
    version: '',
    installMethod: installForm.installMethod
  });
};

const loadSoftwareTemplates = async () => {
  try {
    const response = await softwareInstallApi.getTemplates();
    softwareTemplates.value = response.templates;
  } catch (error) {
    console.error('加载软件模板失败:', error);
  }
};

const handleTemplateChange = (type: string) => {
  installForm.softwareList = [];
  if (type !== 'custom') {
    softwareTemplates.value[type as keyof typeof softwareTemplates.value].forEach(software => {
      addSoftware(software);
    });
  }
};

const nextStep = () => {
  if (installStep.value === 0 && installForm.softwareList.length === 0) {
    message.warning('请选择要安装的软件');
    return;
  }
  installStep.value++;
};

const prevStep = () => {
  installStep.value--;
};

const handleInstallSubmit = async () => {
  try {
    loading.value = true;
    
    // 构建安装请求
    const installRequest: SoftwareInstallRequest = {
      servers: selectedRows.value.map(row => row.ip),
      softwareType: installForm.softwareType,
      softwareList: installForm.softwareList.filter(item => item.selected),
      installMethod: installForm.installMethod,
      parallelInstall: installForm.parallelInstall,
      timeout: installForm.timeout,
      retryCount: installForm.retryCount,
      customScript: installForm.customScript,
      packageManager: installForm.packageManager,
      updateSystem: installForm.updateSystem,
      installDependencies: installForm.installDependencies
    };

    // 调用后端API启动软件安装
    const response = await softwareInstallApi.startInstall(installRequest);
    
    message.success(`软件安装任务已启动，任务ID: ${response.task_id}`);
    showInstallModal.value = false;
    
    // 跳转到安装进度页面
    // router.push('/dashboard/install-progress');
    
  } catch (error) {
    message.error('启动软件安装失败');
    console.error('Error starting software install:', error);
  } finally {
    loading.value = false;
  }
};

const renderStatus = (record: any) => {
  const status = statusMap[record.status as keyof typeof statusMap] || { status: 'default' as const, text: record.status };
  return h(Badge, { status: status.status, text: status.text });
};

const renderType = (record: any) => {
  const typeMap = {
    gpu: { color: 'purple', text: 'GPU服务器' },
    cpu: { color: 'blue', text: 'CPU服务器' },
    storage: { color: 'green', text: '存储服务器' }
  };
  const type = typeMap[record.type as keyof typeof typeMap] || { color: 'default', text: record.type };
  return h(Tag, { color: type.color }, () => type.text);
};

onMounted(() => {
  handleRefresh();
  loadSoftwareTemplates();
});
</script>

<template>
  <div class="software-install-page">
    <div class="page-header">
      <h1>软件批量安装</h1>
      <p>选择服务器并批量安装软件包</p>
    </div>

    <!-- 服务器列表 -->
    <Card title="服务器列表" class="server-list-card">
      <template #extra>
        <Space>
          <Button @click="handleRefresh" :loading="loading">刷新</Button>
          <Button 
            type="primary" 
            :disabled="!hasSelectedServers"
            @click="handleSoftwareInstall"
          >
            批量安装软件
          </Button>
        </Space>
      </template>

      <!-- 筛选器 -->
      <div class="filters">
        <Space>
          <Input
            v-model:value="searchText"
            placeholder="搜索服务器名称或IP"
            style="width: 200px"
          />
          <Select
            v-model:value="serverTypeFilter"
            placeholder="服务器类型"
            style="width: 120px"
            @change="handleFilterChange"
          >
            <SelectOption value="all">全部类型</SelectOption>
            <SelectOption value="gpu">GPU服务器</SelectOption>
            <SelectOption value="cpu">CPU服务器</SelectOption>
            <SelectOption value="storage">存储服务器</SelectOption>
          </Select>
          <Select
            v-model:value="statusFilter"
            placeholder="服务器状态"
            style="width: 120px"
            @change="handleFilterChange"
          >
            <SelectOption value="all">全部状态</SelectOption>
            <SelectOption value="online">在线</SelectOption>
            <SelectOption value="offline">离线</SelectOption>
            <SelectOption value="error">错误</SelectOption>
            <SelectOption value="maintenance">维护中</SelectOption>
          </Select>
        </Space>
      </div>

      <!-- 服务器表格 -->
      <Table
        :dataSource="filteredServerList"
        :columns="[
          {
            title: '服务器名称',
            dataIndex: 'name',
            key: 'name',
            width: 200
          },
          {
            title: 'IP地址',
            dataIndex: 'ip',
            key: 'ip',
            width: 150
          },
          {
            title: '类型',
            dataIndex: 'type',
            key: 'type',
            width: 120,
            customRender: ({ record }) => renderType(record)
          },
          {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            customRender: ({ record }) => renderStatus(record)
          },
          {
            title: 'CPU',
            dataIndex: 'cpu',
            key: 'cpu',
            width: 150
          },
          {
            title: '内存',
            dataIndex: 'memory',
            key: 'memory',
            width: 120
          },
          {
            title: 'GPU',
            dataIndex: 'gpu',
            key: 'gpu',
            width: 150
          },
          {
            title: '存储',
            dataIndex: 'storage',
            key: 'storage',
            width: 120
          },
          {
            title: '操作系统',
            dataIndex: 'os',
            key: 'os',
            width: 150
          },
          {
            title: '位置',
            dataIndex: 'location',
            key: 'location',
            width: 120
          }
        ]"
        :rowSelection="{
          selectedRowKeys: selectedRowKeys,
          onChange: handleSelectionChange,
          type: 'checkbox'
        }"
        :pagination="{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
        }"
        :loading="loading"
        rowKey="id"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <strong>{{ record.name }}</strong>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 软件安装模态框 -->
    <Modal
      v-model:open="showInstallModal"
      title="批量安装软件"
      width="800px"
      :footer="null"
      :destroyOnClose="true"
    >
      <Steps :current="installStep" class="install-steps">
        <Step title="选择软件" />
        <Step title="配置参数" />
        <Step title="确认安装" />
      </Steps>

      <div class="install-content">
        <!-- 步骤1: 选择软件 -->
        <div v-if="installStep === 0" class="step-content">
          <h3>选择要安装的软件</h3>
          
          <Tabs v-model:activeKey="installForm.softwareType" @change="handleTemplateChange">
            <TabPane key="system" tab="系统工具">
              <List
                :dataSource="softwareTemplates.system"
                :grid="{ gutter: 16, column: 2 }"
              >
                <template #renderItem="{ item }">
                  <ListItem>
                    <Card size="small" class="software-card">
                      <div class="software-info">
                        <h4>{{ item.name }}</h4>
                        <p>{{ item.description }}</p>
                        <Tag :color="item.category === 'monitoring' ? 'red' : 'blue'">
                          {{ item.category }}
                        </Tag>
                      </div>
                      <Button 
                        type="primary" 
                        size="small"
                        @click="addSoftware(item)"
                      >
                        添加
                      </Button>
                    </Card>
                  </ListItem>
                </template>
              </List>
            </TabPane>
            
            <TabPane key="development" tab="开发工具">
              <List
                :dataSource="softwareTemplates.development"
                :grid="{ gutter: 16, column: 2 }"
              >
                <template #renderItem="{ item }">
                  <ListItem>
                    <Card size="small" class="software-card">
                      <div class="software-info">
                        <h4>{{ item.name }}</h4>
                        <p>{{ item.description }}</p>
                        <Tag :color="item.category === 'compiler' ? 'green' : 'blue'">
                          {{ item.category }}
                        </Tag>
                      </div>
                      <Button 
                        type="primary" 
                        size="small"
                        @click="addSoftware(item)"
                      >
                        添加
                      </Button>
                    </Card>
                  </ListItem>
                </template>
              </List>
            </TabPane>
            
            <TabPane key="ai" tab="AI工具">
              <List
                :dataSource="softwareTemplates.ai"
                :grid="{ gutter: 16, column: 2 }"
              >
                <template #renderItem="{ item }">
                  <ListItem>
                    <Card size="small" class="software-card">
                      <div class="software-info">
                        <h4>{{ item.name }}</h4>
                        <p>{{ item.description }}</p>
                        <Tag :color="item.category === 'gpu' ? 'purple' : 'orange'">
                          {{ item.category }}
                        </Tag>
                      </div>
                      <Button 
                        type="primary" 
                        size="small"
                        @click="addSoftware(item)"
                      >
                        添加
                      </Button>
                    </Card>
                  </ListItem>
                </template>
              </List>
            </TabPane>
            
            <TabPane key="custom" tab="自定义">
              <div class="custom-software">
                <Button type="dashed" @click="addCustomSoftware" style="width: 100%">
                  <PlusOutlined /> 添加自定义软件
                </Button>
              </div>
            </TabPane>
          </Tabs>

          <!-- 已选择的软件列表 -->
          <Divider>已选择的软件</Divider>
          <List
            :dataSource="installForm.softwareList"
            :grid="{ gutter: 16, column: 1 }"
          >
            <template #renderItem="{ item, index }">
              <ListItem>
                <Card size="small">
                  <div class="selected-software">
                    <div class="software-info">
                      <h4>{{ item.name || '自定义软件' }}</h4>
                      <p>{{ item.description || '请输入软件描述' }}</p>
                    </div>
                    <div class="software-actions">
                      <Input 
                        v-if="item.name === ''"
                        v-model:value="item.name"
                        placeholder="软件名称"
                        style="width: 150px; margin-right: 8px"
                      />
                      <Input 
                        v-if="item.name === ''"
                        v-model:value="item.description"
                        placeholder="软件描述"
                        style="width: 200px; margin-right: 8px"
                      />
                      <Button 
                        type="text" 
                        danger
                        @click="removeSoftware(index)"
                      >
                        <DeleteOutlined />
                      </Button>
                    </div>
                  </div>
                </Card>
              </ListItem>
            </template>
          </List>
        </div>

        <!-- 步骤2: 配置参数 -->
        <div v-if="installStep === 1" class="step-content">
          <h3>配置安装参数</h3>
          
          <Form layout="vertical">
            <FormItem label="安装方法">
              <Select v-model:value="installForm.installMethod">
                <SelectOption value="apt">APT (Ubuntu/Debian)</SelectOption>
                <SelectOption value="yum">YUM (CentOS/RHEL)</SelectOption>
                <SelectOption value="pip">PIP (Python)</SelectOption>
                <SelectOption value="conda">Conda</SelectOption>
                <SelectOption value="manual">手动安装</SelectOption>
              </Select>
            </FormItem>
            
            <FormItem label="并行安装">
              <Switch v-model:checked="installForm.parallelInstall" />
              <span style="margin-left: 8px">同时在所有服务器上安装</span>
            </FormItem>
            
            <FormItem label="超时时间 (秒)">
              <InputNumber 
                v-model:value="installForm.timeout"
                :min="300"
                :max="7200"
                style="width: 200px"
              />
            </FormItem>
            
            <FormItem label="重试次数">
              <InputNumber 
                v-model:value="installForm.retryCount"
                :min="0"
                :max="10"
                style="width: 200px"
              />
            </FormItem>
            
            <FormItem label="更新系统">
              <Switch v-model:checked="installForm.updateSystem" />
              <span style="margin-left: 8px">安装前更新系统包</span>
            </FormItem>
            
            <FormItem label="安装依赖">
              <Switch v-model:checked="installForm.installDependencies" />
              <span style="margin-left: 8px">自动安装软件依赖</span>
            </FormItem>
            
            <FormItem label="自定义安装脚本">
              <Input.TextArea 
                v-model:value="installForm.customScript"
                placeholder="可选：自定义安装脚本"
                :rows="4"
              />
            </FormItem>
          </Form>
        </div>

        <!-- 步骤3: 确认安装 -->
        <div v-if="installStep === 2" class="step-content">
          <h3>确认安装信息</h3>
          
          <Alert
            message="安装确认"
            description="请确认以下安装信息，安装过程将不可逆"
            type="warning"
            show-icon
            style="margin-bottom: 16px"
          />
          
          <Descriptions title="安装配置" :column="2">
            <DescriptionsItem label="目标服务器">
              {{ selectedRows.length }} 台服务器
            </DescriptionsItem>
            <DescriptionsItem label="软件数量">
              {{ installForm.softwareList.filter(item => item.selected).length }} 个软件包
            </DescriptionsItem>
            <DescriptionsItem label="安装方法">
              {{ installForm.installMethod }}
            </DescriptionsItem>
            <DescriptionsItem label="并行安装">
              {{ installForm.parallelInstall ? '是' : '否' }}
            </DescriptionsItem>
            <DescriptionsItem label="超时时间">
              {{ installForm.timeout }} 秒
            </DescriptionsItem>
            <DescriptionsItem label="重试次数">
              {{ installForm.retryCount }} 次
            </DescriptionsItem>
          </Descriptions>
          
          <Divider>目标服务器列表</Divider>
          <List
            :dataSource="selectedRows"
            :grid="{ gutter: 16, column: 2 }"
          >
            <template #renderItem="{ item }">
              <ListItem>
                <Card size="small">
                  <div class="server-info">
                    <h4>{{ item.name }}</h4>
                    <p>{{ item.ip }} - {{ item.type }}</p>
                    <Tag :color="statusMap[item.status as keyof typeof statusMap]?.status">
                      {{ statusMap[item.status as keyof typeof statusMap]?.text }}
                    </Tag>
                  </div>
                </Card>
              </ListItem>
            </template>
          </List>
        </div>
      </div>

      <!-- 步骤导航 -->
      <div class="step-actions">
        <Space>
          <Button v-if="installStep > 0" @click="prevStep">上一步</Button>
          <Button v-if="installStep < 2" type="primary" @click="nextStep">下一步</Button>
          <Button 
            v-if="installStep === 2" 
            type="primary" 
            :loading="loading"
            @click="handleInstallSubmit"
          >
            开始安装
          </Button>
          <Button @click="showInstallModal = false">取消</Button>
        </Space>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.software-install-page {
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

.server-list-card {
  margin-bottom: 24px;
}

.filters {
  margin-bottom: 16px;
}

.install-steps {
  margin-bottom: 24px;
}

.step-content {
  min-height: 400px;
}

.software-card {
  height: 100%;
}

.software-info h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.software-info p {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 12px;
}

.selected-software {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.software-actions {
  display: flex;
  align-items: center;
}

.custom-software {
  padding: 24px;
  text-align: center;
}

.server-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
}

.server-info p {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 12px;
}

.step-actions {
  margin-top: 24px;
  text-align: right;
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
}
</style>
