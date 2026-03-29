<script lang="ts" setup>
import { ref, reactive, onMounted, h } from 'vue';
import { 
  Card, 
  Form, 
  FormItem, 
  Input, 
  InputNumber, 
  Select, 
  SelectOption, 
  Button, 
  Space, 
  Row, 
  Col, 
  Divider,
  Alert,
  Switch,
  Tabs,
  TabPane,
  message
} from 'ant-design-vue';

defineOptions({ name: 'CheckConfig' });

// 检查项配置接口
interface CheckItem {
  id: string;
  name: string;
  description: string;
  type: 'number' | 'text' | 'select' | 'boolean';
  value: any;
  unit?: string;
  options?: string[];
  required: boolean;
  min?: number;
  max?: number;
}

// 服务器类型配置
interface ServerTypeConfig {
  id: string;
  name: string;
  description: string;
  checkItems: CheckItem[];
}

// 默认检查项配置
const defaultConfigs: ServerTypeConfig[] = [
  {
    id: 'gpu-server',
    name: 'GPU服务器',
    description: '用于AI计算和图形处理的GPU服务器检查标准',
    checkItems: [
      // 通用检查项
      {
        id: 'os-version',
        name: '操作系统版本',
        description: '支持的操作系统版本',
        type: 'select',
        value: 'Ubuntu 20.04 LTS',
        options: ['Ubuntu 18.04 LTS', 'Ubuntu 20.04 LTS', 'Ubuntu 22.04 LTS', 'CentOS 7', 'CentOS 8', 'RHEL 7', 'RHEL 8'],
        required: true
      },
      {
        id: 'kernel-version',
        name: '内核版本',
        description: '支持的内核版本',
        type: 'select',
        value: '5.4.0',
        options: ['4.15.0', '4.18.0', '5.0.0', '5.4.0', '5.8.0', '5.11.0', '5.15.0', '5.19.0'],
        required: true
      },
      {
        id: 'system-disk-location',
        name: '系统盘安装位置检测',
        description: '系统盘必须安装在指定位置',
        type: 'select',
        value: '/dev/sda',
        options: ['/dev/sda', '/dev/nvme0n1', '/dev/sdb', '/dev/nvme1n1'],
        required: true
      },
      {
        id: 'server-model',
        name: '服务器型号',
        description: '支持的服务器型号',
        type: 'select',
        value: 'Dell PowerEdge R750',
        options: ['Dell PowerEdge R750', 'Dell PowerEdge R7525', 'HPE ProLiant DL380', 'HPE ProLiant DL385', 'Supermicro SYS-4029GP-TRT', 'Supermicro SYS-4029GP-TRT2'],
        required: true
      },
      // GPU相关检查项（仅GPU服务器）
      {
        id: 'gpu-model',
        name: 'GPU型号',
        description: '支持的GPU型号',
        type: 'select',
        value: 'NVIDIA A100',
        options: ['NVIDIA A100', 'NVIDIA V100', 'NVIDIA RTX 3090', 'NVIDIA RTX 4090', 'NVIDIA A40', 'NVIDIA A30'],
        required: true
      },
      {
        id: 'gpu-firmware-version',
        name: 'GPU固件版本',
        description: 'GPU固件的最低版本要求',
        type: 'text',
        value: '90.04.48.00.01',
        required: true
      },
      {
        id: 'gpu-driver-version',
        name: 'GPU驱动版本',
        description: 'NVIDIA驱动的最低版本要求',
        type: 'select',
        value: '470.57.02',
        options: ['460.80', '470.57.02', '510.39.01', '520.61.05', '525.60.13', '530.30.02'],
        required: true
      },
      {
        id: 'gpu-count',
        name: 'GPU数量',
        description: '服务器必须包含的GPU数量',
        type: 'number',
        value: 4,
        unit: '个',
        required: true,
        min: 1,
        max: 16
      },
      {
        id: 'gpu-pcie-bus-check',
        name: 'PCIe Bus号一致性检测',
        description: '检查GPU PCIe Bus号是否连续',
        type: 'boolean',
        value: true,
        required: true
      },
      {
        id: 'gpu-pcie-degradation-check',
        name: 'GPU PCIe降级检测',
        description: '检测GPU PCIe是否降级运行',
        type: 'boolean',
        value: true,
        required: true
      },
      {
        id: 'nvlink-check',
        name: 'NVLink检测',
        description: '检测GPU间NVLink连接状态',
        type: 'boolean',
        value: true,
        required: true
      },
      {
        id: 'gpu-ib-topology-check',
        name: 'GPU-IB卡PIX拓扑连接',
        description: '检查GPU与InfiniBand卡的PIX拓扑连接',
        type: 'boolean',
        value: true,
        required: true
      },
      // 网卡相关检查项
      {
        id: 'network-model',
        name: '网卡型号',
        description: '支持的网卡型号',
        type: 'select',
        value: 'Mellanox ConnectX-6',
        options: ['Mellanox ConnectX-6', 'Mellanox ConnectX-5', 'Intel X710', 'Intel X722', 'Broadcom NetXtreme'],
        required: true
      },
      {
        id: 'network-firmware-version',
        name: '网卡固件版本',
        description: '网卡固件的最低版本要求',
        type: 'text',
        value: '22.31.2000',
        required: true
      },
      {
        id: 'network-driver-version',
        name: '网卡驱动版本',
        description: '网卡驱动的最低版本要求',
        type: 'text',
        value: '5.0-2.0.0.0',
        required: true
      },
      {
        id: 'network-count',
        name: '网卡数量',
        description: '服务器必须包含的网卡数量',
        type: 'number',
        value: 2,
        unit: '个',
        required: true,
        min: 1,
        max: 8
      },
      // CPU和内存检查项
      {
        id: 'cpu-model',
        name: 'CPU型号',
        description: '支持的CPU型号',
        type: 'select',
        value: 'AMD EPYC 7763',
        options: ['AMD EPYC 7763', 'AMD EPYC 7543', 'Intel Xeon Gold 6338', 'Intel Xeon Gold 6348', 'AMD EPYC 7713'],
        required: true
      },
      {
        id: 'memory-model',
        name: '内存型号及容量',
        description: '内存型号和单条容量要求',
        type: 'select',
        value: 'DDR4-3200 32GB',
        options: ['DDR4-2666 16GB', 'DDR4-3200 32GB', 'DDR4-3200 64GB', 'DDR5-4800 32GB', 'DDR5-4800 64GB'],
        required: true
      },
      {
        id: 'memory-total-size',
        name: '总内存容量',
        description: '服务器总内存容量要求',
        type: 'number',
        value: 256,
        unit: 'GB',
        required: true,
        min: 32,
        max: 2048
      },
      // 硬盘检查项
      {
        id: 'disk-spec',
        name: '硬盘规格及数量',
        description: '硬盘规格和数量要求',
        type: 'select',
        value: 'NVMe SSD 1TB x2',
        options: ['SATA SSD 500GB x2', 'NVMe SSD 1TB x2', 'NVMe SSD 2TB x4', 'SAS HDD 1TB x8', 'NVMe SSD 4TB x8'],
        required: true
      },
      {
        id: 'disk-count',
        name: '硬盘数量',
        description: '服务器必须包含的硬盘数量',
        type: 'number',
        value: 2,
        unit: '个',
        required: true,
        min: 1,
        max: 24
      }
    ]
  },
  {
    id: 'cpu-server',
    name: 'CPU服务器',
    description: '用于通用计算和业务处理的CPU服务器检查标准',
    checkItems: [
      // 通用检查项
      {
        id: 'os-version',
        name: '操作系统版本',
        description: '支持的操作系统版本',
        type: 'select',
        value: 'Ubuntu 20.04 LTS',
        options: ['Ubuntu 18.04 LTS', 'Ubuntu 20.04 LTS', 'Ubuntu 22.04 LTS', 'CentOS 7', 'CentOS 8', 'RHEL 7', 'RHEL 8'],
        required: true
      },
      {
        id: 'kernel-version',
        name: '内核版本',
        description: '支持的内核版本',
        type: 'select',
        value: '5.4.0',
        options: ['4.15.0', '4.18.0', '5.0.0', '5.4.0', '5.8.0', '5.11.0', '5.15.0', '5.19.0'],
        required: true
      },
      {
        id: 'system-disk-location',
        name: '系统盘安装位置检测',
        description: '系统盘必须安装在指定位置',
        type: 'select',
        value: '/dev/sda',
        options: ['/dev/sda', '/dev/nvme0n1', '/dev/sdb', '/dev/nvme1n1'],
        required: true
      },
      {
        id: 'server-model',
        name: '服务器型号',
        description: '支持的服务器型号',
        type: 'select',
        value: 'Dell PowerEdge R750',
        options: ['Dell PowerEdge R750', 'Dell PowerEdge R7525', 'HPE ProLiant DL380', 'HPE ProLiant DL385', 'Supermicro SYS-4029GP-TRT', 'Supermicro SYS-4029GP-TRT2'],
        required: true
      },
      // 网卡相关检查项
      {
        id: 'network-model',
        name: '网卡型号',
        description: '支持的网卡型号',
        type: 'select',
        value: 'Intel X710',
        options: ['Mellanox ConnectX-6', 'Mellanox ConnectX-5', 'Intel X710', 'Intel X722', 'Broadcom NetXtreme'],
        required: true
      },
      {
        id: 'network-firmware-version',
        name: '网卡固件版本',
        description: '网卡固件的最低版本要求',
        type: 'text',
        value: '22.31.2000',
        required: true
      },
      {
        id: 'network-driver-version',
        name: '网卡驱动版本',
        description: '网卡驱动的最低版本要求',
        type: 'text',
        value: '5.0-2.0.0.0',
        required: true
      },
      {
        id: 'network-count',
        name: '网卡数量',
        description: '服务器必须包含的网卡数量',
        type: 'number',
        value: 2,
        unit: '个',
        required: true,
        min: 1,
        max: 8
      },
      // CPU和内存检查项
      {
        id: 'cpu-model',
        name: 'CPU型号',
        description: '支持的CPU型号',
        type: 'select',
        value: 'Intel Xeon Gold 6338',
        options: ['AMD EPYC 7763', 'AMD EPYC 7543', 'Intel Xeon Gold 6338', 'Intel Xeon Gold 6348', 'AMD EPYC 7713'],
        required: true
      },
      {
        id: 'memory-model',
        name: '内存型号及容量',
        description: '内存型号和单条容量要求',
        type: 'select',
        value: 'DDR4-3200 32GB',
        options: ['DDR4-2666 16GB', 'DDR4-3200 32GB', 'DDR4-3200 64GB', 'DDR5-4800 32GB', 'DDR5-4800 64GB'],
        required: true
      },
      {
        id: 'memory-total-size',
        name: '总内存容量',
        description: '服务器总内存容量要求',
        type: 'number',
        value: 128,
        unit: 'GB',
        required: true,
        min: 16,
        max: 1024
      },
      // 硬盘检查项
      {
        id: 'disk-spec',
        name: '硬盘规格及数量',
        description: '硬盘规格和数量要求',
        type: 'select',
        value: 'SATA SSD 500GB x2',
        options: ['SATA SSD 500GB x2', 'NVMe SSD 1TB x2', 'NVMe SSD 2TB x4', 'SAS HDD 1TB x8', 'NVMe SSD 4TB x8'],
        required: true
      },
      {
        id: 'disk-count',
        name: '硬盘数量',
        description: '服务器必须包含的硬盘数量',
        type: 'number',
        value: 2,
        unit: '个',
        required: true,
        min: 1,
        max: 12
      }
    ]
  },
  {
    id: 'storage-server',
    name: '存储服务器',
    description: '用于数据存储和备份的存储服务器检查标准',
    checkItems: [
      // 通用检查项
      {
        id: 'os-version',
        name: '操作系统版本',
        description: '支持的操作系统版本',
        type: 'select',
        value: 'Ubuntu 20.04 LTS',
        options: ['Ubuntu 18.04 LTS', 'Ubuntu 20.04 LTS', 'Ubuntu 22.04 LTS', 'CentOS 7', 'CentOS 8', 'RHEL 7', 'RHEL 8'],
        required: true
      },
      {
        id: 'kernel-version',
        name: '内核版本',
        description: '支持的内核版本',
        type: 'select',
        value: '5.4.0',
        options: ['4.15.0', '4.18.0', '5.0.0', '5.4.0', '5.8.0', '5.11.0', '5.15.0', '5.19.0'],
        required: true
      },
      {
        id: 'system-disk-location',
        name: '系统盘安装位置检测',
        description: '系统盘必须安装在指定位置',
        type: 'select',
        value: '/dev/sda',
        options: ['/dev/sda', '/dev/nvme0n1', '/dev/sdb', '/dev/nvme1n1'],
        required: true
      },
      {
        id: 'server-model',
        name: '服务器型号',
        description: '支持的服务器型号',
        type: 'select',
        value: 'Dell PowerEdge R750',
        options: ['Dell PowerEdge R750', 'Dell PowerEdge R7525', 'HPE ProLiant DL380', 'HPE ProLiant DL385', 'Supermicro SYS-4029GP-TRT', 'Supermicro SYS-4029GP-TRT2'],
        required: true
      },
      // 网卡相关检查项
      {
        id: 'network-model',
        name: '网卡型号',
        description: '支持的网卡型号',
        type: 'select',
        value: 'Intel X710',
        options: ['Mellanox ConnectX-6', 'Mellanox ConnectX-5', 'Intel X710', 'Intel X722', 'Broadcom NetXtreme'],
        required: true
      },
      {
        id: 'network-firmware-version',
        name: '网卡固件版本',
        description: '网卡固件的最低版本要求',
        type: 'text',
        value: '22.31.2000',
        required: true
      },
      {
        id: 'network-driver-version',
        name: '网卡驱动版本',
        description: '网卡驱动的最低版本要求',
        type: 'text',
        value: '5.0-2.0.0.0',
        required: true
      },
      {
        id: 'network-count',
        name: '网卡数量',
        description: '服务器必须包含的网卡数量',
        type: 'number',
        value: 2,
        unit: '个',
        required: true,
        min: 1,
        max: 8
      },
      // CPU和内存检查项
      {
        id: 'cpu-model',
        name: 'CPU型号',
        description: '支持的CPU型号',
        type: 'select',
        value: 'Intel Xeon Gold 6338',
        options: ['AMD EPYC 7763', 'AMD EPYC 7543', 'Intel Xeon Gold 6338', 'Intel Xeon Gold 6348', 'AMD EPYC 7713'],
        required: true
      },
      {
        id: 'memory-model',
        name: '内存型号及容量',
        description: '内存型号和单条容量要求',
        type: 'select',
        value: 'DDR4-3200 32GB',
        options: ['DDR4-2666 16GB', 'DDR4-3200 32GB', 'DDR4-3200 64GB', 'DDR5-4800 32GB', 'DDR5-4800 64GB'],
        required: true
      },
      {
        id: 'memory-total-size',
        name: '总内存容量',
        description: '服务器总内存容量要求',
        type: 'number',
        value: 64,
        unit: 'GB',
        required: true,
        min: 8,
        max: 512
      },
      // 硬盘检查项（存储服务器重点）
      {
        id: 'disk-spec',
        name: '硬盘规格及数量',
        description: '硬盘规格和数量要求',
        type: 'select',
        value: 'SAS HDD 1TB x8',
        options: ['SATA SSD 500GB x2', 'NVMe SSD 1TB x2', 'NVMe SSD 2TB x4', 'SAS HDD 1TB x8', 'NVMe SSD 4TB x8', 'SAS HDD 4TB x12'],
        required: true
      },
      {
        id: 'disk-count',
        name: '硬盘数量',
        description: '服务器必须包含的硬盘数量',
        type: 'number',
        value: 8,
        unit: '个',
        required: true,
        min: 4,
        max: 24
      },
      {
        id: 'raid-level',
        name: 'RAID级别',
        description: '支持的RAID级别',
        type: 'select',
        value: 'RAID 5',
        options: ['RAID 0', 'RAID 1', 'RAID 5', 'RAID 6', 'RAID 10'],
        required: true
      }
    ]
  },
  {
    id: 'storage-switch',
    name: '存储交换机',
    description: '用于存储网络连接的交换机设备检查标准',
    checkItems: [
      // 存储 Leaf 交换机
      {
        id: 'storage-leaf-ports-up',
        name: '存储Leaf端口Up数',
        description: '存储Leaf交换机端口Up状态数量',
        type: 'number',
        value: 24,
        unit: '个',
        required: true,
        min: 1,
        max: 48
      },
      {
        id: 'storage-leaf-bgp-peers',
        name: '存储Leaf BGP Peer数',
        description: '存储Leaf交换机BGP邻居数量',
        type: 'number',
        value: 2,
        unit: '个',
        required: true,
        min: 1,
        max: 16
      },
      {
        id: 'storage-leaf-mlag-status',
        name: '存储Leaf MLAG状态',
        description: '存储Leaf交换机MLAG链路聚合状态',
        type: 'boolean',
        value: true,
        required: true
      },
      {
        id: 'storage-leaf-lag-status',
        name: '存储Leaf聚合状态',
        description: '存储Leaf交换机链路聚合状态',
        type: 'boolean',
        value: true,
        required: true
      },
      // 存储 Spine 交换机
      {
        id: 'storage-spine-ports-up',
        name: '存储Spine端口Up数',
        description: '存储Spine交换机端口Up状态数量',
        type: 'number',
        value: 48,
        unit: '个',
        required: true,
        min: 1,
        max: 96
      },
      {
        id: 'storage-spine-bgp-peers',
        name: '存储Spine BGP Peer数',
        description: '存储Spine交换机BGP邻居数量',
        type: 'number',
        value: 4,
        unit: '个',
        required: true,
        min: 1,
        max: 32
      },
      {
        id: 'storage-spine-mlag-status',
        name: '存储Spine MLAG状态',
        description: '存储Spine交换机MLAG链路聚合状态',
        type: 'boolean',
        value: true,
        required: true
      },
      {
        id: 'storage-spine-lag-status',
        name: '存储Spine聚合状态',
        description: '存储Spine交换机链路聚合状态',
        type: 'boolean',
        value: true,
        required: true
      }
    ]
  },
  {
    id: 'compute-switch',
    name: '计算交换机',
    description: '用于计算网络连接的交换机设备检查标准',
    checkItems: [
      // 计算 Leaf 交换机
      {
        id: 'compute-leaf-ports-up',
        name: '计算Leaf端口Up数',
        description: '计算Leaf交换机端口Up状态数量',
        type: 'number',
        value: 24,
        unit: '个',
        required: true,
        min: 1,
        max: 48
      },
      {
        id: 'compute-leaf-bgp-peers',
        name: '计算Leaf BGP Peer数',
        description: '计算Leaf交换机BGP邻居数量',
        type: 'number',
        value: 2,
        unit: '个',
        required: true,
        min: 1,
        max: 16
      },
      {
        id: 'compute-leaf-mlag-status',
        name: '计算Leaf MLAG状态',
        description: '计算Leaf交换机MLAG链路聚合状态',
        type: 'boolean',
        value: true,
        required: true
      },
      {
        id: 'compute-leaf-lag-status',
        name: '计算Leaf聚合状态',
        description: '计算Leaf交换机链路聚合状态',
        type: 'boolean',
        value: true,
        required: true
      },
      // 计算 Spine 交换机
      {
        id: 'compute-spine-ports-up',
        name: '计算Spine端口Up数',
        description: '计算Spine交换机端口Up状态数量',
        type: 'number',
        value: 48,
        unit: '个',
        required: true,
        min: 1,
        max: 96
      },
      {
        id: 'compute-spine-bgp-peers',
        name: '计算Spine BGP Peer数',
        description: '计算Spine交换机BGP邻居数量',
        type: 'number',
        value: 4,
        unit: '个',
        required: true,
        min: 1,
        max: 32
      },
      {
        id: 'compute-spine-mlag-status',
        name: '计算Spine MLAG状态',
        description: '计算Spine交换机MLAG链路聚合状态',
        type: 'boolean',
        value: true,
        required: true
      },
      {
        id: 'compute-spine-lag-status',
        name: '计算Spine聚合状态',
        description: '计算Spine交换机链路聚合状态',
        type: 'boolean',
        value: true,
        required: true
      }
    ]
  },
  {
    id: 'oob-switch',
    name: '带外交换机',
    description: '用于带外管理网络连接的交换机设备检查标准',
    checkItems: [
      // 带外 Leaf 交换机
      {
        id: 'oob-leaf-ports-up',
        name: '带外Leaf端口Up数',
        description: '带外Leaf交换机端口Up状态数量',
        type: 'number',
        value: 12,
        unit: '个',
        required: true,
        min: 1,
        max: 24
      },
      {
        id: 'oob-leaf-bgp-peers',
        name: '带外Leaf BGP Peer数',
        description: '带外Leaf交换机BGP邻居数量',
        type: 'number',
        value: 1,
        unit: '个',
        required: true,
        min: 1,
        max: 8
      },
      {
        id: 'oob-leaf-mlag-status',
        name: '带外Leaf MLAG状态',
        description: '带外Leaf交换机MLAG链路聚合状态',
        type: 'boolean',
        value: false,
        required: true
      },
      {
        id: 'oob-leaf-lag-status',
        name: '带外Leaf聚合状态',
        description: '带外Leaf交换机链路聚合状态',
        type: 'boolean',
        value: true,
        required: true
      },
      // 带外 Spine 交换机
      {
        id: 'oob-spine-ports-up',
        name: '带外Spine端口Up数',
        description: '带外Spine交换机端口Up状态数量',
        type: 'number',
        value: 24,
        unit: '个',
        required: true,
        min: 1,
        max: 48
      },
      {
        id: 'oob-spine-bgp-peers',
        name: '带外Spine BGP Peer数',
        description: '带外Spine交换机BGP邻居数量',
        type: 'number',
        value: 2,
        unit: '个',
        required: true,
        min: 1,
        max: 16
      },
      {
        id: 'oob-spine-mlag-status',
        name: '带外Spine MLAG状态',
        description: '带外Spine交换机MLAG链路聚合状态',
        type: 'boolean',
        value: false,
        required: true
      },
      {
        id: 'oob-spine-lag-status',
        name: '带外Spine聚合状态',
        description: '带外Spine交换机链路聚合状态',
        type: 'boolean',
        value: true,
        required: true
      }
    ]
  },
  {
    id: 'inband-switch',
    name: '带内交换机',
    description: '用于带内业务网络连接的交换机设备检查标准',
    checkItems: [
      // 带内 Leaf 交换机
      {
        id: 'inband-leaf-ports-up',
        name: '带内Leaf端口Up数',
        description: '带内Leaf交换机端口Up状态数量',
        type: 'number',
        value: 24,
        unit: '个',
        required: true,
        min: 1,
        max: 48
      },
      {
        id: 'inband-leaf-bgp-peers',
        name: '带内Leaf BGP Peer数',
        description: '带内Leaf交换机BGP邻居数量',
        type: 'number',
        value: 2,
        unit: '个',
        required: true,
        min: 1,
        max: 16
      },
      {
        id: 'inband-leaf-mlag-status',
        name: '带内Leaf MLAG状态',
        description: '带内Leaf交换机MLAG链路聚合状态',
        type: 'boolean',
        value: true,
        required: true
      },
      {
        id: 'inband-leaf-lag-status',
        name: '带内Leaf聚合状态',
        description: '带内Leaf交换机链路聚合状态',
        type: 'boolean',
        value: true,
        required: true
      },
      // 带内 Spine 交换机
      {
        id: 'inband-spine-ports-up',
        name: '带内Spine端口Up数',
        description: '带内Spine交换机端口Up状态数量',
        type: 'number',
        value: 48,
        unit: '个',
        required: true,
        min: 1,
        max: 96
      },
      {
        id: 'inband-spine-bgp-peers',
        name: '带内Spine BGP Peer数',
        description: '带内Spine交换机BGP邻居数量',
        type: 'number',
        value: 4,
        unit: '个',
        required: true,
        min: 1,
        max: 32
      },
      {
        id: 'inband-spine-mlag-status',
        name: '带内Spine MLAG状态',
        description: '带内Spine交换机MLAG链路聚合状态',
        type: 'boolean',
        value: true,
        required: true
      },
      {
        id: 'inband-spine-lag-status',
        name: '带内Spine聚合状态',
        description: '带内Spine交换机链路聚合状态',
        type: 'boolean',
        value: true,
        required: true
      }
    ]
  },
  {
    id: 'security-device',
    name: '安全设备',
    description: '用于网络安全防护的设备检查标准',
    checkItems: [
      {
        id: 'firewall-ports-up',
        name: '防火墙端口Up数',
        description: '防火墙设备端口Up状态数量',
        type: 'number',
        value: 8,
        unit: '个',
        required: true,
        min: 1,
        max: 24
      },
      {
        id: 'firewall-bgp-peers',
        name: '防火墙BGP Peer数',
        description: '防火墙设备BGP邻居数量',
        type: 'number',
        value: 2,
        unit: '个',
        required: true,
        min: 0,
        max: 8
      },
      {
        id: 'firewall-mlag-status',
        name: '防火墙MLAG状态',
        description: '防火墙设备MLAG链路聚合状态',
        type: 'boolean',
        value: false,
        required: true
      },
      {
        id: 'firewall-lag-status',
        name: '防火墙聚合状态',
        description: '防火墙设备链路聚合状态',
        type: 'boolean',
        value: true,
        required: true
      },
      {
        id: 'ids-ports-up',
        name: 'IDS端口Up数',
        description: '入侵检测系统端口Up状态数量',
        type: 'number',
        value: 4,
        unit: '个',
        required: true,
        min: 1,
        max: 12
      },
      {
        id: 'ids-bgp-peers',
        name: 'IDS BGP Peer数',
        description: '入侵检测系统BGP邻居数量',
        type: 'number',
        value: 0,
        unit: '个',
        required: true,
        min: 0,
        max: 4
      },
      {
        id: 'ids-mlag-status',
        name: 'IDS MLAG状态',
        description: '入侵检测系统MLAG链路聚合状态',
        type: 'boolean',
        value: false,
        required: true
      },
      {
        id: 'ids-lag-status',
        name: 'IDS聚合状态',
        description: '入侵检测系统链路聚合状态',
        type: 'boolean',
        value: false,
        required: true
      }
    ]
  }
];

