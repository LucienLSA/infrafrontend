<template>
  <div class="p-5">
    <div>
      <div class="mb-4">
        <h1 class="text-2xl font-bold">批量装机</h1>
        <p class="text-gray-600">基于PXE网络启动的批量装机系统</p>
      </div>
      <div class="space-y-6">
        <!-- 服务状态检查 -->
        <Card title="PXE服务状态" class="mb-4">
          <div class="flex items-center justify-between mb-4">
            <span>检查PXE相关服务运行状态</span>
            <Button @click="checkServices" :loading="servicesLoading">
              <Icon icon="ant-design:reload-outlined" />
              刷新状态
            </Button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div v-for="(service, name) in servicesStatus" :key="name" class="text-center">
              <div class="text-lg font-semibold">{{ getServiceName(name) }}</div>
              <div class="flex items-center justify-center mt-2">
                <Badge 
                  :status="service.status === 'active' ? 'success' : 'error'" 
                  :text="service.status === 'active' ? '运行中' : '未运行'"
                />
              </div>
              <div class="text-sm text-gray-500 mt-1">
                自启动: {{ service.enabled ? '已启用' : '未启用' }}
              </div>
            </div>
          </div>
          <div class="mt-4">
            <Button 
              type="primary" 
              @click="startServices" 
              :loading="startingServices"
              :disabled="allServicesRunning"
            >
              启动所有服务
            </Button>
          </div>
        </Card>

        <!-- 步骤导航 -->
        <Steps :current="currentStep" class="mb-6">
          <Step title="选择目标" description="选择要安装的服务器" />
          <Step title="配置参数" description="配置安装参数" />
          <Step title="开始安装" description="执行批量安装" />
          <Step title="监控进度" description="查看安装进度" />
        </Steps>

        <!-- 步骤1: 选择目标服务器 -->
        <Card v-if="currentStep === 0" title="选择目标服务器">
          <div class="space-y-4">
            <!-- 服务器选择方式 -->
            <div class="mb-4">
              <RadioGroup v-model:value="serverSelectionMode" @change="onSelectionModeChange">
                <Radio value="manual">手动输入IP地址</Radio>
                <Radio value="fromList">从服务器列表选择</Radio>
              </RadioGroup>
            </div>

            <!-- 手动输入模式 -->
            <div v-if="serverSelectionMode === 'manual'" class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-2">目标IP地址 (每行一个)</label>
                <Textarea
                  v-model:value="targetIPs"
                  placeholder="请输入目标服务器的IP地址，每行一个&#10;例如：&#10;192.168.1.100&#10;192.168.1.101&#10;192.168.1.102"
                  :rows="6"
                  class="w-full"
                />
              </div>
            </div>

            <!-- 从服务器列表选择模式 -->
            <div v-if="serverSelectionMode === 'fromList'" class="space-y-4">
              <div class="flex justify-between items-center mb-4">
                <span class="text-sm text-gray-600">从现有服务器列表中选择要安装的服务器</span>
                <Button @click="loadServerList" :loading="loadingServers">
                  <Icon icon="ant-design:reload-outlined" />
                  刷新服务器列表
                </Button>
              </div>
              
              <div class="border rounded-lg p-4 max-h-96 overflow-y-auto">
                <div v-if="loadingServers" class="text-center py-8">
                  <Spin size="large" />
                </div>
                <div v-else-if="serverList.length === 0" class="text-center py-8 text-gray-500">
                  暂无服务器数据
                </div>
                <div v-else class="space-y-2">
                  <div 
                    v-for="server in serverList" 
                    :key="server.id"
                    class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div class="flex items-center space-x-3">
                      <Checkbox 
                        :checked="selectedServers.includes(server.id)"
                        @change="(e) => toggleServerSelection(server.id, e.target.checked)"
                      />
                      <div>
                        <div class="font-medium">{{ server.name }}</div>
                        <div class="text-sm text-gray-500">{{ server.ip }} | {{ server.type }} | {{ server.status }}</div>
                      </div>
                    </div>
                    <Badge 
                      :status="server.status === 'online' ? 'success' : 'error'" 
                      :text="server.status === 'online' ? '在线' : '离线'"
                    />
                  </div>
                </div>
              </div>
              
              <div class="flex justify-between items-center">
                <div class="text-sm text-gray-500">
                  已选择 {{ selectedServers.length }} 台服务器
                </div>
                <div class="space-x-2">
                  <Button size="small" @click="selectAllServers">全选</Button>
                  <Button size="small" @click="clearServerSelection">清空</Button>
                </div>
              </div>
            </div>

            <div class="flex justify-between">
              <div class="text-sm text-gray-500">
                {{ serverSelectionMode === 'manual' ? 
                  `已输入 ${targetIPs.split('\n').filter(ip => ip.trim()).length} 个IP地址` : 
                  `已选择 ${selectedServers.length} 台服务器` 
                }}
              </div>
              <Button type="primary" @click="nextStep" :disabled="!canProceedToNextStep">
                下一步
              </Button>
            </div>
          </div>
        </Card>

        <!-- 步骤2: 配置安装参数 -->
        <Card v-if="currentStep === 1" title="配置安装参数">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- 基本配置 -->
            <div class="space-y-4">
              <h3 class="text-lg font-semibold">基本配置</h3>
              
              <div>
                <label class="block text-sm font-medium mb-2">主机名前缀</label>
                <Input v-model:value="installConfig.hostname" placeholder="host" />
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-2">用户名</label>
                <Input v-model:value="installConfig.username" placeholder="user" />
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-2">密码</label>
                <InputPassword v-model:value="installConfig.password" placeholder="请输入密码" />
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-2">网络接口</label>
                <Select v-model:value="installConfig.network_interface" class="w-full">
                  <SelectOption value="ens33">ens33</SelectOption>
                  <SelectOption value="eth0">eth0</SelectOption>
                  <SelectOption value="enp0s3">enp0s3</SelectOption>
                </Select>
              </div>
            </div>

            <!-- 高级配置 -->
            <div class="space-y-4">
              <h3 class="text-lg font-semibold">高级配置</h3>
              
              <div>
                <label class="block text-sm font-medium mb-2">启动模式</label>
                <RadioGroup v-model:value="installConfig.boot_mode">
                  <Radio value="uefi">UEFI</Radio>
                  <Radio value="legacy">Legacy BIOS</Radio>
                </RadioGroup>
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-2">磁盘路径</label>
                <Select v-model:value="installConfig.disk_path" class="w-full">
                  <SelectOption value="/dev/sda">/dev/sda</SelectOption>
                  <SelectOption value="/dev/nvme0n1">/dev/nvme0n1</SelectOption>
                  <SelectOption value="/dev/vda">/dev/vda</SelectOption>
                </Select>
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-2">时区</label>
                <Select v-model:value="installConfig.timezone" class="w-full">
                  <SelectOption value="Asia/Shanghai">Asia/Shanghai</SelectOption>
                  <SelectOption value="UTC">UTC</SelectOption>
                  <SelectOption value="America/New_York">America/New_York</SelectOption>
                </Select>
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-2">键盘布局</label>
                <Select v-model:value="installConfig.keyboard_layout" class="w-full">
                  <SelectOption value="us">US</SelectOption>
                  <SelectOption value="cn">Chinese</SelectOption>
                </Select>
              </div>
            </div>
          </div>

          <!-- 软件包配置 -->
          <div class="mt-6">
            <h3 class="text-lg font-semibold mb-4">预装软件包</h3>
            <div class="space-y-2">
              <div v-for="(pkg, index) in installConfig.packages" :key="index" class="flex items-center space-x-2">
                <Input v-model:value="installConfig.packages[index]" class="flex-1" />
                <Button @click="removePackage(index)" type="text" danger>
                  <Icon icon="ant-design:delete-outlined" />
                </Button>
              </div>
              <Button @click="addPackage" type="dashed" class="w-full">
                <Icon icon="ant-design:plus-outlined" />
                添加软件包
              </Button>
            </div>
          </div>

          <div class="flex justify-between mt-6">
            <Button @click="prevStep">上一步</Button>
            <Button type="primary" @click="nextStep" :disabled="!isConfigValid">
              下一步
            </Button>
          </div>
        </Card>

        <!-- 步骤3: 开始安装 -->
        <Card v-if="currentStep === 2" title="开始安装">
          <div class="space-y-4">
            <Alert
              message="安装确认"
              description="请确认以下配置信息，点击开始安装后将无法撤销。"
              type="warning"
              show-icon
            />
            
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="font-semibold mb-2">安装配置摘要</h4>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div><strong>目标数量:</strong> {{ getTargetCount() }} 台</div>
                <div><strong>选择方式:</strong> {{ serverSelectionMode === 'manual' ? '手动输入IP' : '从服务器列表选择' }}</div>
                <div><strong>主机名:</strong> {{ installConfig.hostname }}</div>
                <div><strong>用户名:</strong> {{ installConfig.username }}</div>
                <div><strong>启动模式:</strong> {{ installConfig.boot_mode.toUpperCase() }}</div>
                <div><strong>网络接口:</strong> {{ installConfig.network_interface }}</div>
                <div><strong>磁盘路径:</strong> {{ installConfig.disk_path }}</div>
                <div><strong>时区:</strong> {{ installConfig.timezone }}</div>
                <div><strong>软件包:</strong> {{ installConfig.packages.join(', ') }}</div>
              </div>
            </div>

            <div class="flex justify-between">
              <Button @click="prevStep">上一步</Button>
              <Button 
                type="primary" 
                size="large"
                @click="startInstallation"
                :loading="installing"
              >
                <Icon icon="ant-design:play-circle-outlined" />
                开始安装
              </Button>
            </div>
          </div>
        </Card>

        <!-- 步骤4: 监控进度 -->
        <Card v-if="currentStep === 3" title="安装进度监控">
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <div>
                <h3 class="text-lg font-semibold">任务ID: {{ currentTaskId }}</h3>
                <div class="text-sm text-gray-500">
                  总进度: {{ taskProgress.completed }}/{{ taskProgress.total }} 完成
                </div>
              </div>
              <div class="flex space-x-2">
                <Button @click="refreshProgress" :loading="refreshing">
                  <Icon icon="ant-design:reload-outlined" />
                  刷新
                </Button>
                <Button @click="viewLogs" type="primary">
                  <Icon icon="ant-design:file-text-outlined" />
                  查看日志
                </Button>
              </div>
            </div>

            <!-- 整体进度条 -->
            <div class="mb-4">
              <div class="flex justify-between text-sm mb-2">
                <span>整体进度</span>
                <span>{{ Math.round((taskProgress.completed / taskProgress.total) * 100) }}%</span>
              </div>
              <Progress 
                :percent="Math.round((taskProgress.completed / taskProgress.total) * 100)"
                :status="taskProgress.failed > 0 ? 'exception' : 'active'"
              />
            </div>

            <!-- 各目标状态 -->
            <div class="space-y-2">
              <div 
                v-for="target in taskTargets" 
                :key="target.ip"
                class="flex items-center justify-between p-3 border rounded-lg"
              >
                <div class="flex items-center space-x-3">
                  <Badge 
                    :status="getStatusBadge(target.status)" 
                    :text="getStatusText(target.status)"
                  />
                  <span class="font-medium">{{ target.ip }}</span>
                  <span class="text-sm text-gray-500">{{ target.message }}</span>
                </div>
                <div class="flex items-center space-x-2">
                  <Progress 
                    :percent="target.progress" 
                    size="small" 
                    :show-info="false"
                    :status="target.status === 'failed' ? 'exception' : 'active'"
                    class="w-20"
                  />
                  <Button 
                    size="small" 
                    @click="viewTargetLogs(target.ip)"
                    :disabled="target.status === 'pending'"
                  >
                    日志
                  </Button>
                </div>
              </div>
            </div>

            <div class="flex justify-between mt-6">
              <Button @click="prevStep">返回配置</Button>
              <Button type="primary" @click="finishInstallation">
                完成
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>

    <!-- 日志查看模态框 -->
    <Modal
      v-model:open="logsModalVisible"
      title="安装日志"
      width="80%"
      :footer="null"
    >
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <span class="font-medium">目标: {{ selectedTargetIP }}</span>
          <Button @click="refreshLogs" :loading="refreshingLogs">
            <Icon icon="ant-design:reload-outlined" />
            刷新日志
          </Button>
        </div>
        <div class="bg-black text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
          <div v-for="(log, index) in targetLogs" :key="index" class="mb-1">
            {{ log }}
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { 
  Card, 
  Button, 
  Steps, 
  Step, 
  Input, 
  Textarea, 
  Select, 
  SelectOption,
  RadioGroup,
  Radio,
  InputPassword,
  Badge,
  Progress,
  Alert,
  Modal,
  Checkbox,
  Spin,
  message
} from 'ant-design-vue'
import { Icon } from '@iconify/vue'
// import { PageWrapper } from '@/components/Page'
import { batchInstallApi } from '@/api/batch-install'

