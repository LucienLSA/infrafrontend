import { requestClient } from './request';

// 服务器环境信息接口
export interface ServerEnvInfo {
  id: string;
  name: string;
  ip: string;
  status: 'online' | 'offline' | 'error';
  os: string;
  kernel: string;
  driverVersion: string;
  gpuCount: number;
  diskCount: number;
  totalMemory: string;
  cpuCores: number;
  lastCheck: string;
  location: string;
}

// 环境检查统计接口
export interface EnvCheckStats {
  total: number;
  online: number;
  offline: number;
  error: number;
  totalGpus: number;
  totalDisks: number;
  totalCores: number;
}

// 查询参数接口
export interface EnvCheckQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  location?: string;
}

// 响应接口
export interface EnvCheckListResponse {
  list: ServerEnvInfo[];
  total: number;
  stats: EnvCheckStats;
}

/**
 * 获取服务器环境信息列表
 */
export function getServerEnvInfoList(params?: EnvCheckQueryParams) {
  return requestClient.get<EnvCheckListResponse>('/api/v1/env-check/servers', {
    params,
  });
}

/**
 * 获取环境检查统计数据
 */
export function getEnvCheckStats() {
  return requestClient.get<EnvCheckStats>('/api/v1/env-check/stats');
}

/**
 * 刷新服务器环境信息
 */
export function refreshServerEnvInfo(serverId: string) {
  return requestClient.post(`/api/v1/env-check/refresh/${serverId}`);
}

/**
 * 批量刷新所有服务器环境信息
 */
export function refreshAllServerEnvInfo() {
  return requestClient.post('/api/v1/env-check/refresh-all');
}

/**
 * 获取单个服务器详细环境信息
 */
export function getServerEnvDetail(serverId: string) {
  return requestClient.get<ServerEnvInfo>(`/api/v1/env-check/detail/${serverId}`);
}

/**
 * 检查服务器环境兼容性
 */
export function checkServerCompatibility(serverIds: string[]) {
  return requestClient.post('/api/v1/env-check/compatibility', {
    serverIds,
  });
}

/**
 * 导出环境信息报告
 */
export function exportEnvReport(format: 'excel' | 'pdf' = 'excel') {
  return requestClient.get(`/api/v1/env-check/export/${format}`, {
    responseType: 'blob',
  });
}

/**
 * 获取环境检查历史记录
 */
export function getEnvCheckHistory(params?: {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}) {
  return requestClient.get('/api/v1/env-check/history', {
    params,
  });
}

/**
 * 执行单个服务器的环境检查
 */
export function executeServerCheck(serverId: string) {
  return requestClient.post(`/api/v1/env-check/execute-check/${serverId}`);
}

/**
 * 批量执行服务器环境检查
 */
export function batchExecuteCheck(serverIds: string[]) {
  return requestClient.post('/api/v1/env-check/batch-check', {
    server_ids: serverIds.map(id => parseInt(id))
  });
}


