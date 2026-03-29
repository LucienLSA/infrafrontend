<script lang="ts" setup>
import { ref, reactive, onMounted, h } from 'vue';
import { 
  Card, 
  Button, 
  Space, 
  Modal,
  message,
  Tabs,
  TabPane,
  Table,
  Input,
  Select,
  SelectOption,
  Form,
  FormItem
} from 'ant-design-vue';

defineOptions({ name: 'StorageSwitch' });

// 响应式数据
const loading = ref(false);
const activeTab = ref('port-table');
const confirmPortTableVisible = ref(false);
const confirmNetworkConfigVisible = ref(false);
const editTemplateVisible = ref(false);

// 端接表数据
const portTableData = ref([
  {
    key: '1',
    port: '1/1',
    device: 'Storage-Server-001',
    vlan: 'VLAN 200',
    ip: '192.168.10.101/24',
    status: '已配置'
  },
  {
    key: '2',
    port: '1/2',
    device: 'Storage-Server-002',
    vlan: 'VLAN 200',
    ip: '192.168.10.102/24',
    status: '已配置'
  },
  {
    key: '3',
    port: '1/3',
    device: 'Storage-Server-003',
    vlan: 'VLAN 201',
    ip: '192.168.11.103/24',
    status: '待配置'
  }
]);

// 网络配置方案数据
const networkConfigData = ref({
  switchModel: 'Cisco Nexus 3000',
  managementVlan: 'VLAN 99',
  storageVlan: 'VLAN 200-210',
  uplinkPorts: '1/25-1/28',
  downlinkPorts: '1/1-1/24',
  lacpMode: 'active',
  spanningTree: 'enabled'
});

// 模板配置数据
const templateData = ref({
  hostname: 'storage-sw-01',
  managementIp: '192.168.99.20/24',
  gateway: '192.168.99.1',
  ntpServer: '192.168.99.100',
  snmpCommunity: 'public',
  syslogServer: '192.168.99.200'
});

// 端接表列配置
const portTableColumns = [
  {
    title: '端口',
    dataIndex: 'port',
    key: 'port',
    width: 80,
  },
  {
    title: '连接设备',
    dataIndex: 'device',
    key: 'device',
    width: 150,
  },
  {
    title: 'VLAN',
    dataIndex: 'vlan',
    key: 'vlan',
    width: 100,
  },
  {
    title: 'IP地址',
    dataIndex: 'ip',
    key: 'ip',
    width: 150,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
  },
  {
    title: '操作',
    key: 'action',
    width: 120,
    customRender: ({ record }: { record: any }) => {
      return h(Space, [
        h(Button, { 
          type: 'link', 
          size: 'small',
          onClick: () => editPort(record)
        }, '编辑'),
        h(Button, { 
          type: 'link', 
          size: 'small',
          danger: true,
          onClick: () => deletePort(record)
        }, '删除')
      ]);
    }
  }
];

// 编辑端口
const editPort = (record: any) => {
  message.info(`编辑端口 ${record.port}`);
};

// 删除端口
const deletePort = (record: any) => {
  message.info(`删除端口 ${record.port}`);
};

// 确认端接表
const confirmPortTable = () => {
  confirmPortTableVisible.value = true;
};

// 确认网络配置方案
const confirmNetworkConfig = () => {
  confirmNetworkConfigVisible.value = true;
};

// 编辑模板
const editTemplate = () => {
  editTemplateVisible.value = true;
};

// 生成配置
const generateConfig = () => {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    message.success('存储交换机配置生成成功！');
  }, 2000);
};

// 保存端接表
const savePortTable = () => {
  confirmPortTableVisible.value = false;
  message.success('端接表保存成功！');
};

// 保存网络配置
const saveNetworkConfig = () => {
  confirmNetworkConfigVisible.value = false;
  message.success('网络配置保存成功！');
};

// 保存模板
const saveTemplate = () => {
  editTemplateVisible.value = false;
  message.success('模板保存成功！');
};

onMounted(() => {
  // 初始化数据
});
</script>