// 响应式数据
const loading = ref(false);
const configs = ref<ServerTypeConfig[]>(JSON.parse(JSON.stringify(defaultConfigs)));
const formRefs = ref<any[]>([]);
const activeTab = ref('gpu-server');

// 保存配置
const saveConfig = async (serverType: ServerTypeConfig) => {
  try {
    loading.value = true;
    
    // 构造配置数据
    const configData: Record<string, any> = {};
    serverType.checkItems.forEach(item => {
      configData[item.id] = {
        value: item.value,
        required: item.required,
        type: item.type,
        unit: item.unit,
        min: item.min,
        max: item.max,
        options: item.options,
        name: item.name,
        description: item.description
      };
    });
    
    // 调用API保存配置
    const response = await fetch('/api/v1/env-check/config/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        server_type: serverType.id === 'gpu-server' ? 'gpu' : serverType.id,
        config_name: `${serverType.name}配置`,
        description: serverType.description,
        check_items: configData,  // 改为check_items匹配数据库字段
        is_active: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('配置保存成功:', result);
    
    message.success(`${serverType.name}配置保存成功！请到服务器检查页面重新执行检查以应用新配置。`);
  } catch (error) {
    console.error('保存配置失败:', error);
    message.error(`保存配置失败: ${(error as Error).message}`);
  } finally {
    loading.value = false;
  }
};

// 重置配置
const resetConfig = (serverType: ServerTypeConfig) => {
  const defaultConfig = defaultConfigs.find(config => config.id === serverType.id);
  if (defaultConfig) {
    serverType.checkItems = JSON.parse(JSON.stringify(defaultConfig.checkItems));
    message.success(`${serverType.name}配置已重置为默认值`);
  }
};

// 更新检查项值
const updateCheckItemValue = (item: CheckItem, value: any) => {
  item.value = value;
};

// 页签切换处理
const handleTabChange = (key: string) => {
  activeTab.value = key;
};

// 获取服务器类型颜色
const getServerTypeColor = (serverTypeId: string) => {
  const colorMap: Record<string, string> = {
    'gpu-server': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // 紫色渐变
    'cpu-server': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // 紫色渐变（与GPU相同）
    'storage-server': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // 紫色渐变（与GPU相同）
    'storage-switch': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // 蓝色渐变
    'compute-switch': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // 粉色渐变
    'oob-switch': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // 绿色渐变
    'inband-switch': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // 橙粉渐变
    'security-device': 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)' // 红色渐变
  };
  return colorMap[serverTypeId] || '#1890ff';
};

