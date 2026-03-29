import { requestClient } from './request';

export interface SoftwarePackage {
  name: string;
  description: string;
  category: string;
  selected?: boolean;
  version?: string;
  installMethod?: string;
}

export interface SoftwareInstallRequest {
  servers: string[];
  softwareType: string;
  softwareList: SoftwarePackage[];
  installMethod: string;
  parallelInstall: boolean;
  timeout: number;
  retryCount: number;
  customScript?: string;
  packageManager: string;
  updateSystem: boolean;
  installDependencies: boolean;
}

export interface SoftwareInstallResponse {
  task_id: string;
  message: string;
}

export interface InstallTask {
  task_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  total_duration?: number;
  success_count: number;
  failed_count: number;
  servers: string[];
  software_list: SoftwarePackage[];
  install_config: any;
  results: InstallResult[];
}

export interface InstallResult {
  server_ip: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  start_time: string;
  end_time?: string;
  duration?: number;
  message: string;
}

export interface SoftwareTemplates {
  system: SoftwarePackage[];
  development: SoftwarePackage[];
  ai: SoftwarePackage[];
}

enum Api {
  START_INSTALL = '/software-install/start',
  GET_TASKS = '/software-install/tasks',
  GET_TASK = '/software-install/tasks',
  CANCEL_TASK = '/software-install/tasks',
  GET_TEMPLATES = '/software-install/templates',
}

export const softwareInstallApi = {
  /**
   * 启动软件批量安装
   */
  startInstall: (request: SoftwareInstallRequest) => {
    return requestClient.post<SoftwareInstallResponse>({
      url: Api.START_INSTALL,
      data: request,
    });
  },

  /**
   * 获取所有安装任务
   */
  getAllTasks: () => {
    return requestClient.get<{ tasks: InstallTask[] }>(Api.GET_TASKS);
  },

  /**
   * 获取特定安装任务详情
   */
  getTask: (taskId: string) => {
    return requestClient.get<InstallTask>({
      url: `${Api.GET_TASK}/${taskId}`,
    });
  },

  /**
   * 取消安装任务
   */
  cancelTask: (taskId: string) => {
    return requestClient.delete<{ task_id: string }>({
      url: `${Api.CANCEL_TASK}/${taskId}`,
    });
  },

  /**
   * 获取软件安装模板
   */
  getTemplates: () => {
    return requestClient.get<{ templates: SoftwareTemplates }>({
      url: Api.GET_TEMPLATES,
    });
  },
};

