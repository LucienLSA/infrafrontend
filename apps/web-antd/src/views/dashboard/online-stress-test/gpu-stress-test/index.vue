<script lang="ts" setup>
import { ref, reactive, onMounted, computed, h } from 'vue';
import { 
  Card, 
  Tabs, 
  TabPane, 
  Table, 
  Button, 
  Space, 
  Input, 
  Select, 
  SelectOption,
  Tag,
  message,
  Checkbox,
  Dropdown,
  Menu,
  MenuItem,
  Modal,
  Progress
} from 'ant-design-vue';
import { gpuStressApi, type GpuServer } from '@/api/gpu-stress';

defineOptions({ name: 'GpuStressTest' });

// 测试结果状态
type TestStatus = '未执行' | '通过' | '失败';

// 测试配置接口
interface TestConfig {
  duration: number;
  intensity?: number;
  testType?: string;
  bandwidthTest?: boolean;
}

// 响应式数据
const loading = ref(false);
const activeTab = ref('gpu-burn');
const searchText = ref('');
const statusFilter = ref<string>('all');
const selectedRowKeys = ref<string[]>([]);
const selectedRows = ref<GpuServer[]>([]);
const selectAll = ref(false);
const indeterminate = ref(false);

// GPU服务器数据
const gpuServers = ref<GpuServer[]>([]);

// 测试配置
const testConfig = ref<TestConfig>({
  duration: 300, // 5分钟
  intensity: 100,
  testType: 'comprehensive',
  bandwidthTest: true
});

// 测试状态
const testModalVisible = ref(false);
const currentTest = ref<any>(null);
const testProgress = ref(0);

// 表格列配置
const getColumns = (testType: string) => [
  {
    title: '选择',
    key: 'selection',
    width: 60,
    customRender: ({ record }: { record: GpuServer }) => {
      return h(Checkbox, {
        checked: selectedRowKeys.value.includes(record.id),
        onChange: (e: any) => handleSelectChange(record, e.target.checked)
      });
    }
  },
  {
    title: '服务器名称',
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
    title: 'GPU型号',
    dataIndex: 'gpuModel',
    key: 'gpuModel',
    width: 120,
  },
  {
    title: 'GPU数量',
    dataIndex: 'gpuCount',
    key: 'gpuCount',
    width: 80,
  },
  {
    title: '服务器状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    customRender: ({ text }: { text: string }) => {
      const color = text === '在线' ? 'green' : 'red';
      return h(Tag, { color }, () => text);
    }
  },
  {
    title: '测试结果',
    dataIndex: `${testType}Status`,
    key: 'testResult',
    width: 100,
    customRender: ({ text }: { text: TestStatus }) => {
      const colorMap = {
        '未执行': 'default',
        '通过': 'green',
        '失败': 'red'
      };
      return h(Tag, { color: colorMap[text] }, () => text);
    }
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    customRender: ({ record }: { record: GpuServer }) => {
      return h(Space, [
        h(Button, { 
          type: 'primary', 
          size: 'small',
          onClick: () => startTest(record, testType)
        }, '开始测试'),
        h(Button, { 
          size: 'small',
          onClick: () => viewDetails(record, testType)
        }, '查看详情')
      ]);
    }
  }
];

// 开始测试
const startTest = async (server: GpuServer, testType: string) => {
  try {
    loading.value = true;
    
    // 首先部署压测工具到目标服务器
    message.info(`正在部署压测工具到 ${server.name}...`);
    await deployTestTools(server.ip);
    
    const testRequest = {
      test_type: testType.toUpperCase() as any,
      servers: [server.ip],
      parallel_tests: false,
      ...getTestConfig(testType)
    };
    
    const response = await gpuStressApi.startGpuStressTest(testRequest);
    currentTest.value = response;
    testModalVisible.value = true;
    
    message.success(`已开始对 ${server.name} 执行 ${testType} 测试`);
    
    // 开始轮询测试状态
    pollTestStatus(response.job_id);
    
  } catch (error) {
    console.error('启动测试失败:', error);
    message.error(`启动测试失败: ${error.message || '未知错误'}`);
  } finally {
    loading.value = false;
  }
};

