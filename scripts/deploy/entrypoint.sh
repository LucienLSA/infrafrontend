#!/bin/sh

# 设置默认值（如果未传递环境变量）
BACKEND_SERVER_URL=${BACKEND_SERVER_URL:-"http://172.107.232.14:3000"}

# 使用 envsubst 替换 nginx.conf 中的环境变量
# 也可以使用 sed: sed -i "s|\${BACKEND_SERVER_URL}|$BACKEND_SERVER_URL|g" /etc/nginx/nginx.conf

sed -i "s|\${BACKEND_SERVER_URL}|$BACKEND_SERVER_URL|g" /etc/nginx/nginx.conf
echo "Configuring backend server URL: $BACKEND_SERVER_URL"


# 执行原始的 nginx 命令
exec "$@"
