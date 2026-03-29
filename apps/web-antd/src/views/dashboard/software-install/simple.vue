<template>
  <div class="software-install-page">
    <div class="page-header">
      <h1>软件功能模块安装</h1>
      <p>选择服务器并按机器角色安装相应的功能模块</p>
    </div>

    <Card title="服务器列表" class="server-list-card">
      <template #extra>
        <Space>
          <Button @click="handleRefresh" :loading="loading">刷新</Button>
          <Button 
            type="primary" 
            :disabled="!hasSelectedServers"
            @click="handleSoftwareInstall"
          >
            批量安装模块
          </Button>
        </Space>
      </template>

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
      />
    </Card>

    <Modal
      v-model:open="showInstallModal"
      title="批量安装软件功能模块"
      width="1000px"
      :footer="null"
    >
      <div class="install-content">
        <h3>选择机器角色和功能模块</h3>
        <p>已选择 {{ selectedRows.length }} 台服务器</p>
        
        <div class="role-selection">
          <h4>选择机器角色</h4>
          <div class="role-grid">
            <div 
              class="role-card" 
              v-for="role in machineRoles" 
              :key="role.id"
              :class="{ 'selected': selectedRole === role.id }"
              @click="selectRole(role.id)"
            >
              <div class="role-header">
                <h5>{{ role.name }}</h5>
                <Tag :color="role.color">{{ role.category }}</Tag>
              </div>
              <p class="role-description">{{ role.description }}</p>
              <div class="role-modules">
                <h6>部署模块：</h6>
                <div class="module-tags">
                  <Tag v-for="module in role.modules" :key="module" size="small">
                    {{ module }}
                  </Tag>
                </div>
              </div>
              <div class="role-functions">
                <h6>核心功能：</h6>
                <ul>
                  <li v-for="func in role.functions" :key="func">{{ func }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="selectedRole" class="module-selection">
          <h4>选择功能模块</h4>
          <div class="module-grid">
            <div class="module-item" v-for="module in getSelectedRoleModules()" :key="module.name">
              <div class="module-header">
                <Checkbox v-model:checked="module.selected">{{ module.name }}</Checkbox>
                <div class="module-actions">
                  <Button 
                    v-if="getConfigTemplate(module.name)" 
                    size="small" 
                    type="link"
                    @click="downloadConfigTemplate(module.name)"
                  >
                    下载配置模板
                  </Button>
                </div>
              </div>
              <span class="module-desc">{{ module.description }}</span>
              <div class="module-packages">
                <Tag v-for="pkg in module.packages" :key="pkg" size="small" color="blue">
                  {{ pkg }}
                </Tag>
              </div>
            </div>
          </div>
        </div>
        
        <div class="install-actions">
          <Button @click="showInstallModal = false">取消</Button>
          <Button type="primary" @click="startInstall" :loading="loading">
            开始安装
          </Button>
        </div>
      </div>
    </Modal>

    <!-- 子角色选择弹窗 -->
    <Modal
      v-model:open="showSubRoleModal"
      title="选择子角色"
      width="600px"
      :footer="null"
    >
      <div class="sub-role-content">
        <p>请选择具体的子角色类型：</p>
        <div class="sub-role-grid">
          <div 
            class="sub-role-card" 
            v-for="option in subRoleOptions" 
            :key="option.id"
            @click="selectSubRole(option.id)"
          >
            <h5>{{ option.name }}</h5>
            <p>{{ option.description }}</p>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, h } from 'vue';
import { serverListApi, type Server } from '@/api/server-list';
import { softwareInstallApi } from '@/api/software-install';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Input, 
  Select, 
  SelectOption,
  Modal, 
  message,
  Tag,
  Badge,
  Checkbox
} from 'ant-design-vue';

// 响应式数据
const loading = ref(false);
const selectedRowKeys = ref<string[]>([]);
const selectedRows = ref<any[]>([]);
const searchText = ref('');
const serverTypeFilter = ref<string>('all');
const statusFilter = ref<string>('all');
const serverList = ref<any[]>([]);
const showInstallModal = ref(false);
const selectedRole = ref<string>('');
const showSubRoleModal = ref(false);
const subRoleOptions = ref<any[]>([]);
const selectedSubRole = ref<string>('');