// 响应式数据
const currentStep = ref(0)
const servicesLoading = ref(false)
const startingServices = ref(false)
const installing = ref(false)
const refreshing = ref(false)
const refreshingLogs = ref(false)
const logsModalVisible = ref(false)
const selectedTargetIP = ref('')
const targetLogs = ref<string[]>([])

// 服务器选择相关
const serverSelectionMode = ref('manual') // 'manual' 或 'fromList'
const targetIPs = ref('')
const serverList = ref<any[]>([])
const selectedServers = ref<string[]>([])
const loadingServers = ref(false)

// 服务状态
const servicesStatus = ref({
  dnsmasq: { status: 'unknown', enabled: false },
  apache2: { status: 'unknown', enabled: false },
  tftp: { status: 'unknown', enabled: false }
})

// 安装配置
const installConfig = reactive({
  hostname: 'host',
  username: 'user',
  password: '',
  network_interface: 'ens33',
  boot_mode: 'uefi',
  disk_path: '/dev/sda',
  timezone: 'Asia/Shanghai',
  keyboard_layout: 'us',
  packages: ['ipmitool']
})

// 任务相关
const currentTaskId = ref('')
const taskProgress = ref({
  total: 0,
  completed: 0,
  failed: 0
})
const taskTargets = ref<any[]>([])

