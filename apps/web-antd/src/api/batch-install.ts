import { requestClient } from './request'

export interface InstallConfig {
  hostname: string
  username: string
  password: string
  network_interface?: string
  boot_mode?: string
  disk_path?: string
  packages?: string[]
  timezone?: string
  keyboard_layout?: string
}

export interface BatchInstallRequest {
  target_ips: string[]
  config: InstallConfig
  iso_path: string
  autoinstall_template?: string
}

export interface InstallStatus {
  ip: string
  status: string
  progress: number
  message: string
  start_time?: string
  end_time?: string
  logs: string[]
}

export interface BatchInstallResponse {
  task_id: string
  status: string
  total_targets: number
  completed: number
  failed: number
  targets: InstallStatus[]
}

export interface ServiceStatus {
  status: string
  enabled: boolean
}

export interface ServicesStatusResponse {
  services: {
    dnsmasq: ServiceStatus
    apache2: ServiceStatus
    tftp: ServiceStatus
  }
}

export interface AutoinstallTemplate {
  name: string
  path: string
  type: string
}

export interface TemplatesResponse {
  templates: AutoinstallTemplate[]
  default_templates: AutoinstallTemplate[]
}

export interface ISOFile {
  name: string
  path: string
  size: number
  size_mb: number
}

export interface ISOsResponse {
  isos: ISOFile[]
}

export interface LogsResponse {
  logs: string[]
}

enum Api {
  TEMPLATES = '/batch-install/templates',
  SERVICES_STATUS = '/batch-install/services/status',
  START_SERVICES = '/batch-install/services/start',
  ISOS = '/batch-install/isos',
  UPLOAD_ISO = '/batch-install/upload-iso',
  CREATE_AUTOINSTALL = '/batch-install/create-autoinstall',
  START_BATCH_INSTALL = '/batch-install/start-batch-install',
  GET_TASK_STATUS = '/batch-install/tasks',
  CANCEL_TASK = '/batch-install/tasks',
}

export const batchInstallApi = {
  /**
   * 获取PXE服务状态
   */
  getServicesStatus: () => requestClient.get<ServicesStatusResponse>(Api.SERVICES_STATUS),

  /**
   * 启动PXE服务
   */
  startServices: () => requestClient.post(Api.START_SERVICES),

  /**
   * 获取自动安装模板列表
   */
  getTemplates: () => requestClient.get<TemplatesResponse>(Api.TEMPLATES),

  /**
   * 获取可用ISO镜像列表
   */
  getISOs: () => requestClient.get<ISOsResponse>(Api.ISOS),

  /**
   * 上传ISO镜像
   */
  uploadISO: (filePath: string, targetPath?: string) => 
    requestClient.post(Api.UPLOAD_ISO, { file_path: filePath, target_path: targetPath }),

  /**
   * 创建自动安装模板
   */
  createAutoinstallTemplate: (templateName: string, config: InstallConfig, templateType: string) =>
    requestClient.post(Api.CREATE_AUTOINSTALL, {
      template_name: templateName,
      config,
      template_type: templateType
    }),

  /**
   * 开始批量安装
   */
  startBatchInstall: (request: BatchInstallRequest) =>
    requestClient.post<BatchInstallResponse>(Api.START_BATCH_INSTALL, request),

  /**
   * 获取任务状态
   */
  getTaskStatus: (taskId: string) =>
    requestClient.get<BatchInstallResponse>(`${Api.GET_TASK_STATUS}/${taskId}`),

  /**
   * 获取所有任务列表
   */
  getAllTasks: () =>
    requestClient.get<{ tasks: BatchInstallResponse[] }>(Api.GET_TASK_STATUS),

  

  /**
   * 取消安装任务
   */
  cancelTask: (taskId: string) =>
    requestClient.delete(`${Api.CANCEL_TASK}/${taskId}`),
}