// 配置文件模板映射
const configTemplates = ref({
  'Harbor镜像仓库': {
    name: 'harbor.yml',
    content: `# Harbor配置文件模板
hostname: harbor.example.com
http:
  port: 80
harbor_admin_password: Harbor12345
database:
  password: root123
  max_idle_conns: 50
  max_open_conns: 1000
`
  },
  'CEPH集群': {
    name: 'config.json',
    content: `{
  "monitors": ["mon1", "mon2", "mon3"],
  "osdnodes": ["osd1", "osd2", "osd3"],
  "disks": ["/dev/sdb", "/dev/sdc", "/dev/sdd"],
  "cluster_network": "10.0.0.0/24",
  "public_network": "192.168.0.0/24"
}`
  },
  '智算底座Web服务': {
    name: 'core-api.yaml',
    content: `# Web服务配置文件
database:
  host: mysql.example.com
  port: 3306
  username: root
  password: root123
ldap:
  server: ldap.example.com
  port: 389
  base_dn: "dc=example,dc=com"
`
  }
});

// 机器角色数据
const machineRoles = ref([
  {
    id: 'k8s-master',
    name: 'K8s管理节点',
    category: '集群管理',
    color: 'purple',
    description: '管理k8s集群所有资源，接收AI任务请求，统一身份认证',
    modules: ['k8s集群核心组件', 'AI适配器', 'LDAP客户端', 'containerd管理工具', '调度组件'],
    functions: [
      '管理k8s集群所有资源（容器、Pod、服务）',
      '接收AI任务请求，通过AI适配器转发到计算节点',
      '统一身份认证（对接LDAP）',
      '调度GPU/CPU资源，分配任务到k8s计算节点'
    ]
  },
  {
    id: 'k8s-worker',
    name: 'K8s计算节点',
    category: '计算节点',
    color: 'blue',
    description: '运行k8s分配的容器任务，提供GPU/CPU算力，支撑AI任务计算',
    modules: ['LDAP客户端', 'NFS客户端', 'containerd', 'nvidia-device-plugin'],
    functions: [
      '运行k8s分配的容器任务（如AI推理、业务服务）',
      '提供GPU/CPU算力，支撑AI任务计算',
      '挂载共享存储，实现节点间数据共享'
    ]
  },
  {
    id: 'storage',
    name: '存储节点',
    category: '存储服务',
    color: 'green',
    description: '提供多种存储服务，包括NFS、CEPH、OBS等',
    modules: ['NFS服务端', 'CEPH集群', '对象存储服务'],
    functions: [
      '提供共享存储目录（NFS）',
      '提供块存储和文件存储（CEPH）',
      '存储非结构化数据（OBS）'
    ]
  },
  {
    id: 'special',
    name: '专项功能节点',
    category: '网络管理',
    color: 'orange',
    description: '提供网络管理、监控运维等专项功能',
    modules: ['SDN控制器', 'VPP服务', '监控组件'],
    functions: [
      '管理集群网络（SDN）',
      '提供高性能NAT网关（VPP）',
      '采集监控数据（监控）'
    ]
  },
  {
    id: 'harbor',
    name: 'Harbor节点',
    category: '镜像仓库',
    color: 'cyan',
    description: '存储本地Docker镜像，避免依赖外网拉取',
    modules: ['Harbor镜像仓库'],
    functions: [
      '存储本地Docker镜像（如AI推理镜像、Web服务镜像）',
      '避免依赖外网拉取'
    ]
  },
  {
    id: 'database',
    name: '数据库节点',
    category: '数据存储',
    color: 'magenta',
    description: '存储平台配置、用户数据、任务记录，提供缓存和文件存储',
    modules: ['MySQL', 'Redis', 'MinIO'],
    functions: [
      'MySQL：存储平台配置、用户数据、任务记录',
      'Redis：缓存高频访问数据（如会话、配置）',
      'MinIO：存储平台上传的文件（如日志、备份）'
    ]
  },
  {
    id: 'web',
    name: 'Web服务节点',
    category: 'Web服务',
    color: 'gold',
    description: '提供Web界面，供用户操作集群，接收用户请求，转发到后端API服务',
    modules: ['智算底座Web服务', 'Web前端', 'Nginx', 'LDAP客户端'],
    functions: [
      '提供Web界面，供用户操作集群（如提交任务、查看资源）',
      '接收用户请求，转发到后端API服务',
      '对接LDAP做用户登录认证'
    ]
  }
]);