// 计算属性
const hasValidIPs = computed(() => {
  const ips = targetIPs.value.split('\n').filter(ip => ip.trim())
  return ips.length > 0 && ips.every(ip => isValidIP(ip.trim()))
})

const hasSelectedServers = computed(() => {
  return selectedServers.value.length > 0
})

const canProceedToNextStep = computed(() => {
  if (serverSelectionMode.value === 'manual') {
    return hasValidIPs.value
  } else {
    return hasSelectedServers.value
  }
})

const isConfigValid = computed(() => {
  return installConfig.hostname && 
         installConfig.username && 
         installConfig.password &&
         installConfig.packages.length > 0
})

const allServicesRunning = computed(() => {
  return Object.values(servicesStatus.value).every(service => service.status === 'active')
})

// 方法
const isValidIP = (ip: string) => {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  return ipRegex.test(ip)
}

const getServiceName = (name: string) => {
  const names: Record<string, string> = {
    dnsmasq: 'DNS/DHCP服务',
    apache2: 'Web服务',
    tftp: 'TFTP服务'
  }
  return names[name] || name
}

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: 'default',
    installing: 'processing',
    completed: 'success',
    failed: 'error'
  }
  return statusMap[status] || 'default'
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '等待中',
    installing: '安装中',
    completed: '已完成',
    failed: '失败'
  }
  return statusMap[status] || status
}

