import { requestClient } from '#/api/request';

export namespace SoftwareRepoApi {
  // 软件包列表查询参数
  export interface ListParams {
    page: number;
    page_size: number;
    name?: string;
    version?: string;
    arch?: string;
    os?: string;
    sort_by?: string;
    order?: string;
  }

  // 单个软件包对象结构
  export interface SoftwarePackage {
    id: number;
    name: string;
    version: string;
    arch: string;
    os: string;
    repo_abs_path: string;
    size_bytes: number;
    created_at?: string;
    [key: string]: any;
  }


  export interface ResponseSoftwareRepoList {
    data: SoftwarePackage[];
    page: number;
    page_size: number;
    total: number;
  }

  // 注册/创建软件包参数
  export interface RegisterParams {
    name: string;
    version: string;
    arch: string;
    os: string;
    repo_abs_path: string;
    size_bytes: number;
  }
}

// src/api/softwareRepo/index.ts
// API 请求函数实现



 // 获取软件包列表
export function getSoftwareListApi(params: SoftwareRepoApi.ListParams) {
  return requestClient.get<SoftwareRepoApi.ResponseSoftwareRepoList>('/software/repo/packages', { params });
}

// 登记(创建)软件包
export function registerSoftwareApi(data: SoftwareRepoApi.RegisterParams) {
  return requestClient.post<any>('/software/repo/packages', data);
}

// 更新软件包信息
export function updateSoftwareApi(id: number, data: Partial<SoftwareRepoApi.RegisterParams>) {
  return requestClient.put<any>(`/software/repo/packages/${id}`, data);
}

// 删除软件包
export function deleteSoftwareApi(id: number) {
  return requestClient.delete<any>(`/software/repo/packages/${id}`);
}

export const softwareRepoApi = {
  
}
