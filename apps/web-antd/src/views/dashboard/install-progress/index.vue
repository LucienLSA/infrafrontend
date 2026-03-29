<template>
  <div class="p-5">
    <div>
      <div class="mb-4">
        <h1 class="text-2xl font-bold">安装进度监控</h1>
        <p class="text-gray-600">监控批量装机的实时进度和状态</p>
      </div>
      <div class="space-y-6">
        <!-- 任务列表 -->
        <Card title="安装任务列表" class="mb-4">
          <div class="flex justify-between items-center mb-4">
            <span>查看所有批量安装任务</span>
            <Button @click="refreshTasks" :loading="tasksLoading">
              <Icon icon="ant-design:reload-outlined" />
              刷新列表
            </Button>
          </div>
          
          <div v-if="tasksLoading" class="text-center py-8">
            <Spin size="large" />
          </div>
          
          <div v-else class="space-y-4">
            <div 
              v-for="task in tasks" 
              :key="task.task_id"
              class="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center space-x-3">
                  <Badge 
                    :color="getTaskStatusColor(task.status)" 
                    :text="getTaskStatusText(task.status)"
                  />
                  <span class="font-medium">任务ID: {{ task.task_id }}</span>
                  <span class="text-sm text-gray-500">
                    {{ formatDate(task.targets[0]?.start_time) }}
                  </span>
                </div>
                <div class="flex space-x-2">
                  <Button size="small" @click="viewTaskDetails(task)">
                    <Icon icon="ant-design:eye-outlined" />
                    查看详情
                  </Button>
                  <Button 
                    size="small" 
                    danger 
                    @click="cancelTask(task.task_id)"
                    :disabled="task.status === 'completed' || task.status === 'cancelled'"
                  >
                    <Icon icon="ant-design:stop-outlined" />
                    取消
                  </Button>
                </div>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span class="text-gray-500">总目标:</span>
                  <span class="ml-2 font-medium">{{ task.total_targets }}</span>
                </div>
                <div>
                  <span class="text-gray-500">已完成:</span>
                  <span class="ml-2 font-medium text-green-600">{{ task.completed }}</span>
                </div>
                <div>
                  <span class="text-gray-500">失败:</span>
                  <span class="ml-2 font-medium text-red-600">{{ task.failed }}</span>
                </div>
              </div>
              
              <div class="mt-3">
                <div class="flex justify-between text-sm mb-1">
                  <span>整体进度</span>
                  <span>{{ Math.round((task.completed / task.total_targets) * 100) }}%</span>
                </div>
                <Progress 
                  :percent="Math.round((task.completed / task.total_targets) * 100)"
                  :status="task.failed > 0 ? 'exception' : 'active'"
                />
              </div>
            </div>
            
            <div v-if="tasks.length === 0" class="text-center py-8 text-gray-500">
              暂无安装任务
            </div>
          </div>
        </Card>

        <!-- 任务详情 -->
        <Card v-if="selectedTask" title="任务详情">
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold">任务ID: {{ selectedTask.task_id }}</h3>
              <Button @click="selectedTask = null">
                <Icon icon="ant-design:close-outlined" />
                关闭
              </Button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <div><strong>状态:</strong> {{ getTaskStatusText(selectedTask.status) }}</div>
                <div><strong>总目标:</strong> {{ selectedTask.total_targets }}</div>
                <div><strong>已完成:</strong> {{ selectedTask.completed }}</div>
                <div><strong>失败:</strong> {{ selectedTask.failed }}</div>
              </div>
              <div class="space-y-2">
                <div><strong>开始时间:</strong> {{ formatDate(selectedTask.targets[0]?.start_time) }}</div>
                <div><strong>结束时间:</strong> {{ formatDate(selectedTask.targets[0]?.end_time) }}</div>
                <div><strong>进度:</strong> {{ Math.round((selectedTask.completed / selectedTask.total_targets) * 100) }}%</div>
              </div>
            </div>
            
            <!-- 各目标状态 -->
            <div class="mt-6">
              <h4 class="font-semibold mb-3">各目标状态</h4>
              <div class="space-y-2">
                <div 
                  v-for="target in selectedTask.targets" 
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
import { ref, onMounted } from 'vue'
import { 
  Card, 
  Button, 
  Badge, 
  Progress, 
  Modal, 
  Spin,
  message
} from 'ant-design-vue'
import { Icon } from '@iconify/vue'
// import { PageWrapper } from '@/components/Page'
import { batchInstallApi, type BatchInstallResponse } from '@/api/batch-install'

// 响应式数据
const tasksLoading = ref(false)
const refreshingLogs = ref(false)
const logsModalVisible = ref(false)
const selectedTargetIP = ref('')
const targetLogs = ref<string[]>([])

const tasks = ref<BatchInstallResponse[]>([])
const selectedTask = ref<BatchInstallResponse | null>(null)

// 方法
const loadTasks = async () => {
  tasksLoading.value = true
  try {
    const response = await batchInstallApi.getAllTasks()
    tasks.value = response.tasks
  } catch (error) {
    message.error('加载任务列表失败')
  } finally {
    tasksLoading.value = false
  }
}

const refreshTasks = () => {
  loadTasks()
}

const getTaskStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    running: 'processing',
    completed: 'success',
    failed: 'error',
    cancelled: 'default'
  }
  return colorMap[status] || 'default'
}

const getTaskStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    running: '运行中',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消'
  }
  return statusMap[status] || status
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

const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

const viewTaskDetails = (task: BatchInstallResponse) => {
  selectedTask.value = task
}

const cancelTask = async (taskId: string) => {
  try {
    await batchInstallApi.cancelTask(taskId)
    message.success('任务已取消')
    loadTasks()
  } catch (error) {
    message.error('取消任务失败')
  }
}

const viewTargetLogs = async (ip: string) => {
  if (!selectedTask.value) return
  
  selectedTargetIP.value = ip
  logsModalVisible.value = true
  await refreshLogs()
}

const refreshLogs = async () => {
  if (!selectedTask.value || !selectedTargetIP.value) return
  
  refreshingLogs.value = true
  try {
    const response = await batchInstallApi.getTargetLogs(selectedTask.value.task_id, selectedTargetIP.value)
    targetLogs.value = response.logs
  } catch (error) {
    message.error('获取日志失败')
  } finally {
    refreshingLogs.value = false
  }
}

// 生命周期
onMounted(() => {
  loadTasks()
  
  // 每30秒自动刷新任务列表
  setInterval(() => {
    loadTasks()
  }, 30000)
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