<template>
  <div style="padding: 24px;">
    <!-- 页面标题 -->
    <div style="margin-bottom: 24px;">
      <h1 style="font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">存储交换机配置</h1>
      <p style="color: #666; margin: 0;">配置存储网络的交换机设备，包括端口分配、VLAN配置和网络参数设置。</p>
    </div>

    <!-- 操作菜单 -->
    <Card style="margin-bottom: 24px;">
      <Space size="large">
        <Button type="primary" @click="confirmPortTable">
          确认端接表
        </Button>
        <Button @click="confirmNetworkConfig">
          确认网络配置方案
        </Button>
        <Button @click="editTemplate">
          编辑模板
        </Button>
        <div style="margin-left: auto;">
          <Button 
            type="primary" 
            size="large"
            :loading="loading"
            @click="generateConfig"
          >
            生成配置
          </Button>
        </div>
      </Space>
    </Card>

    <!-- 配置内容 -->
    <Card>
      <Tabs v-model:activeKey="activeTab" type="card">
        <TabPane key="port-table" tab="端接表">
          <Table
            :columns="portTableColumns"
            :data-source="portTableData"
            :pagination="{ pageSize: 10 }"
            size="middle"
          />
        </TabPane>
        
        <TabPane key="network-config" tab="网络配置">
          <div style="max-width: 600px;">
            <Form :model="networkConfigData" layout="vertical">
              <FormItem label="交换机型号">
                <Input v-model:value="networkConfigData.switchModel" />
              </FormItem>
              <FormItem label="管理VLAN">
                <Input v-model:value="networkConfigData.managementVlan" />
              </FormItem>
              <FormItem label="存储VLAN">
                <Input v-model:value="networkConfigData.storageVlan" />
              </FormItem>
              <FormItem label="上行端口">
                <Input v-model:value="networkConfigData.uplinkPorts" />
              </FormItem>
              <FormItem label="下行端口">
                <Input v-model:value="networkConfigData.downlinkPorts" />
              </FormItem>
              <FormItem label="LACP模式">
                <Select v-model:value="networkConfigData.lacpMode">
                  <SelectOption value="active">Active</SelectOption>
                  <SelectOption value="passive">Passive</SelectOption>
                </Select>
              </FormItem>
              <FormItem label="生成树协议">
                <Select v-model:value="networkConfigData.spanningTree">
                  <SelectOption value="enabled">启用</SelectOption>
                  <SelectOption value="disabled">禁用</SelectOption>
                </Select>
              </FormItem>
            </Form>
          </div>
        </TabPane>
        
        <TabPane key="template" tab="配置模板">
          <div style="max-width: 600px;">
            <Form :model="templateData" layout="vertical">
              <FormItem label="主机名">
                <Input v-model:value="templateData.hostname" />
              </FormItem>
              <FormItem label="管理IP">
                <Input v-model:value="templateData.managementIp" />
              </FormItem>
              <FormItem label="网关">
                <Input v-model:value="templateData.gateway" />
              </FormItem>
              <FormItem label="NTP服务器">
                <Input v-model:value="templateData.ntpServer" />
              </FormItem>
              <FormItem label="SNMP团体">
                <Input v-model:value="templateData.snmpCommunity" />
              </FormItem>
              <FormItem label="Syslog服务器">
                <Input v-model:value="templateData.syslogServer" />
              </FormItem>
            </Form>
          </div>
        </TabPane>
      </Tabs>
    </Card>

    <!-- 确认端接表弹窗 -->
    <Modal
      v-model:open="confirmPortTableVisible"
      title="确认端接表"
      width="800px"
      @ok="savePortTable"
    >
      <p>请确认以下端接表信息是否正确：</p>
      <Table
        :columns="portTableColumns.slice(0, -1)"
        :data-source="portTableData"
        :pagination="false"
        size="small"
      />
    </Modal>

    <!-- 确认网络配置方案弹窗 -->
    <Modal
      v-model:open="confirmNetworkConfigVisible"
      title="确认网络配置方案"
      width="600px"
      @ok="saveNetworkConfig"
    >
      <div style="max-width: 500px;">
        <Form :model="networkConfigData" layout="vertical">
          <FormItem label="交换机型号">
            <Input v-model:value="networkConfigData.switchModel" readonly />
          </FormItem>
          <FormItem label="管理VLAN">
            <Input v-model:value="networkConfigData.managementVlan" readonly />
          </FormItem>
          <FormItem label="存储VLAN">
            <Input v-model:value="networkConfigData.storageVlan" readonly />
          </FormItem>
          <FormItem label="上行端口">
            <Input v-model:value="networkConfigData.uplinkPorts" readonly />
          </FormItem>
          <FormItem label="下行端口">
            <Input v-model:value="networkConfigData.downlinkPorts" readonly />
          </FormItem>
        </Form>
      </div>
    </Modal>

    <!-- 编辑模板弹窗 -->
    <Modal
      v-model:open="editTemplateVisible"
      title="编辑配置模板"
      width="600px"
      @ok="saveTemplate"
    >
      <div style="max-width: 500px;">
        <Form :model="templateData" layout="vertical">
          <FormItem label="主机名">
            <Input v-model:value="templateData.hostname" />
          </FormItem>
          <FormItem label="管理IP">
            <Input v-model:value="templateData.managementIp" />
          </FormItem>
          <FormItem label="网关">
            <Input v-model:value="templateData.gateway" />
          </FormItem>
          <FormItem label="NTP服务器">
            <Input v-model:value="templateData.ntpServer" />
          </FormItem>
          <FormItem label="SNMP团体">
            <Input v-model:value="templateData.snmpCommunity" />
          </FormItem>
          <FormItem label="Syslog服务器">
            <Input v-model:value="templateData.syslogServer" />
          </FormItem>
        </Form>
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
</style>

