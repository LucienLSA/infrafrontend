<script lang="ts" setup>
import { h, onMounted, ref } from "vue";

import {
  Button,
  Card,
  Col,
  message,
  Modal,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
} from "ant-design-vue";

defineOptions({ name: "ServerCheck" });

// 服务器检查结果接口
interface ServerCheckResult {
  id: string;
  name: string;
  ip: string;
  type: string;
  result: "error" | "fail" | "pass";
  os: string;
  kernel: string;
  cpu: string;
  memory: string;
  disk: string;
  gpu: string;
  lastCheckTime: string;
  details: string;
}

// 响应式数据
const loading = ref(false);
const data = ref<ServerCheckResult[]>([]);

// 统计数据
const stats = ref({
  total: 0,
  pass: 0,
  fail: 0,
  error: 0,
  gpu: 0,
  cpu: 0,
  storage: 0,
});

// 详细结果弹窗
const detailModalVisible = ref(false);
const selectedServerDetail = ref<any>(null);
const checkResults = ref<any[]>([]);

const getServerStatusDetail = (status: string) => {
  if (status === "online") {
    return "服务器在线";
  }
  if (status === "offline") {
    return "服务器离线";
  }
  if (status === "error") {
    return "服务器异常";
  }
  return "状态未知";
};

// 获取服务器数据
const fetchServerData = async () => {
  try {
    loading.value = true;
    console.warn("开始获取服务器数据...");

    // 直接调用API而不通过导入的函数
    const response = await fetch(
      "/api/v1/env-check/servers?page=1&pageSize=100",
    );

    console.warn("Response status:", response.status);
    console.warn("Response ok:", response.ok);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    // 处理API响应格式
    if (result?.code !== 0) {
      throw new Error(result?.msg || result?.err || "接口返回错误");
    }

    const responseData = result.data || {};

    if (!responseData || !Array.isArray(responseData.items)) {
      throw new Error("API响应格式错误");
    }

    console.warn("API响应:", result);
    console.warn("处理后的数据:", responseData);
    console.warn(
      "服务器列表长度:",
      responseData.items ? responseData.items.length : 0,
    );

    // 将API数据转换为服务器检查结果格式
    const serverCheckResults: ServerCheckResult[] = responseData.items.map(
      (server: any) => {
        // 从location字段提取OS信息
        const location = server.location || "";
        const osInfo = location.includes("Ubuntu")
          ? "Ubuntu 22.04.5 LTS"
          : "Unknown";

        // 调试GPU字段
        console.warn(
          "处理服务器:",
          server.name,
          "gpuCount:",
          server.gpuCount,
          "类型:",
          typeof server.gpuCount,
        );

        const gpuCount = Number(server.gpu_count ?? 0);
        const cpuCores = Number(server.cpu_cores ?? 0);
        const totalMemoryGB = Number(server.total_memory_gb ?? 0);
        const diskCount = Number(server.disk_count ?? 0);
        const gpuText = gpuCount > 0 ? `${gpuCount} GPU` : "N/A";
        console.warn("GPU文本:", gpuText);

        // 调试所有字段
        console.warn("完整服务器数据:", {
          name: server.name,
          gpuCount,
          gpuText,
          cpuCores,
          totalMemory: totalMemoryGB,
          diskCount,
        });

        const typeMap: Record<string, string> = {
          "gpu-server": "GPU服务器",
          "cpu-server": "CPU服务器",
          "storage-server": "存储服务器",
        };

        const statusMap: Record<string, "error" | "fail" | "pass"> = {
          online: "pass",
          offline: "fail",
          error: "error",
          maintenance: "fail",
        };

        return {
          id: String(server.id),
          name: server.name,
          ip: server.ip,
          type:
            typeMap[server.server_type] ||
            (gpuCount > 0 ? "GPU服务器" : "CPU服务器"),
          result: statusMap[server.status] || "error",
          os: server.os_name || osInfo,
          kernel: server.kernel_version || "unknown",
          cpu: cpuCores > 0 ? `${cpuCores} 核心` : "未知",
          memory: totalMemoryGB > 0 ? `${totalMemoryGB}GB` : "未知",
          disk: diskCount > 0 ? `${diskCount} 个磁盘` : "未知",
          gpu: gpuText,
          lastCheckTime: server.last_check_at
            ? new Date(server.last_check_at).toLocaleString("zh-CN")
            : "Never",
          details: getServerStatusDetail(server.status),
        };
      },
    );

    console.warn("转换后的服务器数据:", serverCheckResults);

    data.value = serverCheckResults;
    checkResults.value = serverCheckResults;

    console.warn("data.value赋值后长度:", data.value.length);
    console.warn("data.value内容:", data.value);
    console.warn("checkResults赋值后长度:", checkResults.value.length);
    console.warn("checkResults内容:", checkResults.value);

    // 更新统计数据
    stats.value = {
      total: serverCheckResults.length,
      pass: serverCheckResults.filter((item) => item.result === "pass").length,
      fail: serverCheckResults.filter((item) => item.result === "fail").length,
      error: serverCheckResults.filter((item) => item.result === "error")
        .length,
      gpu: serverCheckResults.filter((item) => item.type === "GPU服务器")
        .length,
      cpu: serverCheckResults.filter((item) => item.type === "CPU服务器")
        .length,
      storage: serverCheckResults.filter((item) => item.type === "存储服务器")
        .length,
    };

    console.warn("数据获取成功，服务器数量:", serverCheckResults.length);
    console.warn("stats更新后:", stats.value);
  } catch (error) {
    console.error("获取服务器数据失败:", error);
    console.error("错误详情:", error);
    message.error(`获取服务器数据失败: ${(error as Error).message}`);

    data.value = [];
    stats.value = {
      total: 0,
      pass: 0,
      fail: 0,
      error: 0,
      gpu: 0,
      cpu: 0,
      storage: 0,
    };
  } finally {
    loading.value = false;
  }
};

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    pass: "green",
    fail: "orange",
    error: "red",
  };
  return colorMap[status] || "default";
};

