<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { type Rule } from 'ant-design-vue/es/form'; 
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Input, 
  Select, 
  SelectOption, 
  Tag, 
  Modal, 
  Form, 
  FormItem, 
  message, 
  Popconfirm,
  type TableColumnType 
} from 'ant-design-vue';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined 
} from '@ant-design/icons-vue';


import { getSoftwareListApi, deleteSoftwareApi, registerSoftwareApi, updateSoftwareApi, type SoftwareRepoApi } from '@/api/software-package';
interface ModalFormType {
  id: string;
  name: string;
  version: string;
  arch: string;
  os: string;
  repo_abs_path: string;
  size_bytes: number; // 明确指定为 number 类型
}

// --- 状态定义 ---
const loading = ref(false);
const tableData = ref<SoftwareRepoApi.SoftwarePackage[]>([]);
// const total = ref(0);

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  pageSizeOptions: ['10', '20', '50', '100'],
  showTotal: (total: number) => `共 ${total} 条`
});

// 搜索表单
const searchForm = reactive({
  name: '',
  version: '',
  arch: undefined as string | undefined,
  os: ''
});

// 弹窗状态
const modalVisible = ref(false);
const modalLoading = ref(false);
const modalTitle = ref('新增软件包');
const isEditMode = ref(false);

// 弹窗表单数据
const formRef = ref();
const modalForm = reactive<ModalFormType>({ // 显式绑定类型
  id: '',
  name: '',
  version: '',
  arch: 'x86_64',
  os: 'Linux',
  repo_abs_path: '',
  size_bytes: 0 // 初始值为数字 0
});

// 表单验证规则
const rules: Record<string, Rule[]> = {
  name: [
    { required: true, message: '请输入软件包名称', trigger: 'blur' }
  ],
  version: [
    { required: true, message: '请输入版本号', trigger: 'blur' }
  ],
  arch: [
    { required: true, message: '请选择架构', trigger: 'change' }
  ],
  os:[
    {required: true, message: '请输入操作系统', trigger: 'blur' }
  ],
  repo_abs_path: [
    { required: true, message: '请输入仓库路径', trigger: 'blur' }
  ],
  size_bytes: [
    { required: true, message: '请输入软件包大小（字节）', trigger: 'blur' },
  ]
};

// --- 表格列定义 ---
const columns: TableColumnType[] = [
  {
    title: '软件包名称',
    dataIndex: 'name',
    key: 'name',
    width: 180,
    fixed: 'left',
    align: 'center',
  },
  {
    title: '软件版本',
    dataIndex: 'version',
    key: 'version',
    width: 120,
    align: 'center',
  },
  {
    title: '软件架构',
    dataIndex: 'arch',
    key: 'arch',
    width: 120,
    align: 'center',
  },
  {
    title: '操作系统',
    dataIndex: 'os',
    key: 'os',
    width: 150,
    align: 'center',
  },
  {
    title: '软件包大小',
    dataIndex: 'size_bytes',
    key: 'size_bytes',
    width: 120,
    align: 'center',
    // 使用 customRender 格式化
  },
  {
    title: '操作',
    key: 'action',
    width: 180,
    fixed: 'right' ,
    align: 'center',
  }
];

// --- 方法 ---

// 获取数据
const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.current,
      page_size: pagination.pageSize,
      name: searchForm.name,
      version: searchForm.version,
      arch: searchForm.arch,
      os: searchForm.os
    };
    
    // 调用 API
    const res = await getSoftwareListApi(params);
    
    // 根据实际后端返回结构赋值，这里假设 res 包含 list 和 total
    if (res) {
      console.log(res.data)
      tableData.value = res.data || []; // 或者 res.items
      pagination.total = res.total || 0;
    }
  } catch (error) {
    console.error(error);
    message.error('获取列表失败');
  } finally {
    loading.value = false;
  }
};

// 表格分页/排序变化回调
const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  fetchData();
};

