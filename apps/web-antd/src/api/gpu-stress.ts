import { requestClient } from './request';

// GPU压测相关接口类型定义
export namespace GpuStress {
  export interface StartGpuStressTestReq {
    test_type: string;
    servers: string[];
    gpu_burn_config?: {
      duration: number;
      memory_usage: number;
    };
    fld_congif: {
      duration: number;
    };
    p2p_config: {
      duration: number;
    };
    skip_upload?: boolean;
    remote_dir?: string;
    script_path?: string;
    binary_path?: string;
  }
  export interface GpuStressTestParams {
    page?: number;
    page_size?: number;
  }

  export interface GpuStressTestRes {
    test: string[];
    total: number;
    page: number;
    page_size: number;
  }
}



export const gpuStressApi = {
  //启动gpu压测
  startGpuStressTest(data: GpuStress.StartGpuStressTestReq){
    return requestClient.post('/gpu/stress/test', data);
  },

  //取消gpu压测
  cancelGpuStressTest(test_id: string){
    return requestClient.post<string>(`/gpu/stress/test/${test_id}`);
  },

  //获取gpu测试列表
  getGpuStressTests(params: GpuStress.GpuStressTestParams){
    return requestClient.get<GpuStress.GpuStressTestRes>('/gpu/stress/tests', {params});
  }

}