// 获取状态文本
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    pass: "通过",
    fail: "失败",
    error: "错误",
  };
  return textMap[status] || status;
};

// 刷新数据
const refreshData = async () => {
  await fetchServerData();
  message.success("数据已刷新");
};

// 执行单个服务器检查
const executeCheck = async (serverId: string) => {
  console.warn("开始执行检查，服务器ID:", serverId);
  try {
    loading.value = true;
    message.loading("正在执行检查...", 0);

    const response = await fetch(
      `/api/v1/env-check/execute-check/${serverId}`,
      {
        method: "POST",
      },
    );
    console.warn("检查API响应状态:", response.status);
    const result = await response.json();
    console.warn("检查API响应结果:", result);

    message.destroy();

    if (result.code === 0) {
      console.warn("检查成功，开始刷新数据");
      message.success(`服务器 ${serverId} 检查完成`);
      await fetchServerData();

      if (result.data && result.data.status) {
        message.info(`检查状态: ${result.data.status}`);
      }
    } else {
      message.error(`检查失败: ${result.msg || result.err || "未知错误"}`);
    }
  } catch (error) {
    message.destroy();
    console.error("执行检查失败:", error);
    message.error("执行检查失败");
  } finally {
    loading.value = false;
  }
};

// 批量检查
const batchCheck = async () => {
  try {
    loading.value = true;
    message.loading("正在执行批量检查...", 0);

    const gpuServerIds = data.value
      .filter((server) => server.type === "GPU服务器")
      .map((server) => Number.parseInt(server.id));

    if (gpuServerIds.length === 0) {
      message.destroy();
      message.warning("没有找到GPU服务器");
      return;
    }

    const response = await fetch("/api/v1/env-check/batch-check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        server_ids: gpuServerIds,
      }),
    });
    const result = await response.json();

    message.destroy();

    if (result.code === 0) {
      message.success(`批量检查完成，共检查 ${gpuServerIds.length} 台服务器`);
      await fetchServerData();
    } else {
      message.error(`批量检查失败: ${result.msg || result.err || "未知错误"}`);
    }
  } catch (error) {
    message.destroy();
    console.error("批量检查失败:", error);
    message.error("批量检查失败");
  } finally {
    loading.value = false;
  }
};

