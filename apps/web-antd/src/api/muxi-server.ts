import { requestClient } from './request';

// 沐曦服务器(Muxi)接口定义
export namespace MuxiServer {
  export interface Server {
    id: string;
    name: string;
    ip: string;
    status: string;
    gpu_model: string;
    gpu_count: number;
    memory: string;
    location: string;
    last_seen: string;
  }

  export interface Stats {
    total: number;
    online: number;
    offline: number;
    error: number;
  }

  export interface GPUInfo {
    gpu_model: string;
    gpu_count: number;
    memory: string;
  }

  export interface SystemMetrics {
    cpu: string;
    hostname: string;
  }

  export interface Detail {
    server: Server;
    gpu_info: GPUInfo;
    system_metrics: SystemMetrics;
  }

  export interface RefreshRes {
    id: string;
    message: string;
    serverInfo: {
      name: string;
      ip: string;
      status: string;
      gpu_count: number;
      gpu_model: string;
      memory: string;
      cpu_info: string;
      description: string;
    };
    timestamp: string;
  }

  export interface InitRes {
    message: string;
    timestamp: string;
  }
}

/**
 * 获取沐曦服务器列表
 * @param params 查询参数
 */
export function getMuxiServers(params?: { page?: number; page_size?: number; search?: string }) {
  return requestClient.get<MuxiServer.Server[]>('/muxi/server', { params });
}

/**
 * 获取沐曦服务器统计信息
 */
export function getMuxiServerStats() {
  return requestClient.get<MuxiServer.Stats>('/muxi/server/stats');
}

/**
 * 刷新沐曦服务器状态
 * @param id 服务器ID，为空则刷新全部
 */
export function refreshMuxiServer(id?: string) {
  return requestClient.post<MuxiServer.RefreshRes>('/muxi/server/refresh', { id });
}

/**
 * 获取沐曦服务器详情
 * @param id 服务器ID
 */
export function getMuxiServerDetail(id: string) {
  return requestClient.get<MuxiServer.Detail>(`/muxi/server/${id}`);
}

/**
 * 初始化沐曦服务器（占位接口）
 */
export function initMuxiServer() {
  return requestClient.get<MuxiServer.InitRes>('/muxi/server/init');
}
