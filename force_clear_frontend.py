#!/usr/bin/env python3
"""
强制清除前端认证状态
"""
import requests

def force_clear_frontend_state():
    """强制清除前端认证状态"""
    print("=" * 60)
    print("强制清除前端认证状态")
    print("=" * 60)
    
    # 1. 调用清除状态API
    print("\n1. 调用后端清除状态API...")
    try:
        response = requests.post("http://localhost:3000/api/auth/clear-state")
        print(f"清除状态API: {response.status_code}")
        if response.status_code == 200:
            print("✅ 后端状态已清除")
        else:
            print("❌ 后端状态清除失败")
    except Exception as e:
        print(f"❌ 清除状态API调用失败: {e}")
    
    # 2. 通过前端代理清除
    print("\n2. 通过前端代理清除状态...")
    try:
        response = requests.post("http://localhost:5667/api/auth/clear-state")
        print(f"前端代理清除: {response.status_code}")
        if response.status_code == 200:
            print("✅ 前端代理状态已清除")
        else:
            print("❌ 前端代理状态清除失败")
    except Exception as e:
        print(f"❌ 前端代理清除失败: {e}")
    
    print("\n" + "=" * 60)
    print("🔧 现在请执行以下步骤:")
    print("1. 完全关闭浏览器")
    print("2. 重新打开浏览器") 
    print("3. 访问: http://172.171.2.134:5667")
    print("4. 应该看到登录界面 /auth/login")
    print("")
    print("如果仍然直接跳转到 /dashboard，说明前端路由配置有问题")
    print("需要重启前端服务:")
    print("  cd /home/tt/aidoc/apps/web-antd")
    print("  按Ctrl+C停止，然后: pnpm dev")
    print("=" * 60)

if __name__ == "__main__":
    force_clear_frontend_state()