// 查看详细检查结果
const viewCheckDetail = async (serverId: string, _serverName: string) => {
  try {
    loading.value = true;

    // 获取最新的用户配置
    let configData = null;
    try {
      // 先尝试获取用户保存的最新配置
      const userConfigResponse = await fetch(
        "/api/v1/env-check/config/?server_type=gpu&is_active=true",
      );
      const userConfigResult = await userConfigResponse.json();
      const userConfigs = userConfigResult.data || userConfigResult;

      if (userConfigs && userConfigs.length > 0) {
        // 按更新时间排序，使用最新的配置
        userConfigs.sort(
          (a: any, b: any) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        );
        configData = userConfigs[0];
        console.warn(
          "使用最新用户配置:",
          configData.config_name,
          "更新时间:",
          configData.updated_at,
        );
      } else {
        // 如果没有用户配置，使用默认配置
        const defaultConfigResponse = await fetch(
          "/api/v1/env-check/config/default/gpu-server",
        );
        const defaultConfigResult = await defaultConfigResponse.json();
        configData = defaultConfigResult.data || defaultConfigResult;
        console.warn("使用默认配置:", configData.config_name);
      }
    } catch (error) {
      console.error("获取配置失败，使用默认配置:", error);
      const defaultConfigResponse = await fetch(
        "/api/v1/env-check/config/default/gpu-server",
      );
      const defaultConfigResult = await defaultConfigResponse.json();
      configData = defaultConfigResult.data || defaultConfigResult;
      console.warn("使用默认配置（fallback）");
    }

    // 由于检查结果没有保存到数据库，我们直接执行一次检查来获取结果
    console.warn("执行检查以获取详细结果...");
    const checkResponse = await fetch(
      `/api/v1/env-check/execute-check/${serverId}`,
      {
        method: "POST",
      },
    );
    const checkResult = await checkResponse.json();

    if (!checkResult.success) {
      throw new Error(checkResult.message || "检查执行失败");
    }

    const resultData = {
      server_id: serverId,
      check_id: Date.now(), // 使用时间戳作为临时ID
      check_type: "comprehensive",
      case_name: "综合环境检查",
      case_result: checkResult.result?.overall_result?.status || "FAIL",
      result_message: checkResult.result?.overall_result?.message || "",
      start_time: new Date().toISOString(),
      finish_time: new Date().toISOString(),
      details: checkResult.result,
    };

    // 处理配置数据格式（用户配置和默认配置格式可能不同）
    let configItems = {};
    console.warn("=== 配置数据处理 ===");
    console.warn("configData:", configData);

    if (configData) {
      if (configData.check_items) {
        // 用户配置格式
        configItems = configData.check_items;
        console.warn(
          "使用用户配置的check_items，数量:",
          Object.keys(configItems).length,
        );
      } else if (configData.config_data) {
        // 默认配置格式
        configItems = configData.config_data;
        console.warn(
          "使用默认配置的config_data，数量:",
          Object.keys(configItems).length,
        );
      } else {
        console.warn("configData中没有找到check_items或config_data字段");
        console.warn("configData的键:", Object.keys(configData));
      }
    } else {
      console.warn("configData为空或null");
    }

    console.warn("最终configItems:", configItems);
    console.warn("configItems键名:", Object.keys(configItems));

    if (configItems && Object.keys(configItems).length > 0) {
      // 将检查项配置与检查结果匹配
      const checkResultsMap = new Map();

      // 建立检查结果映射 - 使用新的数据结构

      if (resultData && resultData.details && resultData.details.checks) {
        const checks = resultData.details.checks;
        console.warn("检查结果详情:", checks);

        // 创建键名映射函数：将下划线转换为连字符
        const mapCheckKeyToConfigKey = (checkKey: string) => {
          return checkKey.replaceAll("_", "-");
        };

        // 创建特殊的键名映射
        const specialKeyMapping: Record<string, string> = {
          "gpu-driver-version": "gpu_driver",
          "gpu-firmware-version": "gpu_firmware",
          "gpu-ib-topology-check": "gpu_ib_topology",
          "gpu-nvlink-check": "nvlink",
          "gpu-pcie-bus-check": "pcie_bus",
          "gpu-pcie-degradation-check": "pcie_degradation",
          "network-driver-version": "network_driver",
          "network-firmware-version": "network_firmware",
          "system-disk-location": "system_disk",
          "disk-specs": "disk_specs",
          "memory-model": "memory_model",
          "memory-total-size": "memory_total_size",
          // IB相关检查项（暂时没有实现，会显示为未检查）
          "ib-driver-version": "ib_driver",
          "ib-firmware-version": "ib_firmware",
          "ib-link-status": "ib_link_status",
          "ib-model": "ib_model",
        };

        // 直接映射检查结果，同时支持两种键名格式
        Object.entries(checks).forEach(
          ([checkKey, checkResult]: [string, any]) => {
            // 使用原始键名
            checkResultsMap.set(checkKey, checkResult);
            // 也使用转换后的键名
            checkResultsMap.set(mapCheckKeyToConfigKey(checkKey), checkResult);
          },
        );

        // 添加特殊映射
        Object.entries(specialKeyMapping).forEach(([configKey, checkKey]) => {
          if (checks[checkKey]) {
            checkResultsMap.set(configKey, checks[checkKey]);
            console.warn(
              `特殊映射: ${configKey} -> ${checkKey} (${checks[checkKey].case_result})`,
            );
          } else {
            console.warn(
              `特殊映射失败: ${configKey} -> ${checkKey} (检查结果中不存在)`,
            );
          }
        });

        // 特别检查disk-specs和gpu-nvlink-check的映射
        console.warn("=== 关键映射检查 ===");
        console.warn(
          "disk-specs映射:",
          checkResultsMap.get("disk-specs")?.case_result || "未找到",
        );
        console.warn(
          "gpu-nvlink-check映射:",
          checkResultsMap.get("gpu-nvlink-check")?.case_result || "未找到",
        );

        console.warn("检查结果映射完成，映射的键:", [
          ...checkResultsMap.keys(),
        ]);
        console.warn("disk-specs映射结果:", checkResultsMap.get("disk-specs"));
        console.warn(
          "gpu-nvlink-check映射结果:",
          checkResultsMap.get("gpu-nvlink-check"),
        );
        console.warn("映射总大小:", checkResultsMap.size);
      } else {
        console.warn("没有检查结果数据，resultData:", resultData);
      }

      // 按照检查项配置的结构组织结果
      console.warn("=== 开始处理配置项 ===");
      console.warn("配置项数量:", Object.keys(configItems).length);
      console.warn("配置项键名:", Object.keys(configItems));
      console.warn("映射大小:", checkResultsMap.size);
      console.warn(
        "映射中是否有disk-specs:",
        checkResultsMap.has("disk-specs"),
      );
      console.warn(
        "映射中是否有gpu-nvlink-check:",
        checkResultsMap.has("gpu-nvlink-check"),
      );

      checkResults.value = Object.entries(configItems).map(
        ([configId, configItem]: [string, any]) => {
          const checkResult = checkResultsMap.get(configId);
          const hasResult = !!checkResult;

          // 调试特定检查项
          if (configId === "disk-specs" || configId === "gpu-nvlink-check") {
            console.warn(`=== 处理检查项 ${configId} ===`);
            console.warn("hasResult:", hasResult);
            console.warn("checkResult:", checkResult);
            console.warn("configItem:", configItem);
            console.warn("从映射中获取的结果:", checkResultsMap.get(configId));
            console.warn("映射大小:", checkResultsMap.size);
            console.warn("映射键列表:", [...checkResultsMap.keys()]);

            // 测试formatActualValue函数
            if (hasResult && checkResult) {
              console.warn(
                "checkResult.value_from_collected_detail:",
                checkResult.value_from_collected_detail,
              );
              console.warn(
                "checkResult.value_from_collected:",
                checkResult.value_from_collected,
              );
              const testValue = formatActualValue(
                checkResult.value_from_collected_detail ||
                  checkResult.value_from_collected,
              );
              console.warn(`formatActualValue测试结果: ${testValue}`);
            } else {
              console.warn("没有检查结果数据，无法测试formatActualValue");
            }
          }

          let actualValue = "N/A";
          let status = "NOT_CHECKED";
          let isMatch = false;

          if (hasResult) {
            status = checkResult.case_result || "UNKNOWN";
            actualValue = formatActualValue(
              checkResult.value_from_collected_detail ||
                checkResult.value_from_collected,
            );
            isMatch = status === "PASS";

            // 如果有失败消息，强制设置为不匹配
            if (
              checkResult.result_message &&
              Array.isArray(checkResult.result_message) &&
              checkResult.result_message.length > 0
            ) {
              const hasErrorMessage = checkResult.result_message.some(
                (msg: string) =>
                  msg.includes("mismatch") ||
                  msg.includes("insufficient") ||
                  msg.includes("not found") ||
                  msg.includes("detected"),
              );
              if (hasErrorMessage) {
                isMatch = false;
                if (status === "PASS") {
                  status = "FAIL"; // 修正状态
                }
              }
            }
          } else {
            // 对于未检查的项目，保持N/A状态
          }

          // 优先使用检查结果中的基线值，如果没有则使用配置值
          let expectedValue = formatExpectedValue(
            configItem.value,
            configItem.unit,
          );
          if (
            hasResult &&
            checkResult.baseline_detail !== null &&
            checkResult.baseline_detail !== undefined
          ) {
            expectedValue = formatExpectedValue(
              checkResult.baseline_detail,
              configItem.unit,
            );
          }

          let resultMessage = "未检查";
          if (hasResult) {
            resultMessage = Array.isArray(checkResult.result_message)
              ? checkResult.result_message.join("; ")
              : checkResult.result_message || "";
          }

          return {
            id: configId,
            name: configItem.name || getChineseCheckName(configId), // 使用中文名称
            description: configItem.description || "",
            type: configItem.type || "text",
            expectedValue, // 使用实际的基线值
            actualValue,
            status,
            isMatch,
            required: configItem.required || false,
            message: resultMessage,
            unit: configItem.unit || "",
            rawBaseline: hasResult ? checkResult.baseline_detail : null, // 保留原始基线数据用于调试
            rawActual: hasResult
              ? checkResult.value_from_collected_detail
              : null,
          };
        },
      );

      // 计算统计信息
      let passedCount = 0;
      let failedCount = 0;
      let errorCount = 0;
      let uncheckedCount = 0;

      checkResults.value.forEach((item: any) => {
        switch (item.status) {
          case "ERROR": {
            errorCount++;

            break;
          }
          case "FAIL": {
            failedCount++;

            break;
          }
          case "PASS": {
            passedCount++;

            break;
          }
          default: {
            uncheckedCount++;
          }
        }
      });

      const totalChecks = checkResults.value.length;
      const passRate =
        totalChecks > 0 ? Math.round((passedCount / totalChecks) * 100) : 0;

      // 更新统计信息
      selectedServerDetail.value = {
        ...selectedServerDetail.value,
        total_checks: totalChecks,
        passed_checks: passedCount,
        failed_checks: failedCount,
        error_checks: errorCount,
        unchecked_checks: uncheckedCount,
        pass_rate: passRate,
      };

      console.warn("统计信息:", {
        total: totalChecks,
        passed: passedCount,
        failed: failedCount,
        error: errorCount,
        unchecked: uncheckedCount,
        passRate: `${passRate}%`,
      });

      detailModalVisible.value = true;
    } else {
      message.error("无法获取检查项配置");
    }
  } catch (error) {
    console.error("获取检查详情失败:", error);
    message.error("获取检查详情失败");
  } finally {
    loading.value = false;
  }
};

