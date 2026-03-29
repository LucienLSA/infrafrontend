import { requestClient } from './request';

export namespace CpuServer {
  export interface CpuServerParams {
    page?: number;
    page_size?: number;
    id?: string;
    search?: string;
  }

  export interface CpuServerRes {
    id: string;
    name: string;
    ip: string;
    status: 'online' | 'offline' | 'error' | 'maintenance';
    cpuModel: string;
    cpuCores: number;
    memory: string;
    location: string;
    lastSeen: string;
  }

  export interface CpuServerStatsRes {
    total: number;
    online: number;
    offline: number;
    error: number;
    maintenance: number;
    totalCores: number;
  }

  export interface CpuServerDetailsRes {
    id: string;
    name: string;
    ip: string;
    status: 'online' | 'offline' | 'error' | 'maintenance';
    cpuModel: string;
    cpuCores: number;
    memory: string;
    location: string;
    lastSeen: string;
    os: string;
    kernel: string;
    totalMemory: string;
    diskCount: number;
    cpuUsage: string;
    memoryUsage: string;
    diskUsage: string;
    loadAverage: string;
    uptime: string;
    networkInfo: string;
    processesCount: number;
    temperature: string;
    powerStatus: string;
    servicesStatus: string;
    description: string;
  }

  export interface CpuServerTestReq {
    id?: number;
    ip: string;
  }

  export interface CpuServerTestRes {
    ip: string;
    message: string;
    success: boolean;
    timestamp: string;
  }
}


// 获取CPU服务器列表
export function getCpuServerList(params: CpuServer.CpuServerParams) {
  return requestClient.get<CpuServer.CpuServerRes[]>('/cpu/server', {params});
}

// CPU服务器统计
export function getCpuServerStats(){
  return requestClient.get<CpuServer.CpuServerStatsRes>('/cpu/server/stats');
}

//CPU服务器详情
export function getCpuServerDetails(id: number){
  return requestClient.get<CpuServer.CpuServerDetailsRes>(`/cpu/server/${id}/details`);
}

// 刷新CPU服务器状态
// export function refreshCpuServers(){
//   return requestClient.post('/cpu/server/refresh')
// }

//CPU连接测试
export function testCpuServerConnection(data: CpuServer.CpuServerTestReq){
  return requestClient.post<CpuServer.CpuServerTestRes>('/cpu/server/test-connection', data);
}
