import { requestClient } from './request'

export namespace ServerList {
  export interface Server {
    id: string
    name: string
    ip: string
    type: 'gpu' | 'cpu' | 'storage'
    status: 'online' | 'offline' | 'error' | 'unknown' | 'maintenance'
    cpu: string
    memory: string
    gpu: string
    storage: string
    os: string
    location: string
    lastCheck: string
  }

  export interface ServerListRes {
    servers: Server[]
    total: number
    gpu_count: number
    cpu_count: number
    storage_count: number
  }

  export interface ServerListStatsRes {
    total_servers: number
    gpu_servers: number
    cpu_servers: number
    storage_servers: number
    online_servers: number
    offline_servers: number
  }
}


// 获取所有服务器列表
export function getServersList(){
  return requestClient.get<ServerList.ServerListRes>('/server/list')
}

// 获取服务器统计信息
export function getServerListStats(){
  return requestClient.get<ServerList.ServerListStatsRes>('/server/list/stats')
}

// 封装服务器列表API对象
export const serverListApi = {
  // 获取所有服务器
  async getAllServers(type?: string, status?: string) {
    const params: Record<string, string> = {};
    if (type && type !== 'all') {
      params.type = type;
    }
    if (status && status !== 'all') {
      params.status = status;
    }
    const response = await requestClient.get<ServerList.ServerListRes>('/server/list', { params });
    return response;
  },

  // 获取服务器统计信息
  async getStats() {
    return await getServerListStats();
  }
};