// 格式化期望值
const formatExpectedValue = (value: any, unit?: string): string => {
  if (value === null || value === undefined) {
    return "N/A";
  }

  if (typeof value === "boolean") {
    return value ? "是/启用" : "否/禁用";
  }

  if (typeof value === "number") {
    return unit ? `${value} ${unit}` : value.toString();
  }

  if (typeof value === "object") {
    // 处理基线对象（如GPU数量检查的基线）
    if (value.number !== undefined) {
      return unit ? `${value.number} ${unit}` : `${value.number}个`;
    }

    // 其他对象类型
    if (Array.isArray(value)) {
      return value.join(", ");
    }

    return JSON.stringify(value);
  }

  if (typeof value === "string") {
    // 特殊处理一些常见的值
    if (value.toLowerCase() === "true") return "是/启用";
    if (value.toLowerCase() === "false") return "否/禁用";

    // 处理NVLink检测结果
    if (value.includes("NVLink") || value.includes("NVML")) {
      console.warn("formatActualValue: 处理NVLink检测结果，原始值:", value);
      // 简化NVLink检测结果显示
      const lines = value.split("\n").filter((line) => line.trim());
      const gpuLines = lines.filter((line) => line.includes("GPU"));
      const nvlinkLines = lines.filter(
        (line) => line.includes("NVLink") || line.includes("NVML"),
      );

      console.warn(
        "formatActualValue: NVLink处理，gpuLines:",
        gpuLines,
        "nvlinkLines:",
        nvlinkLines,
      );

      if (gpuLines.length > 0 && nvlinkLines.length > 0) {
        const result = `检测到 ${gpuLines.length} 个GPU，NVLink状态: ${nvlinkLines[0].includes("inActive") ? "未激活" : "正常"}`;
        console.warn("formatActualValue: NVLink结果:", result);
        return result;
      }
    }

    return value;
  }

  return value.toString();
};

