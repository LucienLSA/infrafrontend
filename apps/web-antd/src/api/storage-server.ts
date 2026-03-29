import { requestClient } from './request';

export namespace StorageServer {
  export interface StorageServerParams {
    page?: number;
    page_size?: number;
    id?: string;
    search?: string;
  }

  export interface StorageServer {
    id: string;
    name: string;
    ip: string;
    status: "online" | "offline" | string;
    storageType: string;
    totalCapacity: string;
    usedCapacity: string;
    availableCapacity: string;
    location: string;
    lastSeen: string;
    os: string;
    cpuModel: string;
    cpuCores: number;
    totalMemory: string;
    cpuUsage: string;
    memoryUsage: string;
    temperature: string;
    iops: string;
    throughput: string;
    latency: string;
    powerStatus: string;
    deviceRole: string;
    hostname: string;
    rack: string;
    uPosition: number;
    osVersion: string;
    managementIP: string;
    businessIP: string;
  }

  export interface StorageServerListRes {
    servers: StorageServer[];
    total: number;
  }

  export interface StorageServerStatsRes {
    total: number;
    online: number;
    offline: number;
    error: number;
  }

  export interface StorageServerDetailsRes {
    id: string;
    name: string;
    ip: string;
    status: "online" | "offline" | string;
    storageType: string;
    totalCapacity: string;
    usedCapacity: string;
    availableCapacity: string;
    location: string;
    lastSeen: string;
    os: string;
    cpuModel: string;
    cpuCores: number;
    totalMemory: string;
    cpuUsage: string;
    memoryUsage: string;
    temperature: string;
    iops: string;
    throughput: string;
    latency: string;
    powerStatus: string;
    deviceRole: string;
    hostname: string;
    rack: string;
    uPosition: number;
    osVersion: string;
    managementIP: string;
    businessIP: string;
  }

  export interface StorageServerRefreshRes {
    failCount: number;
    messages: string;
    successCount: number;
    timestamp: string;
  }
}


// 获取存储服务器列表
export function getStorageServerList(params: StorageServer.StorageServerParams) {
  return requestClient.get<StorageServer.StorageServerListRes>('/storage/server', { params });
}

// 获取存储服务器统计
export function getStorageServerStats() {
  return requestClient.get<StorageServer.StorageServerStatsRes>('/storage/server/stats');
}

// 获取存储服务器详情
export function getStorageServerDetails(id: number) {
  return requestClient.get<StorageServer.StorageServerDetailsRes>(`/storage/server/${id}/details`);
}

// 刷新存储服务器状态
export function refreshStorageServerStatus() {
  return requestClient.post<StorageServer.StorageServerRefreshRes>(`/storage/server/refresh`);
}