// 角色对应的部署模块
const roleModules = ref({
  'k8s-master': [
    { name: 'k8s集群核心组件', description: 'sealos + k8s镜像 + helm', selected: false, packages: ['sealos:v5.0.1', 'kubernetes:v1.28.5', 'helm:v3.8.2'] },
    { name: 'AI适配器', description: 'unicom-ai-adapter', selected: false, packages: ['unicom-ai-adapter'] },
    { name: 'LDAP客户端', description: '对接LDAP服务端做身份认证', selected: false, packages: ['libnss-ldap', 'libpam-ldap'] },
    { name: 'containerd管理工具', description: 'nerdctl', selected: false, packages: ['nerdctl'] },
    { name: '调度组件', description: 'Volcano、training-operator', selected: false, packages: ['volcano-development.yaml', 'training-operator.tar'] }
  ],
  'k8s-worker': [
    { name: 'LDAP客户端', description: '对接LDAP服务端做身份认证', selected: false, packages: ['libnss-ldap', 'libpam-ldap'] },
    { name: 'NFS客户端', description: '挂载共享存储', selected: false, packages: ['nfs-common'] },
    { name: 'containerd', description: '容器运行时', selected: false, packages: ['containerd'] },
    { name: 'nvidia-device-plugin', description: 'GPU资源调度插件', selected: false, packages: ['nvidia-device-plugin'] }
  ],
  'storage-nfs': [
    { name: 'NFS服务端', description: 'nfs-kernel-server', selected: false, packages: ['nfs-kernel-server', 'nfs-common'] }
  ],
  'storage-ceph': [
    { name: 'CEPH集群', description: 'mon、mgr、osd组件', selected: false, packages: ['storagedeploy_cuceph', 'fabric', 'python2-cryptography'] },
    { name: 'cephfs', description: '文件存储', selected: false, packages: ['ceph-fuse'] }
  ],
  'storage-obs': [
    { name: '对象存储服务', description: 'YIG、TiDB', selected: false, packages: ['yig', 'tidb'] }
  ],
  'sdn': [
    { name: 'SDN控制器', description: 'MSDC系统', selected: false, packages: ['sdn_deploy:v4.1.0.19', 'grpc_health_probe'] },
    { name: 'OpenFlow协议组件', description: '网络协议组件', selected: false, packages: ['openflow'] }
  ],
  'vpp': [
    { name: 'VPP服务', description: '高性能网络服务', selected: false, packages: ['vpp_cluster_20241224.tar.gz', 'vpp_deps'] },
    { name: 'VPP监控组件', description: 'VPP监控工具', selected: false, packages: ['vpp-monitor'] }
  ],
  'monitor': [
    { name: 'Prometheus', description: '监控数据收集', selected: false, packages: ['prometheus'] },
    { name: 'Grafana', description: '监控面板', selected: false, packages: ['grafana'] },
    { name: 'Kafka', description: '消息队列', selected: false, packages: ['kafka'] },
    { name: 'Telegraf', description: '数据采集', selected: false, packages: ['telegraf'] }
  ],
  'harbor': [
    { name: 'Harbor镜像仓库', description: 'Docker镜像仓库', selected: false, packages: ['harbor:v2.7.4', 'harbor-agent:1.0'] }
  ],
  'database': [
    { name: 'MySQL', description: '关系型数据库', selected: false, packages: ['mysql-server'] },
    { name: 'Redis', description: '缓存数据库', selected: false, packages: ['redis-server'] },
    { name: 'MinIO', description: '对象存储', selected: false, packages: ['minio'] }
  ],
  'web': [
    { name: '智算底座Web服务', description: '后端API服务', selected: false, packages: ['web-backend'] },
    { name: 'Web前端', description: 'Vue前端页面', selected: false, packages: ['nginx', 'vue-frontend'] },
    { name: 'Nginx', description: '反向代理', selected: false, packages: ['nginx'] },
    { name: 'LDAP客户端', description: '身份认证', selected: false, packages: ['libnss-ldap', 'libpam-ldap'] }
  ]
});

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
    message.warning('请先选择要安装功能模块的服务器');
    return;
  }
  showInstallModal.value = true;
};

const selectRole = (roleId: string) => {
  // 检查是否需要子角色选择
  if (roleId === 'storage' || roleId === 'special') {
    showSubRoleModal.value = true;
    if (roleId === 'storage') {
      subRoleOptions.value = [
        { id: 'storage-nfs', name: 'NFS服务端', description: '提供共享存储目录' },
        { id: 'storage-ceph', name: 'CEPH节点', description: '提供块存储和文件存储' },
        { id: 'storage-obs', name: 'OBS节点', description: '存储非结构化数据' }
      ];
    } else if (roleId === 'special') {
      subRoleOptions.value = [
        { id: 'sdn', name: 'SDN节点', description: '管理集群网络' },
        { id: 'vpp', name: 'VPP节点', description: '提供高性能NAT网关' },
        { id: 'monitor', name: '监控节点', description: '采集监控数据' }
      ];
    }
    return;
  }
  
  selectedRole.value = roleId;
  // 重置所有模块的选择状态
  if (roleModules.value[roleId as keyof typeof roleModules.value]) {
    roleModules.value[roleId as keyof typeof roleModules.value].forEach(module => {
      module.selected = false;
    });
  }
};