// 重置搜索
const handleReset = () => {
  searchForm.name = '';
  searchForm.version = '';
  searchForm.arch = undefined;
  searchForm.os = '';
  handleSearch();
};

// 格式化字节
const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// --- 弹窗操作 ---

// 打开新增
const handleAdd = () => {
  isEditMode.value = false;
  modalTitle.value = '登记软件包';
  // 重置表单
  modalForm.id = '';
  modalForm.name = '';
  modalForm.version = '';
  modalForm.arch = 'x86_64';
  modalForm.os = 'Linux';
  modalForm.repo_abs_path = '';
  modalForm.size_bytes = 0;
  
  modalVisible.value = true;
};

// 打开编辑
const handleEdit = (record: any) => {
  isEditMode.value = true;
  modalTitle.value = '编辑软件包';
  // 填充表单
  Object.assign(modalForm, record);
  modalVisible.value = true;
};

// 提交表单
// const handleModalOk = () => {
//   formRef.value.validate().then(async () => {
//     modalLoading.value = true;
//     try {
//       // 模拟提交 API
//       // if (isEditMode.value) await updateSoftwareApi(modalForm);
//       // else await createSoftwareApi(modalForm);
      
//       await new Promise(resolve => setTimeout(resolve, 500)); // 模拟延迟
//       message.success(isEditMode.value ? '更新成功' : '登记成功');
//       modalVisible.value = false;
//       fetchData(); // 刷新列表
//     } catch (error) {
//       message.error('操作失败');
//     } finally {
//       modalLoading.value = false;
//     }
//   }).catch(() => {
//     // 验证失败
//   });
// };

const handleModalOk = () => {
  formRef.value.validate().then(async () => {
    modalLoading.value = true; // 开启加载状态
    try {
      const sizeBytes = parseInt(String(modalForm.size_bytes),10); // 10 表示十进制
      // 验证转换是否成功（避免非数字内容）
      if (isNaN(sizeBytes) || sizeBytes < 0) {
        throw new Error('软件包大小必须是大于等于 0 的整数');
      }
      // 组装接口需要的参数（只传 RegisterParams 定义的字段，避免冗余）
      const submitData: SoftwareRepoApi.RegisterParams = {
        name: modalForm.name,
        version: modalForm.version,
        arch: modalForm.arch,
        os: modalForm.os,
        repo_abs_path: modalForm.repo_abs_path,
        size_bytes: sizeBytes,
        // 若 RegisterParams 还有其他字段（如 sha256），需补充从 modalForm 或其他地方获取
      };

      // 区分新增/编辑模式，调用对应接口（严格按接口定义传参）
      if (isEditMode.value) {
        // 编辑模式：接口需要 2 个参数（id + { data: 部分参数 }）
        const packageId = Number(modalForm.id); // 确保 id 是 number 类型（接口要求）
        if (isNaN(packageId)) throw new Error('软件包 ID 无效');
        
        // 调用更新接口：第一个参数是 id，第二个参数是 { data: 部分参数 }
        await updateSoftwareApi(packageId, submitData);
        message.success('软件包更新成功');
      } else {
        // 新增模式：接口需要 { data: 完整参数 }
        await registerSoftwareApi(submitData); // 直接传 submitData，接口内部会包装为 { data: ... }
        message.success('软件包登记成功');
      }

      // 操作成功：关闭弹窗 + 刷新列表（同步后端数据）
      modalVisible.value = false;
      fetchData();
    } catch (error: any) {
      // 错误处理：优先显示后端返回的具体错误，无则显示默认提示
      const errorMsg = error?.response?.data?.msg || 
                      error?.message || 
                      (isEditMode.value ? '更新失败' : '登记失败');
      message.error(errorMsg);
      console.error(`${isEditMode.value ? '更新' : '登记'}软件包异常：`, error);
    } finally {
      // 无论成功失败，都关闭加载状态
      modalLoading.value = false;
    }
  }).catch((error: any) => {
    // 表单验证失败（如未填必填项），无需调用接口
    console.error('表单验证失败：', error);
    message.warning('请完善必填项后提交');
  });
};