// 部署压测工具到目标服务器
const deployTestTools = async (serverIp: string) => {
  try {
    const response = await fetch('/api/v1/gpu-stress/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        server_ip: serverIp,
        tools: ['gpu_burn', 'fld', 'p2p']
      })
    });
    
    if (!response.ok) {
      throw new Error('部署工具失败');
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || '部署工具失败');
    }
    
    message.success(`压测工具已部署到 ${serverIp}`);
  } catch (error) {
    console.error('部署工具失败:', error);
    message.warning(`部署工具失败: ${error.message}，将尝试直接测试`);
  }
};

// 获取测试配置
const getTestConfig = (testType: string) => {
  const config = testConfig.value;
  
  switch (testType) {
    case 'gpu-burn':
      return {
        gpu_burn_config: {
          duration: config.duration,
          intensity: config.intensity || 100
        }
      };
    case 'dcgm':
      return {
        dcgm_config: {
          duration: config.duration,
          test_type: config.testType || 'comprehensive'
        }
      };
    case 'fld':
      return {
        fld_config: {
          duration: config.duration,
          test_type: config.testType || 'comprehensive'
        }
      };
    case 'p2p-bandwidth':
      return {
        p2p_config: {
          duration: config.duration,
          bandwidth_test: config.bandwidthTest || true
        }
      };
    default:
      return {};
  }
};

// 轮询测试状态
const pollTestStatus = async (jobId: string) => {
  try {
    const status = await gpuStressApi.getTestStatus(jobId);
    testProgress.value = status.progress;
    
    if (status.status === 'running') {
      // 继续轮询
      setTimeout(() => pollTestStatus(jobId), 2000);
    } else if (status.status === 'completed') {
      message.success('测试完成');
      testModalVisible.value = false;
      // 刷新服务器列表
      await loadGpuServers();
    } else if (status.status === 'failed') {
      message.error('测试失败');
      testModalVisible.value = false;
    }
  } catch (error) {
    console.error('获取测试状态失败:', error);
  }
};

// 查看详情
const viewDetails = (server: GpuServer, testType: string) => {
  message.info(`查看 ${server.name} 的 ${testType} 测试详情`);
  // 这里可以添加查看详情的逻辑
};

// 筛选数据
const filteredServers = computed(() => {
  let filtered = gpuServers.value;
  
  // 按搜索文本筛选
  if (searchText.value) {
    filtered = filtered.filter(server => 
      server.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
      server.ip.includes(searchText.value) ||
      server.gpuModel.toLowerCase().includes(searchText.value.toLowerCase())
    );
  }
  
  // 按状态筛选
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(server => server.status === statusFilter.value);
  }
  
  return filtered;
});

// 页签切换
const handleTabChange = (key: string) => {
  activeTab.value = key;
  // 切换页签时清空选择
  clearSelection();
};

// 选择处理
const handleSelectChange = (record: GpuServer, checked: boolean) => {
  if (checked) {
    selectedRowKeys.value.push(record.id);
    selectedRows.value.push(record);
  } else {
    const index = selectedRowKeys.value.indexOf(record.id);
    if (index > -1) {
      selectedRowKeys.value.splice(index, 1);
      selectedRows.value.splice(index, 1);
    }
  }
  updateSelectAllStatus();
};

// 全选处理
const handleSelectAll = (checked: boolean) => {
  if (checked) {
    selectedRowKeys.value = filteredServers.value.map(server => server.id);
    selectedRows.value = [...filteredServers.value];
  } else {
    selectedRowKeys.value = [];
    selectedRows.value = [];
  }
  selectAll.value = checked;
  indeterminate.value = false;
};