const selectSubRole = (subRoleId: string) => {
  selectedRole.value = subRoleId;
  selectedSubRole.value = subRoleId;
  showSubRoleModal.value = false;
  
  // 重置所有模块的选择状态
  if (roleModules.value[subRoleId as keyof typeof roleModules.value]) {
    roleModules.value[subRoleId as keyof typeof roleModules.value].forEach(module => {
      module.selected = false;
    });
  }
};

const getSelectedRoleModules = () => {
  if (!selectedRole.value) return [];
  return roleModules.value[selectedRole.value as keyof typeof roleModules.value] || [];
};

const getConfigTemplate = (moduleName: string) => {
  return configTemplates.value[moduleName as keyof typeof configTemplates.value];
};

const downloadConfigTemplate = (moduleName: string) => {
  const template = getConfigTemplate(moduleName);
  if (!template) return;
  
  // 创建下载链接
  const blob = new Blob([template.content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = template.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  message.success(`配置文件模板 ${template.name} 已下载`);
};

const startInstall = async () => {
  if (!selectedRole.value) {
    message.warning('请选择机器角色');
    return;
  }
  
  const selectedModules = getSelectedRoleModules().filter(module => module.selected);
  
  if (selectedModules.length === 0) {
    message.warning('请选择要安装的功能模块');
    return;
  }
  
  try {
    loading.value = true;
    
    // 构建安装请求
    const installRequest = {
      servers: selectedRows.value.map(row => row.ip),
      softwareType: 'role-based',
      roleId: selectedRole.value,
      roleName: machineRoles.value.find(r => r.id === selectedRole.value)?.name || '',
      softwareList: selectedModules.map(module => ({
        name: module.name,
        description: module.description,
        selected: true,
        packages: module.packages
      })),
      installMethod: 'apt',
      parallelInstall: true,
      timeout: 1800,
      retryCount: 3,
      packageManager: 'apt',
      updateSystem: true,
      installDependencies: true
    };

    // 调用后端API启动软件安装
    const response = await softwareInstallApi.startInstall(installRequest);
    
    message.success(`软件功能模块安装任务已启动，任务ID: ${response.task_id}`);
    showInstallModal.value = false;
    
  } catch (error) {
    message.error('启动软件功能模块安装失败');
    console.error('Error starting module installation:', error);
  } finally {
    loading.value = false;
  }
};

const statusMap = {
  online: { status: 'success' as const, text: '在线' },
  offline: { status: 'default' as const, text: '离线' },
  error: { status: 'error' as const, text: '错误' },
  unknown: { status: 'default' as const, text: '未知' },
  maintenance: { status: 'warning' as const, text: '维护中' }
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
});
</script>

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

.install-content {
  padding: 20px;
}

.role-selection {
  margin: 20px 0;
}

.role-selection h4 {
  margin: 16px 0 8px 0;
  color: #1890ff;
  font-size: 16px;
}

.role-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.role-card {
  padding: 16px;
  border: 2px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.3s ease;
}

.role-card:hover {
  background: #f5f5f5;
  border-color: #d9d9d9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.role-card.selected {
  border-color: #1890ff;
  background: #e6f7ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
}

.role-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.role-header h5 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.role-description {
  margin: 8px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.role-modules, .role-functions {
  margin: 12px 0;
}

.role-modules h6, .role-functions h6 {
  margin: 0 0 6px 0;
  font-size: 13px;
  color: #8c8c8c;
  font-weight: 600;
}

.module-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.role-functions ul {
  margin: 0;
  padding-left: 16px;
}

.role-functions li {
  margin: 4px 0;
  font-size: 12px;
  color: #595959;
  line-height: 1.3;
}

.module-selection {
  margin: 20px 0;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.module-selection h4 {
  margin: 0 0 16px 0;
  color: #1890ff;
  font-size: 16px;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.module-item {
  padding: 12px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  background: white;
}

.module-item:hover {
  border-color: #d9d9d9;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.module-desc {
  display: block;
  margin: 6px 0;
  color: #666;
  font-size: 12px;
}

.module-packages {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.install-actions {
  text-align: right;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.install-actions .ant-btn {
  margin-left: 8px;
}

.sub-role-content {
  padding: 20px;
}

.sub-role-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.sub-role-card {
  padding: 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sub-role-card:hover {
  border-color: #1890ff;
  background: #f0f8ff;
}

.sub-role-card h5 {
  margin: 0 0 8px 0;
  color: #262626;
}

.sub-role-card p {
  margin: 0;
  color: #666;
  font-size: 12px;
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.module-actions {
  display: flex;
  gap: 8px;
}

</style>