// 从数据库加载已保存的配置
const loadSavedConfigs = async () => {
  try {
    loading.value = true;
    
    // 获取所有服务器类型的保存配置
    const response = await fetch('/api/v1/env-check/config/');
    const savedConfigs = await response.json();
    
    if (savedConfigs && savedConfigs.length > 0) {
      // 按服务器类型分组并获取最新配置
      const configsByType = new Map();
      savedConfigs.forEach((config: any) => {
        const serverType = config.server_type;
        if (!configsByType.has(serverType) || 
            new Date(config.updated_at) > new Date(configsByType.get(serverType).updated_at)) {
          configsByType.set(serverType, config);
        }
      });
      
      // 更新configs，将保存的值覆盖默认值
      configs.value.forEach(defaultConfig => {
        const serverTypeKey = defaultConfig.id === 'gpu-server' ? 'gpu' : defaultConfig.id;
        const savedConfig = configsByType.get(serverTypeKey);
        
        if (savedConfig && savedConfig.check_items) {
          console.log(`加载 ${defaultConfig.name} 的保存配置`);
          
          // 将保存的配置值覆盖到默认配置中
          defaultConfig.checkItems.forEach(item => {
            const savedItem = savedConfig.check_items[item.id];
            if (savedItem && savedItem.value !== undefined) {
              item.value = savedItem.value;
              console.log(`  ${item.name}: ${item.value}`);
            }
          });
        }
      });
      
      console.log('配置加载完成');
    } else {
      console.log('没有找到保存的配置，使用默认配置');
    }
  } catch (error) {
    console.error('加载配置失败:', error);
    message.warning('加载保存的配置失败，使用默认配置');
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  // 初始化表单引用
  formRefs.value = configs.value.map(() => ref());
  
  // 加载已保存的配置
  await loadSavedConfigs();
});
</script>