const checkServices = async () => {
  servicesLoading.value = true
  try {
    const response = await batchInstallApi.getServicesStatus()
    servicesStatus.value = response.services
  } catch (error) {
    message.error('检查服务状态失败')
  } finally {
    servicesLoading.value = false
  }
}

const startServices = async () => {
  startingServices.value = true
  try {
    await batchInstallApi.startServices()
    message.success('服务启动成功')
    await checkServices()
  } catch (error) {
    message.error('启动服务失败')
  } finally {
    startingServices.value = false
  }
}

const nextStep = () => {
  if (currentStep.value < 3) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// 服务器选择相关方法
const onSelectionModeChange = () => {
  // 切换模式时清空选择
  if (serverSelectionMode.value === 'manual') {
    selectedServers.value = []
  } else {
    targetIPs.value = ''
  }
}

const loadServerList = async () => {
  loadingServers.value = true
  try {
    // 这里应该调用实际的API获取服务器列表
    // 暂时使用模拟数据
    serverList.value = [
      {
        id: '1',
        name: 'GPU-Server-01',
        ip: '192.168.1.101',
        type: 'gpu',
        status: 'online',
        cpu: 'Intel Xeon Gold 6248R',
        memory: '256GB',
        gpu: 'NVIDIA A100 80GB x4',
        storage: '2TB NVMe SSD',
        os: 'Ubuntu 20.04 LTS',
        location: '机房A-机架01',
        lastCheck: '2024-01-15 14:30:25'
      },
      {
        id: '2', 
        name: 'Storage-Server-01',
        ip: '192.168.1.102',
        type: 'storage',
        status: 'online',
        cpu: 'Intel Xeon Silver 4214R',
        memory: '128GB',
        gpu: 'N/A',
        storage: '10TB HDD x8',
        os: 'CentOS 7.9',
        location: '机房A-机架02',
        lastCheck: '2024-01-15 14:28:15'
      },
      {
        id: '3',
        name: 'GPU-Server-02', 
        ip: '192.168.1.103',
        type: 'gpu',
        status: 'offline',
        cpu: 'AMD EPYC 7763',
        memory: '512GB',
        gpu: 'NVIDIA H100 80GB x8',
        storage: '4TB NVMe SSD',
        os: 'Ubuntu 22.04 LTS',
        location: '机房B-机架01',
        lastCheck: '2024-01-15 10:15:30'
      }
    ]
  } catch (error) {
    message.error('加载服务器列表失败')
  } finally {
    loadingServers.value = false
  }
}

const toggleServerSelection = (serverId: string, checked: boolean) => {
  if (checked) {
    if (!selectedServers.value.includes(serverId)) {
      selectedServers.value.push(serverId)
    }
  } else {
    selectedServers.value = selectedServers.value.filter(id => id !== serverId)
  }
}

const selectAllServers = () => {
  selectedServers.value = serverList.value.map(server => server.id)
}

const clearServerSelection = () => {
  selectedServers.value = []
}

const getTargetCount = () => {
  if (serverSelectionMode.value === 'manual') {
    return targetIPs.value.split('\n').filter(ip => ip.trim()).length
  } else {
    return selectedServers.value.length
  }
}

const addPackage = () => {
  installConfig.packages.push('')
}

const removePackage = (index: number) => {
  installConfig.packages.splice(index, 1)
}

const startInstallation = async () => {
  installing.value = true
  try {
    let ips: string[] = []
    
    if (serverSelectionMode.value === 'manual') {
      // 手动输入模式
      ips = targetIPs.value.split('\n').filter(ip => ip.trim())
    } else {
      // 从服务器列表选择模式
      ips = selectedServers.value.map(serverId => {
        const server = serverList.value.find(s => s.id === serverId)
        return server ? server.ip : ''
      }).filter(ip => ip)
    }
    
    if (ips.length === 0) {
      message.error('没有选择任何目标服务器')
      return
    }
    
    const response = await batchInstallApi.startBatchInstall({
      target_ips: ips,
      config: installConfig,
      iso_path: '/home/pxe/ubuntu-22.04.5-live-server-amd64.iso',
      autoinstall_template: 'default'
    })
    
    currentTaskId.value = response.task_id
    taskProgress.value = {
      total: response.total_targets,
      completed: response.completed,
      failed: response.failed
    }
    taskTargets.value = response.targets
    
    currentStep.value = 3
    message.success('批量安装已开始')
    
    // 开始轮询进度
    startProgressPolling()
  } catch (error) {
    message.error('启动安装失败')
  } finally {
    installing.value = false
  }
}

const startProgressPolling = () => {
  const interval = setInterval(async () => {
    if (!currentTaskId.value) {
      clearInterval(interval)
      return
    }
    
    try {
      const response = await batchInstallApi.getTaskStatus(currentTaskId.value)
      taskProgress.value = {
        total: response.total_targets,
        completed: response.completed,
        failed: response.failed
      }
      taskTargets.value = response.targets
      
      if (response.status === 'completed') {
        clearInterval(interval)
        message.success('批量安装完成')
      }
    } catch (error) {
      console.error('获取任务状态失败:', error)
    }
  }, 2000)
}

const refreshProgress = async () => {
  if (!currentTaskId.value) return
  
  refreshing.value = true
  try {
    const response = await batchInstallApi.getTaskStatus(currentTaskId.value)
    taskProgress.value = {
      total: response.total_targets,
      completed: response.completed,
      failed: response.failed
    }
    taskTargets.value = response.targets
  } catch (error) {
    message.error('刷新进度失败')
  } finally {
    refreshing.value = false
  }
}

const viewLogs = () => {
  // 实现查看所有日志的逻辑
  message.info('查看所有日志功能待实现')
}

const viewTargetLogs = async (ip: string) => {
  selectedTargetIP.value = ip
  logsModalVisible.value = true
  await refreshLogs()
}

const refreshLogs = async () => {
  if (!currentTaskId.value || !selectedTargetIP.value) return
  
  refreshingLogs.value = true
  try {
    const response = await batchInstallApi.getTargetLogs(currentTaskId.value, selectedTargetIP.value)
    targetLogs.value = response.logs
  } catch (error) {
    message.error('获取日志失败')
  } finally {
    refreshingLogs.value = false
  }
}

const finishInstallation = () => {
  currentStep.value = 0
  currentTaskId.value = ''
  taskProgress.value = { total: 0, completed: 0, failed: 0 }
  taskTargets.value = []
  targetIPs.value = ''
  message.success('批量安装流程完成')
}

// 生命周期
onMounted(() => {
  checkServices()
  loadServerList()
})
</script>

<style scoped>
.space-y-6 > * + * {
  margin-top: 1.5rem;
}

.space-y-4 > * + * {
  margin-top: 1rem;
}

.space-y-2 > * + * {
  margin-top: 0.5rem;
}

.space-x-2 > * + * {
  margin-left: 0.5rem;
}

.space-x-3 > * + * {
  margin-left: 0.75rem;
}
</style>
