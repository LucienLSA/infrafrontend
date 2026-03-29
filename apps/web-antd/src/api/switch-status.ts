import { requestClient } from '@vben/request';

// 交换机连接状态接口
export interface SwitchConnection {
  id: string;
  name: string;
  ip: string;
  port: number;
  status: 'connected' | 'disconnected' | 'error';
  uptime: string;
  lastSeen: string;
  bandwidth: string;
  packets: number;
  errors: number;
  location: string;
  model: string;
  firmware: string;
}

// 交换机状态统计接口
export interface SwitchStats {
  total: number;
  connected: number;
  disconnected: number;
  error: number;
  totalPackets: number;
  totalErrors: number;
}

// 查询参数接口
export interface SwitchQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  location?: string;
}

// 响应接口
export interface SwitchListResponse {
  list: SwitchConnection[];
  total: number;
  stats: SwitchStats;
}

/**
 * 获取交换机连接状态列表
 */
export function getSwitchStatusList(params?: SwitchQueryParams) {
  return requestClient.get<SwitchListResponse>('/api/v1/switch-status/list', {
    params,
  });
}

/**
 * 获取交换机统计数据
 */
export function getSwitchStats() {
  return requestClient.get<SwitchStats>('/api/v1/switch-status/stats');
}

/**
 * 刷新交换机状态
 */
export function refreshSwitchStatus() {
  return requestClient.post('/api/v1/switch-status/refresh');
}

/**
 * 获取单个交换机详细信息
 */
export function getSwitchDetail(id: string) {
  return requestClient.get<SwitchConnection>(`/api/v1/switch-status/detail/${id}`);
}

/**
 * 测试交换机连接
 */
export function testSwitchConnection(id: string) {
  return requestClient.post(`/api/v1/switch-status/test/${id}`);
}

/**
 * 重启交换机
 */
export function restartSwitch(id: string) {
  return requestClient.post(`/api/v1/switch-status/restart/${id}`);
}

/**
 * 获取交换机端口状态
 */
export function getSwitchPorts(id: string) {
  return requestClient.get(`/api/v1/switch-status/ports/${id}`);
}

/**
 * 获取交换机实时监控数据
 */
export function getSwitchRealtimeData(id: string) {
  return requestClient.get(`/api/v1/switch-status/realtime/${id}`);
}
