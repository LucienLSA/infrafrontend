<template>
  <div class="p-5">
    <div>
      <div class="mb-4">
        <h1 class="text-2xl font-bold">安装模板管理</h1>
        <p class="text-gray-600">管理PXE批量装机的自动安装模板</p>
      </div>
      <div class="space-y-6">
        <!-- 模板列表 -->
        <Card title="现有模板" class="mb-4">
          <div class="flex justify-between items-center mb-4">
            <span>管理自动安装模板</span>
            <Button type="primary" @click="showCreateModal">
              <Icon icon="ant-design:plus-outlined" />
              创建新模板
            </Button>
          </div>
          
          <div v-if="templatesLoading" class="text-center py-8">
            <Spin size="large" />
          </div>
          
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card 
              v-for="template in templates" 
              :key="template.name"
              :title="template.name"
              size="small"
              class="hover:shadow-md transition-shadow"
            >
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <Badge :color="template.type === 'uefi' ? 'blue' : 'green'">
                    {{ template.type.toUpperCase() }}
                  </Badge>
                  <div class="flex space-x-1">
                    <Button size="small" @click="editTemplate(template)">
                      <Icon icon="ant-design:edit-outlined" />
                    </Button>
                    <Button size="small" danger @click="deleteTemplate(template)">
                      <Icon icon="ant-design:delete-outlined" />
                    </Button>
                  </div>
                </div>
                <div class="text-sm text-gray-500">
                  路径: {{ template.path }}
                </div>
              </div>
            </Card>
          </div>
        </Card>

        <!-- ISO镜像管理 -->
        <Card title="ISO镜像管理">
          <div class="flex justify-between items-center mb-4">
            <span>管理操作系统ISO镜像</span>
            <Button @click="refreshISOs" :loading="isosLoading">
              <Icon icon="ant-design:reload-outlined" />
              刷新列表
            </Button>
          </div>
          
          <div v-if="isosLoading" class="text-center py-8">
            <Spin size="large" />
          </div>
          
          <div v-else class="space-y-2">
            <div 
              v-for="iso in isos" 
              :key="iso.name"
              class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div class="flex items-center space-x-3">
                <Icon icon="ant-design:file-outlined" class="text-2xl text-blue-500" />
                <div>
                  <div class="font-medium">{{ iso.name }}</div>
                  <div class="text-sm text-gray-500">{{ iso.size_mb }} MB</div>
                </div>
              </div>
              <div class="flex space-x-2">
                <Button size="small" @click="mountISO(iso)">
                  <Icon icon="ant-design:play-circle-outlined" />
                  挂载
                </Button>
                <Button size="small" danger @click="deleteISO(iso)">
                  <Icon icon="ant-design:delete-outlined" />
                  删除
                </Button>
              </div>
            </div>
            
            <div v-if="isos.length === 0" class="text-center py-8 text-gray-500">
              暂无ISO镜像文件
            </div>
          </div>
        </Card>
      </div>
    </div>

    <!-- 创建模板模态框 -->
    <Modal
      v-model:open="createModalVisible"
      title="创建安装模板"
      width="60%"
      @ok="createTemplate"
      :confirm-loading="creating"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">模板名称</label>
          <Input v-model:value="newTemplate.name" placeholder="例如: ubuntu-server-uefi" />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">模板类型</label>
          <RadioGroup v-model:value="newTemplate.type">
            <Radio value="uefi">UEFI</Radio>
            <Radio value="legacy">Legacy BIOS</Radio>
          </RadioGroup>
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">主机名前缀</label>
          <Input v-model:value="newTemplate.config.hostname" placeholder="host" />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">用户名</label>
          <Input v-model:value="newTemplate.config.username" placeholder="user" />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">密码</label>
          <InputPassword v-model:value="newTemplate.config.password" placeholder="请输入密码" />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">网络接口</label>
          <Select v-model:value="newTemplate.config.network_interface" class="w-full">
            <SelectOption value="ens33">ens33</SelectOption>
            <SelectOption value="eth0">eth0</SelectOption>
            <SelectOption value="enp0s3">enp0s3</SelectOption>
          </Select>
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">磁盘路径</label>
          <Select v-model:value="newTemplate.config.disk_path" class="w-full">
            <SelectOption value="/dev/sda">/dev/sda</SelectOption>
            <SelectOption value="/dev/nvme0n1">/dev/nvme0n1</SelectOption>
            <SelectOption value="/dev/vda">/dev/vda</SelectOption>
          </Select>
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">预装软件包</label>
          <div class="space-y-2">
            <div v-for="(pkg, index) in newTemplate.config.packages" :key="index" class="flex items-center space-x-2">
              <Input v-model:value="newTemplate.config.packages[index]" class="flex-1" />
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
      </div>
    </Modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { 
  Card, 
  Button, 
  Badge, 
  Modal, 
  Input, 
  InputPassword,
  Select, 
  SelectOption,
  RadioGroup,
  Radio,
  Spin,
  message
} from 'ant-design-vue'
import { Icon } from '@iconify/vue'
// import { PageWrapper } from '@/components/Page'
import { batchInstallApi, type AutoinstallTemplate, type InstallConfig, type ISOFile } from '@/api/batch-install'