// 删除
const handleDelete = async (record: any) => {
  try {
    await deleteSoftwareApi(record.id);
    message.success('删除成功');
    fetchData();
  } catch (error) {
    message.error('删除失败');
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="p-4">
    <div class="mb-4">
      <h1 class="text-2xl font-bold text-gray-800">软件仓库</h1>
      <p class="text-gray-600 mt-1">管理和维护系统内的软件包资源，支持对软件包的检索、登记、版本管理及架构适配查看。</p>
    </div>
    <Card class="mb-2" :bodyStyle="{ padding: '20px 24px' }">
      <div class="flex flex-wrap items-center gap-2">
        <!-- 软件名称 -->
        <Input
          v-model:value="searchForm.name"
          placeholder="软件名称"
          allowClear
          style="width: 270px"
        >
          <template #prefix>
            <SearchOutlined class="text-gray-400" />
          </template>
        </Input>

        <!-- 版本号 -->
        <Input
          v-model:value="searchForm.version"
          placeholder="版本号"
          allowClear
          style="width: 270px"
        />

        <!-- 架构 -->
        <Select
          v-model:value="searchForm.arch"
          placeholder="架构"
          allowClear
          style="width: 270px"
        >
          <SelectOption value="x86_64">amd64</SelectOption>
          <SelectOption value="aarch64">aarch64</SelectOption>
        </Select>

        <!-- 操作系统 -->
        <Input
          v-model:value="searchForm.os"
          placeholder="操作系统"
          allowClear
          style="width: 270px"
        />

        <!-- 占位，使按钮靠右 -->
        <div class="flex-1"></div>

        <!-- 查询与重置：使用default类型+自定义class实现简约样式 -->
        <Space size="small"> <!-- 减小按钮间距 -->
          <Button class="btn-primary" size="middle" @click="handleSearch">查询</Button>
          <Button class="btn-default" size="middle" @click="handleReset">重置</Button>
        </Space>
      </div>
    </Card>
    <Card :bodyStyle="{ padding: '0' }">
      <template #title>
        <div class="flex justify-between items-center">
          <span class="font-medium">软件列表</span>
          <Space size="small">
            <Button class="btn-primary" size="middle" @click="handleAdd">
              <template #icon><PlusOutlined /></template>
              新增
            </Button>
            <Button class="btn-default" size="middle" @click="fetchData">
              <template #icon><ReloadOutlined /></template>
              刷新
            </Button>
          </Space>
        </div>
      </template>
      <!-- 新增表头下边界：添加border-b -->
      <div class="border-b border-gray-200">
        <Table
          :columns="columns"
          :data-source="tableData"
          :loading="loading"
          :pagination="pagination"
          @change="handleTableChange"
          row-key="id"
          size="middle"
          :scroll="{ x: 1000 }"
          :style="{ border: 'none' }" 
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <span class="text-blue-600 font-medium cursor-pointer hover:underline" @click="handleEdit(record)">
                {{ record.name }}
              </span>
            </template>

            <template v-if="column.key === 'arch'">
              <Tag :color="record.arch === 'x86_64' ? 'blue' : 'orange'">
                {{ record.arch }}
              </Tag>
            </template>

            <template v-if="column.key === 'size_bytes'">
              {{ formatBytes(record.size_bytes) }}
            </template>

            <template v-if="column.key === 'action'">
              <Space size="small">
                <Button type="link" size="small" @click="handleEdit(record)">
                  <template #icon><EditOutlined /></template>
                  编辑
                </Button>
                <Popconfirm
                  title="确定要删除该软件包吗？"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="handleDelete(record)"
                >
                  <Button type="link" danger size="small">
                    <template #icon><DeleteOutlined /></template>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            </template>
          </template>
        </Table>
      </div>
    </Card>

    <Modal
      v-model:open="modalVisible"
      :title="modalTitle"
      :confirm-loading="modalLoading"
      @ok="handleModalOk"
      width="600px"
    >
      <Form
        ref="formRef"
        :model="modalForm"
        :rules="rules"
        layout="vertical"
        class="pt-4"
      >        
        <div class="grid grid-cols-2 gap-4">
          <FormItem label="软件包名称" name="name">
            <Input v-model:value="modalForm.name" placeholder="请输入软件包名称" />
          </FormItem>
          <FormItem label="版本号" name="version">
            <Input v-model:value="modalForm.version" placeholder="例如: 1.0.0" />
          </FormItem>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <FormItem label="软件架构" name="arch">
            <Select v-model:value="modalForm.arch">
              <SelectOption value="x86_64">amd64</SelectOption>
              <SelectOption value="aarch64">aarch64</SelectOption>
            </Select>
          </FormItem>
          <FormItem label="操作系统" name="os">
            <Input v-model:value="modalForm.os" placeholder="例如: Linux, Ubuntu" />
          </FormItem>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <FormItem label="仓库路径" name="repo_abs_path">
            <Input v-model:value="modalForm.repo_abs_path" placeholder="/path/to/repo" />
          </FormItem>
          <FormItem label="软件大小" name="size_bytes">
            <Input v-model:value="modalForm.size_bytes" type="number" placeholder="例如: 1024" />
          </FormItem>
        </div>
      </Form>
    </Modal>
  </div>
</template>

<style scoped>
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.font-bold { font-weight: 700; }
.font-medium { font-weight: 500; }
.text-gray-800 { color: #1f2937; }
.text-gray-600 { color: #4b5563; }
.text-gray-400 { color: #bfbfbf; }
.text-gray-200 { color: #e5e7eb; }
.mt-1 { margin-top: 0.25rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-2 { margin-bottom: 0.5rem; } /* 缩小Card间距 */
.p-4 { padding: 1rem; }
.pt-4 { padding-top: 1rem; }

/* 布局工具类 */
.flex { display: flex; }
.flex-wrap { flex-wrap: wrap; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-2 { gap: 0.5rem; } /* 缩小搜索区间距 */
.flex-1 { flex: 1; }
.grid { display: grid; }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }

/* 交互样式 */
.text-blue-600 { color: #2563eb; }
.cursor-pointer { cursor: pointer; }
.hover\:underline:hover { text-decoration: underline; }
.border-b { border-bottom-width: 1px; }
.border-gray-200 { border-color: #e5e7eb; }

/* 简约按钮样式（替代默认primary） */
.btn-primary {
  background-color: #2563eb !important;
  color: #fff !important;
  border: none !important;
  border-radius: 6px !important;
  height: 30px !important;
  padding: 0 16px !important;
  box-shadow: none !important; /* 去除阴影 */
}
.btn-primary:hover {
  background-color: #1d4ed8 !important; /* hover深色过渡 */
}

/* 默认按钮样式 */
.btn-default {
  background-color: #f3f4f6 !important;
  color: #1f2937 !important;
  border: 1px solid #e5e7eb !important;
  border-radius: 6px !important;
  height: 30px !important;
  padding: 0 16px !important;
  box-shadow: none !important;
}
.btn-default:hover {
  background-color: #e5e7eb !important;
}

/* 表单组件样式优化 */
.ant-form-item {
  margin-bottom: 16px; /* 适度增大表单间距，提升可读性 */
}

.ant-input,
.ant-select-selector {
  border-radius: 6px !important;
  height: 36px !important; /* 统一输入框高度 */
  border-color: #e5e7eb !important;
}

/* 表格表头下边界与内容间距 */
.ant-table-thead > tr > th {
  border-bottom: 1px solid #e5e7eb !important;
  background-color: #f9fafb !important;
  padding: 12px 8px !important;
}

.ant-table-tbody > tr > td {
  padding: 12px 8px !important;
}
</style>