// 格式化实际值
const formatActualValue = (value: any): string => {
  console.warn("formatActualValue输入:", value, "类型:", typeof value);

  if (value === null || value === undefined) {
    console.warn("formatActualValue: 值为null或undefined，返回N/A");
    return "N/A";
  }

  if (typeof value === "object") {
    console.warn("formatActualValue: 处理对象类型，键:", Object.keys(value));
    // 特殊处理GPU信息对象
    if (value.active_conf && value.active_conf.detail) {
      const gpuCount = Object.keys(value.active_conf.detail).length;
      const gpuNames = Object.values(value.active_conf.detail).map(
        (gpu: any) => gpu.Name || "Unknown",
      );
      const uniqueNames = [...new Set(gpuNames)];
      return `检测到 ${gpuCount} 个GPU: ${uniqueNames.join(", ")}`;
    }

    // 处理CPU型号对象
    if (value.cpu_model) {
      return value.cpu_model;
    }

    // 处理GPU数量对象
    if (value.gpu_count !== undefined) {
      return `${value.gpu_count} 个`;
    }

    // 处理GPU型号对象
    if (value.unique_models) {
      return value.unique_models.join(", ");
    }

    // 处理硬盘数量对象
    if (value.disk_count !== undefined) {
      return `${value.disk_count} 个`;
    }

    // 处理硬盘规格对象
    if (value.disks && Array.isArray(value.disks)) {
      console.warn("formatActualValue: 处理硬盘规格对象，disks:", value.disks);
      const diskInfo = value.disks
        .map((disk) => `${disk.name}: ${disk.size} (${disk.model})`)
        .join(", ");
      const diskCount = value.disk_count ?? value.disks.length;
      const result = `${diskCount} 个硬盘: ${diskInfo}`;
      console.warn("formatActualValue: 硬盘规格结果:", result);
      return result;
    }

    // 处理内存容量对象
    if (value.total_memory_gb !== undefined) {
      return `${value.total_memory_gb}GB`;
    }

    // 处理网卡信息对象
    if (value.ethernet_devices) {
      const deviceCount =
        value.total_devices ??
        (Array.isArray(value.ethernet_devices) &&
        value.ethernet_devices.length > 0
          ? value.ethernet_devices.length
          : 0);
      return `${deviceCount} 个网卡设备`;
    }

    // 其他对象类型简化显示
    if (Array.isArray(value)) {
      return value.join(", ");
    }

    // 对于复杂对象，只显示关键信息
    const keys = Object.keys(value);
    return keys.length <= 3
      ? JSON.stringify(value, null, 2)
      : `对象包含 ${keys.length} 个属性: ${keys.slice(0, 3).join(", ")}...`;
  }

  if (typeof value === "boolean") {
    return value ? "是/启用" : "否/禁用";
  }

  return value.toString();
};