// 更新全选状态
const updateSelectAllStatus = () => {
  const total = filteredServers.value.length;
  const selected = selectedRowKeys.value.length;
  
  if (selected === 0) {
    selectAll.value = false;
    indeterminate.value = false;
  } else if (selected === total) {
    selectAll.value = true;
    indeterminate.value = false;
  } else {
    selectAll.value = false;
    indeterminate.value = true;
  }
};

// 清空选择
const clearSelection = () => {
  selectedRowKeys.value = [];
  selectedRows.value = [];
  selectAll.value = false;
  indeterminate.value = false;
};

// 批量开始测试
const batchStartTest = async (testType: string) => {
  if (selectedRows.value.length === 0) {
    message.warning('请先选择要测试的服务器');
    return;
  }
  
  try {
    loading.value = true;
    
    const testRequest = {
      test_type: testType.toUpperCase() as any,
      servers: selectedRows.value.map(server => server.ip),
      parallel_tests: true,
      ...getTestConfig(testType)
    };
    
    const response = await gpuStressApi.startGpuStressTest(testRequest);
    currentTest.value = response;
    testModalVisible.value = true;
    
    const serverNames = selectedRows.value.map(server => server.name).join('、');
    message.success(`已开始对 ${selectedRows.value.length} 台服务器执行批量 ${testType} 测试：${serverNames}`);
    
    // 开始轮询测试状态
    pollTestStatus(response.job_id);
    
  } catch (error) {
    console.error('批量启动测试失败:', error);
    message.error(`批量启动测试失败: ${error.message || '未知错误'}`);
  } finally {
    loading.value = false;
  }
};

// 批量查看详情
const batchViewDetails = (testType: string) => {
  if (selectedRows.value.length === 0) {
    message.warning('请先选择要查看的服务器');
    return;
  }
  
  const serverNames = selectedRows.value.map(server => server.name).join('、');
  message.info(`查看 ${selectedRows.value.length} 台服务器的 ${testType} 测试详情：${serverNames}`);
  // 这里可以添加实际的批量查看逻辑
};

// 按条件筛选选择
const selectByCondition = (condition: string) => {
  let serversToSelect: GpuServer[] = [];
  
  switch (condition) {
    case 'online':
      serversToSelect = filteredServers.value.filter(server => server.status === '在线');
      break;
    case 'offline':
      serversToSelect = filteredServers.value.filter(server => server.status === '离线');
      break;
    case 'not-tested':
      serversToSelect = filteredServers.value.filter(server => {
        const statusKey = `${activeTab.value}Status` as keyof GpuServer;
        return server[statusKey] === '未执行';
      });
      break;
    case 'failed':
      serversToSelect = filteredServers.value.filter(server => {
        const statusKey = `${activeTab.value}Status` as keyof GpuServer;
        return server[statusKey] === '失败';
      });
      break;
    case 'passed':
      serversToSelect = filteredServers.value.filter(server => {
        const statusKey = `${activeTab.value}Status` as keyof GpuServer;
        return server[statusKey] === '通过';
      });
      break;
  }
  
  // 添加新选择的服务器（避免重复）
  serversToSelect.forEach(server => {
    if (!selectedRowKeys.value.includes(server.id)) {
      selectedRowKeys.value.push(server.id);
      selectedRows.value.push(server);
    }
  });
  
  updateSelectAllStatus();
  message.success(`已选择 ${serversToSelect.length} 台符合条件的服务器`);
};

// 加载GPU服务器数据
const loadGpuServers = async () => {
  try {
    loading.value = true;
    const servers = await gpuStressApi.getGpuServers();
    gpuServers.value = servers;
  } catch (error) {
    console.error('加载GPU服务器数据失败:', error);
    message.error('加载GPU服务器数据失败');
  } finally {
    loading.value = false;
  }
};


onMounted(() => {
  // 初始化数据
  loadGpuServers();
});
</script>

