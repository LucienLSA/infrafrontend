FROM node:22-slim AS builder

# --max-old-space-size
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_OPTIONS=--max-old-space-size=8192
ENV TZ=Asia/Shanghai

RUN npm i -g corepack

WORKDIR /app

# copy package.json and pnpm-lock.yaml to workspace
COPY . /app

# 安装依赖
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# 重新构建 internal 包以消除本地路径引用
# 删除旧的 dist 目录
# RUN rm -rf /app/internal/vite-config/dist /app/internal/node-utils/dist

# # 为 internal 包执行 stub 构建（它们使用 unbuild）
# RUN pnpm -F @vben/vite-config run stub
# RUN pnpm -F @vben/node-utils run stub

# RUN pnpm run clean
# 构建应用
RUN pnpm run build --filter=@vben/web-antd

# 调试：检查构建产物位置
RUN echo "=== 检查 web-antd 构建产物 ===" && \
    ls -la /app/web-antd/ 2>&1 || echo "web-antd 目录不存在" && \
    ls -la /app/ 2>&1 | head -30

RUN echo "Builder Success 🎉"

FROM nginx:stable-alpine AS production

# 配置 nginx
RUN echo "types { application/javascript js mjs; }" > /etc/nginx/conf.d/mjs.conf \
    && rm -rf /etc/nginx/conf.d/default.conf

# 复制构建产物
COPY --from=builder /app/apps/web-antd/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY --from=builder /app/scripts/deploy/nginx.conf /etc/nginx/nginx.conf

# 复制 entrypoint 脚本
COPY --from=builder /app/scripts/deploy/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 5667

# 使用 entrypoint 脚本
ENTRYPOINT ["/entrypoint.sh"]

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
