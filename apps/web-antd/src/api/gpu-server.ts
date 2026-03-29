import { requestClient } from './request';

// GPU服务器接口定义
export namespace GpuServer {
  export interface GpuServerParams {
    page?: number;
    page_size?: number;
    id?: string;
    search?: string;
  }

  export interface GpuServerRes {
    id: string;
    name: string;
    ip: string;
    status: 'online' | 'offline' | 'error' | 'maintenance';
    gpuCount: number;
    gpuModel: string;
    memory: string;
    cpuInfo: string;
    location: string;
    lastSeen: string;
  }

  export interface RefreshGpuRes {
    failCount: number;
    message: string;
    successCount: number;
    timestamp: string;
  }

  export interface GpuStatsRes {
    total: number;
    online: number;
    offline: number;
    error: number;
    maintenance: number;
    totalGpus: number;
  }

  export interface GpuDetailRes {
    id: string; 
    name: string; 
    ip: string; 
    businessIp: string; 
    managementIp: string; 
    gpuCount: number; 
    gpuModel: string; 
    memory: string; 
    cpuInfo: string; 
    location: string; 
    os: string; 
    kernel: string; 
    totalMemory: string; 
    cpuCores: number; 
    status: "error" | "normal" | "offline" | "maintaining"; 
    lastSeen: string; 
    serverType: string; 
    deviceRole: string; 
    hostname: string; 
    deviceName: string; 
    rack: string; 
    uPosition: string; 
    osVersion: string; 
    loginMethod: string; 
    gpuUsage: string; 
    memoryUsage: string;
    temperature: string; 
    powerUsage: string; 
    fanSpeed: string; 
    uptime: string;
    processesCount: number; 
    driverVersion: string; 
    cudaVersion: string; 
  }
}


// 获取所有GPU服务器数据
export function getGpuServers(params: GpuServer.GpuServerParams) {
  if (params.page && !Number.isInteger(params.page)) {
    throw new Error('page必须是整数');
  }
  if (params.page_size && !Number.isInteger(params.page_size)) {
    throw new Error('page_size必须是整数');
  }
  return requestClient.get<GpuServer.GpuServerRes[]>('/gpu/server', {params});
}

// 统计GPU服务器
export function getGpuServerStats() {
  return requestClient.get<GpuServer.GpuStatsRes>('/gpu/server/stats');
}

// 刷新GPU服务器状态
export function refreshGpuServers() {
  return requestClient.post<GpuServer.RefreshGpuRes>('/gpu/server/refresh');
}

// GPUf服务器详情
export function gerGpuServerDetails(id: number) {
  return requestClient.get<GpuServer.GpuDetailRes>(`/gpu/server/${id}/details`);
}

// 通过SSE获取GPU服务器实时数据流