<template>
  <div style="padding: 24px;">
    <!-- 页面标题 -->
    <div style="margin-bottom: 24px;">
      <h1 style="font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">GPU在线压测</h1>
      <p style="color: #666; margin: 0;">对GPU服务器进行各种在线压力测试，验证硬件性能和稳定性。</p>
    </div>

    <!-- 筛选区域 -->
    <Card style="margin-bottom: 24px;">
      <Space size="large" wrap>
        <Input
          v-model:value="searchText"
          placeholder="搜索服务器名称、IP或GPU型号"
          style="width: 300px;"
          allow-clear
        />
        <Select
          v-model:value="statusFilter"
          placeholder="筛选服务器状态"
          style="width: 150px;"
        >
          <SelectOption value="all">全部状态</SelectOption>
          <SelectOption value="在线">在线</SelectOption>
          <SelectOption value="离线">离线</SelectOption>
        </Select>
        <Button type="primary" @click="() => { searchText = ''; statusFilter = 'all'; }">
          重置筛选
        </Button>
      </Space>
    </Card>

    <!-- 批量操作区域 -->
    <Card style="margin-bottom: 24px;" v-if="selectedRows.length > 0">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <span style="color: #1890ff; font-weight: 500;">
            已选择 {{ selectedRows.length }} 台服务器
          </span>
          <Button size="small" @click="clearSelection">清空选择</Button>
        </div>
        <Space>
          <Button 
            type="primary" 
            @click="batchStartTest(activeTab)"
            :disabled="selectedRows.length === 0"
          >
            批量开始测试
          </Button>
          <Button 
            @click="batchViewDetails(activeTab)"
            :disabled="selectedRows.length === 0"
          >
            批量查看详情
          </Button>
        </Space>
      </div>
    </Card>

    <!-- 测试页签 -->
    <Card>
      <Tabs 
        v-model:activeKey="activeTab" 
        @change="handleTabChange"
        type="card"
        size="large"
      >
        <TabPane key="gpu-burn" tab="GPU Burn测试">
          <template #tab>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #ff6b6b;"></div>
              <span>GPU Burn测试</span>
            </div>
          </template>
          
          <!-- 表格操作栏 -->
          <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <Checkbox
                :checked="selectAll"
                :indeterminate="indeterminate"
                @change="handleSelectAll"
              >
                全选
              </Checkbox>
              <Dropdown>
                <template #overlay>
                  <Menu @click="({ key }) => selectByCondition(key)">
                    <MenuItem key="online">选择在线服务器</MenuItem>
                    <MenuItem key="offline">选择离线服务器</MenuItem>
                    <MenuItem key="not-tested">选择未测试服务器</MenuItem>
                    <MenuItem key="failed">选择测试失败服务器</MenuItem>
                    <MenuItem key="passed">选择测试通过服务器</MenuItem>
                  </Menu>
                </template>
                <Button>按条件选择</Button>
              </Dropdown>
            </div>
            <div style="color: #666; font-size: 14px;">
              共 {{ filteredServers.length }} 台服务器
            </div>
          </div>
          
          <Table
            :columns="getColumns('gpu-burn')"
            :data-source="filteredServers"
            :loading="loading"
            :pagination="{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }"
            row-key="id"
            size="middle"
          />
        </TabPane>

        <TabPane key="dcgm" tab="DCGM测试">
          <template #tab>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #4facfe;"></div>
              <span>DCGM测试</span>
            </div>
          </template>
          
          <!-- 表格操作栏 -->
          <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <Checkbox
                :checked="selectAll"
                :indeterminate="indeterminate"
                @change="handleSelectAll"
              >
                全选
              </Checkbox>
              <Dropdown>
                <template #overlay>
                  <Menu @click="({ key }) => selectByCondition(key)">
                    <MenuItem key="online">选择在线服务器</MenuItem>
                    <MenuItem key="offline">选择离线服务器</MenuItem>
                    <MenuItem key="not-tested">选择未测试服务器</MenuItem>
                    <MenuItem key="failed">选择测试失败服务器</MenuItem>
                    <MenuItem key="passed">选择测试通过服务器</MenuItem>
                  </Menu>
                </template>
                <Button>按条件选择</Button>
              </Dropdown>
            </div>
            <div style="color: #666; font-size: 14px;">
              共 {{ filteredServers.length }} 台服务器
            </div>
          </div>
          
          <Table
            :columns="getColumns('dcgm')"
            :data-source="filteredServers"
            :loading="loading"
            :pagination="{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }"
            row-key="id"
            size="middle"
          />
        </TabPane>

        <TabPane key="fld" tab="FLD测试">
          <template #tab>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #43e97b;"></div>
              <span>FLD测试</span>
            </div>
          </template>
          
          <!-- 表格操作栏 -->
          <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <Checkbox
                :checked="selectAll"
                :indeterminate="indeterminate"
                @change="handleSelectAll"
              >
                全选
              </Checkbox>
              <Dropdown>
                <template #overlay>
                  <Menu @click="({ key }) => selectByCondition(key)">
                    <MenuItem key="online">选择在线服务器</MenuItem>
                    <MenuItem key="offline">选择离线服务器</MenuItem>
                    <MenuItem key="not-tested">选择未测试服务器</MenuItem>
                    <MenuItem key="failed">选择测试失败服务器</MenuItem>
                    <MenuItem key="passed">选择测试通过服务器</MenuItem>
                  </Menu>
                </template>
                <Button>按条件选择</Button>
              </Dropdown>
            </div>
            <div style="color: #666; font-size: 14px;">
              共 {{ filteredServers.length }} 台服务器
            </div>
          </div>
          
          <Table
            :columns="getColumns('fld')"
            :data-source="filteredServers"
            :loading="loading"
            :pagination="{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }"
            row-key="id"
            size="middle"
          />
        </TabPane>

        <TabPane key="p2p-bandwidth" tab="P2P带宽测试">
          <template #tab>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #fa709a;"></div>
              <span>P2P带宽测试</span>
            </div>
          </template>
          
          <!-- 表格操作栏 -->
          <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <Checkbox
                :checked="selectAll"
                :indeterminate="indeterminate"
                @change="handleSelectAll"
              >
                全选
              </Checkbox>
              <Dropdown>
                <template #overlay>
                  <Menu @click="({ key }) => selectByCondition(key)">
                    <MenuItem key="online">选择在线服务器</MenuItem>
                    <MenuItem key="offline">选择离线服务器</MenuItem>
                    <MenuItem key="not-tested">选择未测试服务器</MenuItem>
                    <MenuItem key="failed">选择测试失败服务器</MenuItem>
                    <MenuItem key="passed">选择测试通过服务器</MenuItem>
                  </Menu>
                </template>
                <Button>按条件选择</Button>
              </Dropdown>
            </div>
            <div style="color: #666; font-size: 14px;">
              共 {{ filteredServers.length }} 台服务器
            </div>
          </div>
          
          <Table
            :columns="getColumns('p2p-bandwidth')"
            :data-source="filteredServers"
            :loading="loading"
            :pagination="{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }"
            row-key="id"
            size="middle"
          />
        </TabPane>
      </Tabs>
    </Card>

    <!-- 测试进度模态框 -->
    <Modal
      v-model:open="testModalVisible"
      title="测试进度"
      :footer="null"
      :closable="false"
      width="600px"
    >
      <div v-if="currentTest" style="text-align: center;">
        <div style="margin-bottom: 20px;">
          <h3>正在执行 {{ currentTest.test_type }} 测试</h3>
          <p>测试服务器: {{ currentTest.servers.join(', ') }}</p>
        </div>
        
        <Progress 
          :percent="testProgress" 
          :status="testProgress === 100 ? 'success' : 'active'"
          style="margin-bottom: 20px;"
        />
        
        <div style="color: #666; font-size: 14px;">
          {{ testProgress === 100 ? '测试完成' : '测试进行中...' }}
        </div>
      </div>
    </Modal>
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
  padding: 2px 8px;
}
</style>