// 获取中文检查项名称
const getChineseCheckName = (configId: string): string => {
  const chineseNames: Record<string, string> = {
    "os-version": "操作系统版本",
    "kernel-version": "内核版本",
    "system-disk-location": "系统盘安装位置检测",
    "server-model": "服务器型号",
    "gpu-model": "GPU型号",
    "gpu-firmware-version": "GPU固件版本",
    "gpu-driver-version": "GPU驱动版本",
    "gpu-count": "GPU数量",
    "gpu-pcie-bus-check": "PCIe Bus号一致性检测",
    "gpu-pcie-degradation-check": "GPU PCIe降级检测",
    "nvlink-check": "NVLink检测",
    "gpu-nvlink-check": "NVLink检测",
    "gpu-ib-topology-check": "GPU-IB卡PIX拓扑连接",
    "network-model": "网卡型号",
    "network-firmware-version": "网卡固件版本",
    "network-driver-version": "网卡驱动版本",
    "network-count": "网卡数量",
    "cpu-model": "CPU型号",
    "memory-model": "内存型号及容量",
    "memory-total-size": "总内存容量",
    "disk-specs": "硬盘规格及数量",
    "disk-count": "硬盘数量",
    "disk-raid-check": "RAID配置检测",
    "disk-smart-check": "SMART健康检测",
    "ib-model": "InfiniBand卡型号",
    "ib-firmware-version": "InfiniBand固件版本",
    "ib-driver-version": "InfiniBand驱动版本",
    "ib-link-status": "InfiniBand链路状态",
    "ib-topology-check": "InfiniBand拓扑检测",
    "power-supply-check": "电源供应检测",
    "cooling-system-check": "散热系统检测",
    "bmc-version": "BMC版本",
    "bios-version": "BIOS版本",
    "firmware-consistency-check": "固件一致性检测",
    "security-boot-check": "安全启动检测",
    "virtualization-support": "虚拟化支持检测",
    "container-runtime-check": "容器运行时检测",
  };
  return chineseNames[configId] || configId;
};

// 关闭详细结果弹窗
const closeDetailModal = () => {
  detailModalVisible.value = false;
  selectedServerDetail.value = null;
  checkResults.value = [];
};