// 响应式数据
const templatesLoading = ref(false)
const isosLoading = ref(false)
const creating = ref(false)
const createModalVisible = ref(false)

const templates = ref<AutoinstallTemplate[]>([])
const isos = ref<ISOFile[]>([])

const newTemplate = reactive({
  name: '',
  type: 'uefi',
  config: {
    hostname: 'host',
    username: 'user',
    password: '',
    network_interface: 'ens33',
    disk_path: '/dev/sda',
    timezone: 'Asia/Shanghai',
    keyboard_layout: 'us',
    packages: ['ipmitool']
  } as InstallConfig
})

// 方法
const loadTemplates = async () => {
  templatesLoading.value = true
  try {
    const response = await batchInstallApi.getTemplates()
    templates.value = [...response.templates, ...response.default_templates]
  } catch (error) {
    message.error('加载模板失败')
  } finally {
    templatesLoading.value = false
  }
}

const loadISOs = async () => {
  isosLoading.value = true
  try {
    const response = await batchInstallApi.getISOs()
    isos.value = response.isos
  } catch (error) {
    message.error('加载ISO列表失败')
  } finally {
    isosLoading.value = false
  }
}

const refreshISOs = () => {
  loadISOs()
}

const showCreateModal = () => {
  createModalVisible.value = true
}

const addPackage = () => {
  newTemplate.config.packages.push('')
}

const removePackage = (index: number) => {
  newTemplate.config.packages.splice(index, 1)
}

const createTemplate = async () => {
  if (!newTemplate.name || !newTemplate.config.password) {
    message.error('请填写模板名称和密码')
    return
  }
  
  creating.value = true
  try {
    await batchInstallApi.createAutoinstallTemplate(
      newTemplate.name,
      newTemplate.config,
      newTemplate.type
    )
    message.success('模板创建成功')
    createModalVisible.value = false
    loadTemplates()
    
    // 重置表单
    newTemplate.name = ''
    newTemplate.config.password = ''
  } catch (error) {
    message.error('创建模板失败')
  } finally {
    creating.value = false
  }
}

const editTemplate = (template: AutoinstallTemplate) => {
  message.info('编辑模板功能待实现')
}

const deleteTemplate = (template: AutoinstallTemplate) => {
  message.info('删除模板功能待实现')
}

const mountISO = (iso: ISOFile) => {
  message.info(`挂载ISO: ${iso.name}`)
}

const deleteISO = (iso: ISOFile) => {
  message.info(`删除ISO: ${iso.name}`)
}

// 生命周期
onMounted(() => {
  loadTemplates()
  loadISOs()
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

.space-x-1 > * + * {
  margin-left: 0.25rem;
}

.space-x-2 > * + * {
  margin-left: 0.5rem;
}

.space-x-3 > * + * {
  margin-left: 0.75rem;
}
</style>



