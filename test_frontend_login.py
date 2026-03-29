#!/usr/bin/env python3
"""
测试前端登录流程的脚本
"""
import requests
import json
import time

def test_frontend_backend_integration():
    """测试前端后端集成"""
    print("=" * 60)
    print("测试前端后端集成")
    print("=" * 60)
    
    base_url = "http://localhost:3000/api"
    
    # 1. 测试登录
    print("\n1. 测试登录...")
    login_response = requests.post(f"{base_url}/auth/login", json={
        "username": "admin",
        "password": "123456"
    })
    
    print(f"登录状态码: {login_response.status_code}")
    login_data = login_response.json()
    print(f"登录响应: {json.dumps(login_data, indent=2, ensure_ascii=False)}")
    
    if login_data.get("code") != 0:
        print("❌ 登录失败")
        return
    
    token = login_data["data"]["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. 测试用户信息
    print("\n2. 测试获取用户信息...")
    user_info_response = requests.get(f"{base_url}/user/info", headers=headers)
    print(f"用户信息状态码: {user_info_response.status_code}")
    user_info_data = user_info_response.json()
    print(f"用户信息响应: {json.dumps(user_info_data, indent=2, ensure_ascii=False)}")
    
    # 3. 测试权限码
    print("\n3. 测试获取权限码...")
    codes_response = requests.get(f"{base_url}/auth/codes", headers=headers)
    print(f"权限码状态码: {codes_response.status_code}")
    codes_data = codes_response.json()
    print(f"权限码响应: {json.dumps(codes_data, indent=2, ensure_ascii=False)}")
    
    # 4. 测试菜单
    print("\n4. 测试获取菜单...")
    menu_response = requests.get(f"{base_url}/menu/all", headers=headers)
    print(f"菜单状态码: {menu_response.status_code}")
    menu_data = menu_response.json()
    print(f"菜单数量: {len(menu_data.get('data', []))}")
    
    # 5. 测试GPU服务器
    print("\n5. 测试GPU服务器...")
    gpu_response = requests.get(f"{base_url}/gpu-server", headers=headers)
    print(f"GPU服务器状态码: {gpu_response.status_code}")
    gpu_data = gpu_response.json()
    if gpu_data.get("code") == 0:
        servers = gpu_data.get("data", [])
        print(f"GPU服务器数量: {len(servers)}")
        for server in servers:
            print(f"  - {server.get('name')} ({server.get('ip')}) - {server.get('status')}")
    
    # 检查所有API是否正常
    all_success = all([
        login_data.get("code") == 0,
        user_info_data.get("code") == 0,
        codes_data.get("code") == 0,
        menu_data.get("code") == 0,
        gpu_data.get("code") == 0
    ])
    
    print(f"\n{'=' * 60}")
    if all_success:
        print("✅ 所有API测试通过！前端应该可以正常工作了。")
        print("\n📱 现在可以在浏览器中访问：")
        print("   http://localhost:5666")
        print("   用户名: admin")
        print("   密码: 123456")
    else:
        print("❌ 部分API测试失败，需要进一步检查。")
    print("=" * 60)

if __name__ == "__main__":
    test_frontend_backend_integration()