// 表格列配置
const columns = [
  {
    title: "服务器名称",
    dataIndex: "name",
    key: "name",
    width: 120,
  },
  {
    title: "IP地址",
    dataIndex: "ip",
    key: "ip",
    width: 140,
  },
  {
    title: "类型",
    dataIndex: "type",
    key: "type",
    width: 100,
  },
  {
    title: "检查结果",
    dataIndex: "result",
    key: "result",
    width: 100,
    customRender: ({ record }: any) => {
      return h(
        Tag,
        { color: getStatusColor(record.result) },
        getStatusText(record.result),
      );
    },
  },
  {
    title: "操作系统",
    dataIndex: "os",
    key: "os",
    width: 140,
  },
  {
    title: "GPU",
    dataIndex: "gpu",
    key: "gpu",
    width: 80,
  },
  {
    title: "最后检查时间",
    dataIndex: "lastCheckTime",
    key: "lastCheckTime",
    width: 160,
  },
  {
    title: "操作",
    key: "action",
    width: 160,
    customRender: ({ record }: any) => {
      return h(Space, {}, [
        h(
          Button,
          {
            type: "primary",
            size: "small",
            loading: loading.value,
            onClick: () => {
              console.warn("检查按钮被点击，记录:", record);
              executeCheck(record.id);
            },
          },
          "检查",
        ),
        h(
          Button,
          {
            size: "small",
            onClick: () => viewCheckDetail(record.id, record.name),
          },
          "查看详情",
        ),
      ]);
    },
  },
];

onMounted(() => {
  console.warn("服务器检查页面已挂载");
  console.warn("初始data.value长度:", data.value.length);
  console.warn("初始data.value内容:", data.value);
  fetchServerData();
});
</script>

<template>
  <div style="padding: 24px">
    <!-- 页面标题 -->
    <div style="margin-bottom: 24px">
      <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: bold">
        服务器检查
      </h1>
      <p style="margin: 0; color: #666">
        检查服务器环境信息，包括操作系统、硬件配置、网络状态等关键指标。
      </p>
    </div>

    <!-- 统计卡片 -->
    <Row :gutter="16" style="margin-bottom: 24px">
      <Col :span="6">
        <Card>
          <Statistic
            title="总服务器数"
            :value="stats.total"
            value-style="color: #1890ff"
          />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic
            title="检查通过"
            :value="stats.pass"
            value-style="color: #52c41a"
          />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic
            title="检查失败"
            :value="stats.fail"
            value-style="color: #fa8c16"
          />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic
            title="设备错误"
            :value="stats.error"
            value-style="color: #ff4d4f"
          />
        </Card>
      </Col>
    </Row>

    <!-- 服务器类型统计 -->
    <Row :gutter="16" style="margin-bottom: 24px">
      <Col :span="8">
        <Card>
          <Statistic
            title="GPU服务器"
            :value="stats.gpu"
            value-style="color: #667eea"
          />
        </Card>
      </Col>
      <Col :span="8">
        <Card>
          <Statistic
            title="CPU服务器"
            :value="stats.cpu"
            value-style="color: #667eea"
          />
        </Card>
      </Col>
      <Col :span="8">
        <Card>
          <Statistic
            title="存储服务器"
            :value="stats.storage"
            value-style="color: #667eea"
          />
        </Card>
      </Col>
    </Row>

    <!-- 操作按钮 -->
    <div style="margin-bottom: 24px; text-align: right">
      <Space>
        <Button @click="refreshData" :loading="loading"> 刷新数据 </Button>
        <Button type="primary" @click="batchCheck" :loading="loading">
          批量检查GPU服务器
        </Button>
      </Space>
    </div>

    <!-- 服务器列表 -->
    <Card title="服务器列表">
      <Table
        :columns="columns"
        :data-source="data"
        :loading="loading"
        :pagination="{
          total: data.length,
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total: number) => `共 ${total} 条记录`,
        }"
        row-key="id"
      />
    </Card>

    <!-- 详细检查结果弹窗 -->
    <Modal
      v-model:open="detailModalVisible"
      :title="`${selectedServerDetail?.serverName} 检查详情`"
      width="80%"
      :footer="null"
      @cancel="closeDetailModal"
    >
      <div v-if="selectedServerDetail">
        <!-- 检查总览 -->
        <Card title="检查总览" style="margin-bottom: 16px">
          <Row :gutter="16">
            <Col :span="6">
              <Statistic
                title="总检查项"
                :value="selectedServerDetail.total_checks"
              />
            </Col>
            <Col :span="6">
              <Statistic
                title="通过"
                :value="selectedServerDetail.passed_checks"
                value-style="color: #52c41a"
              />
            </Col>
            <Col :span="6">
              <Statistic
                title="失败"
                :value="selectedServerDetail.failed_checks"
                value-style="color: #ff4d4f"
              />
            </Col>
            <Col :span="6">
              <Statistic
                title="通过率"
                :value="selectedServerDetail.pass_rate"
                suffix="%"
                value-style="color: #1890ff"
              />
            </Col>
          </Row>
        </Card>

        <!-- 详细检查结果 - 按照检查项配置的结构显示 -->
        <Card title="详细检查结果">
          <Row :gutter="[16, 16]">
            <Col v-for="item in checkResults" :key="item.id" :span="12">
              <div
                class="check-item-result"
                :class="{
                  'check-item-pass': item.isMatch && item.status === 'PASS',
                  'check-item-fail': !item.isMatch && item.status === 'FAIL',
                  'check-item-error': item.status === 'ERROR',
                  'check-item-not-checked': item.status === 'NOT_CHECKED',
                }"
              >
                <!-- 检查项标题 -->
                <div class="check-item-header">
                  <div class="check-item-title">
                    <Tag
                      :color="
                        item.status === 'PASS'
                          ? 'green'
                          : item.status === 'FAIL'
                            ? 'red'
                            : item.status === 'ERROR'
                              ? 'orange'
                              : 'default'
                      "
                      style="margin-right: 8px"
                    >
                      {{
                        item.status === "PASS"
                          ? "通过"
                          : item.status === "FAIL"
                            ? "失败"
                            : item.status === "ERROR"
                              ? "错误"
                              : "未检查"
                      }}
                    </Tag>
                    <strong>{{ item.name }}</strong>
                    <span v-if="item.required" class="required-mark">*</span>
                  </div>
                  <div class="check-item-desc">{{ item.description }}</div>
                </div>

                <!-- 检查结果对比 -->
                <div class="check-result-comparison">
                  <div class="result-row">
                    <span class="result-label">期望值:</span>
                    <span class="result-value expected">{{
                      item.expectedValue
                    }}</span>
                  </div>

                  <div class="result-row">
                    <span class="result-label">实际值:</span>
                    <span
                      class="result-value actual"
                      :class="{
                        mismatch:
                          !item.isMatch && item.status !== 'NOT_CHECKED',
                      }"
                    >
                      {{ item.actualValue }}
                    </span>
                  </div>

                  <div
                    v-if="item.message && item.message !== '未检查'"
                    class="result-message"
                  >
                    <span class="result-label">检查消息:</span>
                    <span class="message-text">{{ item.message }}</span>
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          <div
            v-if="checkResults.length === 0"
            style="padding: 40px; text-align: center"
          >
            <p style="color: #666">暂无检查结果，请先执行检查</p>
          </div>
        </Card>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.ant-statistic-content-value {
  font-size: 24px;
  font-weight: bold;
}