<template>
  <div style="padding: 24px;">
    <!-- 页面标题 -->
    <div style="margin-bottom: 24px;">
      <h1 style="font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">检查项配置</h1>
      <p style="color: #666; margin: 0;">配置不同类型服务器的环境检查标准，系统将根据这些标准对服务器进行自动检查。</p>
    </div>


    <!-- 说明信息 -->
    <Alert
      message="配置说明"
      description="您可以修改各种类型服务器的检查标准。修改后的配置将立即生效，用于后续的服务器环境检查。建议根据实际业务需求调整检查标准。"
      type="info"
      show-icon
      style="margin-bottom: 24px;"
    />

    <!-- 服务器类型配置页签 -->
    <Card v-if="configs.length > 0">
      <Tabs 
        v-model:activeKey="activeTab" 
        @change="handleTabChange"
        type="card"
        size="large"
      >
        <TabPane 
          v-for="(serverType, index) in configs" 
          :key="serverType.id"
          :tab="serverType.name"
        >
          <template #tab>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div 
                :style="{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: getServerTypeColor(serverType.id)
                }"
              ></div>
              <span>{{ serverType.name }}</span>
            </div>
          </template>
          
          <!-- 服务器类型描述 -->
          <div style="margin-bottom: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #1890ff;">
            <p style="margin: 0; color: #666; font-size: 14px;">{{ serverType.description }}</p>
          </div>

          <!-- 操作按钮 -->
          <div style="margin-bottom: 24px; text-align: right;">
            <Space>
              <Button 
                type="default" 
                @click="resetConfig(serverType)"
                :disabled="loading"
                size="large"
              >
                重置配置
              </Button>
              <Button 
                type="primary" 
                @click="saveConfig(serverType)"
                :loading="loading"
                size="large"
              >
                保存配置
              </Button>
            </Space>
          </div>

          <!-- 检查项配置 -->
          <Row :gutter="[16, 16]">
            <Col 
              v-for="(item, itemIndex) in serverType.checkItems" 
              :key="item.id" 
              :span="12"
            >
              <div class="check-item">
                <div class="check-item-title">
                  <strong>{{ item.name }}</strong>
                  <span class="check-item-desc">{{ item.description }}</span>
                </div>
                
                <!-- 数字输入 -->
                <InputNumber
                  v-if="item.type === 'number'"
                  :value="item.value"
                  @update:value="(value) => updateCheckItemValue(item, value)"
                  :min="item.min"
                  :max="item.max"
                  :addon-after="item.unit"
                  style="width: 100%"
                  :placeholder="`请输入${item.name}`"
                />
                
                <!-- 文本输入 -->
                <Input
                  v-else-if="item.type === 'text'"
                  :value="item.value"
                  @update:value="(value) => updateCheckItemValue(item, value)"
                  :placeholder="`请输入${item.name}`"
                />
                
                <!-- 下拉选择 -->
                <Select
                  v-else-if="item.type === 'select'"
                  :value="item.value"
                  @update:value="(value) => updateCheckItemValue(item, value)"
                  :placeholder="`请选择${item.name}`"
                  style="width: 100%"
                >
                  <SelectOption 
                    v-for="option in item.options" 
                    :key="option" 
                    :value="option"
                  >
                    {{ option }}
                  </SelectOption>
                </Select>
                
                <!-- 开关切换 -->
                <Switch
                  v-else-if="item.type === 'boolean'"
                  :checked="item.value"
                  @update:checked="(checked) => updateCheckItemValue(item, checked)"
                  checked-children="启用"
                  un-checked-children="禁用"
                />
              </div>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </Card>

    <!-- 全局操作 -->
    <Card>
      <template #title>
        <h3 style="margin: 0; font-size: 16px;">全局操作</h3>
      </template>
      <Space>
        <Button 
          type="primary" 
          size="large"
          @click="() => { configs.forEach(config => saveConfig(config)); }"
          :loading="loading"
        >
          保存所有配置
        </Button>
        <Button 
          size="large"
          @click="() => { configs.forEach(config => resetConfig(config)); }"
          :disabled="loading"
        >
          重置所有配置
        </Button>
        <Button 
          size="large"
          @click="() => { message.info('导出功能开发中...'); }"
        >
          导出配置
        </Button>
        <Button 
          size="large"
          @click="() => { message.info('导入功能开发中...'); }"
        >
          导入配置
        </Button>
      </Space>
    </Card>
  </div>
</template>

<style scoped>
.ant-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.ant-card-head {
  border-bottom: none;
  padding: 0;
  overflow: hidden;
}

.ant-card-head .ant-card-head-wrapper {
  padding: 0;
}

.ant-card-body {
  padding: 24px;
}

.ant-form-item {
  margin-bottom: 16px;
}

.ant-form-item-label > label {
  font-weight: 500;
}

/* 服务器类型卡片样式 */
.server-card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.server-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

/* 检查项样式 */
.check-item {
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  background: #fafafa;
  transition: all 0.2s ease;
}

.check-item:hover {
  border-color: #1890ff;
  background: #f0f8ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
}

.check-item-title {
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.check-item-desc {
  color: #666;
  font-size: 12px;
  margin-left: 8px;
}
</style>