/* 检查项结果样式 */
.check-item-result {
  padding: 16px;
  background: #fafafa;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  transition: all 0.3s;
}

.check-item-pass {
  background: #f6ffed;
  border-color: #52c41a;
}

.check-item-fail {
  background: #fff2f0;
  border-color: #ff4d4f;
}

.check-item-error {
  background: #fff7e6;
  border-color: #fa8c16;
}

.check-item-not-checked {
  background: #f5f5f5;
  border-color: #d9d9d9;
}

.check-item-header {
  margin-bottom: 12px;
}

.check-item-title {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: 600;
}

.check-item-desc {
  font-size: 12px;
  line-height: 1.4;
  color: #666;
}

.required-mark {
  margin-left: 4px;
  color: #ff4d4f;
}

.check-result-comparison {
  font-size: 13px;
}

.result-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
}

.result-label {
  min-width: 60px;
  font-weight: 500;
  color: #666;
}

.result-value {
  flex: 1;
  word-break: break-all;
}

.result-value.expected {
  font-weight: 500;
  color: #1890ff;
}

.result-value.actual {
  color: #52c41a;
}

.result-value.actual.mismatch {
  padding: 2px 6px;
  font-weight: 500;
  color: #ff4d4f;
  background: #fff2f0;
  border: 1px solid #ff4d4f;
  border-radius: 4px;
}

.result-message {
  display: flex;
  align-items: flex-start;
  padding: 8px;
  margin-top: 8px;
  background: #fff2f0;
  border: 1px solid #ff4d4f;
  border-radius: 4px;
}

.message-text {
  flex: 1;
  font-size: 12px;
  color: #ff4d4f;
}
</style>
